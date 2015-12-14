// WebChatty
// Copyright (C) 2015 Andy Christianson, Brian Luft, Willie Zutz
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
// Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
// OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/// <reference path="../../../typings/tsd.d.ts" />
"use strict";

import * as express from "express";
import * as morgan from "morgan";
import * as winston from "winston";
import * as compression from "compression";
import * as fs from "fs";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as http from "http";
import * as api from "./index";
import * as collections from "../collections/index";
import * as spec from "../spec/index";

export enum LogLevel {
    None = <any>"none",
    Test = <any>"test",
    Critical = <any>"critical",
    Event = <any>"event",
    Status = <any>"status",
    Request = <any>"request",
    Debug = <any>"debug"
}

export interface ServerConfiguration {
    httpPort: number;

    logFilePath: string;
    logMaxFileSize: number;
    logMaxFiles: number;
    logUseJsonFormat: boolean;
    logFileLevel: LogLevel;
    logConsoleLevel: LogLevel;

    accountConnector: spec.IAccountConnector;
    clientDataConnector: spec.IClientDataConnector;
    messageConnector: spec.IMessageConnector;
    threadConnector: spec.IThreadConnector;
    searchConnector: spec.ISearchConnector;
}

export enum RequestMethod {
    Get, Post
}

export class Server {
    private _config: ServerConfiguration;
    private _logger: winston.LoggerInstance;
    private _httpServer: http.Server = null;
   
    public app: express.Express;
    public accountConnector: spec.IAccountConnector;
    public clientDataConnector: spec.IClientDataConnector;
    public messageConnector: spec.IMessageConnector;
    public threadConnector: spec.IThreadConnector;
    public searchConnector: spec.ISearchConnector;
    public dispatcher: api.Dispatcher = new api.Dispatcher();
    
    constructor(config: ServerConfiguration) {
        this.accountConnector = config.accountConnector;
        this.clientDataConnector = config.clientDataConnector;
        this.messageConnector = config.messageConnector;
        this.threadConnector = config.threadConnector;
        this.searchConnector = config.searchConnector;
        this._config = config;
        this.app = express();
        
        const customLogLevels = {
            levels: {
                none: 0,
                test: 1,
                critical: 2,
                event: 3,
                status: 4,
                request: 5,
                debug: 6
            },
            colors: {
                none: "red",
                test: "magenta",
                critical: "red",
                event: "cyan",
                status: "yellow",
                request: "green",
                debug: "magenta"
            }
        };
        
        this._logger = new winston.Logger({
            levels: customLogLevels.levels,
            transports: [
                new winston.transports.File({
                    level: config.logFileLevel.toString(),
                    filename: config.logFilePath,
                    handleExceptions: true,
                    json: config.logUseJsonFormat,
                    maxsize: config.logMaxFileSize,
                    maxFiles: config.logMaxFiles,
                    colorize: false
                }),
                new winston.transports.Console({
                    level: config.logConsoleLevel.toString(),
                    handleExceptions: true,
                    json: false,
                    colorize: true
                })
            ],
            exitOnError: false
        });
        winston.addColors(customLogLevels.colors);
        const isErrorResponseRegex = /^5[0-9][0-9]/;
        this.app.use(morgan(":status :remote-addr \":method :url\" - :response-time ms - \":referrer\" \":user-agent\"", {
            stream: <any>{ // any cast is because the typing is wrong
                write: (str: string) => {
                    var isError = isErrorResponseRegex.test(str);
                    // send morgan's output to winston
                    if (isError) {
                        this._logger.log("critical", str.trim());
                    } else {
                        this._logger.log("request", str.trim());
                    }
                }
            }
        }));
        this.app.use(compression({
            filter: () => true,
            threshold: 1
        }));
        this.app.use(bodyParser.urlencoded({ extended: false }));

        // configure the connectors with a reference to the server instance
        this.accountConnector.injectServer(this);
        this.clientDataConnector.injectServer(this);
        this.messageConnector.injectServer(this);
        this.threadConnector.injectServer(this);
        this.searchConnector.injectServer(this);
        this.dispatcher.injectServer(this);
        
        // load all of the routes in ./routes/ automatically by searching the filesystem for .js files
        findFilesSync(path.join(__dirname, "routes")).forEach(routeFilePath => require(routeFilePath)(this));
    }

    public async run(): Promise<void> {
        await this.accountConnector.start();
        await this.messageConnector.start();
        await this.threadConnector.start();
        await this.clientDataConnector.start();
        await this.searchConnector.start();
        this.dispatcher.start();
        
        this._httpServer = this.app.listen(this._config.httpPort);
        this.log("status", "Server: Listening on port " + this._config.httpPort);
    }
    
    public async stop(): Promise<void> {
        this.dispatcher.stop();
        if (this._httpServer !== null) {
            this._httpServer.close();
        }
        this.log("status", "Server: Stopped.");
    }
    
    public log(level: string, message: string): void {
        this._logger.log(level, message);
    }
    
    public addStaticFileRoute(urlRoot: string, diskRoot: string): void {
        this.app.use(urlRoot, express.static(diskRoot, {
            maxAge: "6h",
            redirect: true
        }));
    }

    public addRoute(method: RequestMethod, path: string, handler: (req: express.Request) => Promise<any>): void {
        const expressHandler: express.RequestHandler = (req, res) => {
            var handlerPromise: Promise<any>;
            try {
                handlerPromise = handler(req);
            } catch (ex) {
                handlerPromise = Promise.reject(ex);
            }
            
            handlerPromise
                .then(resData => {
                    res.send(resData); 
                })
                .catch(ex => {
                    if (ex instanceof Error) {
                        const error = <Error>ex;
                        const code = error.name.substr(0, 4) === "ERR_" ? error.name : "ERR_SERVER";
                        res.status(code === "ERR_SERVER" ? 500 : 400);
                        res.send({
                            error: true,
                            code: code,
                            message: error.message
                        });
                        if (code === "ERR_SERVER") {
                            this.log("critical", (ex.name || "???") + " -- " + (ex.message || "???"));
                        }
                    } else {
                        res.status(500);
                        res.send({
                            error: true,
                            code: "ERR_SERVER",
                            message: ex.toString()
                        })
                        this.log("critical", ex.toString());
                    }
                });
        };
        
        if (method === RequestMethod.Get) {
            this.app.get(path, expressHandler);
        } else {
            this.app.post(path, expressHandler);
        }
    }
    
    public async verifyLogin(username: string, password: string): Promise<spec.UserCredentials> {
        var credentials = await this.accountConnector.tryLogin(username, password);
        if (credentials === null) {
            return Promise.reject<spec.UserCredentials>(spec.apiError(
                "ERR_INVALID_LOGIN", "Invalid username or password."));
        } else {
            return credentials;
        }
    }
}

// Finds all files recursively in 'dir'.
function findFilesSync(dir: string): string[] {
    const resultArray: string[] = [];
    findFilesSyncCore(dir, resultArray);
    return resultArray;
}

// Finds all files recursively in 'dir' and adds them to 'resultArray'.
function findFilesSyncCore(dir: string, resultArray: string[]): void {
    fs.readdirSync(dir).forEach(function(filename) {
        const filePath = path.join(dir, filename);
        const stat = fs.lstatSync(filePath);

        if (stat.isDirectory()) {
            findFilesSyncCore(filePath, resultArray);
        } else if (path.extname(filename) === '.js') {
            resultArray.push(filePath);
        }
    });
}

