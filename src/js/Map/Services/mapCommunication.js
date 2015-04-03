'use strict';

angular.module('Map').factory('mapCommunication', [function mapCommunicationFactory() {
  return {
    shutdown: function shutdown() {
      this.shutdownPromise = this.overview.update();
    },
    update: function update() {
      this.overview.update();
    },
    setOverview: function setOverview(overview) {
      this.overview = overview;
    }
  };
}]);