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

import * as _ from "lodash";
import * as api from "../api/index";
import * as spec from "../spec/index";
import * as connectors from "./index";
import { Dictionary } from "../collections/index";

export class ShacknewsMessageConnector implements spec.IMessageConnector {
    private _common: connectors.ShacknewsCommon;
    private _server: api.Server;
    
    constructor(common: connectors.ShacknewsCommon) {
        this._common = common;
    }
    
    // Called by the server at startup to provide the connector with a reference to the server instance.
    public injectServer(server: api.Server): void {
        this._server = server;
    }
    
    // Called when the server is about to start listening for requests.
    public async start(): Promise<void> {
    }
    
    // Gets a range of messages in the user’s inbox or sent mailbox.  May return fewer than 'take' messages.
    public async getMessages(credentials: spec.UserCredentials, folder: spec.Mailbox, drop: number, take: number): Promise<spec.Message[]> {
        const to = folder === spec.Mailbox.Inbox;
        interface Row {
            id: number;
            from_name: string;
            to_name: string;
            msg_subject: string;
            msg_created_on: Date;
            msg_body: string;
            msg_from_read: number; // 0 or 1
            msg_to_read: number; // 0 or 1
        }
        
        const results: Row[] = await this._common.query(
            `SELECT messages.*, from_user.username AS from_name, to_user.username AS to_name
            FROM messages
            INNER JOIN users AS from_user ON messages.msg_from = from_user.id
            INNER JOIN users AS to_user ON messages.msg_to = to_user.id
            WHERE
                ${to ? "to_user" : "from_user"}.username = :username AND
                messages.${to ? "inbox_to_mod" : "sent_from_mod"} = 0
            ORDER BY msg_created_on DESC
            LIMIT :take
            OFFSET :drop`, 
            {
                username: credentials.username,
                take: take,
                drop: drop
            }
        );
        return results.map(x => ({
            id: x.id,
            from: x.from_name,
            to: x.to_name,
            subject: x.msg_subject,
            unread: to ? (x.msg_to_read === 0) : (x.msg_from_read === 0),
            
            // adjust for the date being in local time but having no timezone set
            date: new Date(x.msg_created_on.getTime() + x.msg_created_on.getTimezoneOffset()*60*1000),
            
            // convert the plain text to HTML, without parsing Shacktags.
            body: x.msg_body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "\n<br>")
        }));
    }

    // Gets the total number of messages in the folder as well as the number of unread messages.
    public async getMessageCount(credentials: spec.UserCredentials, folder: spec.Mailbox): Promise<spec.MailboxOverview> {
        const to = folder === spec.Mailbox.Inbox;
        const results: { count: number, read: number }[] = await this._common.query(
            `SELECT COUNT(*) AS count, messages.${to ? "msg_to_read" : "msg_from_read"} AS read
            FROM users
            INNER JOIN messages ON users.id = messages.${to ? "msg_to" : "msg_from"}
            WHERE
                users.username = :username AND
                messages.${to ? "inbox_to_mod" : "sent_from_mod"} = 0
            GROUP BY messages.${to ? "msg_to_read" : "msg_from_read"}`,
            { username: credentials.username }
        );
        return {
            total: _.chain(results).map(x => x.count).sum().value(),
            unread: _.chain(results).filter(x => x.read === 0).map(x => x.count).sum().value()
        };
    }
    
    // The caller has previously verified that the recipient username is valid.
    public async sendMessage(credentials: spec.UserCredentials, recipient: string, subject: string, body: string): Promise<void> {
        const http = await this._common.newUserSession(credentials);
        await http.request("post", "https://www.shacknews.com/messages/send", {
            "uid": 0,
            "to": recipient,
            "subject": subject,
            "message": body
        });
    }
    
    // If 'messageId' is invalid, the implementation may either reject with ERR_INVALID_MESSAGE, or silently ignore it.
    public async markMessageRead(credentials: spec.UserCredentials, messageId: number): Promise<void> {
        const messageInfo = await this.getMessageInfo(credentials.username, messageId);
        if (messageInfo.isFrom || messageInfo.isTo) {
            const http = await this._common.newUserSession(credentials);
            await http.request("post", "https://www.shacknews.com/messages/read", {
                "mid": messageId
            });
        } else {
            return Promise.reject(spec.apiError("ERR_INVALID_MESSAGE", "Invalid message ID."));
        }
    }
    
    // If 'messageId' is invalid, the implementation may either reject with ERR_INVALID_MESSAGE, or silently ignore it.
    public async deleteMessage(credentials: spec.UserCredentials, messageId: number, mailbox: spec.Mailbox): Promise<void> {
        const messageInfo = await this.getMessageInfo(credentials.username, messageId);
        
        if ((mailbox === spec.Mailbox.Inbox && messageInfo.isTo && !messageInfo.toDeleted) || 
                (mailbox === spec.Mailbox.Sent && messageInfo.isFrom && !messageInfo.fromDeleted)) {
            const http = await this._common.newUserSession(credentials);
            await http.request("post", "https://www.shacknews.com/messages/delete", {
                "mid": messageId,
                "type": mailbox // "inbox" or "sent"
            });
        } else {
            return Promise.reject(spec.apiError("ERR_INVALID_MESSAGE", "Invalid message ID."));
        }
    }
    
    private async getMessageInfo(username: string, messageId: number)
            : Promise<{ isFrom: boolean, isTo: boolean, fromDeleted: boolean, toDeleted: boolean }> {
        interface Row { fromName: string; toName: string; fromDeleted: number; toDeleted: number; }
        const messageRows: Row[] = await this._common.query(
            `SELECT
                fu.username AS fromName, tu.username AS toName,
                m.sent_from_mod AS fromDeleted, m.inbox_to_mod AS toDeleted
            FROM messages AS m
            INNER JOIN users AS fu ON m.msg_from = fu.id
            INNER JOIN users AS tu ON m.msg_to = tu.id
            WHERE m.id = :id`,
            { id: messageId }
        );
        if (messageRows.length !== 1) {
            return Promise.reject(spec.apiError("ERR_INVALID_MESSAGE", "Invalid message ID."));
        }
        const message = messageRows[0];
        const isSentDeleted = message.fromDeleted === 1;
        const isInboxDeleted = message.toDeleted === 1;
        return {
            isFrom: message.fromName.toLowerCase() === username,
            isTo: message.toName.toLowerCase() === username,
            fromDeleted: message.fromDeleted === 1,
            toDeleted: message.toDeleted === 1
        };
    }
}
