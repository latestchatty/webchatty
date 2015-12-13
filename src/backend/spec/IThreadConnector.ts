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

import * as api from "../api/index";
import * as spec from "./index";
import { Dictionary } from "../collections/index";

export interface IThreadConnector {
    // Called by the server at startup to provide the connector with a reference to the server instance.
    injectServer(server: api.Server): void;
    
    // Called when the server is about to start listening for requests.
    start(): Promise<void>;
    
    // Gets the list of recently bumped threads, starting with the most recently bumped.  Only non-expired threads
    // are included.  Up to "maxThreads" of the most recent threads are returned.  "expirationHours" is the number of
    // hours to retain a thread in this list.
    getActiveThreadIds(maxThreads: number, expirationHours: number): Promise<number[]>;
    
    // Gets all posts in all specified threads, in no particular order.  The IDs may be replies inside the thread,
    // not necessarily the thread root.  If multiple post IDs in the same thread are specified, that thread's posts are 
    // returned only once.  If a post ID does not exist, then the thread is silently omitted from the results.
    getThreads(postIds: number[]): Promise<spec.Post[]>;
    
    // Resolves the new post ID if it worked.  parentId may be 0 to post a new thread.
    // The caller has already verified that the user is not banned.
    // May reject with ERR_POST_RATE_LIMIT, ERR_NUKED, ERR_INVALID_PARENT.
    // The thread connector must arrange for the NewPost event to be sent.  The post body sent in the event data must 
    // be in HTML (i.e. by calling spec.tagsToHtml(text)).
    postComment(credentials: spec.UserCredentials, parentId: number, text: string): Promise<number>;
    
    // Resolves the newest post ID in the database, or 0 if there are no posts.  The newest post may be nuked.
    getNewestPostId(): Promise<number>;
    
    // Gets a consecutive range of posts, omitting nuked posts.  Nuked posts are excluded, and do not count towards
    //  the maximum 'count'. startId is inclusive.
    getPostRange(startId: number, count: number, reverse: boolean): Promise<spec.Post[]>;
    
    // Moderator-only action that changes a post's category.  The caller has verified that the user is a moderator.
    // Rejects with ERR_INVALID_POST if the post ID does not exist.
    // The thread connector must arrange for the CategoryChange event to be sent.
    setPostCategory(postId: number, category: spec.ModerationFlag): Promise<void>;
}
