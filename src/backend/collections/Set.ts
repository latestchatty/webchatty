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

export class Set<TKey> {
    private items: { [keyString: string]: boolean } = {};
    
    public static fromArray<TSource, TKey>(source: TSource[], selector: (item: TSource) => TKey) {
        const set = new Set<TKey>();
        for (var i = 0; i < source.length; i++) {
            const key = selector(source[i]);
            set.add(key); 
        }
        return set;
    }
    
    public add(key: TKey): boolean {
        if (key === null) {
            throw new Error("key must not be null.");
        } else if (this.contains(key)) {
            return false;
        }
        
        this.items[JSON.stringify(key)] = true;
        return true;
    }
    
    public clear(): void {
        this.items = {};
    }
    
    public contains(key: TKey): boolean {
        if (key === null) {
            throw new Error("key must not be null.");
        }
        
        return JSON.stringify(key) in this.items;
    }
    
    public remove(key: TKey): boolean {
        if (key === null) {
            throw new Error("key must not be null.");
        }
        
        if (this.contains(key)) {
            delete this.items[JSON.stringify(key)];
            return true;
        } else {
            return false;
        }
    }
    
    public count(): number {
        return Object.keys(this.items).length;
    }
    
    public keys(): TKey[] {
        return Object.keys(this.items).map(x => <TKey>JSON.parse(x));
    }
}
