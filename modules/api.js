var api_utils = require('./api/util/api-utils.js');
var api_errors = require('./api/util/api-errors.js');

//subdomain modules
var auth = require('./api/auth.js');
var users = require('./api/users.js');

//function to configure the app
exports.configure = function(app) {
	var url_prefix = '/api';	

	//configure each of the domains
	auth.configure(app, url_prefix);
	users.configure(app, url_prefix);

	//if the requested path wasn't handled, return a bad-path error
	app.get(url_prefix, api_utils.restHandler(uncaughtApiCall));
	app.post(url_prefix, api_utils.restHandler(uncaughtApiCall));
	app.get(url_prefix + '/*', api_utils.restHandler(uncaughtApiCall));
	app.post(url_prefix + '/*', api_utils.restHandler(uncaughtApiCall));
}

function uncaughtApiCall(req, params, callback) {
	return callback(api_errors.noSuchApiPath(req.session.user, params));
}

//subdomains of the api
exports.auth = auth;
exports.users = users;

