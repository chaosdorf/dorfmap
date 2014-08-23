$(document).ready(function() {
	$('.toggle').each(function() {
		$(this).click(function(e) {
			e.preventDefault()
			link = $(this)
			$.get('/toggle/'+link.attr('id'), {m: 1}, function(data) {
				$.getJSON("/list/all.json", {}, function(data) {
					$.each(data, function(k, v) {
						if (v["type"] != null) {
							$('#'+k).css('background-image', 'url(/'+v["image"]+')')
						}
					});
				});
			});
		});
	});

	(function imgrefresh() {
		$.getJSON("/list/all.json", {}, function(data) {
			$.each(data, function(k, v) {
				if (v["type"] != null) {
					$('#'+k).css('background-image', 'url(/'+v["image"]+')')
				}
			});
		});
		setTimeout(imgrefresh, 5000);
	})();
});
