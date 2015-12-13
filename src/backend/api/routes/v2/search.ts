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

import * as lodash from "lodash";
import * as api from "../../index";
import * as spec from "../../../spec/index";
import { Dictionary } from "../../../collections/index";

function emptyToNull(str: string): string {
    return str === "" ? null : str;
}

module.exports = (server: api.Server) => {
    server.addRoute(api.RequestMethod.Get, "/v2/search", async (req) => {
        const query = new api.QueryParser(req);
        const terms = emptyToNull(query.getOptionalString("terms", "").trim());
        const author = emptyToNull(query.getOptionalString("author", "").trim());
        const parentAuthor = emptyToNull(query.getOptionalString("parentAuthor", "").trim());
        const category = query.getOptionalModerationFlag("category", null);
        const offset = query.getOptionalInteger("offset", 0);
        const limit = query.getOptionalInteger("limit", 35, 1, 500);
        const oldestFirst = query.getOptionalBoolean("oldestFirst", false);
        
        if (terms === null && author === null && parentAuthor === null && category === null) {
            return Promise.reject(spec.apiError(
                "ERR_ARGUMENT", "At least one of [terms, author, parentAuthor, category] must be specified."));
        } else if (category === spec.ModerationFlag.Nuked) {
            return Promise.reject(spec.apiError("ERR_ARGUMENT", "category cannot be \"nuked\"."));
        }
        
        const htmlPosts = await server.searchConnector.search(
            terms, author, parentAuthor, category, offset, limit, oldestFirst);
        return { posts: htmlPosts };
    });
};
