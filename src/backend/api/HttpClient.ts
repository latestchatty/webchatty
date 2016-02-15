// WebChatty
// Copyright (C) 2016 Andy Christianson, Brian Luft, Willie Zutz
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

import * as request from "request";

const USER_AGENT = "WebChatty (https://github.com/webchatty/webchatty)";

export class HttpClient {
    private _jar: request.CookieJar = request.jar();
    
    public request(method: string, url: string, data?: any, headers?: any): Promise<string> {
        if (typeof headers === "undefined") {
            headers = {};
        }
        headers["user-agent"] = USER_AGENT;
        
        method = method.toUpperCase();
        
        return new Promise<string>((resolve, reject) => {
            const options: request.CoreOptions = {
                method: method,
                headers: headers,
                jar: this._jar,
                gzip: true,
                strictSSL: true,
                followAllRedirects: true
            };
            
            if (typeof data !== "undefined") {
                if (method === "GET") {
                    options.qs = data;
                } else if (method === "POST") {
                    options.form = data;
                }
            }
            
            request(url, options, (error, response, body) => {
                if (error) {
                    reject(error);
                } else if (response.statusCode !== 200) {
                    reject("HTTP request returned status code " + response.statusCode);
                } else {
                    resolve(body);
                }
            });
            
        });
    }
}
