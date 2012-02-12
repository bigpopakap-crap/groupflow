var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_validate = require('../util/api-validate.js');

//function to configure the app
exports.configure = function(app, url_prefix) {
	url_prefix += '/register';	

	//set the handler for registration
	app.post(url_prefix, api_utils.restHandler(this.register));
}

/*
	Validates the registration inputs, ensures uniqueness of ID's,
	then creates the new user

	On success: returns the user object
	On error: returns some form validation error
*/
exports.register = function(user, params, callback) {
	var paramErrors = api_validate.validate(params, {
		'param': {
			required: true,
			minlen: 2,
			maxlen: 12,
			notlike: [{ val: 'Groupflow', tol: 2}]
		}
	});

	//for now, don't wrap in error object
	callback(paramErrors);
}

