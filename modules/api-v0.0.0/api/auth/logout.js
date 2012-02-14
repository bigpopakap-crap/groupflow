/*
	This API domain:
		/api/auth/login, api.auth.login

	REST functions:
		logout - attaches the user to the session if they have the right password
	
	Internal-only functions:
		clearSession - (DOESN'T FOLLOW THE NORMAL INPUT/OUTPUT PATTERN)
						clears the user from the request session

	Directly touches database tables:
		(none)
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');

//function to configure the app
exports.configure = function(app, url_prefix) {
	url_prefix += '/logout';	

	//configure logout
	app.get(url_prefix, api_utils.restHandler(this.logout));
}

/*
	Cases:
		success: there was a user, and their session ended
		warning: there was no user to begin with
*/
exports.logout = function(req, params, callback) {
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

function clearSession(req) {
	if (req.session) req.session.destroy();
}
exports.clearSession = clearSession;

