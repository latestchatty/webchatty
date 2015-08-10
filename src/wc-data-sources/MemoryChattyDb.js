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
var _ = require('lodash');
var wcData = require('wc-data');
var common = require('wc-common');
var ChattyDb = wcData.ChattyDb;
var ModFlag = wcData.ModFlag;
var UserRegistrationDate = wcData.UserRegistrationDate;
var WinChattyException = wcData.WinChattyException;

// MemoryChattyDb(UserCredentials[] mods, UserCredentials[] users)
// Returns an in-memory reference implementation of ChattyDb.  There is no persistence.
function MemoryChattyDb(mods, users) {
  var mInstance = null; // Service
  var mPosts = [ null ]; // Post[], the array index is the post number. Index 0 is reserved.
  var mThreads = []; // MemThread[]
  var mStartupDate = wcData.dateTimeNow(); // UtcDateTime
  
  // MemThread(int id, UtcDateTime date, UtcDateTime bumpDate)
  function MemThread(id, date, bumpDate) {
    this.id = id;
    this.date = date;
    this.bumpDate = bumpDate;
  }
  
  // postExists(int postId) : bool
  function postExists(postId) {
    return postId > 0 && postId < mPosts.length && mPosts[postId].category !== ModFlag.NUKED;
  }
  
  // containingThreadId(int postId) : int?
  function containingThreadId(postId) {
    if (postExists(postId)) {
      return mPosts[postId].threadId;
    } else {
      return null;
    }
  }
  
  // attach(Service instance) : void
  // This is called by the engine when it first starts up.  The ChattyDb hangs onto the Service reference which
  // it will use later to notify the engine of post updates.
  function attach(instance) {
    mInstance = instance;
  }
  
  // getPosts(int[] postIds) : Post[]
  // Retrieves a set of posts by post ID.  If a post ID does not exist or is nuked, then it is silently omitted from 
  // the returned array.
  function getPosts(postIds) {
    var validPostIds = _(postIds).filter(postExists);
    return _(mPosts).at(validPostIds);
  }
  
  // getPostRange(int startId, int count, bool reverse) : Post[]
  // Retrieves a set of posts which are contiguous by post ID.  If a post in the range does not exist or is nuked, then
  // it is silently omitted from the returned array.  If `reverse` is true, then the returned posts start at `startId`
  // and walk backwards.
  function getPostRange(startId, count, reverse) {
    return getPosts(_.range(startId, reverse ? startId + count : startId - count));
  }
  
  // getThreads(int[] postIds) : Post[]
  // Gets an unordered list of posts in the threads that contain `postIds`.  Each post ID is not necessarily the root
  // post, but may be any post in the thread.  If any post ID does not exist or is nuked, it is silently omitted from
  // the resulting array.
  function getThreads(postIds) {
    var threadIds = _(postIds).map(containingThreadId).filter(common.isNotNull).uniq();
    return _(mPosts).filter(function(post) { 
      return post !== null && postExists(post.id) && _(threadIds).includes(post.threadId); 
    });
  }
  
  // getUserRegistrationDates(string[] usernames) : UserRegistrationDate[]
  // Gets the registration dates of a set of usernames.  If `usernames` is empty, then all registration dates are
  // returned.  Usernames are case insensitive.
  function getUserRegistrationDates(usernames) {
    var allLowercaseUsernames = _(users).concat(mods).map(function(x) { return x.username.toLowerCase(); });
    if (usernames.length === 0) {
      usernames = allLowercaseUsernames;
    }
    return _(usernames)
      .filter(function(x) { return allLowercaseUsernames.includes(x.toLowerCase()); })
      .map(function(x) { return new UserRegistrationDate(x, mStartupDate); });
  }
  
  // search(string terms, string author, string parentAuthor, ModFlag? category, int offset, int limit, 
  //   bool oldestFirst) : Post[]
  // Searches the comments.  The string arguments may be blank strings.  The category may be a blank string.
  // Searches are case insensitive.
  function search(terms, author, parentAuthor, category, offset, limit, oldestFirst) {
    throw new WinChattyException('ERR_SERVER', 'Not implemented.');
  }
  
  // requestReindex(int postId) : void
  // Instructs the database to reindex a particular post.  If such an operation is not applicable for a particular 
  // backend, it can do nothing in response.
  function requestReindex(postId) {
    // does nothing
  }
  
  // setPostCategory(string username, string password, int postId, ModFlag category) : void
  // Instructs the database to moderate a particular post.  The user must be a moderator.  WinChattyException is 
  // thrown if the user is not a moderator.
  function setPostCategory(username, password, postId, category) {
    throw new WinChattyException('ERR_SERVER', 'Not implemented.');
  }
  
  // getUserCategoryFilters(string username) : UserCategoryFilters
  // Gets the user's moderation flag filter settings.  Usernames are case insensitive.
  function getUserCategoryFilters(username) {
    throw new WinChattyException('ERR_SERVER', 'Not implemented.');
  }
  
  // setUserCategoryFilters(string username, UserCategoryFilters filters) : void
  // Sets the user's moderation flag filter settings.  Usernames are case insensitive.
  function setUserCategoryFilters(username, filters) {
    throw new WinChattyException('ERR_SERVER', 'Not implemented.');
  }
  
  // getUserMarkedPosts(string username) : UserMarkedPost[]
  // Gets the most recent N marked posts, where N is decided by the ChattyDb.  Usernames are case insensitive.
  function getUserMarkedPosts(username) {
    throw new WinChattyException('ERR_SERVER', 'Not implemented.');
  }
  
  // setUserMarkedPost(string username, int postId, MarkedPostType type) : void
  // Marks or unmarks a post.  If `postId` is -1, then all posts are unmarked.  Usernames are case insensitive.
  function setUserMarkedPost(username, postId, type) {
    throw new WinChattyException('ERR_SERVER', 'Not implemented.');
  }
  
  // getUserClientData(string username, string client) : string
  // Gets the client data.  Returns "" if there is no client data.  Usernames are case insensitive.
  function getUserClientData(username, client) {
    throw new WinChattyException('ERR_SERVER', 'Not implemented.');
  }
  
  // setUserClientData(string username, string client, string data) : void
  // Sets the client data.  Usernames are case insensitive.
  function setUserClientData(username, client, data) {
    throw new WinChattyException('ERR_SERVER', 'Not implemented.');
  }
  
  return new ChattyDb(attach, getPosts, getPostRange, getThreads, getUserRegistrationDates, search, requestReindex,
    setPostCategory, getUserCategoryFilters, setUserCategoryFilters, getUserMarkedPosts, setUserMarkedPost, 
    getUserClientData, setUserClientData);
}

module.exports = MemoryChattyDb;
