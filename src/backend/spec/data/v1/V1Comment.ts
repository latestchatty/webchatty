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

import * as spec from "./../../index";
import * as v1 from "./index";

export class V1Participant {
    public username: string;
    public post_count: number;
}

export class V1Comment {
    public comments: V1Comment[];
    public reply_count: number;
    public body: string;
    public date: string;
    public participants: V1Participant[];
    public category: v1.V1ModerationFlag;
    public last_reply_id: string;
    public author: string;
    public preview: string;
    public id: string;
    
    constructor(comments: V1Comment[], replyCount: number, body: string, date: Date, participants: V1Participant[],
            category: v1.V1ModerationFlag, lastReplyId: number, author: string, preview: string, id: number) {
        this.comments = comments;
        this.reply_count = replyCount;
        this.body = body;
        this.date = v1.toV1Date(date);
        this.participants = participants;
        this.category = category;
        this.last_reply_id = lastReplyId.toString();
        this.author = author;
        this.preview = preview;
        this.id = id.toString();
    }
}
