(function($) {

	//make sure JQuery is defined
	if (!$) {
		console.log('gf-data-bind requires JQuery!');
		return;
	}

	//classes and attributes that the HTML elements must have        
	var templateClass = 'gf-bind-template';
	var templateSel = '.' + templateClass;
	var dataAttr = 'data-gf-bind';
	var gfBindDataKey = 'gf-bind-data-key';

	//gets the template element and removes it
	$.fn.gfbind_init = function() {
		this.each(function() {
			init($(this));
		});
		return this;
	}

	/* takes an array and appends them to the end
		(they will appear in they order they are in the array)
		if the input is an object, it will be treated as a singleton array
	*/
	$.fn.gfbind_append = function(arr) {
		//revert to defaults with the input
		arr = validateInputArray(arr);

		this.each(function() {
			append($(this), arr);
		});
		return this;
	}

	/* takes an array and prepends them to the beginning
		(they will appear in the OPPOSITE order that they are in the array)
		if the input is an object, it will be treated as a singleton array
	*/
	$.fn.gfbind_prepend = function(arr) {
		//revert to defaults with the input
		arr = validateInputArray(arr);

		this.each(function() {
			prepend($(this), arr);
		});
		return this;
	}

	//makes sure the input is an array
	function validateInputArray(arr) {
		if (!arr) return [];
		else if (isArray(arr)) return arr;
		else if (typeof arr == 'object') return [arr];
		else return [];
	}
	function isArray(arr) {
		//TODO improve this solution
		return ((typeof arr.length != 'undefined') &&
				(typeof arr.length != 'null') &&
				(arr.length !== null));
	}

	//does the initialization of bfbind on a particular element
	function init(jelem) {
		 //get the template element and make sure it exists
	    var template = jelem.find(templateSel).first();
	    if (!template || template.length == 0) {
            return;
	    }
	    
	    //get the parent of the template and remove the template
	    var root = template.parent();
		if (!root || root.length == 0) {
            return;
	    }

		//remove the template element
		//and add the template and the root to the data for the element
	    template.remove();
		jelem.data(gfBindDataKey, {
			init: true,
			template: template,
			root: root
		});
	}

	//does the append of an array on a particular element
	function append(jelem, arr) {
		var data = jelem.data(gfBindDataKey);
		if (!data.init) return; //wasn't initialized

		for (var i=0; i < arr.length; i++) {
			var newElem = bindElem(data.template, arr[i]);
			root.append(newElem);
		}
	}

	//does the prepend of an array on a particular element
	function prepend(jelem, arr) {
		var data = jelem.data(gfBindDataKey);
		if (!data.init) return; //wasn't initialized

		for (var i=arr.length - 1; i >= 0; i--) {
			var newElem = bindElem(data.template, arr[i]);
			data.root.prepend(newElem);
		}
	}

	//binds the data in obj to the template element and returns the bound element
	function bindElem(template, obj) {
		var dom = template.clone();

		//for each child of the template, find if it has a bind
	    //attribute and bind the attributes accordingly
		dom.find('[' + dataAttr + ']').each(function() {
			//get the JSON of the attributes to be bound
			var map = JSON.parse($(this).attr(dataAttr));

			for (var key in map) {
				var value = obj[map[key]];
				if (typeof value == 'undefined')
					continue;

				//bind the data, handle special cases
				if (key == 'innerText') $(this).text(value);
				else if (key == 'innerHTML') $(this).html(value);
				else if (key == 'class') $(this).addClass(value);
				else $(this).attr(key, value);
			}
		});

		return dom;
	}
        
})(jQuery);
