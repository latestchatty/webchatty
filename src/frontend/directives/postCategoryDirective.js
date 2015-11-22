angular.module('chatty').directive('postCategory',
    function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                function add() {
                    var tagClass = scope.$eval('post.tagClass')
                    if (tagClass) {
                        element.addClass(tagClass)
                    }
                }

                function update() {
                    //remove old
                    _.each(['postInformative', 'postNws', 'postFrontpage'], function(c) {
                        element.removeClass(c)
                    })

                    add()
                }

                //initial value
                add()

                //watch for changes
                var postId = scope.$eval('post.id')
                scope.$on('post-category-change-' + postId, update)
            }
        }
    })
