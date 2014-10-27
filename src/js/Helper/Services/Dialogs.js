/**
* @ngdoc module
* @name Helper
*/

/**
* @ngdoc service
* @name Dialogs
* @module Helper
* @description
*
* Helper to create some Standard use case Dialogs
*
*/

/**
* @ngdoc method
* @name Dialogs#yesNoDialog
* @description
* Shows a Dialog with a cancel Button and a OK Button
*
* @type {object}
* @type {object}    options
* @param {string}    options.okLabel             Label for the OK Button
* @param {string}    options.closeLabel          Label for the Close Button
* @param {string}    options.template            Template of the Content - Do not use with templateUrl
* @param {string}    options.templateUrl         Link to a Template for the Content - Do not use with template
* @param {string}    options.toolbarClass        Classes for the Toolbar
* @param {string}    options.toolbarTemplate     Template of the Toolbar - Do not use with toolbarTemplateUrl
* @param {string}    options.toolbarTemplateUrl  Link to a Template for the Toolbar - Do not use with toolbarTemplate
*
* @param {function}  okCallback                  Function when OK is pressed
* @param {function}  closeCallback               Function when Cancel is pressed
* @param {function}  cancelCallback              Function when Dialog is canceled (clicked outside of Dialog)
*/

angular.module('Helper').service('Dialogs', ['$mdDialog', '$sce', '$templateCache', function($mdDialog,$sce,$templateCache) {
    var self = this;
    angular.extend(this, {
        multiButtonDialog: function(options, cancelCallback) {
            $mdDialog.show({
                templateUrl: '/static/Helper/Templates/multiButtonDialog.html',
                controller: ['$scope', function($scope) {
                    var opt = {
                        toolbarClass: "md-theme-light",
                        layout: "horizontal",
                        layoutAlign: "end",
                        scopeExtend: {}
                    };

                    angular.extend(opt, options);

                    if (!opt.templateUrl && opt.template) {
                        $templateCache.put('DialogsContent', opt.template);
                        opt.templateUrl = "DialogsContent";
                    }

                    if (!opt.toolbarTemplateUrl && opt.toolbarTemplate) {
                        $templateCache.put('DialogsToolbarContent', opt.toolbarTemplate);
                        opt.toolbarTemplateUrl = "DialogsToolbarContent";
                    }

                    angular.extend($scope, opt.scopeExtend);
                    $scope.init();

                    if(options && opt.toolbarClass.indexOf("md-theme-") === -1) {
                        opt.toolbarClass+=" md-theme-light";
                    }

                    opt.buttons.forEach(function(b, index) {
                        $templateCache.put('b'+index, b.label);
                        b.templateUrl = "b"+index;
                        if (b.flex) {
                            b.class+=" dialogsButtonFlex";
                        }
                        b.callback = function(callback) {
                            return function() {
                                if (b.close) {
                                    $mdDialog.hide(callback);
                                } else {
                                    callback($scope, b, $mdDialog.hide);
                                }
                            };
                        }(b.callback);
                    });


                    angular.extend($scope, {
                        done: function(action) {
                            $mdDialog.hide(action);
                        }
                    });
                    angular.extend($scope, opt);
                }]
            }).then(function(action) {
                if (action !== undefined && action !== null) {
                    action($scope);
                }
            }, function() {
                if (cancelCallback) {
                    cancelCallback($scope);
                }
            });
        },
        yesNoDialog: function(options, okCallback, closeCallback, cancelCallback) {
            var okLabel = "Ok";
            var closeLabel = "Abbrechen";
            var opt = {
                buttons: [
                {
                    template: okLabel,
                    class: "md-theme-green",
                    callback: okCallback,
                    flex: true
                },
                {
                    template: closeLabel,
                    class: "md-theme-red",
                    callback: closeCallback,
                    flex:true
                }]
            };
            angular.extend(opt, options);
            self.multiButtonDialog(opt, cancelCallback);
        }
    });
}]);
