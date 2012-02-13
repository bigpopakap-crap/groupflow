var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_validate = require('./util/api-validate.js');

//subdomain modules
var blurb = require('./users/blurb.js');
var permissions = require('./users/permissions.js');

//function to configure the app
exports.configure = function(app, url_prefix) {
	url_prefix += '/users';	

	//configure each of the domains
	blurb.configure(app, url_prefix);
	permissions.configure(app, url_prefix);
	
	//configure this api domain
	//TODO
}

/*
	Gets the user object by their username
*/
//TODO

//subdomains of the api
exports.blurb = blurb;
exports.permissions = permissions;

