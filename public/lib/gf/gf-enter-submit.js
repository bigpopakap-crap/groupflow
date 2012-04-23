(function ($) {

	$.fn.enterSubmit = function() {
		this.each(function () {
			enterSubmit($(this));
		});		

		return this;
	}

	function enterSubmit(jelem) {
		//catch the enter key, and submit the containing form
		jelem.keypress(function (e) {
			if (e.which == 13) {
				$(this).parents('form').submit();
			}
		});
	}

})(jQuery);
