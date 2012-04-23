(function ($) {

	$(document).ready(function () {
		$('.notification-tile-partial a').click(function () {
			var notid = $(this).parents('.notification-tile-partial').attr('data-notid');

			$.ajax({
				type: 'POST',
				data: { notid: notid },
				url: '/api/notifications/markread',
				success: function(response) {
					//reload the page if it is was the close button
					if ($(this).hasClass('close')) {
						window.location.reload();
					}
				},
				warning: function(response) {
					//TODO handle the error
				},
				error: function(response) {
					//TODO handle the error
				},
				neterror: function(response) {
					//TODO handle the error
				}
			});
		});
	});

})(jQuery);
