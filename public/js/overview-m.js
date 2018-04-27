$(document).ready(function() {

	function refreshall() {
		$.getJSON('/list/all.json', {}, function(data) {
			$.each(data, function(k, v) {
				if (v["type"] != null) {
					$('#'+k).css('background-image', 'url(/'+v["image"]+')');
				}
			});
		});
	}

	$('.runshortcut').click(function() {
		var link = $(this);
		var text = link.find('span.fakelink span').text();
		$.post('/action', {action: 'shortcut', shortcut: text}, function(data) {
			refreshall();
		});
	});

	$('.toggle').click(function() {
		var link = $(this);
		$.post('/action', {action: 'toggle', device: link.attr('id')}, function(data) {
			refreshall();
		});
	});

	$('.runpreset').click(function() {
		var link = $(this)
		var text = $(link.find('span.fakelink span')[0]).text()
		$.post('/action', {action: 'preset', preset: text}, function(data) {
			refreshall();
		});
	});

	(function imgrefresh() {
		refreshall();
		setTimeout(imgrefresh, 5000);
	})();
});
