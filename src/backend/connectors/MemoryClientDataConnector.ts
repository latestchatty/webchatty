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

import * as api from "../api/index";
import * as spec from "../spec/index";
import { Dictionary } from "../collections/index";

// IClientDataConnector allows the implementation to do whatever it wants if a provided username does not exist.
// We choose to reject in that case.
export class MemoryClientDataConnector implements spec.IClientDataConnector {
    private _server: api.Server;
    
    private _flagFilters: Dictionary<string, spec.ModerationFlag[]> = new Dictionary<string, spec.ModerationFlag[]>();
        // lowercase username -> list of ModerationFlags to filter in
        
    private _markedPosts: Dictionary<string, Dictionary<number, spec.MarkedPostType>>
        = new Dictionary<string, Dictionary<number, spec.MarkedPostType>>();
        // lowercase username -> (post id -> MarkedPostType)
        
    private _blobs: Dictionary<{username: string, client: string}, string> 
        = new Dictionary<{username: string, client: string}, string>();
        // {lowercase username, client name} -> blob data 
    
    // Called by the server at startup to provide the connector with a reference to the server instance.
    public injectServer(server: api.Server): void {
        this._server = server;
    }
    
    // Resolves a list of moderation flags that the user has selected to show.  If the user has never set flag filters,
    // then a default set of filters are returned.
    public getModerationFlagFilters(username: string): Promise<spec.ModerationFlag[]> {
        return this.checkUserExists(username)
            .then(() => {
                var defaultFilters = [
                    spec.ModerationFlag.Informative,
                    spec.ModerationFlag.OnTopic,
                    spec.ModerationFlag.PoliticalOrReligious,
                    spec.ModerationFlag.Stupid,
                    spec.ModerationFlag.Tangent
                ];
                return Promise.resolve(this._flagFilters.lookup(username.toLowerCase(), defaultFilters));
            });
    }
    
    // Sets the moderation flag settings for this user.  Resolves true if it worked.
    public setModerationFlagFilters(username: string, flags: spec.ModerationFlag[]): Promise<boolean> {
        return this.checkUserExists(username)
            .then(() => {
                this._flagFilters.set(username.toLowerCase(), flags);
                return Promise.resolve(true);
            });
    }
    
    // Resolves a mapping of post IDs to MarkedPostTypes, one pair for each marked post.
    public getMarkedPosts(username: string): Promise<Dictionary<number, spec.MarkedPostType>> {
        return this.checkUserExists(username)
            .then(() => {
                var defaultDict = new Dictionary<number, spec.MarkedPostType>();
                return Promise.resolve(this._markedPosts.lookup(username.toLowerCase(), defaultDict));
            });
    }
    
    // Sets a marked post for this user.  Resolves true if it worked.
    public setMarkedPost(username: string, postId: number, type: spec.MarkedPostType): Promise<boolean> {
        return this.getMarkedPosts(username)
            .then(list => {
                list.set(postId, type);
                return Promise.resolve(true);
            });
    }
    
    // Removes all marked posts for this user.  Resolves true if it worked.
    public clearMarkedPosts(username: string): Promise<boolean> {
        return this.checkUserExists(username)
            .then(() => {
                this._markedPosts.remove(username.toLowerCase());
                return Promise.resolve(true);
            });
    }

    // Retrieves a blob of client-defined data.  Resolves an empty string if no data is present.
    public getClientData(username: string, client: string): Promise<string> {
        return this.checkUserExists(username)
            .then(() => {
                return Promise.resolve(this._blobs.lookup({username: username.toLowerCase(), client: client}, ""));
            });
    }
    
    // Saves a blob of client-defined data.  Resolves true if it worked.
    // The implementation must accept at least 100,000 bytes for the data string but can reject above that if it wants.
    public setClientData(username: string, client: string, data: string): Promise<boolean> {
        return this.checkUserExists(username)
            .then(() => {
                // we'll accept 100,000 characters which will be at least the required 100,000 bytes
                if (data.length > 100000) {
                    return Promise.reject(spec.apiError("ERR_ARGUMENT", "data is too long."));
                }
                this._blobs.set({username: username.toLowerCase(), client: client}, data);
                return Promise.resolve(true);
            });
    }
    
    // Resolves true if the user exists.  Rejects with ERR_ARGUMENT if the user does not exist.
    private checkUserExists(username: string): Promise<boolean> {
        return this._server.accountConnector.userExists(username)
            .then(exists => {
                if (exists) {
                    return Promise.resolve(true);
                } else {
                    return Promise.reject(spec.apiError("ERR_ARGUMENT", "User does not exist."));
                }
            });
    }
}
