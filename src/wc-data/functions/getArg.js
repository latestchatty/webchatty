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
var _ = require('lodash')
var ApiException = require('../objects/ApiException.js')
var toUtcDateTime = require('../functions/toUtcDateTime.js')

var regexInt = /^[0-9]+$/

// parseSingle(string arg, string type, int|false min, int|false max) : object
function parseSingle(arg, type, min, max) {
    // min and max only apply for integers and strings
    if ((min !== false || max !== false) && type !== 'INT' && type !== 'STR') {
        throw new ApiException('ERR_SERVER', 'Min and max can only be provided for INT or STR types.')
    }

    switch (type) {
        case 'INT':
            if (!arg.match(regexInt)) {
                throw new ApiException('ERR_ARGUMENT', 'Value "' + arg + '" is not a valid INT.')
            }
            var val = parseInt(arg, 10)
            if (min !== false && val < min) {
                throw new ApiException('ERR_ARGUMENT', 'Value "' + arg + '" is less than the minimum of ' + min + '.')
            } else if (max !== false && val > max) {
                throw new ApiException('ERR_ARGUMENT', 'Value "' + arg + '" is greater than the maximum of ' + max + '.')
            }
            return val

        case 'BIT':
            if (arg === 'true') {
                return true
            } else if (arg === 'false') {
                return false
            }
            throw new ApiException('ERR_ARGUMENT', 'Value "' + arg + '" is not a valid BIT.')

        case 'STR':
            if (min !== false && arg.length < min) {
                throw new ApiException('ERR_ARGUMENT', 'Value "' + arg + '" is shorter than the minimum of ' + min + ' characters.')
            } else if (max !== false && arg.length > max) {
                throw new ApiException('ERR_ARGUMENT', 'Value "' + arg + '" is longer than the maximum of ' + max + ' characters.')
            }
            return arg

        case 'DAT':
            var ticks = Date.parse(arg)
            if (isNaN(ticks)) {
                throw new ApiException('ERR_ARGUMENT', '"' + arg + '" is not a valid DAT value.')
            }
            return toUtcDateTime(new Date(ticks))

        case 'MOD':
            if (!_.includes(['ontopic', 'nws', 'stupid', 'political', 'tangent', 'informative'], arg)) {
                throw new ApiException('ERR_ARGUMENT', '"' + arg + '" is not a valid MOD value.')
            }
            return arg

        case 'MODN':
            if (!_.includes(['ontopic', 'nws', 'stupid', 'political', 'tangent', 'informative', 'nuked'], arg)) {
                throw new ApiException('ERR_ARGUMENT', '"' + arg + '" is not a valid MODN value.')
            }
            return arg

        case 'MBX':
            if (!_.includes(['inbox', 'sent'], arg)) {
                throw new ApiException('ERR_ARGUMENT', '"' + arg + '" is not a valid MBX value.')
            }
            return arg

        case 'MPT':
            if (!_.includes(['unmarked', 'pinned', 'collapsed'], arg)) {
                throw new ApiException('ERR_ARGUMENT', '"' + arg + '" is not a valid MPT value.')
            }
            return arg

        default:
            throw new ApiException('ERR_SERVER', 'Unexpected type: ' + type)
    }
}

// parseList(string arg, string type, int|false min, int|false max) : object[]
function parseList(arg, type, min, max) {
    var list = arg.split(',')
    if (min !== false && list.length < min) {
        throw new ApiException('ERR_ARGUMENT', 'At least ' + min + ' list items must be provided.')
    } else if (max !== false && list.length > max) {
        throw new ApiException('ERR_ARGUMENT', 'At most ' + max + ' list items must be provided.')
    }
    return _.map(list, function(x) { return parseSingle(x, type, false, false) })
}

// getArg(object req, string name, object spec, object defaultValue) : object
// spec is: { type: 'STR', min: 0, max: 50, list: true, optional: true } where type is required, all others are optional.
// The value is parsed into the specified type.  If spec.optional is true and arg is empty, then defaultValue is returned.
// If the argument is defined but invalid per the data type, ApiException is thrown.
function getArg(req, name, spec, defaultValue) {
    var arg = req.query[name]
    var type = spec.type // string like STR, INT, DAT, etc.
    var min = ('min' in spec) && spec.min // int or false
    var max = ('max' in spec) && spec.max // int or false
    var list = ('list' in spec) && spec.list // bool
    var optional = ('optional' in spec) && spec.optional // bool
    if (!(name in req.query) || arg === '') {
        if (optional) {
           return defaultValue
        } else {
            throw new ApiException('ERR_ARGUMENT', 'Missing argument: ' + name)
        }
    }
    return list ? parseList(arg, type, min, max) : parseSingle(arg, type, min, max)
}

module.exports = getArg
