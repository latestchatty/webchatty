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
import * as compression from "compression";
import * as fs from "fs";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as collections from "../collections/index";
import * as spec from "../spec/index";

// this is the entrypoint called by the client code.
export function runServer(config: IServerConfiguration): void {
    var server = new Server(config);
    server.run();
}

export interface IServerConfiguration {
    httpPort: number;
    accountConnector: spec.IAccountConnector;
    clientDataConnector: spec.IClientDataConnector;
}

export enum RequestMethod {
    Get, Post
}

export class Server {
    private _config: IServerConfiguration;
    private _app: express.Express;
   
    public accountConnector: spec.IAccountConnector;
    public clientDataConnector: spec.IClientDataConnector;
    
    constructor(config: IServerConfiguration) {
        this.accountConnector = config.accountConnector;
        this.clientDataConnector = config.clientDataConnector;
        this._config = config;
        this._app = express();
        this._app.use(morgan("combined"));
        this._app.use(compression({
            filter: () => true,
            threshold: 1
        }));
        this._app.use(bodyParser.urlencoded({ extended: false }));

        // configure the connectors with a reference to the server instance
        this.accountConnector.injectServer(this);
        this.clientDataConnector.injectServer(this);
        
        // load all of the routes in ./routes/ automatically by searching the filesystem for .js files
        findFilesSync(path.join(__dirname, "routes")).forEach(routeFilePath => require(routeFilePath)(this));
    }

    public run(): void {
        this._app.listen(this._config.httpPort);
        console.log("Listening on port " + this._config.httpPort);
    }

    public addRoute(method: RequestMethod, path: string, handler: (req: express.Request) => Promise<any>): void {
        var expressHandler: express.RequestHandler = (req, res) => {
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
                        var error = <Error>ex;
                        var code = error.name.substr(0, 4) === "ERR_" ? error.name : "ERR_SERVER";
                        res.status(code === "ERR_SERVER" ? 500 : 400);
                        res.send({
                            error: true,
                            code: code,
                            message: error.message
                        });
                    } else {
                        res.status(500);
                        res.send({
                            error: true,
                            code: "ERR_SERVER",
                            message: ex.toString()
                        })
                    }
                });
        };
        
        if (method === RequestMethod.Get) {
            this._app.get(path, expressHandler);
        } else {
            this._app.post(path, expressHandler);
        }
    }
}

// Finds all files recursively in 'dir'.
function findFilesSync(dir: string): string[] {
    var resultArray: string[] = [];
    findFilesSyncCore(dir, resultArray);
    return resultArray;
}

// Finds all files recursively in 'dir' and adds them to 'resultArray'.
function findFilesSyncCore(dir: string, resultArray: string[]): void {
    fs.readdirSync(dir).forEach(function(filename) {
        var filePath = path.join(dir, filename);
        var stat = fs.lstatSync(filePath);

        if (stat.isDirectory()) {
            findFilesSyncCore(filePath, resultArray);
        } else if (path.extname(filename) === '.js') {
            resultArray.push(filePath);
        }
    });
}
