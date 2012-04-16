(function ($) {

	var group_invitation_tile_sel = '.group-invitation-tile-partial';
	var ajax_form_sel = '.form-ajax';
	var action_buttons_sel = '.actions .action';
	var accepted_message_sel = '.messages .accepted';
	var rejected_message_sel = '.messages .rejected';
	var ajax_form_action_attr = 'data-gf-ajax-form-action';

	$(document).ready(function() {
		init($(group_invitation_tile_sel));
	});

	//initializes all the forms on the user tile
	function init(jtile) {
		jtile.find(ajax_form_sel).submit(function() {
			var jform = $(this);
			var jpartial = jform.parents(group_invitation_tile_sel); //get the user tile that caused this

			//call the function to handle it based on the action it is performing
			var handler = ({
				'accept-invitation': acceptInvitation,
				'reject-invitation': rejectInvitation
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

	//accept a group invitation
	function acceptInvitation(jform, jpartial) {
		submitForm(jform, {
			success: function(data) {
				jpartial.find(action_buttons_sel).fadeOut(400);
				jpartial.find(accepted_message_sel).delay(400).fadeIn(400);
			},
			error: function(data) {
				//TODO show some sort of error
			}
		});
	}

	//accept a group invitation
	function rejectInvitation(jform, jpartial) {
		submitForm(jform, {
			success: function(data) {
				jpartial.find(action_buttons_sel).fadeOut(400);
				jpartial.find(rejected_message_sel).delay(400).fadeIn(400);
			},
			error: function(data) {
				//TODO show some sort of error
			}
		});
	}

})(jQuery);
