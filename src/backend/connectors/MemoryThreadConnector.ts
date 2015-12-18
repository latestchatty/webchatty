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
    
    private _nextId = 1;
    private _threads: MemoryThread[] = [];
    private _posts = new Dictionary<number, spec.Post>(); // id -> post
    
    // Called by the server at startup to provide the connector with a reference to the server instance.
    public injectServer(server: api.Server): void {
        this._server = server;
    }
    
    // Called when the server is about to start listening for requests.
    public async start(): Promise<void> {
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
    
    // Gets all posts (including nuked posts) in all specified threads, in no particular order.  The IDs may be 
    // replies inside the thread, not necessarily the thread root.  If multiple post IDs in the same thread are 
    // specified, that thread's posts are returned only once.  If a post ID does not exist, then the thread is silently
    // omitted from the results.
    public async getThreads(postIds: number[]): Promise<spec.Post[]> {
        var threadIds = lodash
            .chain(postIds)
            .map(x => this._posts.lookup(x, null))
            .filter(x => x !== null)
            .map(x => x.threadId)
            .value();
        return lodash.filter(this._posts.values(), x => lodash.contains(threadIds, x.threadId));
    }
    
    // Resolves the new post ID if it worked.  parentId may be 0 to post a new thread.
    // The caller has already verified that the user is not banned.
    // May reject with ERR_POST_RATE_LIMIT, ERR_NUKED, ERR_INVALID_PARENT.
    // The thread connector must arrange for the NewPost event to be sent.  The post body sent in the event data must 
    // be in HTML (i.e. by calling spec.tagsToHtml(text)).
    public async postComment(credentials: spec.UserCredentials, parentId: number, text: string): Promise<number> {
        if (parentId !== 0 && !this._posts.containsKey(parentId)) {
            return Promise.reject<number>(spec.apiError("ERR_INVALID_PARENT", "parentId does not exist."));
        }
        const newPostId = this._nextId++;
        var parentPost = parentId === 0 ? null : this._posts.get(parentId);
        var post = {
            id: newPostId,
            threadId: parentId === 0 ? newPostId : parentPost.threadId,
            parentId: parentId,
            author: credentials.username,
            category: spec.ModerationFlag.OnTopic,
            date: new Date(),
            body: text, //TODO: handle tags
            lols: <spec.LolCount[]>[]
        };
        this._posts.set(newPostId, post);
        if (parentId === 0) {
            this._threads.push({
                threadId: newPostId,
                newestId: newPostId,
                postDate: post.date
            });
        } else {
            this._threads.filter(x => x.threadId === post.threadId)[0].newestId = newPostId;
        }
        
        await this._server.dispatcher.sendEvent(spec.EventType.NewPost, {
            postId: newPostId,
            post: spec.postToHtml(post),
            parentAuthor: parentId === 0 ? "" : parentPost.author
        });
                
        return newPostId;
    }
    
    // Resolves the newest post ID in the database, or 0 if there are no posts.  The newest post may be nuked.
    public async getNewestPostId(): Promise<number> {
        return this._nextId - 1;
    }
    
    // Gets a consecutive range of posts, including nuked posts.
    public async getPostRange(startId: number, count: number, reverse: boolean): Promise<spec.Post[]> {
        const list: spec.Post[] = [];
        for (var id = startId; id > 0 && id < this._nextId && list.length < count; id += (reverse ? -1 : 1)) {
            const post = this._posts.lookup(id, null);
            if (post !== null) {
                list.push(post);
            }
        }
        return list;
    }
    
    // Moderator-only action that changes a post's category.  The caller has verified that the user is a moderator.
    // Rejects with ERR_INVALID_POST if the post ID does not exist.
    // The thread connector must arrange for the CategoryChange event to be sent.
    public async setPostCategory(postId: number, category: spec.ModerationFlag): Promise<void> {
        const post = this._posts.lookup(postId, null);
        if (post === null) {
            return Promise.reject<void>(spec.apiError("ERR_INVALID_POST", "Post ID does not exist."));
        } else {
            post.category = category;
            
            await this._server.dispatcher.sendEvent(spec.EventType.CategoryChange, {
                postId: postId,
                category: category
            });
        }
    }
    
}
