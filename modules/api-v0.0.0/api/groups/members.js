/*
	This API domain:
		/api/groups/members, api.groups.members

	REST functions:
		//TODO
	
	Internal-only functions:
		//TODO

	Directly touches database tables:
		//TODO

	Directly touches session variables:
		//TODO
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_warnings = require('../util/api-warnings.js');
var api_validate = require('../util/api-validate.js');
var db = require('../../db.js');

//subdomain modules
//TODO

function configure(app, url_prefix) {
	url_prefix += '/members';

	//configure subdomains
	//TODO

	//configure this api domain
	//TODO
}
exports.configure = configure;

//export the subdomains
//TODO

