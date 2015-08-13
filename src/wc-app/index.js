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
var path = require('path')
var _ = require('lodash')
var wcData = require('wc-data')
var common = require('wc-common')
var Service = wcData.Service

// registerRoutes(Service service)
// Locates the .js files in the routes/ directory, loads them, and runs them so that they will add their routes to
// the app object (accessed via the Service object).
function registerRoutes(dir, service) {
    _.filter(common.findFilesSync(dir), function(x) { return path.extname(x) === '.js' })
        .forEach(function(filePath) {
            require(filePath)(service)
            console.log('Route: /' + path.basename(path.relative(path.join(__dirname, 'routes'), filePath), '.js'))
        })
}

// wc-app.run(ChattyDb chattyDb, LolDb lolDb, int port) : void
// Runs the HTTP server on the specified port.
exports.run = function(chattyDb, lolDb, port) {
    var app = require('express')()
    app.use(require('morgan')('combined'))
    app.use(require('compression')({
        filter: function() { return true },
        threshold: 1
    }))
    app.timeout = 0

    // addRoute(string method, string routePath, function handler)
    // method is: GET, POST
    // handler is: function(req, res)
    function addRoute(method, routePath, handler) {
        var wrappedHandler = function(req, res) {
            try {
                handler(req, res)
            } catch (ex) {
                if (ex instanceof wcData.ApiException) {
                    res.send(ex)
                } else {
                    console.log('Unexpected exception while handling ' + routePath + ': ')
                    console.log(ex)
                    res.send(new wcData.ApiException('ERR_SERVER', 'An unexpected error occurred.'))
                }
            }
        }
        if (method === 'GET') {
            app.get(routePath, wrappedHandler)
        } else if (method === 'POST') {
            app.post(routePath, wrappedHandler)
        } else {
            throw 'Unexpected method in route: ' + method
        }
    }

    var service = new Service(app, chattyDb, lolDb, null, null, addRoute) // todo
    chattyDb.attach(service)
    lolDb.attach(service)

    registerRoutes(path.join(__dirname, 'routes'), service)

    app.listen(port)
    console.log('HTTP server listening on port ' + port + '.')
}
