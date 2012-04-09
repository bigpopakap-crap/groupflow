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
		var jtile = this;

		if (accepted_states[state]) {
			var allElems = jtile.find('[' + tile_state_attr + ']');
			var inElems = jtile.find('[' + tile_state_attr + '="' + state + '"]');
			var outElems = allElems.not(inElems);

			//fade in/out times
			var fadeOutTime = 800;
			var fadeInTime = 400;

			//fade out and fade in the buttons
			outElems.stop().fadeOut(fadeOutTime);
			inElems.stop().delay(fadeOutTime).fadeIn(fadeInTime);
		}
	}

})(jQuery);
