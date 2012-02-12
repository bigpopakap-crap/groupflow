var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');

//function to configure the app
exports.configure = function(app, url_prefix) {
	url_prefix += '/logout';	

	//configure logout
	//TODO
	console.log('logout at: ' + url_prefix);
}

