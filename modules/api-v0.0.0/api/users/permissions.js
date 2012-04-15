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
var db = require('../../db.js');

function configure(app, url_prefix) {
	url_prefix += '/permissions';

	//configure get function
	api_utils.restHandler(app, 'get', url_prefix + '/get', get);
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
			params: params,
			success: req.session.user_permissions
		}));
	}
	else {
		db.query(
			'select * from UserDevPermissions where username=? limit 1',
			[ req.session.user.username ],
			function (err, results) {
				if (err) {
					//database error
					return callback(api_errors.database(req.session.user, params, err));
				}
				else {
					//convert the numbers to booleans and return the permissions
					var permissions = {
						devtools: ((results[0] && results[0].devtools) ? true : false)
					}

					//cache the value in the session
					req.session.user_permissions = permissions;

					//return them
					return callback(api_utils.wrapResponse({
						params: params,
						success: permissions
					}));
				}
			}
		);
	}
}
exports.get = get;

