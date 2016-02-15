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
/// <reference path="./mysql2.d.ts" />
"use strict";

import * as mysql from "mysql2";
import * as api from "../api/index";
import * as spec from "../spec/index";

// provides shared functionality to all Shacknews connectors.
export class ShacknewsCommon {
    private _db: mysql.IPool;
    
    constructor(host: string, port: number, username: string, password: string, database: string) {
        this._db = mysql.createPool({
            host: host,
            port: port,
            user: username,
            password: password,
            database: database,
            timezone: 'utc',
            namedPlaceholders: true
        });
    }
    
    public query(sql: string, values: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            this._db.execute(sql, values, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    
    // for operations that we perform by contacting a shacknews.com web service, this will
    // log the user in and return the HttpClient containing the logged-in cookies.
    public async newUserSession(credentials: spec.UserCredentials): Promise<api.HttpClient> {
        const http = new api.HttpClient();
        const loginResult = await http.request("post", "https://www.shacknews.com/account/signin", {
            "get_fields[]": "result",
            "user-identifier": credentials.username,
            "supplied-pass": credentials.password,
            "remember-login": 1
        }, {
            "X-Requested-With": "XMLHttpRequest"
        });
        
        if (loginResult.indexOf('{"result":{"valid":"true"') < 0) {
            // this shouldn't happen; the user credentials have already been verified.
            return Promise.reject("Login failed.");
        } else {
            return http;
        }
    }
}
