angular.module('Map').factory('mapCommunication', [function mapCommunicationFactory() {
  return {
    shutdown: function () {
      this.shutdownPromise = this.overview.update();
    },
    update: function () {
      this.overview.update();
    },
    setOverview: function (overview) {
      this.overview = overview;
    }
  };
}]);