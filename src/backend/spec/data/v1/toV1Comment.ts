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

/// <reference path="../../../../../typings/tsd.d.ts" />
"use strict";

import * as lodash from "lodash";
import * as spec from "../../index";
import { Dictionary } from "../../../collections/index";

function getCommentDepth(comment: spec.V1Comment): number {
    const depths = lodash.map(comment.comments, getCommentDepth);
    return depths.length > 0 ? lodash.max(depths) + 1 : 1;
}

// includes itself, so it's always at least 1
function getReplyCount(comment: spec.V1Comment): number {
    const counts = lodash.map(comment.comments, getReplyCount);
    return counts.length > 0 ? lodash.sum(counts) + 1 : 1;
}

function removeSpoilers(html: string): string {
    const spoilerSpan = "span class=\"jt_spoiler\"";
    const spoilerSpanLen = spoilerSpan.length;
    const span = "span ";
    const spanLen = span.length;
    const endSpan = "/span>";
    const endSpanLen = endSpan.length;
    const replaceStr = "_______";
    var out = "";
    var inSpoiler = false;
    var depth = 0;
    
    // Split by < to get all the tags separated out.
    html.split("<").forEach((chunk, i) => {
        if (i === 0) {
            // The first chunk does not start with or contain a <, so we can just copy it directly to the output.
            out += chunk;
        } else if (inSpoiler) {
            if (chunk.substr(0, spanLen) === span) {
                // Nested Shacktag.
                depth++;
            } else if (chunk.substr(0, endSpanLen) === endSpan) {
                // End of a Shacktag.
                depth--;
                // If the depth has dropped back to zero, then we found the end of the spoilered text.
                if (depth === 0) {
                    out += chunk.substr(endSpanLen);
                    inSpoiler = false;
                }
            }
        } else if (chunk.substr(0, spoilerSpanLen) === spoilerSpan) {
            // Beginning of a spoiler.
            inSpoiler = true;
            depth = 1;
            out += replaceStr;
        } else {
            out += "<" + chunk;
        }
    });
    
    return out;
}

export function toV1Comment(id: number, posts: spec.Post[], isRoot?: boolean, recurse?: boolean): spec.V1Comment {
    if (typeof isRoot === "undefined") {
        isRoot = true;
    }
    if (typeof recurse === "undefined") {
        recurse = true;
    }
    
    const postsById = Dictionary.fromArray(posts, x => x.id, x => x);
    const postsByParentId = lodash.groupBy(posts, x => x.parentId);
    const rootPost = postsById.get(id);
    
    var childComments: spec.V1Comment[] = [];
    if (recurse && postsByParentId.hasOwnProperty(id)) {
        const childPosts = postsByParentId[id];
        childComments = lodash.map(childPosts, x => toV1Comment(x.id, posts, false));
    }
    
    const threadPosts = isRoot ? lodash.filter(posts, x => x.threadId === id) : [];
    const replyCount = isRoot ? threadPosts.length : 0;
    const participants = isRoot ? lodash.chain(threadPosts).map(x => x.author).union().value() : [];
    const lastReplyId = isRoot ? lodash.max(threadPosts, x => x.id).id : 0;
    const preview = removeSpoilers(spec.tagsToHtml(rootPost.body));
    
    return new spec.V1Comment(childComments, replyCount, rootPost.body, rootPost.date, participants, 
        spec.toV1ModerationFlag(rootPost.category), lastReplyId, rootPost.author, preview, id);   
}
