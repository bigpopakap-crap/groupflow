(function($) {

	var user_tile_sel = '.user-tile-partial';
	var ajax_form_sel = '.form-ajax';
	var ajax_form_action_attr = 'data-gf-ajax-form-action';

	$(document).ready(function() {
		init($(user_tile_sel));
	});

	//initializes all the forms on the user tile
	function init(jtile) {
		jtile.find(ajax_form_sel).submit(function() {
			var jform = $(this);
			var jpartial = jform.parents(user_tile_sel); //get the user tile that caused this

			//call the function to handle it based on the action it is performing
			var handler = ({
				'accept-request': acceptRequest,
				'reject-request': rejectRequest,
				'create-request': createRequest,
				'cancel-request': cancelRequest
			})[jform.attr(ajax_form_action_attr)];
			handler(jform, jpartial);

			return false; //never actually submit the form
		});
	}

	//submits the form and calls the success or error callbacks
	//callbacks are: success, warning, error, neterror
	function submitForm(jform, callbacks) {
		callbacks = callbacks || {};
		$.ajax({
			type: jform.attr('method'),
			data: jform.serializeArray(),
			url: jform.attr('action'),
			success: function(data) {
				data = JSON.parse(data);

				if (data.response.success && callbacks.success)
					return callbacks.success(data);
				else if (data.response.warning && callbacks.warning)
					return callbacks.warning(data);
				else if (data.response.error && callbacks.error)
					return callbacks.error(data);
			},
			error: function(data) {
				if (callbacks.neterror) callbacks.neterror(JSON.parse(data));
			}
		});
	}

	//accept a friend request
	function acceptRequest(jform, jpartial) {
		submitForm(jform, {
			success: function(data) {
				//do nothing except change the tile state to friends
				jpartial.setTileState('friends');
			},
			error: function(data) {
				//TODO show some sort of error
			}
		});
	}

	//accept a friend request
	function rejectRequest(jform, jpartial) {
		submitForm(jform, {
			success: function(data) {
				//do nothing except change the tile state to none
				jpartial.setTileState('none');
			},
			error: function(data) {
				//TODO show some sort of error
			}
		});
	}

	//accept a friend request
	function createRequest(jform, jpartial) {
		submitForm(jform, {
			success: function(data) {
				//do nothing except change the tile state to outgoing
				jpartial.setTileState('outgoing');
			},
			error: function(data) {
				//TODO show some sort of error
			}
		});
	}

	//cancel a friend request
	function cancelRequest(jform, jpartial) {
		submitForm(jform, {
			success: function(data) {
				//do nothing except change the tile state to none
				jpartial.setTileState('none');
			},
			error: function(data) {
				//TODO show some sort of error
			}
		});
	}

})(jQuery);
