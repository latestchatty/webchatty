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

export class MemoryMessageConnector implements spec.IMessageConnector {
    private _server: api.Server;
    private _nextId: number = 1;
    
    // these are: lowercase username -> (message id -> message)
    private _inboxes = new Dictionary<string, Dictionary<number, spec.Message>>();
    private _outboxes = new Dictionary<string, Dictionary<number, spec.Message>>();
    
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
        const messages = this.getFolderMessages(credentials, folder);
        return lodash.chain(messages.values()).sortBy(x => x.id).drop(drop).take(take).value();
    }

    // Gets the total number of messages in the folder as well as the number of unread messages.
    public async getMessageCount(credentials: spec.UserCredentials, folder: spec.Mailbox)
            : Promise<spec.MailboxOverview> {
        const messages = this.getFolderMessages(credentials, folder);
        return { 
            total: messages.count(), 
            unread: lodash.where(messages.values(), (x: spec.Message) => x.unread).length 
        };
    }
    
    // The caller has previously verified that the recipient username is valid.
    public async sendMessage(credentials: spec.UserCredentials, recipient: string, subject: string, body: string): Promise<void> {
        const message: spec.Message = {
            id: this._nextId++,
            from: credentials.username,
            to: recipient,
            subject: subject,
            date: new Date(),
            body: body,
            unread: true
        };
        const senderCopy = Object.assign({}, message);
        senderCopy.unread = false;
        this.createMailboxes(credentials.username);
        this.createMailboxes(recipient);
        this._inboxes.get(recipient.toLowerCase()).add(message.id, message);
        this._outboxes.get(credentials.username.toLowerCase()).add(message.id, senderCopy);
    }
    
    // If 'messageId' is invalid, the implementation may either reject with ERR_INVALID_MESSAGE, or silently ignore it.
    // We reject with the error.
    public async markMessageRead(credentials: spec.UserCredentials, messageId: number): Promise<void> {
        this.createMailboxes(credentials.username);
        const dict = this._inboxes.get(credentials.username.toLowerCase());
        const message = dict.lookup(messageId, null);
        if (message === null) {
            return Promise.reject(spec.apiError("ERR_INVALID_MESSAGE", "Message does not exist."));
        }
        message.unread = false;
    }
    
    // If 'messageId' is invalid, the implementation may either reject with
    // ERR_INVALID_MESSAGE, or silently ignore it.  We reject with the error.
    public async deleteMessage(credentials: spec.UserCredentials, messageId: number, mailbox: spec.Mailbox): Promise<void> {
        this.createMailboxes(credentials.username);
        const inbox = this._inboxes.get(credentials.username.toLowerCase());
        const outbox = this._outboxes.get(credentials.username.toLowerCase());
        const isInInbox = inbox.containsKey(messageId);
        const isInOutbox = outbox.containsKey(messageId);
        if (mailbox === spec.Mailbox.Inbox) {
            if (isInInbox) {
                inbox.remove(messageId);
            } else {
                return Promise.reject(spec.apiError("ERR_INVALID_MESSAGE", "Message does not exist."));
            }
        } else {
            if (isInOutbox) {
                outbox.remove(messageId);
            } else {
                return Promise.reject(spec.apiError("ERR_INVALID_MESSAGE", "Message does not exist."));
            }
        }
    }
    
    private getFolderMessages(credentials: spec.UserCredentials, folder: spec.Mailbox) {
        this.createMailboxes(credentials.username);
        const mailbox = folder == spec.Mailbox.Inbox ? this._inboxes : this._outboxes;
        return mailbox.get(credentials.username.toLowerCase());
    }
    
    private createMailboxes(username: string): void {
        const lcUser = username.toLowerCase();
        if (!this._inboxes.containsKey(lcUser)) {
            this._inboxes.set(lcUser, new Dictionary<number, spec.Message>());
        }
        if (!this._outboxes.containsKey(lcUser)) {
            this._outboxes.set(lcUser, new Dictionary<number, spec.Message>());
        }
    }
}
