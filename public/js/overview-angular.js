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
    var app = angular.module('dorfmap', ['ngMaterial', 'cgBusy']);

    app.controller("MapController", function ($http, $timeout, $scope) {
        var map = this;
        map.layer=getURLParameter('layer') || 'control';
        map.menu={};
        map.menu.clicked=function (type) {
            type.hide=true;
            $timeout(function() {
                type.hide=false;
            }, 300);
        };
        $http.get('/ajax/menu.json').success(function(data) {
            Object.keys(data).forEach(function(key) {
                map.menu[key]=data[key];
                map.menu[key].hide=false;
                $scope.$root.$broadcast("update");
            });
            map.menu.shortcuts.function=function(action) {
                map.menu.clicked(map.menu.shortcuts);
                $http.get('/action/'+action).success(function() {
                    if (action.indexOf('amps')==-1)
                        $scope.$emit("update");
                    else
                        $timeout(function() {
                            $scope.$emit("update");
                        },500);
                });
            }
            map.menu.shortcuts.style={};
            map.menu.shortcuts.style['margin-left']="-4px";
            map.menu.presets.function=function() {
                map.menu.clicked(map.menu.presets);
            }
            map.menu.layers.function=function(layer) {
                map.menu.clicked(map.menu.layers);
                map.layer=layer;
            }
            map.menu.layers.style={};
            map.menu.layers.style['margin-left']="4px";
        });
    });

    app.controller('OverviewController', function($http, $scope, $sce, $interval, $materialDialog) {
        var overview = this;
        overview.lamps={};

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
                            }
                            overview.lamps[key].imageClass=function() { return overview.lamps[key].canAccess() ? "lampimage":""; };
                            overview.lamps[key].isAuto=function() {return overview.lamps[key].type==="light_au";}
                            overview.lamps[key].image=function() {
                                if (key=="dorfdoor") return "/static/dorfdoor.png";
                                statusName=overview.lamps[key].status===1?"on":"off";
                                if (key==="hackcenter_blau")
                                    return "/static/hackcenter_blau_"+statusName+".png"
                                if (overview.lamps[key].isAuto()) {
                                    autoPrefix=overview.lamps[key].auto==0?"no":"";
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
                                style.left=l.x1;
                                style.top=l.y1;
                                if (l.x2!=32)
                                    style.width=l.x2;
                                if (l.y2!=32)
                                    style.height=l.y2;
                                return style;
                            };
                            overview.lamps[key].statusClass=function() {
                                if (overview.lamps[key].type!="infoarea" && overview.lamps[key].type!="rtext")
                                    return "popup"
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
                                                $scope.loadingPromise=$http.get('/blinkencontrol/'+key+'.json').success(function(data) {
                                                    $scope.color={};
                                                    $scope.color.red=data.red;
                                                    $scope.color.blue=data.blue;
                                                    $scope.color.green=data.green;
                                                    $scope.color.speed=data.speed;
                                                    $scope.color.opmode=data.opmode;
                                                });
                                                $scope.close = function() {
                                                    $hideDialog();
                                                };
                                                $scope.save = function() {
                                                };
                                            }
                                        });
                                        return;
                                    }
                                    if (overview.lamps[key].type=="charwrite") {
                                        $materialDialog({
                                            templateUrl: '/static/templates/charwrite-template.html',
                                            targetEvent: $event,
                                            controller: function($scope, $hideDialog, $http) {
                                                $scope.lamp=overview.lamps[key];
                                                $scope.loadingPromise=$http.get('/charwrite/'+key+'.json').success(function(data) {
                                                    $scope.lamp.text=data.text;
                                                    $scope.radioGroup="custom";
                                                    if ($scope.customModes.indexOf($scope.lamp.text)!=-1)
                                                        $scope.radioGroup=$scope.lamp.text;
                                                });
                                                $scope.customModes=['date','clock','hosts','power'];
                                                $scope.close = function() {
                                                    $hideDialog();
                                                };
                                                $scope.save = function() {
                                                    if ($scope.radioGroup === "custom")
                                                        $scope.radioGroup=$scope.lamp.newText;
                                                    $http.post("/ajax/charwrite", {device:$scope.lamp.name,text:$scope.radioGroup});
                                                    $scope.close();
                                                }
                                            }
                                        });
                                        return;
                                    }
                                    overview.lamps[key].blocked=true;
                                    $http.get('/toggle/'+key+'?ajax=1').success(function(data){
                                        var oldStatus = overview.lamps[key].status;
                                        overview.lamps[key].status=parseInt(data.status);
                                        overview.lamps[key].auto=data.auto;
                                        overview.lamps["infoarea"].statusText=$sce.trustAsHtml(data.infoarea);
                                        if (((oldStatus === overview.lamps[key].status) || (oldStatus==1 && overview.lamps[key].status===0)) && data.rate_delay>0) {
                                            overview.lamps[key].rate_delay=data.rate_delay;
                                            overview.lamps[key].blocked=false;
                                            if (!overview.lamps[key].rateDelayActive) {
                                                rateDelayUpdate(overview.lamps[key],data.rate_delay, $interval);
                                            }
                                            return;
                                        }
                                        if (overview.lamps[key].isAuto()) {
                                            var unsafeStatusText = overview.lamps[key].statusText.toString();
                                            if (overview.lamps[key].auto==1 && unsafeStatusText.indexOf("(deaktiviert)")!=-1) {
                                                overview.lamps[key].statusText = $sce.trustAsHtml(unsafeStatusText.replace(" (deaktiviert)",""));
                                            } else if (overview.lamps[key].auto == 0 && unsafeStatusText.indexOf("(deaktiviert)")==-1) {
                                                overview.lamps[key].statusText=$sce.trustAsHtml(unsafeStatusText+" (deaktiviert)");
                                            }
                                        }
                                        overview.lamps[key].blocked=false;
                                    });
                                }
                            };
                        } else {
                            overview.lamps[key].status=data[key].status;
                            overview.lamps[key].type=data[key].type;
                            overview.lamps[key].rate_delay=data[key].rate_delay;
                            overview.lamps[key].statusText=data[key].statusText;
                        }
                        if (typeof(overview.lamps[key].statusText) == "string")
                            overview.lamps[key].statusText=$sce.trustAsHtml(overview.lamps[key].statusText.split(" (rate")[0]);

                        if (!overview.lamps[key].status)
                            overview.lamps[key].status=0;
                        else
                            overview.lamps[key].status=parseInt(overview.lamps[key].status);
                        if (overview.lamps[key].status === 0 && !overview.lamps[key].rateDelayActive && overview.lamps[key].rate_delay > 0) {
                            rateDelayUpdate(overview.lamps[key], overview.lamps[key].rate_delay, $interval)
                        }
                    });
                }
            );
            if (!$scope.map.loadingPromise)
                $scope.map.loadingPromise=httpGet;
        };
        $scope.$parent.$on('update', overview.update);
        this.update();
        $interval(this.update, 20000);

        this.filteredLamps=function() {
            return Object.keys(overview.lamps).filter(function(k) {return overview.lamps[k].layer===$scope.map.layer})
            .map(function(key) {return overview.lamps[key]});
        };
    });

    app.directive('lamp', function($sce) {
        return {
            restrict:'E',
            templateUrl:'/static/templates/lamp-template.html'
        }
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