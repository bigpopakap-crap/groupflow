(function($) {

	var user_tile_sel = '.user-tile-partial';
	var tile_state_attr = 'data-user-tile-state';

	var accepted_states = {
		'': true,
		'none': true,
		'incoming': true,
		'outgoing': true,
		'friends': true
	}

	$(document).ready(function() {
		$(user_tile_sel).each(function() {
			var jelem = $(this);
			var init_state = jelem.attr(tile_state_attr);

			if (init_state) {
				jelem.setTileState(init_state);
			}
			else {
				//hide all the fields and figure out the actual tile state via AJAX call
				jelem.setTileState('');
				//TODO get the tile state via AJAX
			}
		});
	});

	//sets the tile state
	$.fn.setTileState = function(state) {
		if (accepted_states[state]) {
			this.find('[' + tile_state_attr + ']').hide();
			this.find('[' + tile_state_attr + '="' + state + '"]').show();
		}
	}

})(jQuery);
