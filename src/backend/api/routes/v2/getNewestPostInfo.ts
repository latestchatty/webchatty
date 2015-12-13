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

import * as lodash from "lodash";
import * as api from "../../index";
import * as spec from "../../../spec/index";

module.exports = (server: api.Server) => {
    server.addRoute(api.RequestMethod.Get, "/v2/getNewestPostInfo", async (req) => {
        const postId = await server.threadConnector.getNewestPostId();
        if (postId === 0) {
            // no posts at all yet
            return { id: 0, date: new Date(0) }
        } else {
            const post = await server.threadConnector.getPostRange(postId, 1, false);
            if (post.length > 0) {
                return { id: postId, date: post[0].date };
            } else {
                // response from the thread connector doesn't make sense.  if this is the newest post ID, then we 
                // should be able to read it (even if it's nuked).
                return Promise.reject(spec.apiError("ERR_SERVER", "Unable to find the newest post."));
            }
        }
    });
};
