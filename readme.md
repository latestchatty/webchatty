# WebChatty
[![npm version](https://badge.fury.io/js/webchatty.svg)](http://badge.fury.io/js/webchatty)

WebChatty is a web-based forum with a threaded discussion structure inspired by the Shacknews.com comments.  The WebChatty node.js server hosts the chatty web service and the Single Page Application (SPA) frontend.  The web service implements versions 1 and 2 of the existing [WinChatty](https://github.com/electroly/winchatty-server) API and adds additional WebChatty-specific functionality.

WebChatty offers the following major features:

> **Small page load sizes**. The service-based SPA architecture minimizes the amount of redundant HTML transferred to the user.

> **Push technology.** New replies and threads are sent to the browser as soon as they happen.  New replies appear in the browser automatically.  No need to manually refresh the page.

> The **Reflow button** instantly re-sorts the threads to place active posts on top.  

> **Multimedia content embedded in posts**. Raw images, imgur (including gifv and albums), gfycat, youtube, and vimeo content are shown inline.

> **Custom tabs.**  Save a post, author, filter, etc. for later quick filtering. 

> **Cloud synchronization for collapsed threads**. Collapsed threads carry over between browser sessions and between WebChatty desktop and mobile clients.

The following native clients can connect to WebChatty servers:
- [Latest Chatty](https://itunes.apple.com/us/app/latest-chatty/id287316743?mt=8) (iOS)
- [Shack Browse](https://play.google.com/store/apps/details?id=net.woggle.shackbrowse&hl=en) (Android)
- [Lamp](http://shackwiki.com/wiki/Lamp) (Windows)
- [Latest Chatty 8](https://www.microsoft.com/en-us/store/apps/latest-chatty-8/9wzdncrdklbd) (Windows)

Read the documentation:
- [WebChatty API](https://github.com/webchatty/webchatty/blob/master/doc/webchatty-api.md)
- [Server Code Design](https://github.com/webchatty/webchatty/blob/master/doc/code-design.md)
