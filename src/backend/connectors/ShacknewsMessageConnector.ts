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

import * as knex from "knex";
import * as _ from "lodash";
import * as api from "../api/index";
import * as spec from "../spec/index";
import { Dictionary } from "../collections/index";

export class ShacknewsMessageConnector implements spec.IMessageConnector {
    private _db: knex;
    private _server: api.Server;
    
    constructor(db: knex) {
        this._db = db;
    }
    
    // Called by the server at startup to provide the connector with a reference to the server instance.
    public injectServer(server: api.Server): void {
        this._server = server;
    }
    
    // Called when the server is about to start listening for requests.
    public async start(): Promise<void> {
    }
    
    // Gets a range of messages in the user’s inbox or sent mailbox.  May return fewer than 'take' messages.
    public async getMessages(credentials: spec.UserCredentials, folder: spec.Mailbox, drop: number, take: number)
            : Promise<spec.Message[]> {
        return Promise.reject("Not implemented");
    }

    // Gets the total number of messages in the folder as well as the number of unread messages.
    public async getMessageCount(credentials: spec.UserCredentials, folder: spec.Mailbox)
            : Promise<spec.MailboxOverview> {
        class Row {
            count: number; // the number of messages that share this value for "read"
            read: number; // 0=unread, 1=read
        }
                
        const results: Row[] = await this._db
            .from("users")
            .where("users.username", credentials.username)
            .innerJoin("messages", "users.id", "messages.msg_to")
            .where("messages.inbox_to_mod", 0)
            .groupBy("messages.msg_to_read")
            .count("* as count")
            .column("messages.msg_to_read as read");

        return {
            total: _.chain(results).map(x => x.count).sum().value(),
            unread: _.chain(results).filter(x => x.read === 0).map(x => x.count).sum().value()
        };
    }
    
    // Resolves true if it worked.  The caller has previously verified that the recipient username is valid.
    public async sendMessage(credentials: spec.UserCredentials, recipient: string, subject: string, body: string)
            : Promise<boolean> {
        return Promise.reject("Not implemented");
    }
    
    // Resolves true if it worked.  If 'messageId' is invalid, the implementation may either reject with
    // ERR_INVALID_MESSAGE, or silently ignore it.  We reject with the error.
    public async markMessageRead(credentials: spec.UserCredentials, messageId: number): Promise<boolean> {
        return Promise.reject("Not implemented");    
    }
    
    // Resolves true if it worked.  If 'messageId' is invalid, the implementation may either reject with
    // ERR_INVALID_MESSAGE, or silently ignore it.  We reject with the error.
    public async deleteMessage(credentials: spec.UserCredentials, messageId: number): Promise<boolean> {
        return Promise.reject("Not implemented");
    }
}
