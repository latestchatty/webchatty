# WebChatty Server Code Design

<!-- use "npm run doctoc" to generate this table of contents. --> 
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Introduction](#introduction)
- [Modules](#modules)
  - [index.js](#indexjs)
  - [service.js](#servicejs)
- [Data Objects](#data-objects)
  - [ModFlag enum](#modflag-enum)
  - [PostChangeType enum](#postchangetype-enum)
  - [MarkedPostType enum](#markedposttype-enum)
  - [ApiException object](#apiexception-object)
  - [UtcDateTime object](#utcdatetime-object)
  - [UserRegistrationDate object](#userregistrationdate-object)
  - [UserCredentials object](#usercredentials-object)
  - [UserCategoryFilters object](#usercategoryfilters-object)
  - [UserMarkedPost object](#usermarkedpost-object)
  - [Post object](#post-object)
- [Interfaces](#interfaces)
  - [ChattyDb object](#chattydb-object)
  - [LolDb object](#loldb-object)
  - [Service object](#service-object)
- [Data Sources](#data-sources)
  - [MemoryChattyDb object](#memorychattydb-object)
  - [MemoryLolDb object](#memoryloldb-object)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Introduction
This is a reimplementation of the WinChatty v1 and v2 APIs in Node.js.  This implementation separates the API and data access layers so that they can be independently swapped out.  Indeed, several data layer implementations are included, and perhaps in the future someone will rewrite the API layer in TypeScript or ES6.

The codebase is split into three modules:
- wc-data
- wc-data-sources
- wc-app

```
                        +----------------------+                               
                        |                      |                               
                   +----+ winchatty-tng (root) +---------+                     
                   |    |                      |         |                     
                   |    +-----------+----------+         |                     
                   |                |                    |                     
                   |                |                    |                     
                   |                |                    |                     
               +---v----+           |          +---------v-------+             
               |        |           |          |                 |        pg   
express <------+ wc-app |           |          | wc-data-sources +------> mysql
               |        |           |          |                 |        http 
               +---+----+           |          +---------+-------+             
                   |                |                    |                     
                   |                |                    |                     
                   |                |                    |                     
                   |           +----v----+               |                     
                   |           |         |               |                     
                   +-----------> wc-data <---------------+                     
                               |         |                                     
                               +---------+                                     
                                                                               
```

## Modules

### index.js
This is the main Node.js entrypoint.  It performs the following steps to bootstrap the application:
- Read the local settings file.
- Based on those settings, create the appropriate ChattyDb and LolDb.
- Call `service.run()`.

### service.js
This module contains the WinChatty API core engine which drives an Express.js HTTP server.  The engine uses inversion of control to allow the data access functions to be defined by the injected ChattyDb and LolDb objects.

> **service.run(ChattyDb chattyDb, LolDb lolDb, int port) : void**   
> Runs the HTTP server on the specified port.

## Data Objects

### ModFlag enum
Property | Value | Description
--- | --- | ---
`ONTOPIC` | `'ontopic'` | On-topic (default)
`NWS`| `'nws'` | Not work safe
`STUPID` | `'stupid'` | Stupid
`POLITICAL` | `'political'` | Political/religious
`TANGENT` | `'tangent'` | Off-topic/tangent
`INFORMATIVE` | `'informative'` | Informative
`NUKED` | `'nuked'` | Nuked

___
### PostChangeType enum
Property | Value | Description
--- | --- | ---
`NEW_POST` | `'newPost'` | This is a new post.
`CATEGORY_CHANGE` | `'categoryChange'` | This is an existing post whose moderation flag changed.

___
### MarkedPostType enum
Property | Value | Description
--- | --- | ---
`UNMARKED` | `'unmarked'` | Default
`PINNED` | `'pinned'` | Pinned by the user
`COLLAPSED` | `'collapsed'` | Collapsed by the user

___
### ApiException object
Property | Type | Description
--- | --- | ---
`code` | string | Error code starting with 'ERR\_' (e.g. ERR_SERVER, ERR_ARGUMENT)
`message` | string | Error message

___
### UtcDateTime object
Really just a string, but formatted in the precise `DAT` format: "2013-12-01T19:39:00Z".  See the [WebChatty API](https://github.com/webchatty/webchatty/blob/master/doc/webchatty-api.md#data-types) for more information on the `DAT` type.

___
### UserRegistrationDate object
Property | Type | Description
--- | --- | ---
`username` | string | Username
`date` | UtcDateTime | Registration date

___
### UserCredentials object
Property | Type | Description
--- | --- | ---
`username` | string | Username
`password` | string | Password

___
### UserCategoryFilters object
Property | Type | Description
--- | --- | ---
`nws` | bool | Whether to show NWS posts
`stupid` | bool | Whether to show stupid posts
`political` | bool | Whether to show political/religious posts
`tangent` | bool | Whether to show tangent/off-topic posts
`informative` | bool | Whether to show informative posts

___
### UserMarkedPost object
Property | Type | Description
--- | --- | ---
`postId` | int | Marked post ID
`markType` | MarkedPostType | Type of mark

___
### Post object
Property | Type | Description
--- | --- | ---
`id` | int | Post ID.
`threadId` | int | Thread ID. May be the same as `id` if this is the root post.
`parentId` | int | For replies, the ID of the parent post.  For root posts, 0.
`author` | string | Author's username.
`category` | ModFlag | Moderation flag.
`date` | UtcDateTime | Timestamp.
`body` | string | Post body.

## Interfaces

### ChattyDb object
This caller-defined interface provides an abstraction over the chatty database access.  All data access in the engine goes through this interface.  Thus, new backends can be swapped in by reimplementing only these functions.

Property | Type | Description
--- | --- | ---
`attach` | function | Callback function
`getPosts` | function | Callback function
`getPostRange` | function | Callback function
`getThreads` | function | Callback function
`getUserRegistrationDates` | function | Callback function
`search` | function | Callback function
`requestReindex` | function | Callback function
`setPostCategory` | function | Callback function
`getUserCategoryFilters` | function | Callback function
`setUserCategoryFilters` | function | Callback function
`getUserMarkedPosts` | function | Callback function
`setUserMarkedPost` | function | Callback function
`getUserClientData` | function | Callback function
`setUserClientData` | function | Callback function
`verifyUserCredentials` | function | Callback function
`postComment` | function | Callback function

> **attach(Service instance) : Promise<void>**   
> This is called by the engine when it first starts up.  The ChattyDb hangs onto the Service reference which it will use later to notify the engine of post updates.
> `after` is: function(

> **getPosts(int[] postIds) : Promise<Post[]>**   
> Retrieves a set of posts by post ID.  If a post ID does not exist or is nuked, then it is silently omitted from the returned array.

> **getPostRange(int startId, int count, bool reverse) : Promise<Post[]>**   
> Retrieves a set of posts which are contiguous by post ID.  If a post in the range does not exist or is nuked, then it is silently omitted from the returned array.  If `reverse` is true, then the returned posts start at `startId` and walk backwards.

> **getThreads(int[] postIds) : Promise<Post[]>**   
> Gets an unordered list of posts in the threads that contain `postIds`.  Each post ID is not necessarily the root post, but may be any post in the thread.  If any post ID does not exist or is nuked, it is silently omitted from the resulting array.

> **getUserRegistrationDates(string[] usernames) : Promise<UserRegistrationDate[]>**   
> Gets the registration dates of a set of usernames.  If `usernames` is empty, then all registration dates are returned.  Usernames are case insensitive.  If a username is not found or the user has no registration date available, then the user is omitted from the result.

> **search(string terms, string author, string parentAuthor, ModFlag? category, int offset, int limit, bool oldestFirst) : Promise<Post[]>**   
> Searches the comments.  The string arguments may be blank strings.  The category may be a blank string.  Searches are case insensitive.

> **requestReindex(int postId) : Promise<void>**   
>  Instructs the database to reindex a particular post.  If such an operation is not applicable for a particular backend, it can do nothing in response.

> **setPostCategory(UserCredentials credentials, int postId, ModFlag category) : Promise<void>**   
> Instructs the database to moderate a particular post.  The user must be a moderator.  ApiException is thrown if the user is not a moderator.  Usernames are case insensitive.

> **getUserCategoryFilters(string username) : Promise<UserCategoryFilters>**   
> Gets the user's moderation flag filter settings.  Usernames are case insensitive.

> **setUserCategoryFilters(string username, UserCategoryFilters filters) : Promise<void>**   
> Sets the user's moderation flag filter settings.  Usernames are case insensitive.

> **getUserMarkedPosts(string username) : Promise<UserMarkedPost[]>**   
> Gets the most recent N marked posts, where N is decided by the ChattyDb.  Usernames are case insensitive.

> **setUserMarkedPost(string username, int postId, MarkedPostType type) : Promise<void>**   
> Marks or unmarks a post.  If `postId` is -1, then all posts are unmarked.  Usernames are case insensitive.

> **getUserClientData(string username, string client) : Promise<string>**   
> Gets the client data.  Returns "" if there is no client data.  Usernames are case insensitive.

> **setUserClientData(string username, string client, string data) : Promise<void>**   
> Sets the client data.  Usernames are case insensitive.

> **verifyUserCredentials(UserCredentials credentials) : Promise<UserCredentialsStatus>**   
> Verifies the username and password, and checks whether the user is a moderator.  The username is not case sensitive.

> **postComment(UserCredentials credentials, int parentId, string body) : Promise<void>**   
> Posts a new comment.  If parentId is 0, then a new thread is made.  `body` may contain Shacktags.

___
### LolDb object
This caller-defined interface provides an abstraction over the ShackLOL data access.

Property | Type | Description
--- | --- | ---
`attach` | function | Callback function

> **attach(Service instance) : void**   
> This is called by the engine when it first starts up.  The LolDb hangs onto the Service reference which it will use later to notify the engine of LOL updates.

___
### Service object
Property | Type | Description
--- | --- | ---
`app` | express | Express.js app
`chattyDb` | ChattyDb | Chatty data access
`lolDb` | LolDb | ShackLOL data access
`notifyPostChange` | function | Callback function
`notifyLolChange` | function | Callback function

> **notifyPostChange(int postId, PostChangeType type) : void**   
> Called by the ChattyDb to inform the engine that a post has changed, either by being created or by being moderated.  This invites the engine to query the ChattyDb for this post's information and send out an event accordingly.

> **notifyLolChange(int[] postIds) : void**   
> Called by the LolDb to inform the engine that a post has been LOL'd or un-LOL'd.  This invites the engine to query the LolDb for the LOL counts for these posts and send out an event accordingly.

## Data Sources

### MemoryChattyDb object
An in-memory reference implementation of ChattyDb.  There is no persistence.

> **MemoryChattyDb(UserCredentials[] mods, UserCredentials[] users)**   
> Constructor.  The specified users are created.

___
### MemoryLolDb object
An in-memory reference implementation of LolDb.  There is no persistence; the LOL database begins blank at every launch of the server.  Intended for testing purposes only.

> **MemoryLolDb()**   
> Constructor.
