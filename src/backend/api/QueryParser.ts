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

import * as express from "express";
import * as util from "util";
import * as spec from "../spec/index";

export class QueryParser {
    private _req: express.Request;
    
    constructor(req: express.Request) {
        this._req = req;
    }
    
    public getString(name: string, minLength?: number, maxLength?: number): string {
        if (typeof minLength === "undefined") {
            minLength = 0;
        }
        if (typeof maxLength === "undefined") {
            maxLength = 2147483647;
        }
        
        if (this.has(name)) {
            var value = this.get(name);
            if (value.length === 0) {
                throw spec.apiError("ERR_ARGUMENT", util.format("Missing argument \"%s\".", name));
            } else if (value.length < minLength) {
                throw spec.apiError("ERR_ARGUMENT", util.format(
                    "The value for parameter \"%s\" must be at least %d characters long.", name, minLength));
            } else if (value.length > maxLength) {
                throw spec.apiError("ERR_ARGUMENT", util.format(
                    "The value for parameter \"%s\" must be at most %d characters long.", name, maxLength)); 
            }
            return value;
        } else {
            throw spec.apiError("ERR_ARGUMENT", "Missing argument \"" + name + "\"");
        }
    }
    
    private has(name: string): boolean {
        if (this._req.method === "GET") {
            return name in this._req.query;
        } else {
            return name in this._req.body;
        }
    }
    
    private get(name: string): string {
        if (this._req.method === "GET") {
            return this._req.query[name];
        } else {
            return this._req.body[name];
        }
    }
}
