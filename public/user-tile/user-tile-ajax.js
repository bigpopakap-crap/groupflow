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

	//accept a friend request
	function acceptRequest(jform, jpartial) {
		jform.ajaxSubmit({
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
		jform.ajaxSubmit({
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
		jform.ajaxSubmit({
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
		jform.ajaxSubmit({
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
