var api_utils = require('./api/util/api-utils.js');
var api_errors = require('./api/util/api-errors.js');

//subdomain modules
var auth = require('./api/auth.js');
var accounts = require('./api/accounts.js');
var users = require('./api/users.js');
var friends = require('./api/friends.js');
var notifications = require('./api/notifications.js');

//function to configure the app
function configure(app) {
	var url_prefix = '/api';	

	//configure each of the domains
	auth.configure(app, url_prefix);
	accounts.configure(app, url_prefix);
	users.configure(app, url_prefix);
	friends.configure(app, url_prefix);
	notifications.configure(app, url_prefix);
	require('./api/devtools.js').configure(app, url_prefix);

	//if the requested path wasn't handled, return a bad-path error
	app.get(url_prefix, api_utils.restHandler(uncaughtApiCall));
	app.post(url_prefix, api_utils.restHandler(uncaughtApiCall));
	app.get(url_prefix + '/*', api_utils.restHandler(uncaughtApiCall));
	app.post(url_prefix + '/*', api_utils.restHandler(uncaughtApiCall));
}
exports.configure = configure;

//returns the error for API calls that went unhandled
function uncaughtApiCall(req, params, callback) {
	return callback(api_errors.noSuchApiPath(req.session.user, params));
}

//subdomains of the api
exports.auth = auth;
exports.accounts = accounts;
exports.users = users;
exports.friends = friends;
exports.notifications = notifications;

