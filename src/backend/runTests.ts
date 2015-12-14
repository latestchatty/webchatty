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

/// <reference path="../../typings/tsd.d.ts" />
"use strict";

import * as webchatty from "./webchatty";
import * as supertest from "supertest";
import * as should from "should";

function newServer(test: boolean): webchatty.Server {
    const server = new webchatty.Server({
        httpPort: 8080,
        logFilePath: "./webchatty.log",
        logMaxFileSize: 5000000,
        logMaxFiles: 5,
        logUseJsonFormat: false,
        logConsoleLevel: test ? webchatty.LogLevel.Test : webchatty.LogLevel.Debug,
        logFileLevel: test ? webchatty.LogLevel.Test : webchatty.LogLevel.Request,
        accountConnector: new webchatty.MemoryAccountConnector([
            {
                username: "user",
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
        messageConnector: new webchatty.MemoryMessageConnector(),
        threadConnector: new webchatty.MemoryThreadConnnector(),
        searchConnector: new webchatty.MemorySearchConnector({
            maxPosts: 51000,
            prunePosts: 50000
        })
    });
    server.run();
    return server;
}

var numPasses = 0;
var numFails = 0;

function test(name: string, server: webchatty.Server, test: supertest.Test): Promise<void> {
    return new Promise<void>((resolve, reject) => { 
        test.end((err, res) => {
            if (err === null) {
                server.log("test", "Passed: " + name);
                numPasses++;
            } else {
                server.log("test", "FAILED: " + name);
                console.log(err);
                numFails++;
            }
            resolve();            
        });
    });
}

function isError(code: string): (res: supertest.Response) => any {
    const expectedStatus = code === "ERR_SERVER" ? 500 : 400;
    return res => {
        should.strictEqual(res.status, expectedStatus);
        should.strictEqual(res.body.error, true);
        should.strictEqual(res.body.code, code);
    };
}

async function postCommentTests(server: webchatty.Server): Promise<void> {
    await test("postComment - username does not exist", server,
        supertest(server.app)
        .post("/v2/postComment")
        .type("form")
        .send({ username: "invaliduser", password: "invalidpassword", parentId: 0, text: "invalid post" })
        .expect(isError("ERR_INVALID_LOGIN"))
    );
    
    await test("postComment - password is wrong", server,
        supertest(server.app)
        .post("/v2/postComment")
        .type("form")
        .send({ username: "user", password: "invalidpassword", parentId: 0, text: "invalid post" })
        .expect(isError("ERR_INVALID_LOGIN2"))
    );
    
    await test("postComment - new thread", server,
        supertest(server.app)
        .post("/v2/postComment")
        .type("form")
        .send({ username: "user", password: "pass", parentId: 0, text: "new post" })
        .expect(200)
        .expect({ result: "success", newPostId: 1 })
    );
    
    await test("postComment - new reply", server,
        supertest(server.app)
        .post("/v2/postComment")
        .type("form")
        .send({ username: "user", password: "pass", parentId: 1, text: "new reply" })
        .expect(200)
        .expect({ result: "success", newPostId: 2 })
    );
}

const allTests = [
    postCommentTests
];

async function runTests(): Promise<void> {
    for (var i = 0; i < allTests.length; i++) {
        const server = newServer(true);
        await allTests[i](server);
        server.stop();
    }
    
    console.log("Passed tests: " + numPasses);
    console.log("Failed tests: " + numFails);
    process.exit(numFails);
}

runTests();
