(function($) {

	$.fn.gfvalidate = function(param_values, param_errors, errors) {
		param_values = param_values || {};
		param_errors = param_errors || {};
		errors = errors || [];

		this.each(function() {
			gfvalidate($(this), param_values, param_errors, errors);
		});
	}

	function gfvalidate(jelem, param_values, param_errors, errors) {
		alert(JSON.stringify(param_values, null, 3));
		alert(JSON.stringify(param_errors, null, 3));
		alert(JSON.stringify(errors, null, 3));
	}

})(jQuery);
