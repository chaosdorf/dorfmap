angular.module('Map').controller('OverviewController', ['$http', '$scope', '$interval', '$materialDialog', '$q', '$timeout', 'socket', 'mapCommunication', 'Dialogs', function ($http, $scope, $interval, $materialDialog, $q, $timeout, socket, mapCommunication, Dialogs) {
  function rateDelayUpdate(lamp, amount, $interval) {
    lamp.rateDelayActive = true;
    $interval(function () {
      --lamp.rate_delay;
      if (lamp.rate_delay <= 0) {
        lamp.rateDelayActive = false;
      }
    }, 1000, amount);
  }

  var overview = this;
  this.lamps = {};

  mapCommunication.setOverview(this);

  socket.on('toggle', function (data) {
    this.lamps[data.name].update(data, true);
  }.bind(this));

  //UNCOMMENT THIS TO DISABLE WEBSOCKETS
  //socket.removeAllListeners().destroy();
  this.update = function () {
    var t = $q.defer();
    var httpGet = $http.get('/list/all.json').success(function (data) {
      Object.keys(data).forEach(function (key) {
        if (!overview.lamps[key]) {
          if (typeof(data[key].status_text) === "string") {
            data[key].status_text = data[key].status_text;
          }
          overview.lamps[key] = data[key];
          overview.lamps[key].rateDelayActive = false;
          overview.lamps[key].blocked = false;
          overview.lamps[key].canAccess = function () {
            return this.is_writable && this.rate_delay <= 0 && !this.blocked;
          };
          overview.lamps[key].update = function (data, complete) {
            if (data) {
              this.status = data.status;
              this.type = data.type;
              if (data.status === 0)  {
                this.rate_delay = data.rate_delay;
              }
              if (typeof(data.status_text) === "string") {
                this.status_text = data.status_text;
                if (data.infoarea)  {
                  overview.lamps.infoarea.status_text = data.infoarea;
                }
              }
            }
            if (complete) {
              if (!this.status) {
                this.status = 0;
              }
              else {
                this.status = parseInt(this.status);
              }
              if (this.status === 0 && !this.rateDelayActive && this.rate_delay > 0) {
                rateDelayUpdate(this, this.rate_delay, $interval);
              }
            }
          };
          overview.lamps[key].imageClass = function () {
            return this.canAccess() ? "lampimage" : "";
          };
          overview.lamps[key].isAuto = function () {
            return this.type === "light_au";
          };
          overview.lamps[key].image = function () {
            if (key == "dorfdoor") return "/static/images/dorfdoor.png";
            var statusName = this.status === 1 ? "on" : "off";
            if (key === "hackcenter_blau") return "/static/images/hackcenter_blau_" + statusName + ".png";
            if (this.isAuto()) {
              var autoPrefix = this.auto === 0 ? "no" : "";
              if (this.status === -1) return "/static/images/light_" + autoPrefix + "auto.png";
              return "/static/images/light_" + statusName + "_" + autoPrefix + "auto.png";
            }
            if (this.status === -1) return '/static/images/' + this.type + ".png";
            return '/static/images/' + this.type + "_" + statusName + ".png";
          };
          overview.lamps[key].style = function (dup) {
            var style = {};
            var l = this;
            if (dup) {
              l = dup;
            }
            style.left = l.x1 + 'px';
            style.top = l.y1 + 'px';
            if (l.x2 != 32) {
              style.width = l.x2 + 'px';
            }
            if (l.y2 != 32) {
              style.height = l.y2 + 'px';
            }
            return style;
          };
          overview.lamps[key].statusClass = function () {
            if (this.type != "infoarea" && this.type != "rtext") {
              return "popup";
            }
          };
          overview.lamps[key].class = function () {
            if (key === "dorfdoor") {
              return this.status === 0 ? "closed" : "open";
            }
            return this.type === 'rtext' ? 'rtext' : '';
          };
          overview.lamps[key].toggle = function ($event) {
            if (this.canAccess()) {
              if (this.type == "blinkenlight") {

                var back = function(scope, button, close) {
                  if (!scope.animations.editing) {
                    close();
                  } else {
                    scope.animations.editing = false;
                    scope.title="Animations";
                  }
                };
                var save = function (scope, button, close) {
                  if (!scope.animations.editing) {
                    $http.post("/ajax/blinkencontrol", {
                      device: this.name,
                      raw_string: scope.animations.selected
                    }).success(function (data) {
                      scope.lamp.status = data.status;
                      socket.emit('blinkencontrol', {
                        device: this.name,
                        raw_string: scope.animations.selected,
                        status: data.status
                      });
                    });
                    close();
                  } else {
                    $http.post("/ajax/blinkencontrol", {
                      device: this.name,
                      name: scope.animations.animation,
                      raw_string: scope.animations.newRawString,
                    }).success(function(data) {
                      scope.lamp.status = data.status;
                      scope.animations.editing = false;
                      scope.title="Animations";
                    });
                  }
                }.bind(this);

                Dialogs.multiButtonDialog({
                  toolbarTemplate: "{{title}}",
                  templateUrl: '/static/Map/Templates/blinkencontrol.html',
                  scopeExtend: {
                    init: function() {
                      this.loadingPromise = $http.get('ajax/blinkencontrol?device=' + key).success(function (data) {
                        data.presets = data.presets.map(function(animation) {
                          animation.Edit = function() {
                            this.animations.editing = true;
                            this.title = animation.name;
                            this.animations.newRawString = animation.raw_string;
                            this.animations.animation = animation.name;
                          }.bind(this);
                          return animation;
                        }.bind(this));
                        this.animations = data.presets;
                        this.title = "Animations";
                        if (data.active) {
                          this.animations.selected = data.active.raw_string;
                        }
                        socket.on('blinkencontrol', function (data) {
                          this.animations.selected = data.raw_string;
                          this.lamp.status = data.status;
                        }.bind(this));
                      }.bind(this));
                    }
                  },
                  buttons: [{
                    label: '{{animations.editing ? "Back" : "Cancel"}}',
                    callback: back,
                    close: false
                  }, {
                    label: 'Save',
                    callback: save
                  }]
                });
                return;
              }
              if (this.type == "charwrite") {
                $materialDialog.show({
                  templateUrl: '/static/Map/Templates/charwrite.html',
                  targetEvent: $event,
                  controller: ['$scope', '$http', function ($scope, $http) {
                    $scope.lamp = overview.lamps[key];
                    $scope.loadingPromise = $http.get('/ajax/charwrite').success(function (data) {
                      $scope.modes = data;
                      $scope.radioGroup = "custom";
                      if ($scope.modes.map(function (m) {
                        return m.name;
                      }).indexOf($scope.lamp.charwrite_text) != -1) {
                        $scope.radioGroup = $scope.lamp.charwrite_text;
                      }
                    });
                    $scope.customModes = ['date', 'clock', 'hosts', 'power'];
                    $scope.close = function () {
                      $scope.lamp.newText = '';
                      $materialDialog.hide();
                    };
                    $scope.save = function () {
                      if ($scope.radioGroup === "custom") {
                        $scope.radioGroup = $scope.lamp.newText;
                      }
                      $http.post("/ajax/charwrite", {
                        device: $scope.lamp.name,
                        text: $scope.radioGroup
                      }).success(function () {
                        $scope.lamp.charwrite_text = $scope.radioGroup;
                      });
                      $scope.close();
                    };
                  }]
                });
                return;
              }
              this.blocked = true;
              var oldStatus = this.status;
              $http.post('/action', {
                action: 'toggle',
                device: key
              }).success(function (data) {
                data.name = key;
                data.type = overview.lamps[key].type;
                socket.emit('toggle', data);
                overview.lamps[key].status = parseInt(data.status);
                overview.lamps[key].auto = data.auto;
                overview.lamps.infoarea.status_text = data.infoarea;
                if (((oldStatus === overview.lamps[key].status) || (oldStatus == 1 && overview.lamps[key].status === 0)) && data.rate_delay > 0) {
                  overview.lamps[key].rate_delay = data.rate_delay;
                  overview.lamps[key].blocked = false;
                  if (!overview.lamps[key].rateDelayActive) {
                    rateDelayUpdate(overview.lamps[key], data.rate_delay, $interval);
                  }
                  return;
                }
                if (overview.lamps[key].isAuto()) {
                  var unsafeStatusText = overview.lamps[key].status_text.toString();
                  if (overview.lamps[key].auto == 1 && unsafeStatusText.indexOf("(deaktiviert)") != -1) {
                    overview.lamps[key].status_text = unsafeStatusText.replace(" (deaktiviert)", "");
                  } else if (overview.lamps[key].auto === 0 && unsafeStatusText.indexOf("(deaktiviert)") === -1) {
                    overview.lamps[key].status_text = unsafeStatusText + " (deaktiviert)";
                  }
                }
                overview.lamps[key].blocked = false;
              });
              if (!overview.lamps[key].isAuto()) {
                overview.lamps[key].status = !overview.lamps[key].status;
              }
            }
          };
        } else {
          overview.lamps[key].update(data[key], false);
        }
        overview.lamps[key].update(null, true);
      });
    });
    if (!$scope.map.loadingPromise) {
      $scope.map.loadingPromise = httpGet;
    }
    return httpGet;
  };

  this.filteredLamps = function () {
    return Object.keys(overview.lamps).filter(function (k) {
      return overview.lamps[k].layer === $scope.map.layer;
    }).map(function (key) {
      return overview.lamps[key];
    });
  };
}]);
