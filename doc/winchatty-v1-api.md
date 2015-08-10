# WinChatty v1 API

<!-- use "make doctoc" to generate this table of contents. --> 
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Introduction](#introduction)
  - [Data Types](#data-types)
  - [Error Responses](#error-responses)
- [API](#api)
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
This documents the WinChatty v1 API, a legacy web service supporting the [Latest Chatty](https://itunes.apple.com/us/app/latest-chatty/id287316743?mt=8) iOS chatty client.  The WinChatty desktop client uses an AMF-based protocol related to this v1 API.  This AMF protocol and the WinChatty desktop client are deprecated and will not be supported in TNG.  WinChatty will only support the JSON interface documented here.

Don't use this API in new applications.  Use the [WinChatty v2 API](https://github.com/electroly/winchatty-tng/blob/master/doc/winchatty-v2-api.md) instead.

### Data Types
This document uses the same data type notation as the [WinChatty v2 API documentation](https://github.com/electroly/winchatty-tng/blob/master/doc/winchatty-v2-api.md#data-types).

The v1 data structure is hierarchical.  Each comment has a list of its children, and each of its children have lists of their children, and so forth.  The children list is empty for leaf nodes.

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

### Error Responses
Errors are reported using the following JSON structure.

```
{
   "faultCode": "AMFPHP_RUNTIME_ERROR", 
   "faultString": [STR], // error message
   "faultDetail": [STR] // source path and line
}
```

## API
The API is based on REST principles.  All responses are JSON except when noted otherwise.

### GET /v1/about
Gets an HTML page with information about the server.

### GET /v1/index.json
Gets the first page of active threads.  This is the same as /v1/0.1.json.

Response: `[V1_PAGE]`

### GET /v1/`[INT]`.json
Same as /v1/index.json.  The number in the URL is ignored.  Originally this retrieved a particular chatty (like a particular Morning Discussion or Evening Reading) prior to the "rolling" chatty concept.

Response: `[V1_PAGE]`

### GET /v1/`[INT]`.`[INT]`.json
Gets the Nth page of active threads, where N is the second number in the URL.  The first number is ignored.

Response: `[V1_PAGE]`

### GET /v1/thread/`[INT]`.json
Gets a particular thread and its replies.  The number in the URL is the ID of some post in the thread (not necessarily the root post).

Response: `[V1_THREAD]`

### GET /v1/search.json
Comment search.  At least one of the parameters must be specified.

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
Gets the first page of front-page news articles.

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
Gets the full story body.  The number in the URL is the story ID.

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
Same as /v1/stories/`[INT]`.json.  The second number in the URL is ignored.

### POST /v1/messages.json
Gets the first page of the user's Shackmessage inbox.  Username and password are passed via HTTP basic authentication.

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
Marks a message as read.  Username and password are passed via HTTP basic authentication.  The number in the URL is the message ID to mark as read.

Response: (plain text, not JSON)
```
ok
```

Error: (plain text, not JSON)
```
error_mark_failed
```

### POST /v1/messages/send/
Sends a Shackmessage.  Username and password are passed via HTTP basic authentication.

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
Posts a comment.  Username and password are passed via HTTP basic authentication.

Parameters:
- `parent_id=[STR]` - Parent ID.  May be 0 or "" to post a root thread.
- `body=[STR]` - Comment text.

Errors: (plain text, not JSON)
- `error_login_failed`
- `error_post_rate_limit`
- `error_post_failed`

Response: (blank)
