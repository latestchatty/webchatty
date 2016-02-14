// WebChatty
// Copyright (C) 2016 Andy Christianson, Brian Luft, Willie Zutz
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

/// <reference path="../../typings/tsd.d.ts" />
"use strict";

import * as webchatty from "./webchatty";
import * as knex from "knex";

// This connects WebChatty to the Shacknews MySQL backend.

[
    "SHACK_SQL_HOSTNAME",
    "SHACK_SQL_PORT",
    "SHACK_SQL_USERNAME",
    "SHACK_SQL_PASSWORD",
    "SHACK_SQL_DATABASE",
].forEach(envVar => {
    if (!process.env.hasOwnProperty(envVar)) {
        console.error("Missing environment variable: " + envVar);
        process.exit(1);
    }
});

const db = knex({
    client: "mysql",
    connection: {
        host: process.env.SHACK_SQL_HOSTNAME,
        port: process.env.SHACK_SQL_PORT,
        user: process.env.SHACK_SQL_USERNAME,
        password: process.env.SHACK_SQL_PASSWORD,
        database: process.env.SHACK_SQL_DATABASE
    }
});

const server = new webchatty.Server({
    httpPort: 8080,
    logFilePath: "./webchatty.log",
    logMaxFileSize: 5000000,
    logMaxFiles: 5,
    logUseJsonFormat: false,
    logConsoleLevel: webchatty.LogLevel.Debug,
    logFileLevel: webchatty.LogLevel.Request,
    accountConnector: new webchatty.MemoryAccountConnector([
        {
            username: "electroly",
            password: "pass",
            level: webchatty.UserAccessLevel.User,
            registrationDate: new Date("2014-02-03T11:15:00Z") 
        },
        {
            username: "mod",
            password: "pass",
            level: webchatty.UserAccessLevel.Moderator,
            registrationDate: new Date("2014-01-02T23:00:00Z") 
        },
        {
            username: "admin",
            password: "pass",
            level: webchatty.UserAccessLevel.Administrator,
            registrationDate: new Date("2004-01-01T15:30:11Z") 
        },
    ]),
    clientDataConnector: new webchatty.MemoryClientDataConnector(),
    messageConnector: new webchatty.ShacknewsMessageConnector(db),
    threadConnector: new webchatty.MemoryThreadConnnector(),
    searchConnector: new webchatty.MemorySearchConnector({
        maxPosts: 51000,
        prunePosts: 50000
    })
});

server.run();

process.on("SIGINT", async () => {
    await server.stop();
    process.exit(0);
});
