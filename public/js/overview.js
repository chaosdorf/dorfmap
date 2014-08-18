(function(){

	//var app = angular.module('dorfmap');

	app.controller("MapController", function ($http, $scope, $element) {
		var map = this;
		map.action=function(action, element, $element) {
			$http.get('/action/'+action).success(function(data) {
				$scope.$$childHead.overview.update();
			});
		}
	});

	app.controller('OverviewController', function($http, $scope, $sce, $interval) {
		var overview = this;
		overview.lamps={};

		this.update=function() {
			$http.get('/list/all.json').success(
				function(data){
					Object.keys(data).forEach(function(key) {
						if (!overview.lamps[key]) {
							overview.lamps[key]=data[key];
							overview.lamps[key].css=new Object();
							overview.lamps[key].isAuto=function() {return overview.lamps[key].type==="light_au";}
							overview.lamps[key].image=function() {
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
							overview.lamps[key].toggle=function() {
								if (overview.lamps[key].is_writable && overview.lamps[key].rate_delay <= 0) {
									$http.get('/ajax/rate_limit/'+overview.lamps[key].name+'.json').success(function(data) {
										if (parseInt(data) > 0 && overview.lamps[key].status===0) {
											overview.lamps[key].origStatusText = overview.lamps[key].statusText;
											delete overview.lamps[key].css.cursor;
											overview.lamps[key].rate_delay=data;
											$interval(function() {	
												if (--overview.lamps[key].rate_delay == 0)
													overview.lamps[key].css.cursor="pointer";
											}, 1000, overview.lamps[key].rate_delay);
											return;
										}
										$http.get('/toggle/'+key).success(function(data){
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
										});
									});
									
								}
							}
							overview.lamps[key].statusClass=function() {
								if (this.type!="infoarea" && this.type!="rtext")
									return "popup"
							};
							overview.lamps[key].class=function(){
								return this.type==='rtext'?'rtext':'';
							};
						} else {
							overview.lamps[key].status=data[key].status;
							overview.lamps[key].type=data[key].type;
							overview.lamps[key].rate_delay=data[key].rate_delay;
							$http.get('/ajax/statustext/'+key).success(function(data){
								overview.lamps[key].statusText=$sce.trustAsHtml(data.split(" (rate")[0]);
							});
						}
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
		this.update();
		$interval(this.update, 20000);

		this.filteredLamps=function() {
			return Object.keys(overview.lamps).filter(function(k) {return overview.lamps[k].layer===$scope.$parent.map.layer})
			.map(function(key) {return overview.lamps[key]});
		};
	});

	app.directive('lamp', function($sce) {
		return {
			restrict:'E',
			templateUrl:'/templates/lamp-template.html',
			controller: function($scope, $http) {
				$http.get('/ajax/statustext/'+$scope.lamp.name).success(function(data){
					$scope.lamp.statusText=$sce.trustAsHtml(data.split(" (rate")[0]);
				});
			},
		}
	});
})();



/*$(document).ready(function() {
	$('.toggle').each(function() {
		$(this).click(function(e) {
			e.preventDefault();
			parent = $(this).parent()
			$.get('/toggle/'+parent.attr('id'), {}, function(data) {
				$.getJSON("/list/all.json", {}, function(data) {
					$.each(data, function(k, v) {
						$('#img'+k).attr('src', v["image"])
					})
				});
			});
		});
	});
});
/*
(function infotextrefresh() {
	$.ajax({
		url: '/ajax/infoarea',
		success: function(data) {
			$('#infoarea').html(data);
		},
		complete: function() {
			setTimeout(infotextrefresh, 10000);
		}
	});
})();

(function imgrefresh() {
	$.getJSON("/list/all.json", {}, function(data) {
		$.each(data, function(k, v) {
			$('#img'+k).attr('src', v["image"])
		})
	});
	setTimeout(imgrefresh, 5000);
})();
*/