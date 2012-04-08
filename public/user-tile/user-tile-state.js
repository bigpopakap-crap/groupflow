(function($) {

	var user_tile_sel = '.user-tile-partial';
	var tile_state_attr = 'data-user-tile-state';
	var tile_username_attr = 'data-username';

	var accepted_states = {
		'': true,
		'is': true,
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

				//get the tile state via AJAX
				var username = jelem.attr(tile_username_attr);
				$.get('/api/friends/state', { username: username }, function (data) {
					data = JSON.parse(data);

					if (data.response.success) {
						jelem.setTileState(data.response.success);
					}
				});
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
