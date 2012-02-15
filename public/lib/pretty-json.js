(function($) {

	//make sure JQuery is defined
	if (!$) {
		console.log('pretty-json requires JQuery!');
		return;
	}

	//sets this object as the text of the given elements in a prett format
	$.fn.prettyJson = function(obj, tabnum) {
		if (!obj || typeof obj != 'object') obj = {};

		this.each(function() {
			prettyJson($(this), obj, tabnum);
		});
		return this;
	}

	//pretty-prints the given object in the element
	function prettyJson(jelem, obj, tabnum) {
		//use the requested number of spaces
		var tab = '';
		for (var i=0; i < (tabnum || 6); i++) {
			tab += '&nbsp;'
		}

		//actually put the text in the element
		jelem.html(JSON.stringify(obj, null, '\t')
						.replace(/\n/g, '<br>')
						.replace(/\t/g, tab)
				);
	}

})(jQuery);
