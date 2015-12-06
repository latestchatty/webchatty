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

import * as express from "express";
import * as util from "util";
import * as spec from "../spec/index";

var integerRegEx = /^[0-9]+$/;

export class QueryParser {
    private _req: express.Request;
    
    constructor(req: express.Request) {
        this._req = req;
    }
    
    public getBoolean(name: string): boolean {
        var value = this.get(name);
        if (value === "true") {
            return true;
        } else if (value === "false") {
            return false;
        } else {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "The value for parameter \"%s\" must be either \"true\" or \"false\".", name));
        }
    }
    
    // unsigned 31-decimal integer 0..2147483647
    public getInteger(name: string, min?: number, max?: number): number {
        if (typeof min === "undefined") {
            min = 0;
        }
        if (typeof max === "undefined") {
            max = 2147483647;
        }
        
        var str = this.getString(name, 1, 10);
        if (!integerRegEx.test(str)) {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "The value for parameter \"%s\" must be an integer.", name));
        }
        var num = parseFloat(str);
        if (num < min) {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "The value for parameter \"%s\" must be greater than or equal to %d.", name, min));
        } else if (num > max) {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "The value for parameter \"%s\" must be less than or equal to %d.", name, max)); 
        }
        return num;
    }
    
    public getString(name: string, minLength?: number, maxLength?: number): string {
        if (typeof minLength === "undefined") {
            minLength = 1;
        }
        if (typeof maxLength === "undefined") {
            maxLength = 2147483647;
        }
        
        var value = this.get(name);
        if (value.length < minLength) {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "The value for parameter \"%s\" must be at least %d character(s) long.", name, minLength));
        } else if (value.length > maxLength) {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "The value for parameter \"%s\" must be at most %d character(s) long.", name, maxLength)); 
        }
        return value;
    }
    
    public getStringList(name: string, minListCount?: number, maxListCount?: number, minStringLength?: number, 
            maxStringLength?: number): string[] {
        if (typeof minListCount === "undefined") {
            minListCount = 1;
        }
        if (typeof maxListCount === "undefined") {
            maxListCount = 2147483647;
        }
        if (typeof minStringLength === "undefined") {
            minStringLength = 1;
        }
        if (typeof maxStringLength === "undefined") {
            maxStringLength = 2147483647;
        }
        
        var list = this.get(name).split(",");
        
        if (list.length < minListCount) {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "The comma-separated list \"%s\" must have at least %d item(s).", name, minListCount));
        } else if (list.length > maxListCount) {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "The comma-separated list \"%s\" must have at most  %d item(s).", name, maxListCount));
        }
        
        if (!list.every(x => x.length >= minStringLength)) {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "Each item in the comma-separated list \"%s\" must be at least %d character(s) long.", name, minStringLength));
        } else if (!list.every(x => x.length <= maxStringLength)) {
            throw spec.apiError("ERR_ARGUMENT", util.format(
                "Each item in the comma-separated list \"%s\" must be at most %d character(s) long.", name, maxStringLength));
        }
        
        return list;
    }
    
    public getMarkedPostType(name: string): spec.MarkedPostType {
        switch (this.getString(name)) {
            case "unmarked": return spec.MarkedPostType.Unmarked;
            case "pinned": return spec.MarkedPostType.Pinned;
            case "collapsed": return spec.MarkedPostType.Collapsed;
            default: throw spec.apiError("ERR_ARGUMENT", util.format(
                "The value for parameter \"%s\" must be: unmarked, pinned, or collapsed.", name));
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
        if (!this.has(name)) {
            throw spec.apiError("ERR_ARGUMENT", "Missing argument \"" + name + "\"");
        } else if (this._req.method === "GET") {
            return this._req.query[name];
        } else {
            return this._req.body[name];
        }
    }
}
