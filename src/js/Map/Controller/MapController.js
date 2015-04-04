'use strict';

angular.module('Map').controller('MapController', function ($http, $timeout, $scope, $mdDialog, mapCommunication) {
  function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ''])[1].replace(/\+/g, '%20')) || null;
  }

  this.layer = getURLParameter('layer') || 'control';
  $http.get('/ajax/menu.json').success(data => {
    this.menu = data;
    this.menuEntries = {};
    var max = 0;
    data.forEach((d, index) => {
      this.menuEntries[d.name] = index;
      if (d.entries.length > max) {
        max = d.entries.length;
      }
      if (d.name === 'shortcuts') {
        d['function'] = (action) => {
          $http.post('/action', {
            action: 'shortcut',
            shortcut: action
          }).success(function () {
            var timeout = 0;
            if (action.indexOf('amps') === -1) {
              timeout = 500;
            }
            if (action === 'shutdown') {
              mapCommunication.shutdown();
            } else {
              $timeout(function () {
                mapCommunication.update();
              }, timeout);
            }
          });
          $mdDialog.hide();
        };
      }
      if (d.name === 'presets') {
        d['function'] = function (action) {
          $http.post('/action', {
            action: 'preset',
            preset: action
          }).success(function () {
            mapCommunication.update();
          });
          $mdDialog.hide();
        };
      }
      if (d.name === 'layers') {
        d['function'] = layer => {
          this.layer = layer;
          $mdDialog.hide();
        };
      }
    });
    data.height = max * 24;
    this.menu.dialog = key => {
      $mdDialog.show({
        templateUrl: 'Map/Templates/dropdownmenu.html',
        controller: ($scope) => {
          $scope.dropdownData = data;
          $scope.selectedIndex = this.menuEntries[key];
        }
      });
    };
    mapCommunication.update();
  });
});