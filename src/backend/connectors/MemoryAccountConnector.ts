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

import * as spec from "../spec/index";
import * as collections from "../collections/index";

export class MemoryUserAccount {
    username: string;
    password: string;
    level: spec.UserAccessLevel;
    
    constructor(username: string, password: string, level: spec.UserAccessLevel) {
        this.username = username;
        this.password = password;
        this.level = level;
    }
}

export class MemoryAccountConnector implements spec.IAccountConnector {
    private accounts: collections.Dictionary<string, MemoryUserAccount>;
    
    constructor(initialAccounts: MemoryUserAccount[]) {
        this.accounts = collections.Dictionary.fromArray(initialAccounts, x => x.username, x => x);
    }
    
    public tryLogin(username: string, password: string): Promise<spec.UserCredentials> {
        return new Promise<spec.UserCredentials>((resolve, reject) => {
            var account = this.accounts.lookup(username, null);
            if (account === null) {
                resolve(null); // wrong username
            } else if (account.password === password) {
                resolve(new spec.UserCredentials(username, account.level));
            } else {
                resolve(null); // wrong password
            }
        });
    }
}
