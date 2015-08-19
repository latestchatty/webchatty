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
var Promise = require('promise')
var wcData = require('wc-data')
var common = require('wc-common')

function unused() {}

// MemoryChattyDb(UserCredentials[] mods, UserCredentials[] users)
// Returns an in-memory reference implementation of ChattyDb.  There is no persistence.
function MemoryChattyDb(mMods, mUsers) {
    var mInstance = null // Service
    var mPosts = [null] // Post[], the array index is the post number. Index 0 is reserved.
    var mThreads = [] // MemThread[]
    var mStartupDate = wcData.dateTimeNow() // UtcDateTime
    var mAllUsers = _(mMods).concat(mUsers).value() // UserCredentials[]

    // MemThread(int id, UtcDateTime date, UtcDateTime bumpDate)
    function MemThread(id, date, bumpDate) {
        this.id = id
        this.date = date
        this.bumpDate = bumpDate
    }

    // postExists(int postId) : bool
    function postExists(postId) {
        return postId > 0 && postId < mPosts.length && mPosts[postId].category !== wcData.ModFlag.NUKED
    }

    // containingThreadId(int postId) : int?
    function containingThreadId(postId) {
        return postExists(postId) ? mPosts[postId].threadId : null
    }

    // attach(Service instance) : Promise<void>
    // This is called by the engine when it first starts up.  The ChattyDb hangs onto the Service reference which
    // it will use later to notify the engine of post updates.
    function attach(instance) {
        return new Promise(function(resolve) {
            mInstance = instance
            resolve(null)
        })
    }

    // getPosts(int[] postIds) : Promise<Post[]>
    // Retrieves a set of posts by post ID.  If a post ID does not exist or is nuked, then it is silently omitted from
    // the returned array.
    function getPosts(postIds) {
        return new Promise(function(resolve) {
            var validPostIds = _.filter(postIds, postExists)
            resolve(_.at(mPosts, validPostIds))
        })
    }

    // getPostRange(int startId, int count, bool reverse) : Promise<Post[]>
    // Retrieves a set of posts which are contiguous by post ID.  If a post in the range does not exist or is nuked, then
    // it is silently omitted from the returned array.  If `reverse` is true, then the returned posts start at `startId`
    // and walk backwards.
    function getPostRange(startId, count, reverse) {
        return new Promise(function(resolve) {
            resolve(getPosts(_.range(startId, reverse ? startId + count : startId - count)))
        })
    }

    // getThreads(int[] postIds) : Promise<Post[]>
    // Gets an unordered list of posts in the threads that contain `postIds`.  Each post ID is not necessarily the root
    // post, but may be any post in the thread.  If any post ID does not exist or is nuked, it is silently omitted from
    // the resulting array.
    function getThreads(postIds) {
        return new Promise(function(resolve) {
            var threadIds = _(postIds).map(containingThreadId).filter(common.isNotNull).uniq().value()
            resolve(_.filter(mPosts, function(post) {
                return post !== null && postExists(post.id) && _.includes(threadIds, post.threadId)
            }))
        })
    }

    // getUserRegistrationDates(string[] usernames) : Promise<UserRegistrationDate[]>
    // Gets the registration dates of a set of usernames.  If `usernames` is empty, then all registration dates are
    // returned.  Usernames are case insensitive.  If a username is not found or the user has no registration date
    // available, then the user is omitted from the result.
    function getUserRegistrationDates(usernames) {
        return new Promise(function(resolve) {
            var allLowercaseUsernames = _.map(mAllUsers, function(x) { return x.username.toLowerCase() })
            if (usernames.length === 0) {
                usernames = allLowercaseUsernames
            }
            resolve(_(usernames)
                .filter(function(x) { return _.includes(allLowercaseUsernames, x.toLowerCase()) })
                .map(function(x) { return new wcData.UserRegistrationDate(x, mStartupDate) })
                .value())
        })
    }

    // search(string terms, string author, string parentAuthor, ModFlag? category, int offset, int limit,
    //   bool oldestFirst) : Promise<Post[]>
    // Searches the comments.  The string arguments may be blank strings.  The category may be a blank string.
    // Searches are case insensitive.
    function search(/*terms, author, parentAuthor, category, offset, limit, oldestFirst*/) {
        return new Promise(function(/*resolve*/) {
            throw new wcData.ApiException('ERR_SERVER', 'Not implemented.')
        })
    }

    // requestReindex(int postId) : Promise<void>
    // Instructs the database to reindex a particular post.  If such an operation is not applicable for a particular
    // backend, it can do nothing in response.
    function requestReindex(/*postId*/) {
        return new Promise(function(resolve) {
            resolve(null)
        })
    }

    // setPostCategory(UserCredentials credentials, int postId, ModFlag category) : Promise<void>
    // Instructs the database to moderate a particular post.  The user must be a moderator.  ApiException is
    // thrown if the user is not a moderator.
    function setPostCategory(/*username, password, postId, category*/) {
        throw new wcData.ApiException('ERR_SERVER', 'Not implemented.')
    }

    // getUserCategoryFilters(string username) : Promise<UserCategoryFilters>
    // Gets the user's moderation flag filter settings.  Usernames are case insensitive.
    function getUserCategoryFilters(/*username*/) {
        throw new wcData.ApiException('ERR_SERVER', 'Not implemented.')
    }

    // setUserCategoryFilters(string username, UserCategoryFilters filters) : Promise<void>
    // Sets the user's moderation flag filter settings.  Usernames are case insensitive.
    function setUserCategoryFilters(/*username, filters*/) {
        throw new wcData.ApiException('ERR_SERVER', 'Not implemented.')
    }

    // getUserMarkedPosts(string username) : Promise<UserMarkedPost[]>
    // Gets the most recent N marked posts, where N is decided by the ChattyDb.  Usernames are case insensitive.
    function getUserMarkedPosts(/*username*/) {
        throw new wcData.ApiException('ERR_SERVER', 'Not implemented.')
    }

    // setUserMarkedPost(string username, int postId, MarkedPostType type) : Promise<void>
    // Marks or unmarks a post.  If `postId` is -1, then all posts are unmarked.  Usernames are case insensitive.
    function setUserMarkedPost(/*username, postId, type*/) {
        throw new wcData.ApiException('ERR_SERVER', 'Not implemented.')
    }

    // getUserClientData(string username, string client) : Promise<string>
    // Gets the client data.  Returns "" if there is no client data.  Usernames are case insensitive.
    function getUserClientData(/*username, client*/) {
        throw new wcData.ApiException('ERR_SERVER', 'Not implemented.')
    }

    // setUserClientData(string username, string client, string data) : Promise<void>
    // Sets the client data.  Usernames are case insensitive.
    function setUserClientData(/*username, client, data*/) {
        throw new wcData.ApiException('ERR_SERVER', 'Not implemented.')
    }

    // verifyUserCredentials(UserCredentials credentials) : Promise<UserCredentialsStatus>
    // Verifies the username and password, and checks whether the user is a moderator.  The username is not case sensitive.
    function verifyUserCredentials(credentials) {
        return new Promise(function(resolve) {
            var lowerUser = credentials.username.toLowerCase()
            var isValid = _.some(mAllUsers, function(x) {
                return x.username.toLowerCase() === lowerUser && x.password === credentials.password
            })
            var isMod = _.some(mMods, function(x) {
                return x.username.toLowerCase() === lowerUser
            })
            resolve(new wcData.UserCredentialsStatus(isValid, isMod))
        })
    }
    
    // **postComment(UserCredentials credentials, int parentId, string body) : Promise<void>**   
    // Posts a new comment.  If parentId is 0, then a new thread is made.  `body` may contain Shacktags.
    function postComment(credentials, parentId, body) {
        verifyUserCredentials(credentials)
            .then(function(credStatus) {
                return new Promise(function(resolve, reject) {
                    if (!credStatus.isValid) {
                        return reject(new wcData.ApiException('ERR_INVALID_LOGIN', 'Invalid credentials.'))
                    } else if (parentId !== 0 && !postExists(parentId)) {
                        return reject(new wcData.ApiException('ERR_ARGUMENT', 'The specified parent post does not exist.'))
                    } else {
                        
                    }
                })
            })
        
        
        return new Promise(function(resolve, reject) {
            var credStatus = verifyUserCredentials(credentials)
            if (credStatus.isValid !== true) {
                return reject(new wcData.ApiException('ERR_INVALID_LOGIN', 'Invalid credentials.'))
            }
            // todo: ERR_POST_RATE_LIMIT
            // todo: ERR_BANNED
        })
    }

    //TODO: unused variables for now
    unused(mInstance, mThreads, MemThread)

    return new wcData.ChattyDb(attach, getPosts, getPostRange, getThreads, getUserRegistrationDates, search,
        requestReindex, setPostCategory, getUserCategoryFilters, setUserCategoryFilters, getUserMarkedPosts,
        setUserMarkedPost, getUserClientData, setUserClientData, verifyUserCredentials)
}

module.exports = MemoryChattyDb
