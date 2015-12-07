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

import * as lodash from "lodash";
import * as api from "../api/index";
import * as spec from "../spec/index";
import { Dictionary } from "../collections/index";

class MemoryThread {
    threadId: number;
    newestId: number;
    postDate: Date;
}

export class MemoryThreadConnnector implements spec.IThreadConnector {
    private _server: api.Server;
    
    private _threads: MemoryThread[] = [];
    private _posts = new Dictionary<number, spec.Post>(); // id -> post
    
    // Called by the server at startup to provide the connector with a reference to the server instance.
    public injectServer(server: api.Server): void {
        this._server = server;
    }
    
    // Gets the list of recently bumped threads, starting with the most recently bumped.  Only non-expired threads
    // are included.  Up to "maxThreads" of the most recent threads are returned.  "expirationHours" is the number of
    // hours to retain a thread in this list.
    public async getActiveThreadIds(maxThreads: number, expirationHours: number): Promise<number[]> {
        var nowMsec = new Date().getTime();
        var expirationMsec = expirationHours * 3600000;
        var thresholdMsec = nowMsec - expirationMsec;
        return lodash
            .chain(this._threads)
            .filter(x => x.postDate.getTime() > thresholdMsec)
            .sortBy(x => -x.newestId)
            .map(x => x.threadId)
            .take(maxThreads)
            .value();
    }
    
    // Gets all posts in all specified threads, in no particular order.  The IDs may be replies inside the thread,
    // not necessarily the thread root.  If multiple post IDs in the same thread are specified, that thread's posts are 
    // returned only once.  If a post ID does not exist, then the thread is silently omitted from the results.
    public async getThreads(postIds: number[]): Promise<spec.Post[]> {
        var threadIds = lodash
            .chain(postIds)
            .map(x => this._posts.lookup(x, null))
            .filter(x => x !== null)
            .map(x => x.threadId)
            .value();
        return lodash.filter(this._posts.values(), x => lodash.contains(threadIds, x.threadId));
    }
}
