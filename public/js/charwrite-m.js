$(document).ready(function() {
	$('.text').click(function() {
		var elem = $(this);
		$.post('/ajax/charwrite', {
				device: $('ul.charwrite').data('device'),
				text: elem.data('text')
			}, function(data) {
				location.reload(true);
			}
		);
	});
	$('input[type="submit"]').click(function(e) {
		e.preventDefault();
		$.post('/ajax/charwrite', {
				device: $('ul.charwrite').data('device'),
				text: $('input[name="disptext"]').val()
			}, function(data) {
				location.reload(true);
			}
		);
	});
});
