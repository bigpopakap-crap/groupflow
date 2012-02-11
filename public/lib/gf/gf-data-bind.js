(function($) {
        
	var templateClass = 'gf-bind-template';
	var templateSel = '.' + templateClass;
	var dataAttr = 'data-gf-bind';

	$.fn.gfbind = function(arr, onafterattach) {
	    this.each(function() {
            gfbind($(this), arr, onafterattach);
	    });
	    
	    return this;
	}

	function gfbind(jelem, arr, onafterattach) {
	    //don't continue if the array isn't an array
	    if (!$.isArray(arr)) {
            return;
	    }
	    
	    //get the template element
	    var template = jelem.find(templateSel).first();
	    if (!template || template.length == 0) {
            return;
	    }
	    
	    //get the parent of the template and remove the template
	    var root = template.parent();
	    template.remove();
	    
	    //for each element in the array, append a new child
	    for (var i in arr) {
            var elem = gfbindElem(template, arr[i]);
            root.append(elem);
            if (onafterattach) onafterattach(elem);
	    }
	}

	function gfbindElem(template, elem) {
	    //copy the template element
	    var dom = template.clone();
	    
	    //for each child of the template, find if it has a bind
	    //attribute and bind the attributes accordingly
	    dom.find('[' + dataAttr + ']').each(function() {
            //get the JSON of the attributes to be bound
            var map = JSON.parse($(this).attr(dataAttr));
            
            for (var key in map) {
                var value = elem[map[key]];
                if (typeof value == 'undefined') {
                    continue;
                }
                
                //handle special case of innerText
                if (key == 'innerText') $(this).text(value);
                else if (key == 'innerHTML') $(this).html(value);
                else if (key == 'class') $(this).addClass(value);
                else $(this).attr(key, value);
            }
	    });
	    
	    return dom;
	}
        
})(jQuery);
