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

import * as lodash from "lodash";
import * as spec from "./../spec/index";
import { Set } from "../collections/index";

export function removeNukedSubthreads(posts: spec.Post[]): spec.Post[] {
    const postsByParent = lodash.groupBy(posts, x => x.parentId);
    const nukedPostIds = new Set<number>();
    
    const stack = lodash.chain(posts).filter(x => x.category === spec.ModerationFlag.Nuked).map(x => x.id).value();
    while (stack.length > 0) {
        const id = stack.pop();
        nukedPostIds.add(id);
        if (postsByParent.hasOwnProperty(id)) {
            postsByParent[id].forEach(child => {
                stack.push(child.id);
            });
        }
    }
    
    return lodash.filter(posts, x => !nukedPostIds.contains(x.id));
}
