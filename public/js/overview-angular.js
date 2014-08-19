function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

(function(){
    var app = angular.module('dorfmap', ['ngMaterial']);

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
            $http.get('/list/all.json').success(
                function(data){
                    Object.keys(data).forEach(function(key) {
                        if (!overview.lamps[key]) {
                            overview.lamps[key]=data[key];
                            overview.lamps[key].blocked=false;
                            overview.lamps[key].animationClass=function() {
                                return overview.lamps[key].blocked ? "pulse" : "";
                            };
                            overview.lamps[key].css=new Object();
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
                            }
                            overview.lamps[key].toggle=function($event) {
                                if (overview.lamps[key].is_writable && overview.lamps[key].rate_delay <= 0 && !overview.lamps[key].blocked) {
                                    if (overview.lamps[key].type=="blinkenlight") {
                                        window.location.href='/blinkencontrol/'+key;
                                        return;
                                    }
                                    if (overview.lamps[key].type=="charwrite") {
                                        var hideDialog = $materialDialog({
                                            templateUrl: '/static/templates/charwrite-template.html',
                                            targetEvent: $event
                                        });
                                        return;
                                    }
                                    overview.lamps[key].blocked=true;
                                    $http.get('/ajax/rate_limit/'+overview.lamps[key].name+'.json').success(function(data) {
                                        if (parseInt(data) > 0 && overview.lamps[key].status===0) {
                                            overview.lamps[key].origStatusText = overview.lamps[key].statusText;
                                            delete overview.lamps[key].css.cursor;
                                            overview.lamps[key].rate_delay=data;
                                            $interval(function() {  
                                                if (--overview.lamps[key].rate_delay == 0)
                                                    overview.lamps[key].css.cursor="pointer";
                                            }, 1000, overview.lamps[key].rate_delay);
                                            overview.lamps[key].blocked=false;
                                            return;
                                        }
                                        $http.get('/toggle/'+key+'?ajax=1').success(function(data){
                                            $http.get('/ajax/statustext/infoarea').success(function(data){
                                                overview.lamps["infoarea"].statusText=$sce.trustAsHtml(data);
                                            });
                                            if (overview.lamps[key].isAuto()) {
                                                $http.get('/get/'+key+".json").success(function(data2){
                                                    overview.lamps[key].status=parseInt(data2.status);
                                                    overview.lamps[key].auto=data2.auto;
                                                    var unsafeStatusText = overview.lamps[key].statusText.toString();
                                                    if (overview.lamps[key].auto==1 && unsafeStatusText.indexOf("(deaktiviert)")!=-1) {
                                                        overview.lamps[key].statusText = $sce.trustAsHtml(unsafeStatusText.replace(" (deaktiviert)",""));
                                                    } else if (overview.lamps[key].auto == 0 && unsafeStatusText.indexOf("(deaktiviert)")==-1) {
                                                        overview.lamps[key].statusText=$sce.trustAsHtml(unsafeStatusText+" (deaktiviert)");
                                                    }
                                                });
                                            }
                                            else {
                                                if (overview.lamps[key].status>=0)
                                                    overview.lamps[key].status=++overview.lamps[key].status%2;
                                                else
                                                    $http.get('/get/'+overview.lamps[key].name+".json").success(function(data2){
                                                        if (!data2.status)
                                                            data2.status=0;
                                                        overview.lamps[key].status=parseInt(data2.status);
                                                        overview.lamps[key].auto=data2.auto;
                                                });
                                            }
                                            overview.lamps[key].blocked=false;
                                        });
                                    });
                                    
                                }
                            }
                            overview.lamps[key].statusClass=function() {
                                if (overview.lamps[key].type!="infoarea" && overview.lamps[key].type!="rtext")
                                    return "popup"

                            };
                            overview.lamps[key].class=function(){
                                if (key==="dorfdoor")
                                    return overview.lamps[key].status === 0 ? "closed" : "open";
                                return overview.lamps[key].type==='rtext'?'rtext':'';
                            };
                        } else {
                            overview.lamps[key].status=data[key].status;
                            overview.lamps[key].type=data[key].type;
                            overview.lamps[key].rate_delay=data[key].rate_delay;
                            overview.lamps[key].statusText=data[key].statusText;
                        }
                        if (typeof(overview.lamps[key].statusText) == "string")
                            overview.lamps[key].statusText=$sce.trustAsHtml(overview.lamps[key].statusText.split(" (rate")[0]);
                        if (overview.lamps[key].is_writable) {
                            if (overview.lamps[key].rate_delay > 0) {
                                $interval(function() {  
                                    if (--overview.lamps[key].rate_delay == 0) {
                                        overview.lamps[key].css.cursor="pointer";
                                    }
                                }, 1000, overview.lamps[key].rat_delay);
                            } else {
                                overview.lamps[key].css.cursor="pointer";
                            }
                        }
                        if (!overview.lamps[key].status)
                            overview.lamps[key].status=0;
                        overview.lamps[key].status=parseInt(overview.lamps[key].status);
                    });
                }
            );
        };
        $scope.$parent.$on('update', overview.update);
        $scope.$emit('update');
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