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
exports.register = function(req, params, callback) {
	//do synchronous checking of the input params
	var paramErrors = api_validate.validate(params, {
		userid: { required: true, minlen: 4, maxlen: 40, isword: true,
					singleunderscores: true, nowhite: true, startletter: true,
					notlike: [{ val: 'Groupflow', tol: 4, ignorecase: true }] },
		password: { required: true, minlen: 6, maxlen: 30, nowhite: true },
		password2: { required: true, custom: function(val, params) {
						if (val !== params.password)
							return {
								devMsg: 'Passwords do not match',
								userMsg: 'Passwords do not match'
							};
						else return null;
					}},
		first_name: { required: true, maxlen: 60, isname: true, startcapletter: true,
					singlespaces: true, singledashes: true, singledots: true, 
					notrailingwhite: true },
		last_name: { required: true, maxlen: 60, isname: true, startcapletter: true,
					singlespaces: true, singledashes: true, singledots: true, 
					notrailingwhite: true },
		email: { required: true, maxlen: 60, isemail: true }
	});

	//if there were already errors, return them
	if (paramErrors) {
		return callback(api_errors.badFormParams(req.user, params, paramErrors);
	}
	else {
		//TODO check if the user exists already
		return callback(api_errors.userIdTaken(req.user, params));

		//TODO create the user

		//TODO log in with the user

		//TODO return the user
	}
}

