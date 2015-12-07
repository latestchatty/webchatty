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

import * as api from "../../index";
import * as spec from "../../../spec/index";

const MESSAGES_PER_PAGE = 50;

module.exports = function(server: api.Server) {
    server.addRoute(api.RequestMethod.Post, "/v2/getMessages", async (req) => {
        const query = new api.QueryParser(req);
        const username = query.getString("username");
        const password = query.getString("password");
        const folder = query.getMailbox("folder");
        const page = query.getInteger("page", 1);
        const credentials = await server.verifyLogin(username, password);
        const messages = await server.messageConnector.getMessages(credentials, folder, 
            (page - 1) * MESSAGES_PER_PAGE, MESSAGES_PER_PAGE);
        const counts = await server.messageConnector.getMessageCount(credentials, folder);
        return {
            page: page,
            totalPages: Math.ceil(counts.total / MESSAGES_PER_PAGE),
            totalMessages: counts.total,
            messages: messages
        };
    });
};
