angular.module('Map').factory('socket', function () {
  var primus = new Primus('http://localhost:3001');
  class SocketFactory {
    static on(ident, fn) {
      primus.on(ident, fn);
    }
    
    static send(ident, data) {
      primus.emit(ident, data);
    }
  }
  
  return SocketFactory;
  
});