angular.module('chatty')
    .service('apiService', function($http) {
        var apiService = {}

        apiService.login = function(username, password) {
            var params = {
                username: username,
                password: password
            }

            return post('../v2/verifyCredentials', params)
        }

        apiService.submitPost = function(username, password, parentId, body) {
            var params = {
                username: username,
                password: password,
                parentId: parentId,
                text: body
            }

            return post('../v2/postComment', params)
        }

        apiService.getNewestEventId = function() {
            return $http.get('../v2/getNewestEventId')
        }

        apiService.getChatty = function() {
            return $http.get('../v2/getChatty')
        }

        apiService.getThread = function(threadId) {
            return $http.get('../v2/getThread?id=' + threadId)
        }

        apiService.waitForEvent = function(lastEventId) {
            return $http.get('../v2/waitForEvent?lastEventId=' + lastEventId)
        }

        apiService.getMarkedPosts = function(username) {
            return $http.get('../v2/clientData/getMarkedPosts?username=' + encodeURIComponent(username))
        }

        apiService.markPost = function(username, postId, markType) {
            var params = {
                username: username,
                postId: postId,
                type: markType
            }
            return post('../v2/clientData/markPost', params)
        }

        apiService.getTotalInboxCount = function(username, password) {
            var opts = {
                username: username,
                password: password
            }

            return post('../v2/getMessageCount', opts)
        }

        apiService.getMessages = function(username, password) {
            var opts = {
                username: username,
                password: password,
                folder: 'inbox',
                page: 1
            }

            return post('../v2/getMessages', opts)
        }

        function post(url, params) {
            var data = _.reduce(params, function(result, value, key) {
                return result + (result.length > 0 ? '&' : '') + key + '=' + encodeURIComponent(value)
            }, '')

            var config = {
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            }

            return $http(config)
        }

        return apiService
    })
