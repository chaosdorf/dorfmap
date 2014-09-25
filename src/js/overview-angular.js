var io = require('socket.io-client');
global.window.io=io;
var angular = require('angular');
require('angular-socket-io');
require('angular-animate');
require('./libs/bower/angular-busy.js');
require('./libs/bower/angular-material.js');
var konami = require('konami-js');


function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function rateDelayUpdate(lamp, amount, $interval) {
  lamp.rateDelayActive=true;
  $interval(function() {
    --lamp.rate_delay;
    if (lamp.rate_delay <= 0) {
      lamp.rateDelayActive=false;
    }
  },1000,amount);
}

(function(){

  'use strict';
  var app = angular.module('dorfmap', ['ngMaterial', 'cgBusy', 'btford.socket-io']);

  app.factory('socket', ['socketFactory', function (socketFactory) {
    return socketFactory({
      //ioSocket: io.connect('172.22.26.56:3001')
    });
  }]);

  app.controller("MapController", ['$http', '$timeout', '$scope', '$materialDialog', function ($http, $timeout, $scope, $materialDialog) {
    new konami(function(){
      window.location='/static/images/madeby_derf0_and_marudor.jpg';
      $materialDialog({
        template:"<img src='/static/images/madeby_derf0_and_marudor.jpg'/>"
      });
    });

    var map = this;
    map.layer=getURLParameter('layer') || 'control';
    $http.get('/ajax/menu.json').success(function(data) {
      map.menu=data;
      map.menuEntries={};
      var max=0;
      data.forEach(function(d, index) {
        map.menuEntries[d.name]=index;
        if (d.entries.length>max) {
          max=d.entries.length;
        }
        if (d.name === 'shortcuts') {
          d.function=function(action, hide) {
            $http.post('/action', { action:'shortcut',shortcut:action }).success(function() {
              var timeout = 0;
              if (action.indexOf('amps')===-1) {
                timeout=500;
              }
              if (action==="shutdown") {
                $scope.$emit('shutdown');
              }
              else {
                $timeout(function() {
                  $scope.$emit('update');
                }, timeout);
              }
            });
            hide();
          };
        }
        if (d.name==='presets') {
          d.function=function(action, hide) {
            $http.post('/action', {action: 'preset', preset: action}).success(function() {
              $scope.$emit('update');
            });
            hide();
          };
        }
        if (d.name==='layers') {
          d.function=function(layer, hide) {
            map.layer=layer;
            hide();
          };
        }
      });
      data.height=(max)*24;
      map.menu.dialog=function(key) {
        $materialDialog({
          templateUrl: '/static/templates/dropdownmenu-template.html',
          controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
            $scope.dropdownData=data;
            $scope.selectedIndex=map.menuEntries[key];
            $scope.hide = $hideDialog;
          }]
        });
      };
      $scope.$emit('update');
    });
  }]);

  app.controller('OverviewController', ['$http','$scope','$sce','$interval','$materialDialog', '$q', '$timeout', 'socket', function($http, $scope, $sce, $interval, $materialDialog, $q, $timeout, socket) {
    var overview = this;
    overview.lamps={};

    socket.on('toggle',function(data){
      overview.lamps[data.name].update(data, true);
    });

    //UNCOMMENT THIS TO DISABLE WEBSOCKETS
    //socket.removeAllListeners().destroy();

    this.update=function() {
      var httpGet = $http.get('/list/all.json').success(function(data){
        Object.keys(data).forEach(function(key) {
          if (!overview.lamps[key]) {
            if (typeof(data[key].status_text)==="string") {
              data[key].status_text=$sce.trustAsHtml(data[key].status_text);
            }
            overview.lamps[key]=data[key];
            overview.lamps[key].rateDelayActive=false;
            overview.lamps[key].blocked=false;
            overview.lamps[key].canAccess=function() {
              return  this.is_writable &&
              this.rate_delay <=0 &&
              !this.blocked;
            };
            overview.lamps[key].update=function(data, complete) {
              if (data) {
                this.status=data.status;
                this.type=data.type;
                if (data.status===0) {
                  this.rate_delay=data.rate_delay;
                }
                if (typeof(data.status_text) === "string") {
                  this.status_text=$sce.trustAsHtml(data.status_text);
                  if (data.infoarea) {
                    overview.lamps.infoarea.status_text=$sce.trustAsHtml(data.infoarea);
                  }
                }
              }
              if (complete) {
                if (!this.status) {
                  this.status=0;
                }
                else {
                  this.status=parseInt(this.status);
                }
                if (this.status === 0 && !this.rateDelayActive && this.rate_delay > 0) {
                  rateDelayUpdate(this, this.rate_delay, $interval);
                }
              }
            };
            overview.lamps[key].imageClass=function() { return this.canAccess() ? "lampimage":""; };
            overview.lamps[key].isAuto=function() { return this.type==="light_au"; };
            overview.lamps[key].image=function() {
              if (key=="dorfdoor") return "/static/images/dorfdoor.png";
              var statusName=this.status===1?"on":"off";
              if (key==="hackcenter_blau") return "/static/images/hackcenter_blau_"+statusName+".png";
              if (this.isAuto()) {
                var autoPrefix=this.auto===0?"no":"";
                if (this.status===-1) return "/static/images/light_"+autoPrefix+"auto.png";
                return "/static/images/light_"+statusName+"_"+autoPrefix+"auto.png";
              }
              if (this.status===-1) return '/static/images/'+this.type+".png";
              return '/static/images/'+this.type+"_"+statusName+".png";
            };
            overview.lamps[key].style=function(dup) {
              var style={};
              var l = this;
              if (dup) {
                l=dup;
              }
              style.left=l.x1+'px';
              style.top=l.y1+'px';
              if (l.x2!=32) {
                style.width=l.x2+'px';
              }
              if (l.y2!=32) {
                style.height=l.y2+'px';
              }
              return style;
            };
            overview.lamps[key].statusClass=function() {
              if (this.type!="infoarea" && this.type!="rtext") {
                return "popup";
              }
            };
            overview.lamps[key].class=function(){
              if (key==="dorfdoor") {
                return this.status === 0 ? "closed" : "open";
              }
              return this.type==='rtext'?'rtext':'';
            };
            overview.lamps[key].toggle=function($event) {
              if (this.canAccess()) {
                if (this.type=="blinkenlight") {
                  $materialDialog({
                    templateUrl: '/static/templates/blinkencontrol-template.html',
                    targetEvent: $event,
                    controller: function($scope, $hideDialog, $http) {
                      $scope.lamp=overview.lamps[key];
                      $scope.loadingPromise=$http.get('ajax/blinkencontrol?device='+key).success(function(data) {
                        $scope.animations=data.presets;
                        if (data.active) {
                          $scope.animations.selected=data.active.raw_string;
                        }
                        socket.on('blinkencontrol', function(data) {
                          $scope.animations.selected=data.raw_string;
                          $scope.lamp.status=data.status;
                        });
                      });
                      $scope.close = function() {
                        $hideDialog();
                      };
                      $scope.save = function() {
                        $http.post("/ajax/blinkencontrol", {device:$scope.lamp.name,raw_string:$scope.animations.selected}).success(function(data) {
                          $scope.lamp.status=data.status;
                          socket.emit('blinkencontrol', {device:$scope.lamp.name,raw_string:$scope.animations.selected,status:data.status});
                        });
                        $scope.close();
                      };
                    }
                  });
                  return;
                }
                if (this.type=="charwrite") {
                  $materialDialog({
                    templateUrl: '/static/templates/charwrite-template.html',
                    targetEvent: $event,
                    controller: ['$scope','$hideDialog','$http', function($scope, $hideDialog, $http) {
                      $scope.lamp=overview.lamps[key];
                      $scope.loadingPromise=$http.get('/ajax/charwrite').success(function(data) {
                        $scope.modes=data;
                        $scope.radioGroup="custom";
                        if ($scope.modes.map(function(m){return m.name;}).indexOf($scope.lamp.charwrite_text)!=-1) {
                          $scope.radioGroup=$scope.lamp.charwrite_text;
                        }
                      });
                      $scope.customModes=['date','clock','hosts','power'];
                      $scope.close = function() {
                        $scope.lamp.newText='';
                        $hideDialog();
                      };
                      $scope.save = function() {
                        if ($scope.radioGroup === "custom") {
                          $scope.radioGroup=$scope.lamp.newText;
                        }
                        $http.post("/ajax/charwrite", {device:$scope.lamp.name,text:$scope.radioGroup}).success(function() {
                          $scope.lamp.charwrite_text=$scope.radioGroup;
                        });
                        $scope.close();
                      };
                    }]
                  });
                  return;
                }
                this.blocked=true;
                var oldStatus = this.status;
                $http.post('/action', {action:'toggle',device:key}).success(function(data){
                  data.name=key;
                  data.type=overview.lamps[key].type;
                  socket.emit('toggle', data);
                  overview.lamps[key].status=parseInt(data.status);
                  overview.lamps[key].auto=data.auto;
                  overview.lamps.infoarea.status_text=$sce.trustAsHtml(data.infoarea);
                  if (((oldStatus === overview.lamps[key].status) || (oldStatus==1 && overview.lamps[key].status===0)) && data.rate_delay>0) {
                    overview.lamps[key].rate_delay=data.rate_delay;
                    overview.lamps[key].blocked=false;
                    if (!overview.lamps[key].rateDelayActive) {
                      rateDelayUpdate(overview.lamps[key],data.rate_delay, $interval);
                    }
                    return;
                  }
                  if (overview.lamps[key].isAuto()) {
                    var unsafeStatusText = overview.lamps[key].status_text.toString();
                    if (overview.lamps[key].auto==1 && unsafeStatusText.indexOf("(deaktiviert)")!=-1) {
                      overview.lamps[key].status_text = $sce.trustAsHtml(unsafeStatusText.replace(" (deaktiviert)",""));
                    } else if (overview.lamps[key].auto === 0 && unsafeStatusText.indexOf("(deaktiviert)")===-1) {
                      overview.lamps[key].status_text=$sce.trustAsHtml(unsafeStatusText+" (deaktiviert)");
                    }
                  }
                  overview.lamps[key].blocked=false;
                });
                if (!overview.lamps[key].isAuto()) {
                  overview.lamps[key].status=!overview.lamps[key].status;
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
        $scope.map.loadingPromise=httpGet;
      }
      return httpGet;
    };
    $scope.$parent.$on('shutdown', function() { $scope.$parent.shutdownPromise = overview.update();});
    $scope.$parent.$on('update', overview.update);

    this.filteredLamps=function() {
      return Object.keys(overview.lamps).filter(function(k) {return overview.lamps[k].layer===$scope.map.layer;})
      .map(function(key) {return overview.lamps[key];});
    };
  }]);

  app.directive('lamp', function() {
    return {
      restrict:'E',
      templateUrl:'/static/templates/lamp-template.html'
    };
  });
})();
