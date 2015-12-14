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

import * as webchatty from "./../webchatty";
import * as supertest from "supertest";
import * as should from "should";

module.exports = async (harness: webchatty.TestHarness) => {
    await harness.test("username does not exist",
        supertest(harness.server.app)
        .post("/v2/postComment")
        .type("form")
        .send({ username: "invaliduser", password: "invalidpassword", parentId: 0, text: "invalid post" })
        .expect(harness.isError("ERR_INVALID_LOGIN"))
    );
    
    await harness.test("password is wrong",
        supertest(harness.server.app)
        .post("/v2/postComment")
        .type("form")
        .send({ username: "user", password: "invalidpassword", parentId: 0, text: "invalid post" })
        .expect(harness.isError("ERR_INVALID_LOGIN"))
    );
    
    await harness.test("new thread",
        supertest(harness.server.app)
        .post("/v2/postComment")
        .type("form")
        .send({ username: "user", password: "pass", parentId: 0, text: "new post" })
        .expect(200)
        .expect({ result: "success", newPostId: 1 })
    );
    
    await harness.test("new reply",
        supertest(harness.server.app)
        .post("/v2/postComment")
        .type("form")
        .send({ username: "user", password: "pass", parentId: 1, text: "new reply" })
        .expect(200)
        .expect({ result: "success", newPostId: 2 })
    );
};
