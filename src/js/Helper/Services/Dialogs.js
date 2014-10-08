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
 * @param {object}    options
 * @param {string}    options.okLabel             Label for the OK Button
 * @param {string}    options.closeLabel          Label for the Close Button
 * @param {string}    options.template            Template of the Content - Do not use with templateUrl
 * @param {string}    options.templateUrl         Link to a Template for the Content - Do not use with template
 * @param {string}    options.toolbarClass        Classes for the Toolbar
 * @param {string}    options.toolbarTemplate     Template of the Toolbar - Do not use with toolbarTemplateUrl
 * @param {string}    options.toolbarTemplateUrl  Link to a Template for the Toolbar - Do not use with toolbarTemplate
 *
 * @param {function}  okCallback                  Function when OK is pressed
 * @param {function}  noCallback                  Function when Cancel is pressed
 * @param {function}  cancelCallback              Function when Dialog is canceled (clicked outside of Dialog)
 */

angular.module('Helper').factory('Dialogs', ['$materialDialog', '$sce', '$templateCache', '$templateRequest', function($materialDialog,$sce,$templateCache,$templateRequest) {
  return {
    yesNoDialog: function(options, okCallback, noCallback, cancelCallback) {
      $materialDialog.show({
        templateUrl: '/static/Helper/Templates/yesNoDialog.html',
        controller: ['$scope', function ($scope) {
          var opt = {
            okLabel: "Ok",
            closeLabel: "Abbrechen",
            toolbarClass: "material-theme-light"
          };
          if(options && options.toolbarClass.indexOf("material-theme-") === -1) {
            options.toolbarClass+=" material-theme-light";
          }

          opt = angular.extend(opt, options);

          if (opt.templateUrl) {
            $templateRequest(opt.templateUrl).then(function() {
              $scope.template = $sce.trustAsHtml($templateCache.get(opt.templateUrl));
            });
          } else if (opt.template) {
            opt.template = $sce.trustAsHtml(opt.template);
          }

          if (opt.toolbarTemplateUrl) {
            $templateRequest(opt.toolbarTemplateUrl).then(function() {
              $scope.toolbarTemplate = $sce.trustAsHtml($templateCache.get(opt.toolbarTemplateUrl));
            });
          } else if (opt.toolbarTemplate) {
            opt.toolbarTemplate = $sce.trustAsHtml(opt.toolbarTemplate);
          }
          angular.extend($scope, {
            done: function(action) {
              $materialDialog.hide(action);
            }
          });
          angular.extend($scope, opt);
        }]
      }).then(function(action) {
        if (action === "ok") {
          okCallback();
        } else if (action === "no") {
          noCallback();
        }
      }, function() {
        cancelCallback();
      });
    }
  };
}]);
