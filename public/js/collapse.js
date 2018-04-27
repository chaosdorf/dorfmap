$(document).ready(function() {
	$('li.header').each(function() {
		children = $('li.child_'+$(this).attr('id'));
		children.each(function() {
			$(this).css('display', 'none');
		});
		$(this).click(function() {
			mychildren = $('li.child_'+$(this).attr('id'));
			$(this).children('.indicator').each(function() {
				if ($(this).hasClass('collapsed-indicator')) {
					$(this).removeClass('collapsed-indicator');
					$(this).addClass('expanded-indicator');
					mychildren.each(function() {
						$(this).css('display', 'block');
					});
				}
				else {
					$(this).removeClass('expanded-indicator');
					$(this).addClass('collapsed-indicator');
					mychildren.each(function() {
						$(this).css('display', 'none');
					});
				}
			});
		});
	});
});
