(function ($) {

	/*
		Submits the form by AJAX and calls the associated callback
		The callbacks is an object containing  optional callbacks:

			success: the data returned is in the groupflow api format and is success
			warning: the data returned is in the groupflow api format and is warning
			error: the data returned is in the groupflow api format and is error
			netsuccess: the data returned is the AJAX data from a successful AJAX call
			neterror: the data return is the AJAX data from a failed AJAX call

		- Note that neterror differs from error
		- Note that netsuccess will be called BEFORE success, if both apply
	*/
	$.fn.ajaxSubmit = function(callbacks) {
		callbacks = callbacks || {};

		this.each(function() {
			ajaxSubmit($(this), callbacks);
		});
	}

	function ajaxSubmit(jform, callbacks) {
		$.ajax({
			type: jform.attr('method'),
			data: jform.serializeArray(),
			url: jform.attr('action'),
			success: function(data) {
				data = JSON.parse(data);

				//call the base netsuccess handler
				if (callbacks.netsuccess)
					callbacks.netsuccess.call(jform, data);

				//call the handlers meant for api calls
				if (data.response.success && callbacks.success)
					callbacks.success.call(jform, data);
				else if (data.response.warning && callbacks.warning)
					callbacks.warning.call(jform, data);
				else if (data.response.error && callbacks.error)
					callbacks.error.call(jform, data);
			},
			error: function(data) {
				data = JSON.parse(data);
				if (callbacks.neterror) callbacks.neterror.call(jform, data);
			}
		});
	}

})(jQuery);
