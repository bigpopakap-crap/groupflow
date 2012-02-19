/*
	This API domain:
		/api/users/permissions, api.users.permissions

	REST functions:
		get - get's the auth'd user's permissions
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		(none)

	Directly touches session variables:
		req.session.user (read)
		req.session.user_permissions (read/write)
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_validate = require('../util/api-validate.js');

function configure(app, url_prefix) {
	url_prefix += '/permissions';

	//configure get function
	app.get(url_prefix + '/get', api_utils.restHandler(get));
}
exports.configure = configure;

/*
	Requires authentication

	Cases:
		success: the app-permissions object
		error: no auth

	Notes:
		MAKE SURE THAT THE PERMISSIONS IS A FLAT OBJECT (NO SUB-OBJECTS)
*/
function get(req, params, callback) {
	if (!req.session.user) {
		//no auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (req.session.user_permissions) {
		//just use the object cached in the session
		return callback(api_utils.wrapResponse({
			success: req.session.user_permissions
		}));
	}
	else if (req.session.user.username == process.env.APP_NAME) {
		//this is the site admin
		var permissions = { devtools: true };
		req.session.user_permissions = permissions; //cache the value in the session
		return callback(api_utils.wrapResponse({ success: permissions }));
	}
	else {
		//this is not the site admin
		var permissions = { devtools: false };
		req.session.user_permissions = permissions; //cache the value in the session
		return callback(api_utils.wrapResponse({ success: permissions }));
	}
}
exports.get = get;

