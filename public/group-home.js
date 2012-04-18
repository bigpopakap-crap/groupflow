(function ($) {

	$(document).ready(function () {
		//ajax submit the post form
		$('.post-area form').submit(function () {
			$(this).ajaxSubmit({
				success: function (data) {
					//refresh the page
					window.location.reload();
				},
				error: function (data) {
					this.find('.message').text(data.response.error.userMsg);
				},
				neterror: function (data) {
					this.find('.message').text('Oops! something when wrong');
				}
			});
			
			return false; //dont actually send the form
		});
	});

})(jQuery);
