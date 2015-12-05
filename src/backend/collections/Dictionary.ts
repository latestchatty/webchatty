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

export class KeyValuePair<TKey, TValue> {
    key: TKey;
    value: TValue;
    
    constructor(key: TKey, value: TValue) {
        this.key = key;
        this.value = value;
    }
}

export class Dictionary<TKey, TValue> {
    private items: { [keyString: string]: TValue } = {};
    
    public static fromArray<TSource, TKey, TValue>(source: TSource[], keySelector: (item: TSource) => TKey, 
            valueSelector: (item: TSource) => TValue) {
        var dict = new Dictionary<TKey, TValue>();
        for (var i = 0; i < source.length; i++) {
            var key = keySelector(source[i]);
            var value = valueSelector(source[i]);
            dict.add(key, value); 
        }
        return dict;
    }
    
    public add(key: TKey, value: TValue): void {
        if (key === null) {
            throw new Error("key must not be null.");
        } else if (this.containsKey(key)) {
            throw new Error("The key \"" + JSON.stringify(key) + "\" already exists in the dictionary.");
        }
        
        this.set(key, value);
    }
    
    public set(key: TKey, value: TValue): void {
        if (key === null) {
            throw new Error("key must not be null.");
        }
        
        this.items[JSON.stringify(key)] = value;
    }
    
    public clear(): void {
        this.items = {};
    }
    
    public containsKey(key: TKey): boolean {
        if (key === null) {
            throw new Error("key must not be null.");
        }
        
        return JSON.stringify(key) in this.items;
    }
    
    public remove(key: TKey): boolean {
        if (key === null) {
            throw new Error("key must not be null.");
        }
        
        if (this.containsKey(key)) {
            delete this.items[JSON.stringify(key)];
            return true;
        } else {
            return false;
        }
    }
    
    public get(key: TKey): TValue {
        if (key === null) {
            throw new Error("key must not be null.");
        } else if (!this.containsKey(key)) {
            throw new Error("The key \"" + JSON.stringify(key) + "\" does not exist in the dictionary.");
        }

        return this.items[JSON.stringify(key)];
    }
    
    public lookup(key: TKey, defaultValue?: TValue): TValue {
        if (typeof defaultValue === "undefined") {
            defaultValue = null;
        }
        if (key === null) {
            throw new Error("key must not be null.");
        }
        
        if (this.containsKey(key)) {
            return this.items[JSON.stringify(key)];
        } else {
            return defaultValue;
        }
    }
    
    public count(): number {
        return Object.keys(this.items).length;
    }
    
    public keys(): TKey[] {
        return Object.keys(this.items).map(x => <TKey>JSON.parse(x));
    }
    
    public values(): TValue[] {
        return Object.keys(this.items).map(x => this.items[x]);
    }
    
    public pairs(): KeyValuePair<TKey, TValue>[] {
        return Object.keys(this.items).map(x => new KeyValuePair(<TKey>JSON.parse(x), this.items[x]));
    }
}
