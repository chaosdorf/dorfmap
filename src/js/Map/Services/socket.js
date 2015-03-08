angular.module('Map').factory('socket', ['socketFactory', function (socketFactory) {
  return socketFactory({
    ioSocket: io.connect('172.22.26.56:3001')
  });
}]);