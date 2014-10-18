angular.module('Map').controller("MapController", ['$http', '$timeout', '$scope', '$materialDialog', 'mapCommunication', function ($http, $timeout, $scope, $materialDialog, mapCommunication) {
  function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
  }



  this.layer = getURLParameter('layer') || 'control';
  $http.get('/ajax/menu.json').success(function (data) {
    this.menu = data;
    this.menuEntries = {};
    var max = 0;
    data.forEach(function (d, index) {
      this.menuEntries[d.name] = index;
      if (d.entries.length > max) {
        max = d.entries.length;
      }
      if (d.name === 'shortcuts') {
        d.function = function (action) {
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
          $materialDialog.hide();
        };
      }
      if (d.name === 'presets') {
        d.function = function (action) {
          $http.post('/action', {
            action: 'preset',
            preset: action
          }).success(function () {
            mapCommunication.update();
          });
          $materialDialog.hide();
        };
      }
      if (d.name === 'layers') {
        d.function = function (layer) {
          this.layer = layer;
          $materialDialog.hide();
        }.bind(this);
      }
    }.bind(this));
    data.height = (max) * 24;
    this.menu.dialog = function (key) {
      $materialDialog.show({
        templateUrl: '/static/Map/Templates/dropdownmenu.html',
        controller: ['$scope', function ($scope) {
          $scope.dropdownData = data;
          $scope.selectedIndex = this.menuEntries[key];
        }.bind(this)]
      });
    }.bind(this);
    mapCommunication.update();
  }.bind(this));
}]);
