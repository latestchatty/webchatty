# WebChatty API

<!-- use "npm run doctoc" to generate this table of contents. --> 
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Introduction](#introduction)
  - [Protocols](#protocols)
  - [Data Types](#data-types)
    - [Request and response types](#request-and-response-types)
    - [Response-only types](#response-only-types)
  - [Error Responses](#error-responses)
  - [Client Implementation Guide](#client-implementation-guide)
- [Threads](#threads)
  - [GET /v2/getChatty](#get-v2getchatty)
  - [GET /v2/getChattyRootPosts](#get-v2getchattyrootposts)
  - [GET /v2/getThread](#get-v2getthread)
  - [GET /v2/getThreadPostIds](#get-v2getthreadpostids)
  - [GET /v2/getThreadPostCount](#get-v2getthreadpostcount)
  - [GET /v2/getSubthread](#get-v2getsubthread)
- [Posts](#posts)
  - [GET /v2/getNewestPostInfo](#get-v2getnewestpostinfo)
  - [GET /v2/getPost](#get-v2getpost)
  - [GET /v2/getPostRange](#get-v2getpostrange)
  - [GET /v2/getParentId](#get-v2getparentid)
  - [GET /v2/getPostLineage](#get-v2getpostlineage)
  - [POST /v2/postComment](#post-v2postcomment)
  - [GET /v2/search](#get-v2search)
  - [POST /v2/requestReindex](#post-v2requestreindex)
  - [POST /v2/setPostCategory](#post-v2setpostcategory)
- [Events](#events)
  - [GET /v2/getNewestEventId](#get-v2getnewesteventid)
  - [GET /v2/waitForEvent](#get-v2waitforevent)
  - [GET /v2/pollForEvent](#get-v2pollforevent)
  - [POST /v2/broadcastServerMessage](#post-v2broadcastservermessage)
- [Users](#users)
  - [GET /v2/checkConnection](#get-v2checkconnection)
  - [POST /v2/verifyCredentials](#post-v2verifycredentials)
  - [GET /v2/getUserRegistrationDate](#get-v2getuserregistrationdate)
  - [GET /v2/getAllUserRegistrationDates](#get-v2getalluserregistrationdates)
  - [GET /v2/getAllTenYearUsers](#get-v2getalltenyearusers)
- [Messages](#messages)
  - [POST /v2/getMessages](#post-v2getmessages)
  - [POST /v2/getMessageCount](#post-v2getmessagecount)
  - [POST /v2/sendMessage](#post-v2sendmessage)
  - [POST /v2/markMessageRead](#post-v2markmessageread)
  - [POST /v2/deleteMessage](#post-v2deletemessage)
- [Client Data](#client-data)
  - [GET /v2/clientData/getCategoryFilters](#get-v2clientdatagetcategoryfilters)
  - [POST /v2/clientData/setCategoryFilters](#post-v2clientdatasetcategoryfilters)
  - [GET /v2/clientData/getMarkedPosts](#get-v2clientdatagetmarkedposts)
  - [POST /v2/clientData/clearMarkedPosts](#post-v2clientdataclearmarkedposts)
  - [POST /v2/clientData/markPost](#post-v2clientdatamarkpost)
  - [GET /v2/clientData/getClientData](#get-v2clientdatagetclientdata)
  - [POST /v2/clientData/setClientData](#post-v2clientdatasetclientdata)
- [Notifications](#notifications)
  - [GET /v2/notifications/generateId](#get-v2notificationsgenerateid)
  - [POST /v2/notifications/registerNotifierClient](#post-v2notificationsregisternotifierclient)
  - [POST /v2/notifications/registerRichClient](#post-v2notificationsregisterrichclient)
  - [POST /v2/notifications/detachAccount](#post-v2notificationsdetachaccount)
  - [POST /v2/notifications/waitForNotification](#post-v2notificationswaitfornotification)
  - [POST /v2/notifications/getUserSetup](#post-v2notificationsgetusersetup)
  - [POST /v2/notifications/setUserSetup](#post-v2notificationssetusersetup)
- [Legacy v1 API](#legacy-v1-api)
  - [Data Types (v1)](#data-types-v1)
  - [Error Responses (v1)](#error-responses-v1)
  - [GET /v1/about](#get-v1about)
  - [GET /v1/index.json](#get-v1indexjson)
  - [GET /v1/`[INT]`.json](#get-v1intjson)
  - [GET /v1/`[INT]`.`[INT]`.json](#get-v1intintjson)
  - [GET /v1/thread/`[INT]`.json](#get-v1threadintjson)
  - [GET /v1/search.json](#get-v1searchjson)
  - [GET /v1/stories.json](#get-v1storiesjson)
  - [GET /v1/stories/`[INT]`.json](#get-v1storiesintjson)
  - [GET /v1/stories/`[INT]`.`[INT]`.json](#get-v1storiesintintjson)
  - [POST /v1/messages.json](#post-v1messagesjson)
  - [POST /v1/messages/`[INT]`.json](#post-v1messagesintjson)
  - [POST /v1/messages/send/](#post-v1messagessend)
  - [POST /v1/post/](#post-v1post)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Introduction
This documents the WebChatty API, a backend web service for a chatty-style forum.  This API supports [Lamp](http://shackwiki.com/wiki/Lamp), [Shack Browse](https://play.google.com/store/apps/details?id=net.woggle.shackbrowse&hl=en), [NiXXeD/chatty](https://github.com/NiXXeD/chatty), and other clients.

This API implements versions 1 and 2 of the WinChatty API, allowing it to support preexisting clients of that API.  WinChatty-compatible methods begin with /v1/ and /v2/, respectively.  New WebChatty methods will be added with a /v3/ prefix.  

### Protocols
The API operates via HTTP or HTTPS.  The client may choose either one, but there's little reason to use HTTP.  I recommend using HTTPS for everything except high-latency cellular connections.  All responses are JSON.

Client applications should be configured to use GZIP compression and verify SSL certificates.  These are both very important, but GZIP compression especially so.  On average GZIP cuts the size of responses down by 75%.  Try calling [/v2/checkConnection](#get-v2checkconnection) to verify that you are correctly using GZIP and SSL.

> **libcurl**   
> Use [curl_setopt()](http://www.php.net/curl_setopt) to set:   
> `CURLOPT_SSL_VERIFYPEER` = `true`   
> `CURLOPT_SSL_VERIFYHOST` = `2`   
> `CURLOPT_ENCODING` = `"gzip"`

> **WinInet**   
> Call [HttpOpenRequest()](http://msdn.microsoft.com/en-us/library/windows/desktop/aa384233(v=vs.85).aspx) using the flag `INTERNET_FLAG_SECURE`.  Then call [InternetSetOption()](http://msdn.microsoft.com/en-us/library/windows/desktop/aa385114(v=vs.85).aspx) using the flag `INTERNET_OPTION_HTTP_DECODING`.

> **.NET**   
> [WebClient](http://msdn.microsoft.com/en-us/library/system.net.webclient(v=vs.110).aspx) automatically verifies SSL certificates, but you must override [GetWebRequest()](http://msdn.microsoft.com/en-us/library/system.net.webclient.getwebrequest(v=vs.110).aspx) in order to support GZIP compression (see [this StackOverflow answer](http://stackoverflow.com/a/4914874) for the code).  [WebException](http://msdn.microsoft.com/en-us/library/system.net.webexception(v=vs.110).aspx) is thrown if the certificate is invalid.

> **iOS / OS X**   
> Based on some quick Google searches, I think [NSURLConnection](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Classes/NSURLConnection_Class/Reference/Reference.html) verifies SSL certificates by default and blows up in some way if the certificate is invalid.  I think you have to add the "Accept-Encoding" header in order to support GZIP compression (see [this StackOverflow answer](http://stackoverflow.com/a/2683986) for the code).

The v2 API does not use cookies; likewise it does not use PHP sessions.

The v2 API does not use HTTP authentication.  Usernames and passwords, when applicable, are passed via POST arguments.  It is highly recommended that HTTPS be used so that usernames and passwords are not transmitted in plain text.  You may wish to use HTTP for requests where passwords are not transmitted; in mobile clients on cellular networks, the SSL handshaking can add a significant amount of latency.

Besides making the API easier to use, I believe the aforementioned restrictions on cookies and authentication are required when using [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) to allow access from all domains.  The API returns the header `Access-Control-Allow-Origin: *`.  The [W3C documentation for CORS](http://www.w3.org/TR/cors/#resource-requests) states:

- ["The string "*" cannot be used for a resource that supports credentials."](http://www.w3.org/TR/cors/#resource-requests)

- ["A supports credentials flag that indicates whether the resource supports user credentials in the request."](http://www.w3.org/TR/cors/#supports-credentials)

- ["The term user credentials for the purposes of this specification means cookies, HTTP authentication, and client-side SSL certificates that would be sent based on the user agent's previous interactions with the origin."](http://www.w3.org/TR/cors/#user-credentials)

### Data Types
In order to precisely define the accepted inputs (query parameters) and the expected outputs (JSON) of the v2 API methods, the following data type shorthands are defined.  Most types appear in both query parameters and JSON responses, but a few only appear in JSON responses.

The following suffixes may appear on any of the data types below:
- The suffix + indicates a list of one or more, separated by comma.
- The suffix ? indicates that the argument may be omitted or empty.
- The suffix * is the combinaton of + and ? (i.e. a list of zero or more).
- A comma and a number indicates the maximum value for integer arguments, the maximum count for list arguments, and the maximum length for string arguments.

#### Request and response types
Type | Description
--- | ---
`[INT]` | Unsigned 31-bit decimal integer (range 0..2147483647).  No leading zeroes.
`[BIT]` | `true` or `false`
`[STR]` | String
`[DAT]` | Combined date and time, represented as a strict subset of RFC 3339, which is itself a strict subset of ISO 8601.  Dates in JSON responses will always be formatted exactly like this: `"2013-12-01T19:39:00.000Z"`.  The time is in the UTC time zone.  Make sure to convert all `[DAT]` values to the user's local time zone before displaying!
`[MOD]` | Moderation flag enum.  One of the following strings: `"ontopic"` `"nws"` `"stupid"` `"political"` `"tangent"` `"informative"`
`[MODN]` | Moderation flag enum, including "nuked".  One of the following strings: `"ontopic"` `"nws"` `"stupid"` `"political"` `"tangent"` `"informative"` `"nuked"`
`[MBX]` | Mailbox enum.  One of the following strings: `"inbox"` `"sent"`
`[MPT]` | Marked post type enum.  One of the following strings: `"unmarked"` `"pinned"` `"collapsed"`

#### Response-only types
`[POST]` - A single post.
>```
>{
>   "id": [INT],
>   "threadId": [INT],
>   "parentId": [INT],
>   "author": [STR],
>   "category": [MOD],
>   "date": [DAT],
>   "body": [STR],
>   "lols":
>   [
>      {
>         "tag": [STR],
>         "count": [INT]
>      },
>      ...
>   ]
>}
>```

`[POSTS]` - A list of posts.
>```
>[
>   [POST*]
>]
>```

`[EVENT]` - A single event of any type.
>```
>{
>   "eventId": [INT],
>   "eventDate": [DAT],
>   "eventType": [E_TYPE],
>   "eventData": [E_DATA]  // check "type" first
>}
>```

`[EVENTS]` - A list of events.
>```
>[
>   [EVENT*]
>]
>```

`[E_TYPE]` - Event action type enum.  One of the following strings:
>- `"newPost"` - data will be `[E_NEWP]`
>- `"categoryChange"` - data will be `[E_CATC]`
>- `"serverMessage"` - data will be `[E_SMSG]`
>- `"lolCountsUpdate"` - data will be `[E_LOLS]`

`[E_DATA]` - Event-specific data.  Abstract base type which may be any one of the following concrete types:
>- `[E_NEWP]` - new post
>- `[E_CATC]` - category change
>- `[E_SMSG]` - server message
>- `[E_LOLS]` - tag counts update

`[E_NEWP]` - New post event data.
>```
>{
>   "postId": [INT],
>   "post": [POST],
>   "parentAuthor": [STR]
>}
>```

`[E_CATC]` - Category change event data.
>```
>{
>   "postId": [INT],
>   "category": [MODN]
>}
>```

`[E_SMSG]` - Server message event data.
>```
>{
>   "message": [STR]
>}
>```

`[E_LOLS]` - ShackLOL tag counts update.  Only tag counts that have changed are included.
>```
>{
>   "updates":
>   [
>      {
>         "postId": [INT],
>         "tag": [STR],
>         "count": [INT]
>      },
>      ...
>   ]
>}
>```

### Error Responses
If an API call results in an error, it is returned in the following JSON structure.
```
{
   "error": true,
   "code": [STR],
   "message": [STR]
}
```
The documentation for each API call lists which error codes are possible.  The following two error codes are possible on any API call, and are thus not listed on each individual call.  In both cases it is recommended that the client simply display the error message and then cancel whatever operation caused it.

Error code | Description
--- | ---
`ERR_SERVER` | Unexpected error.  Could be a communications failure, server outage, exception, etc.  The client did not do anything wrong.
`ERR_ARGUMENT` | Invalid argument.  The client passed an argument value that violates a documented constraint.  The client contains a bug.

### Client Implementation Guide
These are general guidelines to follow when implementing a "full featured" client based on the v2 API.  Feel free to pick and choose based on your client's unique needs.  All of the API calls are designed to stand alone, as well as work in conjunction with the others.

At application startup:
- Call [/v2/clientData/](#client-data) methods to retrieve the user's client settings, if your client supports cloud synchronization of its settings.
- Call [/v2/getNewestEventId](#get-v2getnewesteventid) and save the event ID.  This ID will be continually updated as new events arrive.
- Call [/v2/getChatty](#get-v2getchatty) to bootstrap your local copy of the chatty, including all active threads.
- If your client shows lightning bolts for 10-year users, then call [/v2/getAllUserRegistrationDates](#get-v2getalluserregistrationdates) to bootstrap your list of registration dates.  If you encounter a username that isn't in your list, then call [/v2/getUserRegistrationDate](#get-v2getuserregistrationdate).  For some usernames (specifically, usernames containing punctuation characters), this may fail.

In a loop running until the application exits:
- *For desktop clients and other "unlimited energy/bandwidth/processor" scenarios:*   
Call [/v2/waitForEvent](#get-v2waitforevent), passing the last event ID (either from the original [/v2/getNewestEventId](#get-v2getnewesteventid) call, or the previous loop).  This will block until an event is ready, so your loop does not need any delays (unless you want to artificially limit the rate of events).
- *For mobile clients and other "limited energy/bandwidth/processor" scenarios:*   
Call [/v2/pollForEvent](#get-v2pollforevent), passing the last event ID (either from the original [/v2/getNewestEventId](#get-v2getnewesteventid) call, or the previous loop).  This will always return immediately, but may return zero events.  Then delay for length of time of your choosing (perhaps 1 minute) to allow your WiFi/3G/LTE radio to go idle.
- If `ERR_TOO_MANY_EVENTS` is returned, then throw out your copy of the chatty and start over by calling [/v2/getNewestEventId](#get-v2getnewesteventid) and [/v2/getChatty](#get-v2getchatty).  If the call fails with a different error, then display the error message and exit the loop rather than continuing to call it.

When your event loop retrieves a new event:
- For a new post, insert the post into your copy of the chatty.
- For a category change to "nuked", remove the post and all of its children from your copy of the chatty.
- For a category change to anything else, update the existing post in your copy of the chatty.  If the post does not exist in your copy of the chatty, then it must have been previously nuked and now has been reinstated.  Call [/v2/getSubthread](#get-v2getsubthread) to get the subthread rooted at this post, and insert all of the posts into your copy of the chatty.
- For a server message, show a message box to the user with the specified administrator message.

When the user changes a client option:
- If the username and password were changed, called [/v2/verifyCredentials](#post-v2verifycredentials) to ensure the login information is valid.
- Call [/v2/clientData/](#client-data) methods to save the updated client options.

## Threads
These API calls relate to the chatty itself.   These are the core of the v2 API.

### GET /v2/getChatty
Gets the list of recently bumped threads, starting with the most recently bumped.  Only "active" threads (i.e. threads that have not expired) are included.  Thus this essentially grabs the entire chatty.  The full threads are returned.  You should call this method to bootstrap your application's local copy of the chatty, and then use [/v2/waitForEvent](#get-v2waitforevent) to keep it up to date.

Parameters:
- `count=[INT?]` - The number of threads to return.  If not specified, then all active (not expired) threads are returned.
- `expiration=[INT?,36]` - The number of hours to keep threads around in this list.  If not provided, then the default of 18 is used.  The maximum is 36 hours.

Response:
```
{
   "threads":
   [
      {
         "threadId": [INT],
         "posts": [POSTS]
      },
      ...  // one for each thread
   ]
}
```

### GET /v2/getChattyRootPosts
Gets one page of root posts, without any replies (to save space).  This is intended for use by mobile clients.

Parameters:
- `offset=[INT?]` - Number of threads to skip (for paging).  Default is 0.
- `limit=[INT?]` - Maximum number of threads to return (for paging).  Default is 40.
- `username=[STR?]` - If provided, this allows the isParticipant flag to be returned for each thread indicating whether the user posted that thread or replied to it.  If not provided, the isParticipant flag will always be false.
- `date=[DAT?]` - If provided, posts from this day will be returned rather than the currently active chatty posts.  Root posts will be returned in order from highest to lowest postCount.

Response:
```
{
   "totalThreadCount": [INT],
   "rootPosts":
   [
      {
         "id": [INT],
         "date": [DAT],
         "author": [STR],
         "category": [MOD],
         "body": [STR],
         "postCount": [INT],  // count includes the root post
         "isParticipant": [BIT]
      },
      ...  // one for each thread
   ]
}
```

### GET /v2/getThread
Gets all of the posts in one or more threads.  If an invalid ID is passed (or if the ID of a nuked post is passed), then that thread will be silently omitted from the resulting list of threads.

Parameters:
- `id=[INT+,50]` - One or more IDs.  May be any post in the thread, not just the OP.

Response:
```
{
   "threads":
   [
      {
         "threadId": [INT],
         "posts": [POSTS]
      },
      ...  // one for each thread
   ]
}
```

### GET /v2/getThreadPostIds
Gets the ID of each post in one or more threads.  If an invalid ID is passed (or if the ID of a nuked post is passed), then that thread will be silently omitted from the resulting list of threads.

Parameters:
- `id=[INT+,50]` - One or more IDs.  May be any post in the thread, not just the OP.

Response:
```
{
   "threads":
   [
      {
         "threadId": [INT],
         "postIds":
         [
            [INT],
            ...  // one for each post in the thread
         ]
      },
      ...  // one for each thread
   ]
}
```

### GET /v2/getThreadPostCount
Gets the number of posts in one or more threads, including the root post (i.e. the post count is always at least 1).

Parameters:
- `id=[INT+,200]` - One or more thread IDs.  May be any post in the thread, not just the OP.

Response:
```
{
   "threads":
   [
      {
         "threadId": [INT],
         "postCount": [INT]
      },
      ...  // one for each thread
   ]
}
```

### GET /v2/getSubthread
Gets all of the posts in one or more subthreads.  A subthread is a post (which may or may not be a thread OP) and its descendants.  If an invalid ID is passed (or if the ID of a nuked post is passed), then that thread will be silently omitted from the resulting list of subthreads.

Parameters:
- `id=[INT+,50]` - One or more IDs.  The subthreads rooted at these IDs are returned.

Response:
```
{
   "subthreads":
   [
      {
         "subthreadId": [INT],
         "posts": [POSTS]
      },
      ...  // one for each subthread
   ]
}
```

## Posts
These API calls relate to the chatty itself.   These are the core of the v2 API.

### GET /v2/getNewestPostInfo
Gets the ID and date of the most recent post in the database.

Parameters:
- None.

Response:
```
{
   "id": [INT],
   "date": [DAT]
}
```

### GET /v2/getPost
Gets one or more individual posts, specified by ID.

Parameters:
- `id=[INT+,50]` - The post IDs to retrieve.

Response:
```
{
   "posts": [POSTS]
}
```

### GET /v2/getPostRange
Gets a consecutive range of posts.  If any posts in the range do not exist (i.e. nuked, or hasn't been posted yet), then they are silently omitted from the list of posts in the response, rather than raising an error.  The nuked posts are not counted against the number of posts requested by the count argument.

Parameters:
- `startId=[INT]` - The starting ID.  This ID is included in the range.
- `count=[INT,1000]` - Maximum number of posts to return, including startId.
- `reverse=[BIT?]` - If true, then post IDs ≤ startId are retrieved.  If not specified, or false, then post IDs ≥ startId are retrieved.

Response:
```
{
   "posts": [POSTS]
}
```

### GET /v2/getParentId
Gets the parent IDs for one or more posts.  If a post does not exist, then it is silently omitted from the list of relationships in the response, rather than raising an error.  If a post is the OP of a thread, then the ID 0 is returned.

Parameters:
- `id=[INT+,50]` - List of post IDs.  The parent ID of each one will be returned.

Response:
```
{
   "relationships":
   [
      {
         "childId": [INT],
         "parentId": [INT]
      },
      ...  // one for each ID
   ]
}
```

### GET /v2/getPostLineage
Get the parent, parent's parent, parent's parent's parent, etc. for one or more posts.

Parameters:
- `id=[INT+,50]` - One or more post IDs for which to get parent chains ("lineages").  If an ID does not exist or is nuked, then the chain is silently omitted from the result list.

Response:
```
{
   "posts":
   [
      {
         "postId": [INT],
         "lineage": [POSTS]  // newest first
      },
      ...  // one for each post
   ]
}
```

### POST /v2/postComment
Posts a new comment.

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.
- `parentId=[INT]` - The ID of the post we're replying to, or 0 for a new thread.
- `text=[STR]` - The body of the post.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_INVALID_LOGIN`
- `ERR_POST_RATE_LIMIT`
- `ERR_BANNED`
- `ERR_NUKED`

### GET /v2/search
Performs a comment search.

Parameters:
- `terms=[STR?]` - Search terms.
- `author=[STR?]` - Author.
- `parentAuthor=[STR?]` - Parent author.
- `category=[MOD?]` - Moderation flag.
- `offset=[INT?]` - Number of results to skip.  0 is the default, which gets the first page of results.
- `limit=[INT?,500]` - Maximum number of results to return.  35 is the default.  Larger limits may take a long time to retrieve.
- `oldestFirst=[BIT?]` - Whether to get results oldest first.  Default: false.

Response:
```
{
   "posts": [POSTS]
}
```

### POST /v2/requestReindex
Requests a reindex of a specified post.  This is used when implementing moderator support.  When the moderator nukes or flags a post, the client should call this method to notify the server about the change.  This ensures that the database is immediately updated.  Otherwise, it may take some time for the database to be updated.

This post blocks until the post has been reindexed.  Push-based clients will receive an event about the change.  Poll-based clients can refresh the thread after the call returns.

Parameters:
- `postId=[INT]` - Post ID.

Response
```
{
   "result": "success"
}
```

### POST /v2/setPostCategory
For moderators, sets the category (moderation flag) of a post.  This automatically triggers a reindex of the post; you do not need to call requestReindex afterwards.

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.
- `postId=[INT]` - Post ID.
- `category=[MODN]` - Moderation flag (possibly nuked).

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_INVALID_LOGIN`

## Events
Events allow the server to inform the client of any changes that are made, which the client would need to know to keep its local copy of the chatty up to date.  The following list describes all of the event types:
- `"newPost"` – A new post has been added.
- `"categoryChange"` – The category of an existing post has been modified.
- `"serverMessage"` – The server administrator wants to display a message to all connected users.

The category change event encompasses the following three things that may happen to a post after it is initially made:
- The post may be nuked (removed from the chatty).
- If the post was previously nuked, then it may be unnuked (reinstated in the chatty).
- The post may be flagged with a moderation category like "informative".

All three events are considered a change to the post's category.  To make this work, the standard set of categories (ontopic, nws, stupid, political, tangent, informative) is augmented with the special flag "nuked".  This gives us a nice way to represent nukes, unnukes, and flags the same way: as a change to the post category.

### GET /v2/getNewestEventId
Gets the most recent event in the database.

Parameters:
- None.

Response:
```
{
   "eventId": [INT]
}
```

### GET /v2/waitForEvent
Waits until a new event occurs, and then returns the information about all events that occurred since the last event seen by the client (as specified in the `lastEventId` argument).  This is the primary method by which the client's local copy of the world is kept up-to-date.  The client should process all events in sequential (by numeric ID) order.

A maximum of 10,000 events are returned.  An error is returned if more than 10,000 events have occurred since your specified `lastEventId`.  In that case, throw out your world and start over.  This will be faster than trying to catch up with a massive list of individual updates.

Note that sometimes this will return an empty list of events.  This is normal.  For instance, if no events have occurred yet.

Parameters:
- `lastEventId=[INT]` - Wait until any event newer than this ID appears.  If a newer event already exists, then the request returns immediately without waiting.

Response:
```
{
   "lastEventId": [INT],  // new lastEventId to be used in your next loop
   "events": [EVENTS]
}
```

Errors:
- `ERR_TOO_MANY_EVENTS`

### GET /v2/pollForEvent
Returns the information about all events (if any) that occurred since the last event seen by the client (as specified in the `lastEventId` argument).  This method is for use by clients in limited bandwidth or limited processor scenarios.  It is expected that these clients would call this method around once per minute (the interval is up to the developer's discretion).  Desktop clients (and phone clients who want a faster update rate at the expense of battery life) should use [/v2/waitForEvent](#get-v2waitforevent).  The client should process all events in sequential (by numeric ID) order.

A maximum of 10,000 events are returned.  An error is returned if more than 10,000 events have occurred since your specified `lastEventId`.  In that case, throw out your world and start over.  This will be faster than trying to catch up with a massive list of individual updates.

Parameters:
- `lastEventId=[INT]` - Return any event newer than this ID.

Response:
```
{
   "lastEventId": [INT],  // new lastEventId to be used in your next loop
   "events": [EVENTS]
}
```

Errors:
- `ERR_TOO_MANY_EVENTS`

### POST /v2/broadcastServerMessage
Administrator-only method to broadcast a server message to all connected users.

Parameters:
- `username=[STR]` - Administrator username.
- `password=[STR]` - Administrator password.
- `message=[STR]` - Server message.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_INVALID_LOGIN`

## Users
These API calls pertain to user accounts.

### GET /v2/checkConnection
Checks to ensure the client is using GZIP and SSL.  An error is returned if GZIP compression or SSL encryption are not being correctly used.

Parameters:
- None.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_NOT_USING_GZIP`
- `ERR_NOT_USING_SSL`

### POST /v2/verifyCredentials
Checks the validity of the given username and password.

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.

Response:
```
{
   "isValid": [BIT],
   "isModerator": [BIT]
}
```

### GET /v2/getUserRegistrationDate
Gets the registration date for one or more users.  If a username does not exist or the user does not have a registration date available, then the user is silently omitted from the result array.

Parameters:
- `username=[STR+,50]` - List of Usernames.

Response:
```
{
   "users":
   [
      {
         "username": [STR],
         "date": [DAT]
      },
      ...  // one for each user
   ]
}
```

### GET /v2/getAllUserRegistrationDates
Gets a bulk dump of registration dates for all users.

Parameters:
- None.

Response:
```
{
   "users":
   [
      {
         "username": [STR],
         "date": [DAT]
      },
      ...  // one for each user
   ]
}
```

### GET /v2/getAllTenYearUsers
Gets a bulk list of all users who have been on the site for more than ten years.  On the site, these users are shown with a lightning bolt.  This is not guaranteed to be a fully comprehensive list (to give the implementation some wiggle room).

Parameters:
- None.

Response:
```
{
   "users":
   [
      [STR],
      ...  // one for each user
   ]
}
```

## Messages

### POST /v2/getMessages
Gets a page of messages in the user’s inbox or sent mailbox. 

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.
- `folder=[MBX]` - The mailbox folder.
- `page=[INT]` - 1-based page number.

Response:
```
{
   "page": [INT],
   "totalPages": [INT],
   "totalMessages": [INT],
   "messages":
   [
      {
         "id": [INT],
         "from": [STR],
         "to": [STR],
         "subject": [STR],
         "date": [DAT],
         "body": [STR],
         "unread": [BIT]
      },
      ...  // one for each message
   ]
}
```

Errors:
- `ERR_INVALID_LOGIN`

### POST /v2/getMessageCount
Gets the total number of messages in the user's inbox as well as the number of unread messages on the first page.

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.

Response:
```
{
   "total": [INT],
   "unread": [INT],
}
```

Errors:
- `ERR_INVALID_LOGIN`

### POST /v2/sendMessage
Sends a message.

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.
- `to=[STR]` - Message recipient's username.
- `subject=[STR]` - Subject line.
- `body=[STR]` - Post body.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_INVALID_LOGIN`
- `ERR_INVALID_RECIPIENT`

### POST /v2/markMessageRead
Marks a message as read.  If the message does not exist, then the method returns successfully without doing anything.

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.
- `messageId=[INT]` - Message ID.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_INVALID_LOGIN`
- `ERR_INVALID_MESSAGE`

### POST /v2/deleteMessage
Deletes a message.  If the message does not exist, then the method returns successfully without doing anything.

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.
- `messageId=[INT]` - Message ID.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_INVALID_LOGIN`
- `ERR_INVALID_MESSAGE`

## Client Data
The v2 API supports server storage ("cloud synchronization") of client data (primarily user preferences, but it's really just a general purpose store for the client's discretionary use).  There are two types of client data associated with each user:

- Shared client data is common to all clients.  For instance, the user's post filters (nws, political, etc.) are shared because every client supports this filtering feature.  These clients can support cloud synchronization of this preference by reading and writing this shared data.  All the shared data is available via formalized API methods with well-defined types and formats.
- Private client data is different for each client.  Here the client can store its own preferences and data which necessarily cannot be shared with other clients.  For instance, window positions, client-specific feature preferences, etc.  This data is available via generic string read/write methods.  It is recommended that you Base64-encode your data before passing it to this API.

Access to client data requires only a username.  Don't store secrets in the client data without encrypting it.  Changes to client data are logged by IP address so that troublemakers can be banned.  Troublemakers are also likely to be publicly shamed by this API's author.

### GET /v2/clientData/getCategoryFilters
Gets the user's moderation flag filters.  A value of true indicates that posts in that category are shown.

Parameters:
- `username=[STR,50]` - Username.

Response:
```
{
   "filters":
   {
      "nws": [BIT],
      "stupid": [BIT],
      "political": [BIT],
      "tangent": [BIT],
      "informative": [BIT]
   }
}
```

### POST /v2/clientData/setCategoryFilters
Sets the user's moderation flag filters.  A value of true indicates that posts in that category are shown.

Parameters:
- `username=[STR,50]` - Username.
- `nws=[BIT]` - Not work safe filter.
- `stupid=[BIT]` - Stupid filter.
- `political=[BIT]` - Political/religious filter.
- `tangent=[BIT]` - Tangent filter.
- `informative=[BIT]` - Informative filter.

Response:
```
{
   "result": "success"
}
```

### GET /v2/clientData/getMarkedPosts
Gets all the user's marked posts (pinned or collapsed).

Parameters:
- `username=[STR,50]` - Username.

Response:
```
{
   "markedPosts":
   [
      {
         id: [INT],
         type: [MPT]
      },
      ...  // one for each marked thread
   ]
}
```

### POST /v2/clientData/clearMarkedPosts
Clears the user's marked posts.

Parameters:
- `username=[STR,50]` - Username.

Response:
```
{
   "result": "success"
}
```

### POST /v2/clientData/markPost
Marks a post as unmarked, pinned, or collapsed.  The default for a regular post is unmarked.

Parameters:
- `username=[STR,50]` - Username.
- `postId=[INT]` - Post ID.
- `type=[MPT]` - Mark type.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_POST_DOES_NOT_EXIST`

### GET /v2/clientData/getClientData
Gets the client-specified data for the specified user.  This is just a blob of text that can be anything the client wants to store on the server (e.g. user preferences).  This data is specific to a particular client so that one client's data does not interfere with another client's data for the same user.

Parameters:
- `username=[STR,50]` - Username.
- `client=[STR,50]` - The unique name of this client.  This is chosen by the client author.  It is not displayed anywhere; it is only used to distinguish one client's data from another.  Recommended strings are something short and descriptive, without a version number.  Examples: "lamp", "chromeshack", etc.

Response:
```
{
   "data": [STR]
}
```

### POST /v2/clientData/setClientData
Sets the private client data for the specified user.  This is just a blob of text that can be anything the client wants to store on the server (e.g. user preferences).  This data is specific to a particular client so that one client's data does not interfere with another client's data for the same user.  Beware: anyone can access this data with just a username.  Do not store secret or private information without encrypting it.

Parameters:
- `username=[STR,50]` - Username.
- `client=[STR,50]` - The unique name of this client.  This is chosen by the client author.  It is not displayed anywhere; it is only used to distinguish one client's data from another.  Recommended strings are something short and descriptive, without a version number.  Examples: "lamp", "chromeshack", etc.
- `data=[STR,100000]` - Client-specified data.  I recommend Base64-encoding this data.  Maximum: 100,000 bytes.

Response
```
{
   "result": "success"
}
```

## Notifications
There are three paths for implementing notifications, described below.

- Simple desktop notifier clients, which receive notifications via long-polling and use web-based login:
  - Upon installation (or upon demand), generate a GUID to represent that client installation and save it forever.
  - Call /v2/notifications/registerNotifierClient at startup.
  - Call /v2/notifications/waitForNotification in a loop.  If ERR_CLIENT_NOT_ASSOCIATED is returned, then open https://winchatty.com/v2/notifications/ui/login?clientId=(_____) in the browser, inserting the client GUID into the query string.  Wait for the user to finish logging in, which associates the account, then continue to loop.
- Rich desktop clients, which receive notifications via long-polling and use their own login:
  - Upon installation (or upon demand), generate a GUID to represent that client installation and save it forever.
  - Call /v2/notifications/registerRichClient when the user enables notifications.
  - Call /v2/notifications/waitForNotification in a loop.  If an error is returned, then stop looping and display the error.
  - Call /v2/notifications/detachAccount when the user disables notifications.
- (Not yet implemented) Rich iOS clients, which receive notifications via APNS and use their own login:
  - Upon installation (or upon demand), generate a GUID to represent that client installation and save it forever.
  - Call /v2/notifications/registerRichClient when the user enables notifications, passing the iOS device token.
  - The server will push notifications to the client.
  - Call /v2/notifications/detachAccount when the user disables notifications.

In order to configure the user's notifications, there are two options:
- Web-based interface at https://winchatty.com/v2/notifications/ui/configure - Very easy to implement and provides full functionality, but cannot be customized in any way.  Simply point the user's browser at that page.
- Custom native interface – More work, requiring the use of additional API calls, but permits maximum control over the user experience.

### GET /v2/notifications/generateId
Generates a GUID.  This is provided as a convenience for clients on platforms where GUIDs are not commonplace.  Windows-based clients may produce a GUID locally using standard Windows methods rather than calling this API.

Parameters:
- None.

Response:
```
{
   "id": [STR]
}
```

### POST /v2/notifications/registerNotifierClient
Registers a brand new installation of a simple notifier client.  This only needs to be done once.  The  notifier app must generate a GUID to use as its ID.  This GUID will uniquely identify this installation of the application and is how the notification server identifies recipients.  If the client is already registered, then no action is taken and success is returned.  This allows very simple clients to register themselves at every launch.  (Just remember to save that GUID somewhere safe on the computer so each launch can use the same GUID.)

After the client has been registered, it needs to be attached to a site account.  When using this method to register the client, the client must open the web browser to the following URL to present the user with an attachment and setup interface:

https://winchatty.com/v2/notifications/ui/login?clientId={0}

{0} should be replaced with the client's GUID in the above URL.  Once the account is attached, the notifier may begin calling waitForNotification to listen for notifications.  waitForNotification will return an error if the client is not attached to an account.

Parameters:
- `id=[STR]` - 36-character GUID, generated fresh by the client.  The client must save and reuse this GUID every time it interacts with the notifications API, otherwise it will be seen as a separate client installation.
- `name=[STR]` - User-recognizable name of this installation.  Typically this should include the computer name, the operating system, and the name of the application.

Response:
```
{
   "result": "success"
}
```

### POST /v2/notifications/registerRichClient
Registers a brand new installation of a rich notifier client.  This only needs to be done once.  If the user logs into a different account, this call may be re-issued to reattach the client to the new account.  It is not necessary to call detachAccount first in that scenario.

After the client is registered, it is immediately attached to the given site account.  Desktop clients may begin calling waitForNotification to listen for notifications as soon as this call returns.  Mobile clients will begin receiving push notifications.

Parameters:
- `id=[STR]` - 36-character GUID, generated fresh by the client.  The client must use this GUID every time it interacts with the notifications API, otherwise it will be seen as a separate client installation.
- `name=[STR]` - User-recognizable name of this installation.  Typically this should include the computer name, the operating system, and the name of the application.
- `username=[STR]` - Username.
- `password=[STR]` - Password.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_INVALID_LOGIN`

### POST /v2/notifications/detachAccount
Detaches the client from the given site account.  The client will no longer receive notifications for this user.

Parameters:
- `clientId=[STR]` - Client GUID.
- `username=[STR]` - Username.
- `password=[STR]` - Password.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_UNKNOWN_CLIENT_ID`
- `ERR_INVALID_LOGIN`

### POST /v2/notifications/waitForNotification
Block until a new notification is ready, or until an internal timeout expires.  In the latter case, zero messages will be returned in the response.

To avoid per-host concurrent connection limits in some HTTP APIs (notably including WinInet), it is recommended that this method be called using the following URL, which contains a different hostname than the v2 API normally uses.  The use of a different hostname ensures that the connection won't be counted against the winchatty.com connection limit.  SSL is not available with this hostname.

http://*notifications*.winchatty.com/v2/notifications/waitForNotification

Parameters:
- `clientId=[STR]` - Client GUID.

Response:
```
{
   "messages":
   [
      {
         "subject": [STR],
         "body": [STR],
         "postId": [INT],
         "threadId": [INT]
      },
      ...
   ]
}
```

Errors:
- `ERR_UNKNOWN_CLIENT_ID`
- `ERR_CLIENT_NOT_ASSOCIATED`

### POST /v2/notifications/getUserSetup
Retrieves the user's notification setup.

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.

Response:
```
{
   "triggerOnReply": [BIT],
   "triggerOnMention": [BIT],
   "triggerKeywords": [STR*]
}
```

Errors:
- `ERR_INVALID_LOGIN`

### POST /v2/notifications/setUserSetup
Overwrites the user's notification setup.  This affects all clients attached to the user's account.

Parameters:
- `username=[STR]` - Username.
- `password=[STR]` - Password.
- `triggerOnReply=[BIT]` - Whether to send a notification for replies to the user's posts.
- `triggerOnMention=[BIT]` - Whether to send a notification when the user's name is mentioned.
- `triggerKeywords=[STR*]` - List of post keywords for which to send notifications.

Response:
```
{
   "result": "success"
}
```

Errors:
- `ERR_INVALID_LOGIN`

## Legacy v1 API
This API exists only to support [Latest Chatty](https://itunes.apple.com/us/app/latest-chatty/id287316743?mt=8) on iOS.  Do not use it in new applications.

### Data Types (v1)
The v1 comment data structure is hierarchical.  Each comment has a list of its children, and each of its children have lists of their children, and so forth.  The children list is empty for leaf nodes.

Type | Description
--- | ---
`[V1_DAT]` | Date and time in freeform text like "Aug 02, 2015 8:01pm PDT".  Note the Pacific time zone, rather than UTC.
`[V1_MOD]` | Moderation flag enum.  Same as `[MOD]` except it uses `"offtopic"` instead of `"tangent"`.  One of the following strings: `"ontopic"` `"nws"` `"stupid"` `"political"` `"offtopic"` `"informative"`

`[V1_COMMENT]` - A comment and its nested children.  This is a recursive data structure.
>```
>{
>   "comments": [V1_COMMENT*],
>   "reply_count": [INT], // includes itself, so it's always at least 1
>   "body": [STR],
>   "date": [V1_DAT],
>   "participants": [STR*], // list of usernames that posted in this thread
>   "category": [V1_MOD],
>   "last_reply_id": [STR], // ID of most recent reply converted to a string
>   "author": [STR],
>   "preview": [STR], // tags stripped out, spoilers replaced with underscores, truncated with ellipsis
>   "id": [STR] // post ID converted to a string
>}
>```

`[V1_PAGE]` - A page of comments.
>```
>{
>   "comments": [V1_COMMENT*],
>   "page": [STR], // 1-based page number converted to a string
>   "last_page": [INT],
>   "story_id": 0, 
>   "story_name": "Latest Chatty" 
>}
>```

`[V1_THREAD]` - A thread of comments.
>```
>{
>   "comments": [V1_COMMENT*],
>   "page": 1, 
>   "last_page": 1, 
>   "story_id": 0, 
>   "story_name": "Latest Chatty", 
>}
>```

`[V1_SEARCH_RESULT]` - A comment search result.
>```
>{
>   "comments": [],
>   "last_reply_id": null, 
>   "author": [STR],
>   "date": [V1_DAT],
>   "story_id": 0, 
>   "category": null, 
>   "reply_count": null, 
>   "id": [STR], // post ID converted to a string
>   "story_name": "", 
>   "preview": [STR], // tags stripped out, spoilers replaced with underscores, truncated with ellipsis
>   "body": null 
>}
>```

### Error Responses (v1)
Errors are reported using the following JSON structure.

```
{
   "faultCode": "AMFPHP_RUNTIME_ERROR", 
   "faultString": [STR], // error message
   "faultDetail": [STR] // source path and line
}
```

### GET /v1/about
**Deprecated.** Gets an HTML page with information about the server.

### GET /v1/index.json
**Deprecated.** Gets the first page of active threads.  This is the same as /v1/0.1.json.

Response: `[V1_PAGE]`

### GET /v1/`[INT]`.json
**Deprecated.** Same as /v1/index.json.  The number in the URL is ignored.  Originally this retrieved a particular chatty (like a particular Morning Discussion or Evening Reading) prior to the "rolling" chatty concept.

Response: `[V1_PAGE]`

### GET /v1/`[INT]`.`[INT]`.json
**Deprecated.** Gets the Nth page of active threads, where N is the second number in the URL.  The first number is ignored.

Response: `[V1_PAGE]`

### GET /v1/thread/`[INT]`.json
**Deprecated.** Gets a particular thread and its replies.  The number in the URL is the ID of some post in the thread (not necessarily the root post).

Response: `[V1_THREAD]`

### GET /v1/search.json
**Deprecated.** Comment search.  At least one of the parameters must be specified.

Parameters:
- `terms=[STR?]` - Search terms
- `author=[STR?]` - Author
- `parent_author=[STR?]` - Parent author
- `page=[INT?]` - 1-based page number (defaults to 1)

Response:
```
{
   "terms": [STR],
   "author": [STR],
   "parent_author": [STR],
   "last_page": [INT],
   "comments": [V1_SEARCH_RESULT*]
}
```

### GET /v1/stories.json
**Deprecated.** Gets the first page of front-page news articles.

Response:
```
[
   {
      "body": [STR], // same as preview
      "comment_count": [INT],
      "date": [V1_DAT],
      "id": [INT],
      "name": [STR],
      "preview": [STR],
      "url": [STR],
      "thread_id": ""
   },
   …
]
```

### GET /v1/stories/`[INT]`.json
**Deprecated.** Gets the full story body.  The number in the URL is the story ID.

Response:
```
{
   "preview": [STR],
   "name": [STR],
   "body": [STR], // html
   "date": [V1_DAT],
   "comment_count": [INT], // not including the root post, so may be 0
   "id": [INT],
   "thread_id": [INT]
}
```

### GET /v1/stories/`[INT]`.`[INT]`.json
**Deprecated.** Same as /v1/stories/`[INT]`.json.  The second number in the URL is ignored.

### POST /v1/messages.json
**Deprecated.** Gets the first page of the user's inbox.  Username and password are passed via HTTP basic authentication.

Response:
```
{
   "user": [STR],
   "messages": [
      {
         "id": [STR], // ID number converted to a string
         "from": [STR],
         "to": [STR],
         "subject": [STR],
         "date": [STR], // freeform date text like "August 1, 2015, 12:03 am"
         "body": [STR],
         "unread": [BIT]
      },
      …
   ]
}
```

Error: (plain text, not JSON)
```
error_get_failed
```

### POST /v1/messages/`[INT]`.json
**Deprecated.** Marks a message as read.  Username and password are passed via HTTP basic authentication.  The number in the URL is the message ID to mark as read.

Response: (plain text, not JSON)
```
ok
```

Error: (plain text, not JSON)
```
error_mark_failed
```

### POST /v1/messages/send/
**Deprecated.** Sends a message.  Username and password are passed via HTTP basic authentication.

Parameters:
- `to=[STR]` - Recipient username
- `subject=[STR]` - Message subject
- `body=[STR]` - Message body

Response: (plain text, not JSON)
```
OK
```

Error: (plain text, not JSON)
```
error_send_failed
```

### POST /v1/post/
**Deprecated.** Posts a comment.  Username and password are passed via HTTP basic authentication.

Parameters:
- `parent_id=[STR]` - Parent ID.  May be 0 or "" to post a root thread.
- `body=[STR]` - Comment text.

Response: (blank)

Errors: (plain text, not JSON)
- `error_login_failed`
- `error_post_rate_limit`
- `error_post_failed`

