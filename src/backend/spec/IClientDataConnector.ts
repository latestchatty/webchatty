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

// For all of the methods in this class, if a provided username does not exist, the implementation may do whatever
// it wants (resolve using some default behavior, or reject) because the API will try not to call the connector without
// first checking if the username exists.  The same applies for post IDs.
export interface IClientDataConnector {
    // Called by the server at startup to provide the connector with a reference to the server instance.
    injectServer(server: api.Server): void;
    
    // Called when the server is about to start listening for requests.
    start(): Promise<void>;
    
    // Resolves a list of moderation flags that the user has selected to show.  If the user has never set flag filters,
    // then a default set of filters are returned.
    getModerationFlagFilters(username: string): Promise<spec.ModerationFlag[]>;
    
    // Sets the moderation flag settings for this user.  Resolves true if it worked.
    setModerationFlagFilters(username: string, flags: spec.ModerationFlag[]): Promise<boolean>;
    
    // Resolves a mapping of post IDs to MarkedPostTypes, one pair for each marked post.
    getMarkedPosts(username: string): Promise<Dictionary<number, spec.MarkedPostType>>;
    
    // Sets a marked post for this user.  Resolves true if it worked.
    setMarkedPost(username: string, postId: number, type: spec.MarkedPostType): Promise<boolean>;
    
    // Removes all marked posts for this user.  Resolves true if it worked.
    clearMarkedPosts(username: string): Promise<boolean>;

    // Retrieves a blob of client-defined data.  Resolves an empty string if no data is present.
    getClientData(username: string, client: string): Promise<string>;
    
    // Saves a blob of client-defined data.  Resolves true if it worked.
    // The implementation must accept at least 100,000 bytes for the data string but can reject above that if it wants.
    setClientData(username: string, client: string, data: string): Promise<boolean>;
}
