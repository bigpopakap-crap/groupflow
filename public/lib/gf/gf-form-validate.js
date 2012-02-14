(function($) {

	$.fn.gfvalidate = function(values, errors) {
		values = values || {};
		errors = errors || {};

		this.each(function() {
			gfvalidate($(this), values, errors);
		});
	}

	function gfvalidate(jelem, values, errors) {
		alert(JSON.stringify(values, null, 3));
		alert(JSON.stringify(errors, null, 3));
	}

})(jQuery);
