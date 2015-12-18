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
import { Set } from "../../../collections/index";

async function getUnnukedPostRange(server: api.Server, startId: number, count: number, reverse: boolean)
        : Promise<spec.Post[]> {
    const unnukedPosts: spec.Post[] = [];
    
    // we need to exclude the nuked posts, and the nuked posts must not count against 'count'.
    // we will grab 'count+10' posts, then grab all the containing threads, then remove the nuked subthreads.
    // if there were more than 10 nuked posts in there, then read another full chunk of posts until we have enough.
    const chunkSize = count + 10;
    while (startId > 0 && unnukedPosts.length < count) {
        const posts = await server.threadConnector.getPostRange(startId, chunkSize, reverse);
        if (posts.length === 0) {
            break; // no posts left, so return fewer posts than requested
        }
        const threadIds = lodash.chain(posts).map(x => x.threadId).union().value();
        const allThreadPosts = await server.threadConnector.getThreads(threadIds);
        const allUnnukedPosts = api.removeNukedSubthreads(allThreadPosts);
        const postIds = Set.fromArray(posts, x => x.id);
        allUnnukedPosts.filter(x => postIds.contains(x.id)).forEach(post => {
            unnukedPosts.push(post);
        });
        startId += (reverse ? -1 : 1) * chunkSize;
    }

    return lodash
        .chain(unnukedPosts)
        .sortBy(x => (reverse ? -1 : 1) * x.id)
        .take(count)
        .value();
}

module.exports = (server: api.Server) => {
    server.addRoute(api.RequestMethod.Get, "/v2/getPostRange", async (req) => {
        const query = new api.QueryParser(req);
        var startId = query.getInteger("startId");
        const count = query.getInteger("count", 1, 1000);
        const reverse = query.getOptionalBoolean("reverse", false);
        const posts = await getUnnukedPostRange(server, startId, count, reverse);
        return { posts: lodash.map(posts, spec.postToHtml) };
    });
};
