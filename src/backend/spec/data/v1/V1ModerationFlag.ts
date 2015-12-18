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

import * as spec from "../../index";

export enum V1ModerationFlag {
    OnTopic = <any>"ontopic",
    NotWorkSafe = <any>"nws",
    Stupid = <any>"stupid",
    PoliticalReligious = <any>"political",
    Tangent = <any>"offtopic",
    Informative = <any>"informative",
    Nuked = <any>"nuked"
}

export function toV1ModerationFlag(flag: spec.ModerationFlag): V1ModerationFlag {
    switch (flag) {
        case spec.ModerationFlag.OnTopic: return V1ModerationFlag.OnTopic;
        case spec.ModerationFlag.NotWorkSafe: return V1ModerationFlag.NotWorkSafe;
        case spec.ModerationFlag.Stupid: return V1ModerationFlag.Stupid;
        case spec.ModerationFlag.PoliticalReligious: return V1ModerationFlag.PoliticalReligious;
        case spec.ModerationFlag.Tangent: return V1ModerationFlag.Tangent;
        case spec.ModerationFlag.Informative: return V1ModerationFlag.Informative;
        case spec.ModerationFlag.Nuked: return V1ModerationFlag.Nuked;
        default: throw spec.apiError("ERR_SERVER", "Invalid ModerationFlag: " + flag);
    }
}
