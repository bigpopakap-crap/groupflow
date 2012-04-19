(function ($) {

	$(document).ready(function() {
		$('.blurb-area .edit-toggle').click(function () {
			$('.blurb-area .edit-toggle-target').toggle();
			if ($('.blurb-area .edit-toggle-target input[type=text]').is(':visible')) {
				$('.blurb-area .edit-toggle-target input[type=text]').focus();
			}
		});

		$('.blurb-area .blurb-edit form').submit(function() {
			$(this).ajaxSubmit({
				success: function (data) {
					//refresh the page
					window.location.reload();
				},
				error: function (data) {
					//display the blurb field error
					this.find('.message').text(data.response.error.paramErrors.blurb.userMsg);
				},
				neterror: function (data) {
					this.find('.message').text('Uh oh! Something went wrong')
				}
			});

			return false; //don't actually submit the form
		});
	});

})(jQuery);
