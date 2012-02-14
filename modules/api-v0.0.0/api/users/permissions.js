var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_validate = require('../util/api-validate.js');

exports.configure = function(app, url_prefix) {
	url_prefix += '/permissions';

	//configure get function
	app.get(url_prefix + '/get', api_utils.restHandler(this.get));
}

/*
	Requires authentication

	Cases:
		success: the app-permissions object
		error: no auth

	Notes:
		MAKE SURE THAT THE PERMISSIONS IS A FLAT OBJECT (NO SUB-OBJECTS)
*/
exports.get = function(req, params, callback) {
	if (!req.session.user) {
		//no auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (req.session.user.username == process.env.APP_NAME) {
		//this is the site admin
		return callback(api_utils.wrapResponse({
			success: {
				dev_tools: true
			}
		}));
	}
	else {
		//this is not the site admin
		return callback(api_utils.wrapResponse({
			success: {
				dev_tools: false
			}
		}));
	}
}

