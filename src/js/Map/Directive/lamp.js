'use strict';

angular.module('Map').directive('lamp', function () {
  return {
    restrict: 'E',
    templateUrl: '/static/Map/Templates/lamp.html',
    link: function link(scope, element) {
      scope.element = element;
    },
    controller: ['$scope', function ($scope) {
      $scope.$watch('lamp.status_text', function (newval) {
        if (newval) {
          if ($scope.lamp.type === 'infoarea') {
            $scope.element.children().html(newval);
            return;
          }
          if ($scope.rate_delay > 0) {
            $scope.lamp.tooltipText = $scope.lamp.status_text + ' (rate limited - wait ' + newval + ' seconds)';
          } else {
            if ($scope.lamp.status_text) {
              $scope.lamp.tooltipText = $scope.lamp.status_text;
            }
          }
        }
      });
      $scope.$watch('lamp.rate_delay', function (newval) {
        if (newval > 0) {
          $scope.lamp.tooltipText = $scope.lamp.status_text + ' (rate limited - wait ' + newval + ' seconds)';
        } else {
          if ($scope.lamp.status_text) {
            $scope.lamp.tooltipText = $scope.lamp.status_text;
          }
        }
      });
    }]
  };
});