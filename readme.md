# WinChatty: The Next Generation
[![npm version](https://badge.fury.io/js/winchatty.svg)](http://badge.fury.io/js/winchatty)

A Node.js implementation of the WinChatty API.  This is a web service providing the backend for a chatty-style web forum.  The following major clients are supported:
- [Latest Chatty](https://itunes.apple.com/us/app/latest-chatty/id287316743?mt=8) (iOS)
- [Shack Browse](https://play.google.com/store/apps/details?id=net.woggle.shackbrowse&hl=en) (Android)
- [Lamp](http://shackwiki.com/wiki/Lamp) (Windows)
- [Latest Chatty 8](https://www.microsoft.com/en-us/store/apps/latest-chatty-8/9wzdncrdklbd) (Windows)
- [NiXXeD/chatty](https://github.com/NiXXeD/chatty) (web)

Read the documentation:
- [WinChatty v2 API](https://github.com/electroly/winchatty-tng/blob/master/doc/winchatty-v2-api.md)
- [WinChatty v1 API](https://github.com/electroly/winchatty-tng/blob/master/doc/winchatty-v1-api.md) (legacy)
- [Code Design](https://github.com/electroly/winchatty-tng/blob/master/doc/code-design.md)

WinChatty improves on the original implementation ([electroly/winchatty-server](https://github.com/electroly/winchatty-server)) in the following ways:

> **Clean separation between data providers and the API.**  Thus the API does not depend on a particular database schema.  Support for additional database engines can be added.

> **Written solely in Node.js.**  The original implementation was a mixture of PHP and Node.js, built organically over the years, with many hidden dependencies.  This is a clean Node.js implementation.

> **Fully documented design.**  This will facilitate community contributions.  Both the APIs and the internal code structures are documented.

> **JSON interface only.**  Support for the XML and AMF interfaces has been dropped.  As a result, the WinChatty desktop client is no longer supported.  This greatly simplifies the API implementation.

The goal is for this codebase to be used to power the Shacknews.com comments in addition to supporting independent installs.  The WinChatty backend combined with the [NiXXeD/chatty](https://github.com/NiXXeD/chatty) frontend form a complete end-to-end forum solution with support for clients on all popular platforms.
