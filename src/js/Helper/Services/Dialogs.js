/**
 * @callback scopeCallback
 * @param {object}   scope          Scope of the Dialog
 * @param {function} scope.nextView Changes view of Dialog to the next one (starts at 0 if views length was exceeded)
 * @param {function} scope.prevView Changes view of Dialog to the previous one (starts at last if first was exceeded)
 * @param {function} scope.toView   Changes to view specified (as 0 based index)
 */


angular.module('Helper').service('Dialogs', function ($materialDialog,$sce,$templateCache) {
  var self = this;
  _.extend(this, {
    /**
     * Creates a Dialog with n Buttons
     * @function Dialogs#multiButtonDialog
     * @param   {object}           options                                      Options for the Dialog
     * @param   {string}           [options.layout=horizontal]                  Layout for the Buttons
     * @param   {string}           [options.layoutAlign=end]                    LayoutAlign for the Buttons
     * @param   {string[]||string} [options.template]                           template for the content.
     *                                                                        If array Template for the views
     * @param   {string[]||string} [options.templateUrl]                        templateUrl for the content. If array templateUrls for the views. overrides options.template
     * @param   {object[]||object} options.toolbar                              toolbar of dialog. If array toolbars for each View. If Toolbar.length < template.length fill toolbars with first one.
     * @param   {string}           [options.toolbar.template]                   template of toolbar.
     * @param   {string}           [options.toolbar.templateUrl]                templateUrl of toolbar. Overrides options.toolbar.template
     * @param   {string}           [options.toolbar.class=material-theme-light] class of the toolbar
     * @param   {object[]}         options.buttons                              Array of buttons to display
     * @param   {string}           [options.buttons.template]                   template of Button
     * @param   {string}           [options.buttons.templateUrl]                templateUrl of button. Overrides options.buttons.template
     * @param   {string}           options.buttons.class                        Class of this button
     * @param   {boolean}          options.buttons.flex                         Should this button have flex attribute in Layout?
     * @param   {boolean}          options.buttons.close                        Should this button auto close the Dialog?
     * @param   {number[]}         [options.buttons.views=[0]]                  Which views should show this button?
     * @param   {function}         options.buttons.callback                     Function to fire when this button gets clicked. If close is false gets scope, button, function to hide dialog as arguments
     * @param   {object}           [options.scopeExtend]                        extends Dialog scope by this Object.
     * @param   {function}         [options.scopeExtend.init]                   get called on dialog creation
     * @param   {scopeCallback}    cancelCallback                               Fired when the button is canceled. (clicked outside of dialog)
     */
    multiButtonDialog: function(options, cancelCallback) {
      $materialDialog.show({
        templateUrl: '/static/Helper/Templates/multiButtonDialog.html',
        controller: ['$scope', function($scope) {
          var opt = {
            defaultToolbarClass: "material-theme-light",
            layout: "horizontal",
            layoutAlign: "end",
            scopeExtend: {},
            views: [],
            viewIndex: 0
          };

          _.extend(opt, options);
          opt.template = !opt.template || _.isArray(opt.template) ? opt.template : [opt.template];
          opt.templateUrl = !opt.templateUrl || _.isArray(opt.templateUrl) ? opt.templateUrl : [opt.templateUrl];
          opt.toolbar = !opt.toolbar || _.isArray(opt.toolbar) ? opt.toolbar : [opt.toolbar];

          if (!opt.templateUrl && opt.template) {
            _.each(opt.template, function(template, index) {
              var view = {buttons:[]};
              $templateCache.put('DialogsContentView'+index, template);
              view.content = 'DialogsContentView'+index;

              if (opt.toolbar.hasOwnProperty(index)) {
                if (!opt.toolbar[index].class) {
                  opt.toolbar[index].class = "";
                }
                if (opt.toolbar[index].class.indexOf("material-theme-")===-1) {
                  opt.toolbar[index].class+=opt.defaultToolbarClass;
                }
                if (opt.toolbar[index].template) {
                  $templateCache.put('DialogsToolbarContent'+index, opt.toolbar[index].template);
                  opt.toolbar[index].templateUrl = "DialogsToolbarContent"+index;
                }
              } else {
                opt.toolbar.push(opt.toolbar[0]);
              }
              view.toolbar = opt.toolbar[index];
              opt.views.push(view);
            });
          }

          _.each(opt.buttons, function(button, index) {
            if (!button.hasOwnProperty('templateUrl') && button.hasOwnProperty('template')) {
              $templateCache.put('DialogsButton'+index, button.template);
              button.templateUrl = 'DialogsButton'+index;
            }
            if (!button.hasOwnProperty('views')) {
              button.views=[0];
            }
            button.callback = function(callback) {
              return function() {
                if (button.close) {
                  $materialDialog.hide(callback);
                } else {
                  callback($scope,button,$materialDialog.hide);
                }
              };
            }(button.callback);
            _.each(button.views, function(viewIndex) {
              opt.views[viewIndex].buttons.push(button);
            });
          });

          $scope.previousViewIndex = 0;
          $scope.$watch('viewIndex', function(newVal, oldVal) {
            $scope.previousViewIndex = oldVal;
          });
          $scope.previousView = function() {
            $scope.viewIndex = ($scope.viewIndex-1) % $scope.views.length;
          };
          $scope.nextView = function() {
            $scope.viewIndex = ($scope.viewIndex+1) % $scope.views.length;
          };
          $scope.toView = function(viewIndex) {
            $scope.viewIndex = viewIndex;
          };

          _.extend($scope, opt.scopeExtend);
          if ($scope.init) {
            $scope.init();
          }

          _.extend($scope, opt);
        }]
      }).then(function(action) {
        if (action !== undefined && action !== null) {
          action();
        }
      }, function() {
        if (cancelCallback) {
          cancelCallback();
        }
      });
    },
    /**
     * Shows simple Dialog with yes and no button
     * @param {Object}   options            Options of Dialog
     * @param {string}   options.closeLabel Label for Close Button
     * @param {string}   options.okLabel    Label for Ok Button
     * @param {function} okCallback         Gets Called when ok is clicked
     * @param {function} closeCallback      Gets Called when close is clicked
     * @param {function} cancelCallback     Gets Called when Dialog is canceled
     */
    yesNoDialog: function(options, okCallback, closeCallback, cancelCallback) {
      var okLabel = "Ok";
      var closeLabel = "Abbrechen";
      var opt = {
        buttons: [ {
          template: options.closeLabel || closeLabel,
          class: "material-theme-red",
          callback: closeCallback,
          flex: true,
          close: true
        }, {
          template: options.okLabel || okLabel,
          class: "material-theme-green",
          callback: okCallback,
          flex: true,
          close: true
        }]
      };
      _.extend(opt, options);
      self.multiButtonDialog(opt, cancelCallback);
    }
  });
});
