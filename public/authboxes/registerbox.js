function registerbox(usernameFieldSel, availButtonSel, availTextSel) {

	$(document).ready(function() {
		var usernameField = $(usernameFieldSel);
		var availButton = $(availButtonSel);
		var availText = $(availTextSel);
	
		availButton.removeClass('disabled');

		availButton.click(function() {
			availText.text('checking...');
			$.ajax({
				type: 'POST',
				url: '/api/auth/register',
				data: { username: usernameField.val() },
				success: function(data) {
					data = JSON.parse(data);
					if (data.response.error && data.response.error.paramErrors.username) {
						availText.text('Invalid username: ' + data.response.error.paramErrors.username.userMsg);
					}
					else { //success
						//now check whether it is available
						$.ajax({
							type: 'GET',
							url: '/api/users/get',
							data: { username: usernameField.val() },
							success: function(data) {
								data = JSON.parse(data);
								if (data.response.success) {
									//there is a user
									availText.text('Username unavailable');
								}
								else if (data.response.warning) {
									//no user
									availText.text('Username is available!');
								}
								else {
									//error checking database
									errorFunction();
								}
							},
							error: errorFunction
						});
					}
				},
				error: errorFunction
			});

			function errorFunction() {
				availText.text('Error checking availability');
			}
		});
	});

}
