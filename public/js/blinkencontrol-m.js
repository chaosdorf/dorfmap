$(document).ready(function() {
	$('.animation, .color').click(function() {
		var elem = $(this);
		$.post('/ajax/blinkencontrol', {
				device: $('ul.blinkencontrol').data('device'),
				raw_string: elem.data('string')
			}, function(data) {
				location.reload(true);
			}
		);
	});
});
