var io = require('socket.io-client');
global.window.io=io;
var angular = require('angular');
require('angular-socket-io');
require('angular-animate');
require('./libs/angular-busy.min.js');
require('./libs/angular-material.js');


function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function rateDelayUpdate(lamp, amount, $interval) {
	lamp.rateDelayActive=true;
	$interval(function() {
		--lamp.rate_delay;
		if (lamp.rate_delay <= 0)
			lamp.rateDelayActive=false;
	},1000,amount);
}

(function(){
	'use strict';
	var app = angular.module('dorfmap', ['ngMaterial', 'cgBusy', 'btford.socket-io']);

	app.factory('socket', ['socketFactory', function (socketFactory) {
	  return socketFactory({
		  ioSocket: io.connect('localhost:3001')
	  });
	}]);

	app.controller("MapController", ['$http', '$timeout', '$scope', function ($http, $timeout, $scope) {
		var map = this;
		map.layer=getURLParameter('layer') || 'control';

		map.menu={};
		map.menu.clicked=function(type) {
			type.hide=true;
		};
		$scope.leave=function(data) {
			$timeout(function() {data.hide=true;},300);
		};
		$http.get('/ajax/menu.json').success(function(data) {
			Object.keys(data).forEach(function(key) {
				map.menu[key]=data[key];
				map.menu[key].hide=true;
				$scope.$emit("update");
			});
			map.menu.shortcuts.function=function(action) {
				map.menu.clicked(map.menu.shortcuts);
				$http.get('/action/'+action).success(function() {
					var timeout = 0;
					if (action.indexOf('amps')===-1)
						timeout=500;
					if (action==="shutdown")
						$scope.$emit('shutdown');
					else
						$timeout(function() {
							$scope.$emit('update');
						}, timeout);
				});
			};
			map.menu.presets.function=function() {
				map.menu.clicked(map.menu.presets);
				$http.get('/presets/apply/'+action).success(function() {
					$scope.$emit('update');
				});
			};
			map.menu.layers.function=function(layer) {
				map.menu.clicked(map.menu.layers);
				map.layer=layer;
			};
		});
	}]);

  app.controller('OverviewController', ['$http','$scope','$sce','$interval','$materialDialog', 'socket', function($http, $scope, $sce, $interval, $materialDialog, socket) {
		var overview = this;
		overview.lamps={};

		socket.on("toggle", function (data) {
      overview.lamps[data.name].update(data);
    });

		this.update=function() {
			var httpGet = $http.get('/list/all.json').success(
				function(data){
					Object.keys(data).forEach(function(key) {
						if (!overview.lamps[key]) {
							overview.lamps[key]=data[key];
							overview.lamps[key].rateDelayActive=false;
							overview.lamps[key].blocked=false;
							overview.lamps[key].canAccess=function() {
								return  overview.lamps[key].is_writable &&
										overview.lamps[key].rate_delay <=0 &&
										!overview.lamps[key].blocked;
							};
              overview.lamps[key].update=function(data) {
                this.status=data.status;
                this.type=data.type;
                this.rate_delay=data.rate_delay;
                this.status_text=data.status_text;
              };
							overview.lamps[key].imageClass=function() { return overview.lamps[key].canAccess() ? "lampimage":""; };
							overview.lamps[key].isAuto=function() {return overview.lamps[key].type==="light_au";};
							overview.lamps[key].image=function() {
								if (key=="dorfdoor") return "/static/dorfdoor.png";
								var statusName=overview.lamps[key].status===1?"on":"off";
								if (key==="hackcenter_blau")
									return "/static/hackcenter_blau_"+statusName+".png";
								if (overview.lamps[key].isAuto()) {
									var autoPrefix=overview.lamps[key].auto===0?"no":"";
									if (overview.lamps[key].status===-1)
										return "/static/light_"+autoPrefix+"auto.png";
									return "/static/light_"+statusName+"_"+autoPrefix+"auto.png";
								}
								if (overview.lamps[key].status===-1)
									return '/static/'+overview.lamps[key].type+".png";
								return '/static/'+overview.lamps[key].type+"_"+statusName+".png";
							};
							overview.lamps[key].style=function(dup) {
								var style={};
								var l = overview.lamps[key];
								if (dup)
									l=dup;
								style.left=l.x1+'px';
								style.top=l.y1+'px';
								if (l.x2!=32)
									style.width=l.x2+'px';
								if (l.y2!=32)
									style.height=l.y2+'px';
								return style;
							};
							overview.lamps[key].statusClass=function() {
								if (overview.lamps[key].type!="infoarea" && overview.lamps[key].type!="rtext")
									return "popup";
							};
							overview.lamps[key].class=function(){
								if (key==="dorfdoor")
									return overview.lamps[key].status === 0 ? "closed" : "open";
								return overview.lamps[key].type==='rtext'?'rtext':'';
							};
							overview.lamps[key].toggle=function($event) {
								if (overview.lamps[key].canAccess()) {
									if (overview.lamps[key].type=="blinkenlight") {
										$materialDialog({
											templateUrl: '/static/templates/blinkencontrol-template.html',
											targetEvent: $event,
											controller: function($scope, $hideDialog, $http) {
												$scope.lamp=overview.lamps[key];
												$scope.loadingPromise=$http.get('ajax/blinkencontrol?device='+key).success(function(data) {
													$scope.animations=data.presets;
													if (data.active)
														$scope.radioGroup=data.active.raw_string;
												});
												$scope.close = function() {
													$hideDialog();
												};
												$scope.save = function() {
													$http.post("/ajax/blinkencontrol", {device:$scope.lamp.name,raw_string:$scope.radioGroup}).success(function() {
														$scope.lamp.status=1;
													});
													$scope.close();
												};
											}
										});
										return;
									}
									if (overview.lamps[key].type=="charwrite") {
										$materialDialog({
											templateUrl: '/static/templates/charwrite-template.html',
											targetEvent: $event,
											controller: ['$scope','$hideDialog','$http', function($scope, $hideDialog, $http) {
												$scope.lamp=overview.lamps[key];
												$scope.loadingPromise=$http.get('/ajax/charwrite').success(function(data) {
													$scope.modes=data;
													$scope.radioGroup="custom";
													if ($scope.modes.map(function(m){return m.name;}).indexOf($scope.lamp.charwrite_text)!=-1)
														$scope.radioGroup=$scope.lamp.charwrite_text;
												});
												$scope.customModes=['date','clock','hosts','power'];
												$scope.close = function() {
													$scope.lamp.newText='';
													$hideDialog();
												};
												$scope.save = function() {
													if ($scope.radioGroup === "custom")
														$scope.radioGroup=$scope.lamp.newText;
													$http.post("/ajax/charwrite", {device:$scope.lamp.name,text:$scope.radioGroup}).success(function() {
														$scope.lamp.charwrite_text=$scope.radioGroup;
													});
													$scope.close();
												};
											}]
										});
										return;
									}
									overview.lamps[key].blocked=true;
									$http.get('/toggle/'+key+'?ajax=1').success(function(data){
                    data.oldStatus=overview.lamps[key].status;
                    data.name=key;
                    socket.emit('toggle',data);
										overview.lamps[key].status=parseInt(data.status);
										overview.lamps[key].auto=data.auto;
										overview.lamps.infoarea.status_text=$sce.trustAsHtml(data.infoarea);
										if (((data.oldStatus === overview.lamps[key].status) || (data.oldStatus==1 && overview.lamps[key].status===0)) && data.rate_delay>0) {
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
								}
							};
						} else {
							overview.lamps[key].update(data[key]);
						}
						if (typeof(overview.lamps[key].status_text) == "string")
							overview.lamps[key].status_text=$sce.trustAsHtml(overview.lamps[key].status_text);

						if (!overview.lamps[key].status)
							overview.lamps[key].status=0;
						else
							overview.lamps[key].status=parseInt(overview.lamps[key].status);
						if (overview.lamps[key].status === 0 && !overview.lamps[key].rateDelayActive && overview.lamps[key].rate_delay > 0) {
							rateDelayUpdate(overview.lamps[key], overview.lamps[key].rate_delay, $interval);
						}
					});
				}
			);
			if (!$scope.map.loadingPromise)
				$scope.map.loadingPromise=httpGet;
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

	app.directive('dropdownmenu', function() {
		return {
			restrict:'E',
			templateUrl:'/static/templates/dropdownmenu-template.html',
			scope: {
				action:"=",
				header:"=",
				data:"="
			}
		};
	});
})();
