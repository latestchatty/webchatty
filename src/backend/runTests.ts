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

/// <reference path="../../typings/tsd.d.ts" />
"use strict";

import * as webchatty from "./webchatty";
import * as fs from "fs";
import * as path from "path";

// Finds all files recursively in 'dir'.
function findFilesSync(dir: string): string[] {
    const resultArray: string[] = [];
    findFilesSyncCore(dir, resultArray);
    return resultArray;
}

// Finds all files recursively in 'dir' and adds them to 'resultArray'.
function findFilesSyncCore(dir: string, resultArray: string[]): void {
    fs.readdirSync(dir).forEach(function(filename) {
        const filePath = path.join(dir, filename);
        const stat = fs.lstatSync(filePath);

        if (stat.isDirectory()) {
            findFilesSyncCore(filePath, resultArray);
        } else if (path.extname(filename) === '.js') {
            resultArray.push(filePath);
        }
    });
}

async function runTests(): Promise<void> {
    const harness = new webchatty.TestHarness();
    
    const allTestFiles = findFilesSync(path.join(__dirname, "tests"));
    for (var i = 0; i < allTestFiles.length; i++) {
        harness.group = path.basename(allTestFiles[i], ".test.js");
        try {
            harness.server = harness.newServer(true);
            await require(allTestFiles[i])(harness);
            harness.server.stop();
        } catch (ex) {
            console.log(ex);
            process.exit(1);
        }
    }
    
    console.log("Passed tests: " + harness.numPasses);
    console.log("Failed tests: " + harness.numFails);
    process.exit(harness.numFails);
}

runTests();
