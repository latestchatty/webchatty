# Getting Started

<!-- use "npm run doctoc" to generate this table of contents. --> 
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [For website operators](#for-website-operators)
- [For WebChatty developers](#for-webchatty-developers)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## For website operators
TODO

## For WebChatty developers
You need `git`, `node`, and `npm`.  Node v4 is required, which may be newer than what your operating system's package manager has.  NodeSource.com has up-to-date Ubuntu packages, and for other platforms you can get an installer from Node themselves.

If you are running Ubuntu, the following commands will install these prerequisites.
```
$ curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
$ sudo apt-get install -y git nodejs
```

Verify that `node` is installed correctly by running the following command to print the version number.  The version number should be v4 or higher.
```
$ node --version
v4.2.3
```

Clone the webchatty repository.  (If you want, fork the repository on GitHub first, and then substitute your forked repository below.)
```
$ git clone https://github.com/webchatty/webchatty.git
$ cd webchatty
```

To build WebChatty, invoke `npm`.
```
$ npm install
```

If everything went well, you can run the test server (which uses an in-memory chatty database that isn't persisted between launches) by invoking `npm` again.
```
$ npm start
```

Then navigate to http://127.0.0.1:8080/chatty in your web browser, and you should see a working chatty.  After making code changes, rerun these last two steps to rebuild WebChatty and run the server.

The test server is configured (in `src/backend/runTestServer.ts`) with three test users:

Username | Password | Access level
--- | --- | ---
user | pass | Regular user
mod | pass | Moderator
admin | pass | Administrator

You can use any of these accounts to log in and exercise the chatty for testing purposes.  When you restart the server, everything is reset to a blank slate.
