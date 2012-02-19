var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');

//function to configure the app
function configure(app, url_prefix) {
	url_prefix += '/login/facebook';	

	//configure login-by-facebook
	//TODO
	console.log('facebook at: ' + url_prefix);
}
exports.configure = configure;

