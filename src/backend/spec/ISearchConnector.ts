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

import * as api from "../api/index";
import * as spec from "./index";
import { Dictionary } from "../collections/index";

export interface ISearchConnector {
    // Called by the server at startup to provide the connector with a reference to the server instance.
    injectServer(server: api.Server): void;
    
    // Called when the server is about to start listening for requests.
    start(): Promise<void>;
    
    // Comment search. At least one of [terms, author, parentAuthor, category] will be provided and the others are null 
    // (caller verified).
    search(terms: string, author: string, parentAuthor: string, category: spec.ModerationFlag, offset: number, 
        limit: number, oldestFirst: boolean): Promise<spec.Post[]>;
}
