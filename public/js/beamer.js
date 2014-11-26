$(function() {
	var
		room,
		socket = io(window.location.protocol+'//'+window.location.host);

	$.fn.autoScale = function() {
		if(!this.data('autoScaleOriginal'))
			this.data('autoScaleOriginal', parseInt(this.css('font-size')));

		var
			maxSize = this.data('autoScaleOriginal');
			maxH = this.parent().innerHeight(),
			thisH = this.css('font-size', maxSize).outerHeight();

		console.log(thisH, maxH);
		while(thisH > maxH && maxSize > 0) {
			thisH = this.css('font-size', --maxSize).outerHeight();
			console.log(maxSize, thisH);
		}

		return this;
	}

	// join & rejoin
	socket.on('connect', function() {
		socket.emit('join', 'Saal 1');
	});

	// display a line
	socket.on('line', function(stamp, line, duration) {
		pushLine(stamp, line, duration);
	});


	// presentation specific
	function pushLine(stamp, line, duration) {
		$('h1').animate({opacity: 0}, 200, function() {
			$(this)
				.text(line)
				.autoScale()
				.animate({opacity: 1}, 200);
		});
	}
});
