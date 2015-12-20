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

const POSTS_PER_PAGE = 40;
const EXPIRATION_HOURS = 18;

async function getChattyPage(page: number, server: api.Server): Promise<spec.V1Page> {
    const allThreadIds = await server.threadConnector.getActiveThreadIds(9999, EXPIRATION_HOURS);
    const unnukedPosts = api.removeNukedSubthreads(await server.threadConnector.getThreads(allThreadIds));
    const unnukedThreadIds = lodash.chain(unnukedPosts).map(x => x.threadId).union().value();
    const pageThreadIds = lodash.chain(unnukedThreadIds).drop((page - 1) * POSTS_PER_PAGE).take(POSTS_PER_PAGE).value();
    const postsByThread = lodash.groupBy(unnukedPosts, x => x.threadId);
    const comments = lodash.map(pageThreadIds, threadId => spec.toV1Comment(threadId, postsByThread[threadId], true, false));
    const lastPage = Math.ceil(allThreadIds.length / POSTS_PER_PAGE);
    return new spec.V1Page(comments, page, lastPage);
}
 
module.exports = (server: api.Server) => {
    server.addRoute(api.RequestMethod.Get, "/v1/:ignored.:page.json", async (req) => {
        const page = parseInt(req.params.page, 10);
        if (isNaN(page) || page < 1) {
            return Promise.reject(new spec.V1Error("page must be at least 1."));
        } else {
            return await getChattyPage(page, server);
        }
    });

    server.addRoute(api.RequestMethod.Get, "/v1/index.json", async (req) => {
        return await getChattyPage(1, server);
    }); 
};
