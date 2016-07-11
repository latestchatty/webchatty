// WebChatty
// Copyright (C) 2016 Andy Christianson, Brian Luft, Willie Zutz
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

import * as util from "util";
import * as api from "../api/index";
import * as connectors from "../connectors/index";
import * as spec from "../spec/index";
import * as moment from "moment";
import { Dictionary } from "../collections/index";

export interface ShacknewsThreadConnectorConfig {
    pollingIntervalMsec: number;
}

export class ShacknewsThreadConnector {
    private _server: api.Server;
    private _common: connectors.ShacknewsCommon;
    private _pollTimer: ResettableTimer;
    private _lastModLogId: number = 0; // last chat_mod_log id seen
    private _lastPostId: number = 0; // last chat_posts id seen
    
    constructor(common: connectors.ShacknewsCommon, config: ShacknewsThreadConnectorConfig) {
        this._common = common;
        this._pollTimer = new ResettableTimer(config.pollingIntervalMsec, this.pollForChanges);
    }
    
    // Called by the server at startup to provide the connector with a reference to the server instance.
    public injectServer(server: api.Server): void {
        this._server = server;
    }
    
    // Called when the server is about to start listening for requests.
    public async start(): Promise<void> {
        const modLogRows: { id: number }[] = await this._common.query(`SELECT MAX(id) AS id FROM chat_mod_log`, {});
        if (modLogRows.length === 1) {
            this._lastModLogId = modLogRows[0].id;
        }

        const postRows: { id: number }[] = await this._common.query(`SELECT MAX(id) AS id FROM chat_posts`, {});
        if (postRows.length === 1) {
            this._lastPostId = postRows[0].id;
        }
        
        this._pollTimer.start();
    }
    
    // Called when the server is shutting down.
    public async stop(): Promise<void> {
        await this._pollTimer.stop();
    }
    
    // Gets the list of recently bumped threads, starting with the most recently bumped.  
    // Only non-nuked, non-expired threads are included.  Up to "maxThreads" of the most recent threads are returned.  
    // "expirationHours" is the number of hours to retain a thread in this list.
    public async getActiveThreadIds(maxThreads: number, expirationHours: number): Promise<number[]> {
        const rows: { id: number; }[] = await this._common.query(
            `SELECT op.id
            FROM chat_posts AS op
            INNER JOIN chat_posts AS replies ON op.id = replies.root_id
            WHERE
                op.id = op.root_id AND
                op.post_time > DATE_ADD(CURDATE(), INTERVAL :negHours HOUR) AND
                op.content_id != 99
            GROUP BY op.id
            ORDER BY MAX(replies.id) DESC`,
            { negHours: -expirationHours }
        );
        return rows.map(x => x.id);
    }
    
    // Gets all posts (including nuked posts) in all specified threads, in no particular order.  The IDs may be 
    // replies inside the thread, not necessarily the thread root.  If multiple post IDs in the same thread are 
    // specified, that thread's posts are returned only once.  If a post ID does not exist, then the thread is silently
    // omitted from the results.
    public async getThreads(postIds: number[]): Promise<spec.Post[]> {
        if (postIds.length === 0) {
            return [];
        }
        interface Row {
            id: number;
            threadId: number;
            parentId: number;
            author: string;
            category: number;
            date: Date;
            body: string;
        }
        const rows: Row[] = await this._common.query(
            `SELECT
                id, q.root_id AS threadId, parent_id AS parentId, u.username AS author,
                mod_type_id AS category, post_time AS date, body
            FROM chat_posts AS q
            INNER JOIN (
                SELECT DISTINCT p.root_id
                FROM chat_posts p
                WHERE p.id IN (${postIds.map((x,i) => `:arg${i}`).join(",")})
            ) AS a ON q.root_id = a.root_id
            INNER JOIN users u ON q.user_id = u.id
            WHERE content_id != 99`, 
            this.arrayToObject(postIds.map((x,i) => ({ index: i, value: x})), x => `:arg${x.index}`, x => x.value) 
        );
        return rows.map(x => <spec.Post>{
            id: x.id,
            threadId: x.threadId,
            parentId: x.parentId,
            author: x.author,
            category: this.parseCategory(x.category),
            date: x.date,
            body: x.body,
            lols: []
        });
    }
    
    // Resolves the new post ID if it worked.  parentId may be 0 to post a new thread.
    // The caller has already verified that the user is not banned.
    // May reject with ERR_POST_RATE_LIMIT, ERR_NUKED, ERR_INVALID_PARENT.
    // The thread connector must arrange for the NewPost event to be sent.  The post body sent in the event data must 
    // be in HTML (i.e. by calling spec.tagsToHtml(text)).
    public async postComment(credentials: spec.UserCredentials, parentId: number, text: string): Promise<number> {
        var contentId = 17, contentTypeId = 17;
        if (parentId > 0) {
            const rows: { contentId: number; contentTypeId: number; }[] = await this._common.query(
                `SELECT content_id AS contentId, content_type_id AS contentTypeId
                FROM chat_posts
                WHERE id = :parentId`,
                { parentId: parentId }
            );
            if (rows.length === 0) {
                return Promise.reject(spec.apiError("ERR_INVALID_PARENT", "Parent ID was not found."));
            }
            contentId = rows[0].contentId;
            contentTypeId = rows[0].contentTypeId;
        }
        
        // can't post to the mod board with this API
        if (contentId === 99) {
            return Promise.reject(spec.apiError("ERR_INVALID_PARENT", "Parent ID was not found."));
        }
        
        const http = await this._common.newUserSession(credentials);
        const response = await http.request("post", "https://www.shacknews.com/post_chatty.x", {
            "parent_id": parentId === 0 ? "" : parentId,
            "content_type_id": contentTypeId,
            "content_id": contentId,
            "page": "",
            "parent_url": "/chatty",
            "body": text
        });
        
        // the response is a bunch of HTML that includes a line like this:
        //      navigate_page_no_history( window, "/frame_chatty.x?mode=refresh&anchor=1&id=34615541");
        // we can parse the new post ID from there.
        const re = /\/frame_chatty\.x\?mode=refresh&anchor=1&id=([0-9]+)"/;
        const m = re.exec(response);
        if (m === null) {
            return Promise.reject("Unable to parse the new post ID from the Shacknews response.");
        }
        
        // trigger an immediate check for new posts and post changes.  this will send the NewPost event.
        await this._pollTimer.triggerNow();
        return parseInt(m[1]);
    }
    
    // Resolves the newest post ID in the database, or 0 if there are no posts.  The newest post may be nuked.
    public async getNewestPostId(): Promise<number> {
        const rows: { id: number; }[] = await this._common.query(
            `SELECT id
            FROM chat_posts
            WHERE content_id != 99
            ORDER BY id DESC
            LIMIT 1`,
            {}
        );
        if (rows.length === 0) {
            return 0;
        } else {
            return rows[0].id;
        }
    }
    
    // Gets a consecutive range of posts, including nuked posts.
    public async getPostRange(startId: number, count: number, reverse: boolean): Promise<spec.Post[]> {
        interface Row {
            id: number;
            threadId: number;
            parentId: number;
            author: string;
            category: number;
            date: Date;
            body: string;
        }
        const rows: Row[] = await this._common.query(
            `SELECT
                id, p.root_id AS threadId, parent_id AS parentId, u.username AS author,
                mod_type_id AS category, post_time AS date, body
            FROM chat_posts AS p
            INNER JOIN users AS u ON p.user_id = u.id
            WHERE
                p.id ${reverse ? "<=" : ">="} :startId AND
                p.content_id != 99
            LIMIT :count`, 
            { startId: startId, count: count }
        );
        return rows.map(x => <spec.Post>{
            id: x.id,
            threadId: x.threadId,
            parentId: x.parentId,
            author: x.author,
            category: this.parseCategory(x.category),
            date: x.date,
            body: x.body,
            lols: []
        });        
    }
    
    // Moderator-only action that changes a post's category.  The caller has verified that the user is a moderator.
    // Rejects with ERR_INVALID_POST if the post ID does not exist.
    // The thread connector must arrange for the CategoryChange event to be sent.
    public async setPostCategory(credentials: spec.UserCredentials, postId: number, category: spec.ModerationFlag)
            : Promise<void> {
        // what thread is this post part of?
        const rows: { threadId: number; }[] = await this._common.query(
            `SELECT root_id AS threadId
            FROM chat_posts
            WHERE id = :postId`,
            { postId: postId}
        );
        if (rows.length === 0) {
            return Promise.reject(spec.apiError("ERR_INVALID_POST", "Post does not exist."));
        }
        const threadId = rows[0].threadId;
        
        // make the actual change via the shack api        
        const http = await this._common.newUserSession(credentials);
        const response = await http.request("get", "https://www.shacknews.com/mod_chatty.x", {
            "root": threadId,
            "post_id": postId,
            "mod_type_id": this.toCategory(category)
        });
        if (response.indexOf("Invalid moderation flags") >= 0) {
            return Promise.reject("Possible bug in the API. Server does not understand the moderation flag.");
        } else if (response.indexOf('navigate_page_no_history( window, "/frame_chatty.x?root=') === 0) {
            // this shouldn't happen; the caller already verified the user is a moderator.
            return Promise.reject("Failed to set the post category.  User likely does not have moderator privileges.");
        }
        
        // trigger an immediate check for new posts and post changes.  this will send the CategoryChange event.
        await this._pollTimer.triggerNow();
    }
    
    private parseCategory(category: number): spec.ModerationFlag {
        switch (category) {
            case 1: return spec.ModerationFlag.Informative;
            case 2: return spec.ModerationFlag.NotWorkSafe;
            case 3: return spec.ModerationFlag.Stupid;
            case 4: return spec.ModerationFlag.Tangent;
            case 5: return spec.ModerationFlag.OnTopic;
            case 7: return spec.ModerationFlag.Nuked;
            case 8: return spec.ModerationFlag.Nuked;
            case 9: return spec.ModerationFlag.PoliticalReligious;
            default: return spec.ModerationFlag.OnTopic;
        }
    }
    
    private toCategory(modFlag: spec.ModerationFlag): number {
        switch (modFlag) {
            case spec.ModerationFlag.Informative: return 1;
            case spec.ModerationFlag.NotWorkSafe: return 2;
            case spec.ModerationFlag.Stupid: return 3;
            case spec.ModerationFlag.Tangent: return 4;
            case spec.ModerationFlag.OnTopic: return 5;
            case spec.ModerationFlag.Nuked: return 8;
            case spec.ModerationFlag.PoliticalReligious: return 9;
            default: return 5;
        }
    }
    
    private arrayToObject<T>(array: T[], keySelector: (value: T) => string, valueSelector: (value: T) => any): any {
        const obj: any = {};
        for (var i = 0; i < array.length; i++) {
            obj[keySelector(array[i])] = valueSelector(array[i]);
        }
        return obj;
    }
    
    private async pollForChanges(): Promise<void> {
        // check for new posts
        interface PostRow {
            id: number;
            threadId: number;
            parentId: number;
            author: string;
            category: number;
            date: Date;
            body: string;
            parentAuthor: string;
        }
        const postRows: PostRow[] = await this._common.query(
            `SELECT
                p.id, p.root_id AS threadId, p.parent_id AS parentId, u.username AS author,
                p.mod_type_id AS category, p.post_time AS date, p.body, COALESCE(pu.username, '') AS parentAuthor
            FROM chat_posts AS p
            INNER JOIN users AS u ON p.user_id = u.id
            LEFT JOIN chat_posts AS parent ON p.parent_id = parent.id
            LEFT JOIN users AS pu ON parent.user_id = pu.id
            WHERE p.id > :lastPostId AND p.content_id != 99
            ORDER BY p.id`, 
            { lastPostId: this._lastPostId }
        );
        for (var i = 0; i < postRows.length; i++) {
            const x = postRows[i];
            const post: spec.Post = {
                id: x.id,
                threadId: x.threadId,
                parentId: x.parentId,
                author: x.author,
                category: this.parseCategory(x.category),
                date: x.date,
                body: x.body,
                lols: []
            };
            await this._server.dispatcher.sendEvent(spec.EventType.NewPost, {
                postId: x.id,
                post: spec.postToHtml(post),
                parentAuthor: x.parentAuthor
            });
            this._lastPostId = x.id;
        }
        
        // check for moderations to existing posts
        interface ModRow {
            id: number;
            postId: number;
            category: number;
        }
        const modRows: ModRow[] = await this._common.query(
            `SELECT id, post_id AS postId, mod_type_id AS category
            FROM chat_mod_log
            WHERE id > :lastModLogId
            ORDER BY id`,
            { lastModLogId: this._lastModLogId }
        );
        for (var i = 0; i < modRows.length; i++) {
            const x = modRows[i];
            await this._server.dispatcher.sendEvent(spec.EventType.CategoryChange, {
                postId: x.postId,
                category: this.parseCategory(x.category)
            });
            this._lastModLogId = x.id;
        }
    }
}

// we poll for new posts and moderation actions every N seconds, but if we've made a new post or moderation action
// ourselves we can trigger the poll immediately and reset the N second clock at that point.  the design of the class
// ensures that only one call to the asynchronous callback is in flight at a time.
class ResettableTimer {
    private _callback: () => Promise<void>;
    private _milliseconds: number;
    private _inCallback: boolean = false;
    private _timer: NodeJS.Timer = null;
    private _stopping: boolean = false;
    
    // if a triggerNow() request comes in while the callback is running, it is queued up here.
    // if a tick finishes and sees that there are waiters here, then _callback is immediately run again
    // and the waiters are notified.
    private _waiters: (() => void)[] = [];
    
    constructor(milliseconds: number, timerCallback: () => Promise<void>) {
        this._callback = timerCallback;
        this._milliseconds = milliseconds;
    }
    
    public start(): void {
        this._timer = setTimeout(this.tick, this._milliseconds);
    }
    
    public async stop(): Promise<void> {
        this._stopping = true;
        if (this._inCallback) {
            // wait until the callback finishes
            return new Promise<void>((resolve, reject) => {
                this._waiters.push(resolve);
            });
        } else {
            if (this._timer !== null) {
                clearTimeout(this._timer);
                this._timer = null;
            }
        }
    }
    
    // immediately calls the callback.  the promise does not return until the triggered callback is complete.
    public triggerNow(): Promise<void> {
        // if we're already in the middle of the callback, then queue up to run after that callback is finished.
        if (this._inCallback) {
            return new Promise<void>((resolve, reject) => {
                this._waiters.push(resolve);
            });
        } else {
            return this.tick();
        }
    }
    
    private async tick(): Promise<void> {
        if (this._inCallback === true) {
            // should never happen, but just in case
            return;
        }
        
        if (this._timer !== null) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        
        this._inCallback = true;
        {
            // some calls to triggerNow() may queued up while the callback runs.
            // re-run the callback if so.  more triggerNow() calls may queue up while *that* callback
            // is running, so keep going until we clear the queue.
            do {
                const waitersThisIteration = this._waiters;
                this._waiters = [];
                await this._callback(); // more _waiters may be added while this runs
                waitersThisIteration.forEach(x => x());
            } while (this._waiters.length > 0);
        }
        this._inCallback = false;
        
        if (!this._stopping) {
            this._timer = setTimeout(this.tick, this._milliseconds);
        }
    }
}
