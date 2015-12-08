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

import { Dictionary } from "../collections/index";

class TagInfo {
    matchStart: string;
    matchEnd: string;
    replaceStart: string;
    replaceEnd: string;
}

const infos: TagInfo[] = [
    { matchStart: "r{", matchEnd: "}r", replaceStart: "<span class=\"jt_red\">", replaceEnd: "</span>" },
    { matchStart: "g{", matchEnd: "}g", replaceStart: "<span class=\"jt_green\">", replaceEnd: "</span>" },
    { matchStart: "b{", matchEnd: "}b", replaceStart: "<span class=\"jt_blue\">", replaceEnd: "</span>" },
    { matchStart: "y{", matchEnd: "}y", replaceStart: "<span class=\"jt_yellow\">", replaceEnd: "</span>" },
    { matchStart: "e[", matchEnd: "]e", replaceStart: "<span class=\"jt_olive\">", replaceEnd: "</span>" },
    { matchStart: "l[", matchEnd: "]l", replaceStart: "<span class=\"jt_lime\">", replaceEnd: "</span>" },
    { matchStart: "n[", matchEnd: "]n", replaceStart: "<span class=\"jt_orange\">", replaceEnd: "</span>" },
    { matchStart: "p[", matchEnd: "]p", replaceStart: "<span class=\"jt_pink\">", replaceEnd: "</span>" },
    { matchStart: "q[", matchEnd: "]q", replaceStart: "<span class=\"jt_quote\">", replaceEnd: "</span>" },
    { matchStart: "s[", matchEnd: "]s", replaceStart: "<span class=\"jt_sample\">", replaceEnd: "</span>" },
    { matchStart: "-[", matchEnd: "]-", replaceStart: "<span class=\"jt_strike\">", replaceEnd: "</span>" },
    { matchStart: "i[", matchEnd: "]i", replaceStart: "<i>", replaceEnd: "</i>" },
    { matchStart: "/[", matchEnd: "]/", replaceStart: "<i>", replaceEnd: "</i>" },
    { matchStart: "b[", matchEnd: "]b", replaceStart: "<b>", replaceEnd: "</b>" },
    { matchStart: "*[", matchEnd: "]*", replaceStart: "<b>", replaceEnd: "</b>" },
    { matchStart: "_[", matchEnd: "]_", replaceStart: "<u>", replaceEnd: "</u>" },
    { matchStart: "o[", matchEnd: "]o", replaceStart: "<span class=\"jt_spoiler\" onclick=\"return doSpoiler(event);\">", replaceEnd: "</span>" },
];
const colorPushDict = Dictionary.fromArray(infos, x => x.matchStart, x => x);
const colorPopDict = Dictionary.fromArray(infos, x => x.matchEnd, x => x);

export function tagsToHtml(text: string): string {
    var html: string = "";
    const stack: string[] = [];
    
    const top = () => stack[stack.length - 1] || "";
    
    const pop = (tag: string) => {
        if (stack.length > 0 && stack[stack.length - 1] === tag) {
            stack.pop();
            return true;
        } else {
            return false;
        }
    };
    
    for (var i = 0; i < text.length; /* */) {
        const str1 = text[i];
        const str2 = str1 + (text[i+1] || "");
        const str3 = str2 + (text[i+2] || "");
        
        switch (str2) {
            case "\r\n": html += "<br />"; i += 2; continue;
        }
        switch (str1) {
            case "\r": html += "<br />"; i++; continue;
            case "\n": html += "<br />"; i++; continue;
            case "&": html += "&amp;"; i++; continue;
            case "<": html += "&lt;"; i++; continue;
            case ">": html += "&gt;"; i++; continue;
        }
        
        if (str3 === "}}/" && pop("/{{")) {
            // this is the only way to escape from a code block
            html += "</pre>"; i += 3; continue;
        } else if (top() === "/{{") {
            // if we're inside a code block, all tags are suppressed
            html += str1; i++; continue;
        } else if (str3 === "/{{") {
            html += "<pre class=\"jt_code\">"; stack.push(str3); i += 3; continue;
        }
        
        const pushInfo = colorPushDict.lookup(str2, null);
        if (pushInfo !== null) {
            html += pushInfo.replaceStart;
            stack.push(str2);
            i += 2;
            continue;
        }
        
        const popInfo = colorPopDict.lookup(str2, null);
        if (popInfo !== null && pop(popInfo.matchStart)) {
            html += popInfo.replaceEnd;
            i += 2;
            continue;
        }
        
        html += str1;
        i++;
    }
    
    // end all unfinished tags
    while (stack.length > 0) {
        var tag = stack.pop();
        if (tag === "/{{") {
            html += "</pre>";
        } else {
            var info = colorPushDict.lookup(tag, null);
            if (info !== null) {
                html += info.replaceEnd;
            }
        }
    }
    
    // convert URLs to links
    html = html.replace(/(https?:\/\/[^ |^<]+)/g, "<a href=\"$1\" target=\"_blank\">$1</a>");
    
    return html;
}
