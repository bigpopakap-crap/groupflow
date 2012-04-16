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

	//accept a group invitation
	function acceptInvitation(jform, jpartial) {
		jform.ajaxSubmit({
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
		jform.ajaxSubmit({
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
