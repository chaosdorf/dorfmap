angular.module('Map').controller("MapController", ['$http', '$timeout', '$scope', '$materialDialog', 'mapCommunication', function ($http, $timeout, $scope, $materialDialog, mapCommunication) {
  function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
  }

  var map = this;
  map.layer = getURLParameter('layer') || 'control';
  $http.get('/ajax/menu.json').success(function (data) {
    map.menu = data;
    map.menuEntries = {};
    var max = 0;
    data.forEach(function (d, index) {
      map.menuEntries[d.name] = index;
      if (d.entries.length > max) {
        max = d.entries.length;
      }
      if (d.name === 'shortcuts') {
        d.

        function = function (action, hide) {
          $http.post('/action', {
            action: 'shortcut',
            shortcut: action
          }).success(function () {
            var timeout = 0;
            if (action.indexOf('amps') === -1)  {
              timeout = 500;
            }
            if (action === "shutdown") {
              mapCommunication.shutdown();
            }
            else {
              $timeout(function () {
                mapCommunication.update();
              }, timeout);
            }
          });
          hide();
        };
      }
      if (d.name === 'presets') {
        d.

        function = function (action, hide) {
          $http.post('/action', {
            action: 'preset',
            preset: action
          }).success(function () {
            mapCommunication.update();
          });
          hide();
        };
      }
      if (d.name === 'layers') {
        d.

        function = function (layer, hide) {
          map.layer = layer;
          hide();
        };
      }
    });
    data.height = (max) * 24;
    map.menu.dialog = function (key) {
      $materialDialog({
        templateUrl: '/static/Map/Templates/dropdownmenu.html',
        controller: ['$scope', '$hideDialog', function ($scope, $hideDialog) {
          $scope.dropdownData = data;
          $scope.selectedIndex = map.menuEntries[key];
          $scope.hide = $hideDialog;
        }]
      });
    };
    mapCommunication.update();
  });
}]);