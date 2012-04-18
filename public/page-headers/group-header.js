(function ($) {

	$(document).ready(function() {
		//make the invite toggle button toggle the visibility of the invite input
		$('.group-actions .invite-toggle').click(function() {
			$('.group-actions .invite-area').toggle();
		});
	});

})(jQuery);
