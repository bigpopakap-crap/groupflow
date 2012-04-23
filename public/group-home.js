var group_home = (function ($) {
	return function(GROUP_ID, AFTER, INPUT) {

		$(document).ready(function () {
			//set the input if it is should be set
			$('.post-area .post-input').val(INPUT).focus();

			//ajax submit the post form
			$('.post-area form').submit(function () {
				$(this).ajaxSubmit({
					success: function (data) {
						//do nothing, let the refresh loop catch the new post
						$('.post-area .post-input').val('');
						refresh();
					},
					error: function (data) {
						this.find('.message').text(data.response.error.paramErrors.text.userMsg);
					},
					neterror: function (data) {
						this.find('.message').text('Oops! something when wrong');
					}
				});
			
				return false; //dont actually send the form
			});

			//refresh the page every so often to see if there are new posts
			window.setInterval(refresh, 1000);
		});

		function refresh() {
			var ajax_list = $('.post-list-ajax');

			//check if there is anything after the most recent post being displayed
			$.get('/api/groups/posts/list?groupid=' + GROUP_ID + (AFTER ? '&after=' + AFTER : ''), function (data) {
				data = JSON.parse(data);				
				if (data.response.success && data.response.success.length > 0) {
					window.location.replace(
						window.location.pathname + '?groupid=' + GROUP_ID + '&input=' + $('.post-area .post-input').val()
					);
				}
			});
		}

	}
})(jQuery);
