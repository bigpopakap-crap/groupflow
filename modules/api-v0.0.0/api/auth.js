/*
	This API domain:
		/api/auth, api.auth

	REST functions:
		register - registers a new user after validating the inputs
		login - attaches the user to the session if they have the right password
		logout - attaches the user to the session if they have the right password
	
	Internal-only functions:
		setSession - (DOESN'T FOLLOW THE NORMAL INPUT/OUTPUT PATTERN)
						attaches the user to the request session
		clearSession - (DOESN'T FOLLOW THE NORMAL INPUT/OUTPUT PATTERN)
						clears the user from the request session

	Directly touches database tables:
		(none)

	Directly touches session variables:
		req.session.user (read/write)
*/
var bcrypt = require('bcrypt');
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_validate = require('./util/api-validate.js');
var users = require('./users.js');

//subdomain modules
var facebook = require('./auth/facebook.js');

//function to configure the app
function configure(app, url_prefix) {
	url_prefix += '/auth';	

	//configure each of the subdomains
	facebook.configure(app, url_prefix);

	//configure the actions in this domain
	api_utils.restHandler(app, 'post', url_prefix + '/register', register);
	api_utils.restHandler(app, 'post', url_prefix + '/login', login);
	api_utils.restHandler(app, 'get', url_prefix + '/logout', logout);
}
exports.configure = configure;

/*
	Validates the registration inputs, ensures uniqueness of ID's,
	then creates the new user

	Cases:
		Success: returns the user object
		Error: returns some form validation error
		Warning: (none)
*/
function register(req, params, callback) {
	//do synchronous checking of the input params
	var paramErrors = api_validate.validate(params, {
		username: { required: true, minlen: 4, maxlen: 40, isword: true,
					singleunderscores: true, nowhite: true, startletter: true,
					notlike: [
						{ val: 'Groupflow', tol: 4, ignorecase: true },
						{ val: 'You', tol: 1, ignorecase: true }
					] },
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
		//hash the password and make sure its not too long for the database
		params.password = hashPassword(params.password);
		if (params.password.length > 80) {
			gen_utils.err_log('hashed password was too long for the database!');
			return callback(api_errors.internalServer(req.session.user, params));
		}

		//now check if the user exists already
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
						setSession(req, user);
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
exports.register = register;

//helper: salts and hashes a password to safely store it in the db
function hashPassword(password) {
	var salt = bcrypt.gen_salt_sync(10);
	var hash = bcrypt.encrypt_sync(password, salt);
	return hash;
}

/*
	Takes a username/password combination

	Cases:
		success: the user object
		error: invalid login or database error
*/
function login(req, params, callback) {
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
exports.login = login;

/*
	Cases:
		success: there was a user, and their session ended
		warning: there was no user to begin with
*/
function logout(req, params, callback) {
	//no need to check params, just clear the session
	if (req.session.user) {
		//user was auth'd to the session
		clearSession(req);
		return callback(api_utils.wrapResponse({
			params: params,
			success: 'Successfully logged out'
		}));
	}
	else {
		//user wasn't already auth'd
		clearSession(req);
		return callback(api_utils.wrapResponse({
			params: params,
			warning: 'No user was authenticated in the first place'
		}));
	}
}
exports.logout = logout;

/* helper to attach the user to the session */
function setSession(req, user) {
	req.session.user = user;
}
exports.setSession = setSession;

/* helper to detach the user from the session */
function clearSession(req) {
	if (req.session) req.session.destroy();
}
exports.clearSession = clearSession;

//subdomains of the api
exports.facebook = facebook;

