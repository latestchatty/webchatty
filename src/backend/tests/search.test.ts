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
        .send({ username: "mod", password: "pass", parentId: 1, text: "new reply" })
        .expect(200)
        .expect({ result: "success", newPostId: 2 })
    );
    
    await harness.test("set reply category",
        supertest(harness.server.app)
        .post("/v2/setPostCategory")
        .type("form")
        .send({ username: "mod", password: "pass", postId: 2, category: "informative" })
        .expect(200)
        .expect({ result: "success" })
    );
    
    function shouldBePost1(post: any) {
        should.strictEqual(post.id, 1);
        should.strictEqual(post.threadId, 1);
        should.strictEqual(post.parentId, 0);
        should.strictEqual(post.author, "user");
        should.strictEqual(post.category, "ontopic");
        should.exist(post.date);
        should.strictEqual(post.body, "new post");
        should.exist(post.lols);
    }
    
    function shouldBePost2(post: any) {
        should.strictEqual(post.id, 2);
        should.strictEqual(post.threadId, 1);
        should.strictEqual(post.parentId, 1);
        should.strictEqual(post.author, "mod");
        should.strictEqual(post.category, "informative");
        should.exist(post.date);
        should.strictEqual(post.body, "new reply");
        should.exist(post.lols);
    }
    
    await harness.test("term search",
        supertest(harness.server.app)
        .get("/v2/search?terms=posting")
        .expect(200)
        .expect((res: supertest.Response) => {
            should.exist(res.body.posts);
            shouldBePost1(res.body.posts[0]);
        })
    );
    
    await harness.test("category search",
        supertest(harness.server.app)
        .get("/v2/search?category=informative")
        .expect(200)
        .expect((res: supertest.Response) => {
            should.exist(res.body.posts);
            shouldBePost2(res.body.posts[0]);
        })
    );
    
    await harness.test("author search",
        supertest(harness.server.app)
        .get("/v2/search?author=mod")
        .expect(200)
        .expect((res: supertest.Response) => {
            should.exist(res.body.posts);
            shouldBePost2(res.body.posts[0]);
        })
    );
    
    await harness.test("parent author search",
        supertest(harness.server.app)
        .get("/v2/search?parentAuthor=user")
        .expect(200)
        .expect((res: supertest.Response) => {
            should.exist(res.body.posts);
            shouldBePost2(res.body.posts[0]);
        })
    );
    
};
