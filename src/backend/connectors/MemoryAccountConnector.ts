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
import * as spec from "../spec/index";
import { Dictionary } from "../collections/index";

// used to configure the in-memory list of users
export class MemoryUserAccount {
    username: string;
    password: string;
    registrationDate: Date;
    level: spec.UserAccessLevel;
    
    constructor(username: string, password: string, level: spec.UserAccessLevel, registrationDate: Date) {
        this.username = username;
        this.password = password;
        this.level = level;
        this.registrationDate = registrationDate;
    }
}

export class MemoryAccountConnector implements spec.IAccountConnector {
    private _accounts: Dictionary<string, MemoryUserAccount>;
    
    constructor(initialAccounts: MemoryUserAccount[]) {
        this._accounts = Dictionary.fromArray(initialAccounts, x => x.username, x => x);
    }
    
    // Called by the server at startup to provide the connector with a reference to the server instance.
    public injectServer(server: api.Server): void {
        // we don't care about the server reference
    }
    
    // Resolves a token on successful login.  Resolves null if the username/password are wrong.  Rejects if a problem
    // occurs other than the username/password being wrong.
    public tryLogin(username: string, password: string): Promise<spec.UserCredentials> {
        var account = this._accounts.lookup(username, null);
        if (account === null) {
            return Promise.resolve(null); // wrong username
        } else if (account.password === password) {
            return Promise.resolve(new spec.UserCredentials(username, account.level));
        } else {
            return Promise.resolve(null); // wrong password
        }
    }
    
    /// Resolves true if the username exists (case insensitive), false if it does not.
    public userExists(username: string): Promise<boolean> {
        var usernameLower = username.toLowerCase();
        return Promise.resolve(this._accounts.keys().some(x => x.toLowerCase() === usernameLower));
    }
    
    // Resolves a mapping of usernames to registration dates on success.  If usernames is not provided, then all users
    // are returned.  If a provided username does not exist, then it is silently omitted from the results.
    public getUserRegistrationDates(usernames?: string[]): Promise<Dictionary<string, Date>> {
        if (typeof usernames === "undefined") {
            return Promise.resolve(Dictionary.fromArray(this._accounts.values(), x => x.username, x => x.registrationDate));
        } else {
            var dict = new Dictionary<string, Date>();
            for (var i = 0; i < usernames.length; i++) {
                var username = usernames[i];
                var account = this._accounts.lookup(username, null);
                if (account !== null) {
                    dict.set(username, account.registrationDate);
                }
            }
            return Promise.resolve(dict);
        }
    }
}
