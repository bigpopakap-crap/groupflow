(function($) {

	var sel = '.notification-num';
	var red_class = 'label-important';

	$(document).ready(function() {
		//get the list of notifications then set the text in all elements
		load();
		window.setInterval(load, 1000); //load the notifications every second
	});

	function load() {
		$.ajax({
			type: 'GET',
			url: '/api/notifications/num',
			success: function(data) {
				data = JSON.parse(data);
				if (typeof data.response.success != 'undefined') {
					var num = data.response.success;

					//set the text and make it red if it is non-zero
					$(sel).text(num);
					if (num > 0) $(sel).addClass(red_class);
				}
			}
		});
	}

})(jQuery);
