/*
	This API domain:
		/api/auth/login, api.auth.login

	REST functions:
		login - attaches the user to the session if they have the right password
	
	Internal-only functions:
		setSession - (DOESN'T FOLLOW THE NORMAL INPUT/OUTPUT PATTERN)
						attaches the user to the request session

	Directly touches database tables:
		(none)
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_validate = require('../util/api-validate.js');
var users = require('../users.js');

//function to configure the app
exports.configure = function(app, url_prefix) {
	url_prefix += '/login';	

	//configure login
	app.post(url_prefix, api_utils.restHandler(this.login));
}

/*
	Takes a username/password combination

	Cases:
		success: the user object
		error: invalid login or database error
*/
exports.login = function(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		username: { required: true },
		password: { required: true }
	});

	if (paramErrors) {
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//look up the user by username and password
		users.getbypassword(req, params, function(data) {
			if (data.response.error) {
				//relay the error
				return callback(data);
			}
			else if (data.response.warning) {
				//no user: invalid username/password combination
				return callback(api_errors.invalidLogin(req.session.user, params));
			}
			else if (data.response.success) {
				//got the user! woo!
				var user = data.response.success;
				setSession(req, user);
				return callback(api_utils.wrapResponse({
					params: params,
					success: user
				}));
			}
			else {
				//some weird case - return internal server error and log it
				gen_utils.err_log('weird case: 292jjs)Sh2HSHs9292');
				return callback(api_errors.internalServer(req.session.user, params));
			}
		});
	}
}

/* helper to attach the user to the session */
function setSession(req, user) {
	req.session.user = user;
}
exports.setSession = setSession;

