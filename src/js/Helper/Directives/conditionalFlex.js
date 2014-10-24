angular.module('Helper').directive('conditionalFlex', function() {
  return {
    restrict: 'A',
    scope: {
      "conditionalFlex":"="
    },
    link: function(scope, element, attrs) {
      if (scope.conditionalFlex) {
        attrs.$set('flex', true);
      } else if (attrs.flex) {
        attrs.$set('flex', null);
      }
    }
  };
});
