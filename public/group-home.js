var group_home = (function ($) {
	return function(GROUP_ID, AFTER, INPUT) {

		$(document).ready(function () {
			//initialize the text counter
			$('.post-area .counter').textCounter({
				target: '.post-area .post-input',
				count: 240
			});

			//make the text area submit on enter key
			$('.post-area .post-input').enterSubmit();

			//set the input if it is should be set
			$('.post-area .post-input').val(INPUT).keyup().focus();

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
					var inputString = $('.post-area .post-input').val();
					var inputParam = inputString ? '&input=' + inputString : '';

					window.location.replace(
						window.location.pathname + '?groupid=' + GROUP_ID + inputParam
					);
				}
			});
		}

	}
})(jQuery);
