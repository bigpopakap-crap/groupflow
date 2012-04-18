(function ($) {

	$(document).ready(function () {
		$('.notification-tile-partial a.close').click(function () {
			var notid = $(this).attr('data-notid');

			$.ajax({
				type: 'POST',
				data: { notid: notid },
				url: '/api/notifications/markread',
				success: function(response) {
					//reload the page
					window.location.reload();
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
