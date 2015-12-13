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

import * as collections from "./index";

export class DictionaryWithDefault<TKey, TValue> {
    private _dict = new collections.Dictionary<TKey, TValue>();
    private _defaultValueFunc: () => TValue;
    
    constructor(defaultValueFunc: () => TValue) {
        this._defaultValueFunc = defaultValueFunc;
    }
    
    public add(key: TKey, value: TValue): void {
        this._dict.add(key, value);
    }
    
    public set(key: TKey, value: TValue): void {
        this._dict.set(key, value);
    }
    
    public clear(): void {
        this._dict.clear();
    }
    
    public remove(key: TKey): boolean {
        return this._dict.remove(key);
    }
    
    public get(key: TKey): TValue {
        if (this._dict.containsKey(key)) {
            return this._dict.get(key);
        } else {
            const defaultValue = this._defaultValueFunc();
            this._dict.set(key, defaultValue);
            return defaultValue;
        }
    }
    
    public count(): number {
        return this._dict.count();
    }
    
    public keys(): TKey[] {
        return this._dict.keys();
    }
    
    public values(): TValue[] {
        return this._dict.values();
    }
    
    public pairs(): collections.KeyValuePair<TKey, TValue>[] {
        return this._dict.pairs();
    }
}
