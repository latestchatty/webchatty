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
import { Dictionary, DictionaryWithDefault, Set } from "../collections/index";

export interface MemorySearchConnectorOptions {
    // when the search index hits this number of posts, then trigger an eviction of the oldest posts.
    // suggested: 51000
    maxPosts: number;
    
    // when MAX_SEARCH_POSTS has been hit, then remove all but the newest PRUNE_SEARCH_POSTS posts.
    // suggested: 50000
    prunePosts: number;
}

export class MemorySearchConnector implements spec.ISearchConnector {
    private _server: api.Server;
    private _options: MemorySearchConnectorOptions;
    
    private _posts = new Dictionary<number, spec.HtmlPost>();
    private _postsByStem = new DictionaryWithDefault<string, Set<number>>(
        () => new Set<number>()); // word stem => post IDs
    private _postsByAuthor = new DictionaryWithDefault<string, Set<number>>(
        () => new Set<number>()); // lowercase author => post IDs
    private _postsByParentAuthor = new DictionaryWithDefault<string, Set<number>>(
        () => new Set<number>()); // lowercase parent author => post IDs
    private _postsByCategory = new DictionaryWithDefault<spec.ModerationFlag, Set<number>>(
        () => new Set<number>()); // mod flag => post IDs
    
    constructor(options: MemorySearchConnectorOptions) {
        if (options.prunePosts >= options.maxPosts) {
            throw spec.apiError("ERR_SERVER", "MemorySearchConnector: prunePosts must be less than maxPosts.");
        }
        
        this._options = options;
    }
    
    // Called by the server at startup to provide the connector with a reference to the server instance.
    public injectServer(server: api.Server): void {
        this._server = server;
        server.dispatcher.newEventSignal.addHandler(async (event) => {
            await this.onNewEvent(event);
        });
    }
    
    // Called when the server is about to start listening for requests.
    public async start(): Promise<void> {
        // this may take some time so make a note of it in the log output
        this._server.log("status", "MemorySearchConnector: Loading initial posts...");
        
        // preload the newest posts
        const newestPostId = await this._server.threadConnector.getNewestPostId();
        if (newestPostId > 0) {
            const posts = await this._server.threadConnector.getPostRange(newestPostId, this._options.maxPosts, true);
            const postsDict = Dictionary.fromArray(posts, x => x.id, x => x);
            
            for (var i = 0; i < posts.length; i++) {
                const post = posts[i];
                const parentPost = postsDict.lookup(post.parentId, null);
                const event = {
                    eventId: 0,
                    eventDate: new Date(),
                    eventType: spec.EventType.NewPost,
                    eventData: <spec.NewPostEventData>{
                        parentAuthor: parentPost === null ? "" : parentPost.author,
                        post: spec.postToHtml(post),
                        postId: post.id
                    }
                }
                await this.onNewEvent(event);
            }
        }
        
        this._server.log("status", "MemorySearchConnector: Ready.");
    }
    
    // Comment search. At least one of [terms, author, parentAuthor, category] will be provided and the others are null 
    // (caller verified).
    public async search(terms: string, author: string, parentAuthor: string, category: spec.ModerationFlag, 
            offset: number, limit: number, oldestFirst: boolean): Promise<spec.HtmlPost[]> {
        const resultSets: Set<number>[] = [];
        
        if (terms !== null) {
            while (terms.indexOf("  ") !== -1) {
                terms = terms.replace("  ", " ");
            }
            const words = terms.split(" ");
            const stems = lodash.chain(words).map(x => spec.getWordStem(x)).union().value();
            stems.forEach(stem => {
                resultSets.push(this._postsByStem.get(stem));
            });
        }
        
        if (author !== null) {
            const lcAuthor = author.toLowerCase()
            resultSets.push(this._postsByAuthor.get(lcAuthor));
        }
        
        if (parentAuthor !== null) {
            const lcParentAuthor = parentAuthor.toLowerCase()
            resultSets.push(this._postsByParentAuthor.get(lcParentAuthor));
        }
        
        if (category !== null) {
            resultSets.push(this._postsByCategory.get(category));
        }
        
        if (resultSets.length === 0) {
            return [];
        }
        
        const sortedResultSets = lodash.sortBy(resultSets, x => x.count());
        var results = sortedResultSets[0].keys();
        for (var i = 1; i < sortedResultSets.length; i++) {
            results = lodash.intersection(results, sortedResultSets[i].keys());
        }
        
        return lodash
            .chain(results)
            .sortBy(x => oldestFirst ? x : -x)
            .map(x => this._posts.get(x))
            .filter(x => x.category !== spec.ModerationFlag.Nuked)
            .drop(offset)
            .take(limit)
            .value();
    }
    
    public addPostToIndex(newPost: spec.HtmlPost, parentAuthor: string): void {
        this._posts.set(newPost.id, newPost);
        
        const wordStems = lodash.map(
            spec.stripHtmlTags(newPost.body.replace(/</g, " <")).replace(/  /g, " ").trim().split(" "), 
            spec.getWordStem);
        wordStems.forEach(stem => {
            this._postsByStem.get(stem).add(newPost.id);
        });
        
        this._postsByAuthor.get(newPost.author.toLowerCase()).add(newPost.id);
        this._postsByParentAuthor.get(parentAuthor.toLowerCase()).add(newPost.id);
        this._postsByCategory.get(newPost.category).add(newPost.id);
    }
    
    private async onNewEvent(event: spec.Event): Promise<void> {
        if (event.eventType == spec.EventType.NewPost) {
            const eventData = <spec.NewPostEventData>event.eventData;
            const newPost = eventData.post;
            this.addPostToIndex(newPost, eventData.parentAuthor);
            await this.pruneIfNeeded();
        } else if (event.eventType == spec.EventType.CategoryChange) {
            const eventData = <spec.CategoryChangeEventData>event.eventData;
            const post = this._posts.lookup(eventData.postId, null);
            if (post !== null) {
                this._postsByCategory.get(post.category).remove(post.id);
                post.category = eventData.category;
                this._postsByCategory.get(post.category).add(post.id);
            }
        }
    }
    
    private async pruneIfNeeded(): Promise<void> {
        if (this._posts.count() >= this._options.maxPosts) {
            this._server.log("status", "MemorySearchConnector: Starting reindex...");
            const survivors = lodash.chain(this._posts.keys()).sortBy(x => -x).take(this._options.prunePosts).value();
            const postsDict = this._posts;
            
            this._posts = new Dictionary<number, spec.Post>();
            this._postsByStem = new DictionaryWithDefault<string, Set<number>>(
                () => new Set<number>());
            this._postsByAuthor = new DictionaryWithDefault<string, Set<number>>(
                () => new Set<number>());
            this._postsByParentAuthor = new DictionaryWithDefault<string, Set<number>>(
                () => new Set<number>());
            this._postsByCategory = new DictionaryWithDefault<spec.ModerationFlag, Set<number>>(
                () => new Set<number>());
            
            for (var i = 0; i < survivors.length; i++) {
                const post = postsDict.get(survivors[i]);
                const parentPost = postsDict.lookup(post.parentId, null);
                const event = {
                    eventId: 0,
                    eventDate: new Date(),
                    eventType: spec.EventType.NewPost,
                    eventData: <spec.NewPostEventData>{
                        parentAuthor: parentPost === null ? "" : parentPost.author,
                        post: spec.postToHtml(post),
                        postId: post.id
                    }
                }
                await this.onNewEvent(event);
            }
            this._server.log("status", "MemorySearchConnector: Reindex finished.");
        }
    }
}
