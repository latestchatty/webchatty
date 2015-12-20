# WebChatty
[![npm version](https://badge.fury.io/js/webchatty.svg)](http://badge.fury.io/js/webchatty)
[![build status](https://travis-ci.org/webchatty/webchatty.svg?branch=master)](https://travis-ci.org/webchatty/webchatty)

WebChatty is a fast-paced web-based forum with a threaded discussion structure.  The Node.js-based WebChatty server 
hosts the chatty web service and the Single Page Application (SPA) frontend.  The web service implements versions 1 and 
2 of the existing [WinChatty](https://github.com/electroly/winchatty-server) API and adds additional WebChatty-specific
functionality.

### Features

- **Small page load sizes**. The service-based SPA architecture minimizes the amount of redundant HTML transferred to 
the user.
- **Push technology.** New replies and threads are sent to the browser as soon as they happen.  New replies appear in 
the browser automatically.  No need to manually refresh the page.
- **Reflow button** instantly re-sorts the threads to place active posts on top.  
- **Multimedia content embedded in posts**. Raw images, imgur (including gifv and albums), gfycat, youtube, and vimeo
content are shown inline.
- **Custom tabs.**  Save a post, author, filter, etc. for later quick filtering. 
- **Cloud synchronization for collapsed threads**. Collapsed threads carry over between browser sessions and between
WebChatty desktop and mobile clients.

### Native Client Support

- iOS: [Latest Chatty](https://itunes.apple.com/us/app/latest-chatty/id287316743?mt=8)
- Android: [Shack Browse](https://play.google.com/store/apps/details?id=net.woggle.shackbrowse&hl=en)
- Windows (Universal): [Latest Chatty 8](https://www.microsoft.com/en-us/store/apps/latest-chatty-8/9wzdncrdklbd)
- Windows (Desktop): [Lamp](http://shackwiki.com/wiki/Lamp)

### Documentation

- [Getting Started](https://github.com/webchatty/webchatty/blob/master/doc/getting-started.md)
- [WebChatty API](https://github.com/webchatty/webchatty/blob/master/doc/webchatty-api.md)
