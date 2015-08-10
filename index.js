#!/usr/bin/env node
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

'use strict';
console.log('');
console.log('WinChatty');
console.log('Copyright (C) 2015 Brian Luft');
console.log('');

var ini = require('ini');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var wcData = require('wc-data');
var UserCredentials = wcData.UserCredentials;
var wcDataSources = require('wc-data-sources');
var MemoryChattyDb = wcDataSources.MemoryChattyDb;
var MemoryLolDb = wcDataSources.MemoryLolDb;
var service = require('wc-app');

var iniFilePath = process.env.WINCHATTY_INI || path.join(__dirname, 'winchatty.ini'); 
var config = ini.parse(fs.readFileSync(iniFilePath, 'utf-8'));
var chattyDb = null;
var lolDb = null;

switch (config.chattyDb) {
  case 'memory': {
    var iniUsers = _(config.memoryChattyDb.users).map(JSON.parse);
    var mods = _(iniUsers) 
      .filter(function(x) { return x[2] === true; })
      .map(function(x) { return new UserCredentials(x[0], x[1]); })
      .value();
    var users = _(iniUsers) 
      .filter(iniUsers, function(x) { return x[2] !== true; })
      .map(function(x) { return new UserCredentials(x[0], x[1]); })
      .value();
    chattyDb = new MemoryChattyDb(mods, users);
    break;
  }
  default: {
    console.log('Unrecognized value for "chattyDb": ' + config.chattyDb);
    process.exit(1);
    break;
  }
}

switch (config.lolDb) {
  case 'memory': {
    lolDb = new MemoryLolDb();
    break;
  }
  default: {
    console.log('Unrecognized value for "lolDb": ' + config.lolDb);
    process.exit(1);
    break;
  }
}

console.log('ChattyDb: ' + config.chattyDb);
console.log('LolDb: ' + config.lolDb);
service.run(chattyDb, lolDb, 8080);
