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

import * as spec from "./index";
import { Dictionary } from "../collections/index";

export interface IAccountConnector {
    // Resolves a token on successful login.  Resolves null if the username/password are wrong.  Rejects if a problem
    // occurs other than the username/password being wrong.
    tryLogin(username: string, password: string): Promise<spec.UserCredentials>;
    
    // Resolves a mapping of usernames to registration dates on success.  If usernames is not provided, then all users
    // are returned.  If a provided username does not exist, then it is silently omitted from the results.
    getUserRegistrationDates(usernames?: string[]): Promise<Dictionary<string, Date>>;
}

// in order of increasing access.  each access level has all the permissions of the levels lower than it
export enum UserAccessLevel {
    User = 0,
    Moderator = 1,
    Administrator = 2
}

// this object is only produced as the result of a successful login
export class UserCredentials {
    username: string;
    level: spec.UserAccessLevel;
    
    constructor(username: string, level: spec.UserAccessLevel) {
        this.username = username;
        this.level = level;
    }
}
