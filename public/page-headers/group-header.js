(function ($) {

	$(document).ready(function() {
		//make the invite toggle button toggle the visibility of the invite input
		$('.group-actions .invite-toggle').click(function() {
			$('.group-actions .invite-area').toggle();
		});

		$('#invite-area form').submit(function () {
			$(this).ajaxSubmit({
				success: function (data) {
					this.find('.message').text('Invitation sent to ' + data.request.params.username);
				},
				warning: function (data) {
					//invitation was already sent, but just pretend this was successful
					this.find('.message').text('Invitation sent');
				},
				error: function (data) {
					this.find('.message').text(data.response.error.userMsg);
				},
				neterror: function (data) {
					this.find('.message').text('Oops! something when wrong');
				}
			});

			return false; //never actually submit the form
		});
	});

})(jQuery);
