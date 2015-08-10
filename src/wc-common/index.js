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

'use strict'
var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var common = exports

// arrayContains(object[] haystack, object needle) : bool
exports.arrayContains = function(haystack, needle) {
    for (var i = 0; i < haystack.length; i++) {
        if (haystack[i] === needle) {
            return true
        }
    }
    return false
}

// isNotNull(object x) : bool
exports.isNotNull = function(x) {
    return x !== null
}

// findFilesSyncCore(dir, resultArray) : void
// Finds all files recursively in `dir` and adds them to `resultArray`.
function findFilesSyncCore(dir, resultArray) {
    fs.readdirSync(dir).forEach(function(filename) {
        var filePath = path.join(dir, filename)
        var stat = fs.lstatSync(filePath)

        if (stat.isDirectory()) {
            findFilesSyncCore(filePath, resultArray)
        }
        else if (path.extname(filename) === '.js') {
            resultArray.push(filePath)
        }
    })
}

// findFilesSync(string dir) : string[]
// Finds all files recursively in `dir`.
exports.findFilesSync = function(dir) {
    var resultArray = [] // string[]
    findFilesSyncCore(dir, resultArray)
    return resultArray
}

// startsWithCapitalLetter(string x) : bool
exports.startsWithCapitalLetter = function(x) {
    return x.length > 0 && x[0].toUpperCase() === x[0]
}

// isJsObjectFile(string x) : bool
function isJsObjectFile(x) {
    return path.extname(x) === '.js' && common.startsWithCapitalLetter(path.basename(x))
}

// registerModuleObjects(string dir, object pkg)
// Scans for .js files starting with a capital letter and adds corresponding properties to the pkg object.
exports.registerModuleObjects = function(dir, pkg) {
    _.filter(common.findFilesSync(dir), isJsObjectFile)
        .forEach(function(filePath) {
            var objectName = path.basename(filePath, '.js')
            pkg[objectName] = require(filePath)
        })
}
