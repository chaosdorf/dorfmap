$(document).ready(function() {
	$('li.header').each(function() {
		children = $('li.child_'+$(this).attr('id'))
		children.each(function() {
			$(this).css('display', 'none')
		})
		$(this).click(function() {
			children = $('li.child_'+$(this).attr('id'))
			children.each(function() {
				if ($(this).css('display') == 'none') {
					$(this).css('display', 'block')
				}
				else {
					$(this).css('display', 'none')
				}
			})
		})
	})
})
