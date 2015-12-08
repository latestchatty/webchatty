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
import { Dictionary } from "../../../collections/index";

module.exports = function(server: api.Server) {
    server.addRoute(api.RequestMethod.Get, "/v2/getChattyRootPosts", async (req) => {
        const query = new api.QueryParser(req);
        const offset = query.getOptionalInteger("offset", 0);
        const limit = query.getOptionalInteger("limit", 40);
        const username = query.getOptionalString("username", "");
        const date = query.getOptionalDate("date", null);
        
        const allThreadIds = await server.threadConnector.getActiveThreadIds(9999, 18);
        const threadIds = lodash.chain(allThreadIds).drop(offset).take(limit).value();
        const posts = await server.threadConnector.getThreads(threadIds);
        const usernameLowerCase = username.toLowerCase();
        const userParticipationThreadIds = lodash
            .chain(posts)
            .filter(x => x.author.toLowerCase() === usernameLowerCase)
            .map(x => x.threadId)
            .union()
            .value();
        const rootPosts = lodash.filter(posts, x => x.id === x.threadId);
        const rootPostsById = Dictionary.fromArray(rootPosts, x => x.threadId, x => x);
        const threads = lodash.groupBy(posts, x => x.threadId); // ["threadId"] = Post[]
        const newestPosts = lodash.map(threads, threadPosts => ({ 
            threadId: threadPosts[0].threadId, 
            maxPostId: lodash.max(threadPosts, x => x.id), 
            postCount: threadPosts.length 
        }));
        return {
            totalThreadCount: allThreadIds.length,
            rootPosts: lodash
                .chain(newestPosts)
                .sortBy(x => -x.maxPostId)
                .map(x => ({
                    threadId: x.threadId,
                    post: rootPostsById.get(x.threadId),
                    isParticipant: lodash.contains(userParticipationThreadIds, x.threadId),
                    postCount: threads[x.threadId].length
                }))
                .map(x => ({
                    id: x.threadId,
                    date: x.post.date,
                    author: x.post.author,
                    category: x.post.category,
                    body: spec.tagsToHtml(x.post.body),
                    postCount: x.postCount,
                    isParticipant: x.isParticipant
                }))
                .value()
        };
    });
};
