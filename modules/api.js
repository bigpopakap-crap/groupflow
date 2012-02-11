var api_utils = require('./api/util/api-utils.js');
var api_errors = require('./api/util/api-errors.js');

//function to configure the app
exports.configure = function(app) {
	var url_prefix = '/api';	

	//configure each of the domains
	//TODO

	//if the requested path wasn't handled, return a bad-path error
	app.get(url_prefix + '/*', api_utils.restHandler(uncaughtApiCall));
	app.post(url_prefix + '/*', api_utils.restHandler(uncaughtApiCall));
}

function uncaughtApiCall(user, params, callback) {
	callback(api_errors.noSuchApiPath(user, params));
}

//subdomains of the api
//TODO

