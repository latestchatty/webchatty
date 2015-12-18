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

/// <reference path="../../../../../typings/tsd.d.ts" />
"use strict";

import * as api from "../../index";
import * as spec from "../../../spec/index";

module.exports = (server: api.Server) => {
    server.addRoute(api.RequestMethod.Get, "/v1/thread/:id.json", async (req) => {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id < 1) {
            return Promise.reject(new spec.V1Error("id must be at least 1."));
        }
        const posts = api.removeNukedSubthreads(await server.threadConnector.getThreads([id]));
        if (posts.length === 0) {
            return Promise.reject(new spec.V1Error("Thread was not found."));
        }
        const threadId = posts[0].threadId;
        const comment = spec.toV1Comment(threadId, posts, true, true);
        return new spec.V1Thread([comment]);
    });
};
