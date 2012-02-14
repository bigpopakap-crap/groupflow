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
		//fill all non-passwords with their values
		for (var name in param_values) {
			var value = param_values[name];
			var field = jelem.find(':input:not([type=password])[name=' + name + ']');
			field.val(value);
		}

		//put an error next to each field that has one
		for (var name in param_errors) {
			var error = param_errors[name].userMsg;
			var field = jelem.find(':input[name=' + name + ']');
			
			//add error to the parent control group
			var controlGroup = field.parents('.control-group').first();
			controlGroup.addClass('error');

			//add error message to the control group's help-block
			var errorText = controlGroup.find('.gf-validate-field-error');
			errorText.text(errorText.text() + error); //TODO put every error on a new line
		}

		//put generic errors in the form's error block
		var errorText = jelem.find('.gf-validate-generic-error');
		for (var i=0; i<errors.length; i++) {
			errorText.show();
			var error = errors[i];
			errorText.text(errorText.text() + error); //TODO put every error on a new line
		}
	}

})(jQuery);
