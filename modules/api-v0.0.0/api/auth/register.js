/*
	This API domain:
		/api/auth/register, api.auth.register

	REST functions:
		register - registers a new user after validating the inputs
	
	Internal-only functions:
		--

	Directly touches database tables:
		(none)
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_validate = require('../util/api-validate.js');
var users = require('../users.js');
var login = require('./login.js');

//function to configure the app
exports.configure = function(app, url_prefix) {
	url_prefix += '/register';

	//set the handler for registration
	app.post(url_prefix, api_utils.restHandler(this.register));
}

/*
	Validates the registration inputs, ensures uniqueness of ID's,
	then creates the new user

	Cases:
		Success: returns the user object
		Error: returns some form validation error
		Warning: (none)
*/
exports.register = function(req, params, callback) {
	//do synchronous checking of the input params
	var paramErrors = api_validate.validate(params, {
		username: { required: true, minlen: 4, maxlen: 40, isword: true,
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
		firstName: { required: true, maxlen: 60, isname: true, startcapletter: true,
					singlespaces: true, singledashes: true, singledots: true, 
					notrailingwhite: true },
		lastName: { required: true, maxlen: 60, isname: true, startcapletter: true,
					singlespaces: true, singledashes: true, singledots: true, 
					notrailingwhite: true },
		email: { required: true, maxlen: 60, isemail: true }
	});

	//if there were already errors, return them
	if (paramErrors) {
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//check if the user exists already
		users.get(req, params, function(data) {
			if (data.response.error) {
				//some error - just relay it (the params have been correctly passed)
				return callback(data);
			}
			else if (data.response.success) {
				//user exists, return an error
				return callback(api_errors.usernameTaken(req.session.user, params, params.username));
			}
			else if (data.response.warning) {
				//no such user exists, create them, log them in and return them
				users.create(req, params, function(data) {
					if (data.response.error) {
						//relay the error
						return callback(data);
					}
					else if (data.response.success) {
						//log the user in and return the user object
						var user = data.response.success;
						login.setSession(req, user);
						return callback(data);
					}
					else {
						//some weird case - return internal server error and log it
						gen_utils.err_log('weird case: 282fjs0Js02jsaAS');
						return callback(api_errors.internalServer(req.session.user, params));
					}
				});
			}
			else {
				//some weird case - return internal server error and log it
				gen_utils.err_log('weird case: s290fjsa002h2');
				return callback(api_errors.internalServer(req.session.user, params));
			}
		});
	}
}

