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

module.exports = (server: api.Server) => {
    server.addRoute(api.RequestMethod.Post, "/v2/setPostCategory", async (req) => {
        const query = new api.QueryParser(req);
        const username = query.getString("username");
        const password = query.getString("password");
        const postId = query.getInteger("postId");
        const category = query.getModerationFlag("category");
        
        const credentials = await server.verifyLogin(username, password);
        if (credentials.level < spec.UserAccessLevel.Moderator) {
            return Promise.reject(spec.apiError("ERR_NOT_MODERATOR", "Please provide moderator credentials."));
        }
        
        const posts = await server.threadConnector.getPostRange(postId, 1, false);
        if (posts.length !== 1) {
            return Promise.reject(spec.apiError("ERR_INVALID_POST", "The post was not found."));
        }
        
        await server.threadConnector.setPostCategory(credentials, postId, category);
        return { result: "success" };
    });
};
