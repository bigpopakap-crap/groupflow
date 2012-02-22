/*
	This API domain:
		/api/accounts, api.accounts

	REST functions:
		supported - gets a list of supported services, or if an account type is
					passed, returns true/false
		linkfacebook - links the user's facebook account so they can log in with it
		unlink - unlinks a given account
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		UsersFacebookId (read/write)

	Directly touches session variables:
		req.session.user_fbid (read/write)
*/
var gen_utils = require('../../gen-utils.js');
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');

function configure(app, url_prefix) {
	url_prefix += '/accounts';

	//configure the actions in this api domain
	app.get(url_prefix + '/supported', api_utils.restHandler(supported));
	app.get(url_prefix + '/linkfacebook', api_utils.restHandler(linkfacebook));
	app.get(url_prefix + '/unlink', api_utils.restHandler(unlink));
}
exports.configure = configure;

/* an array of the supported account ids */
var supported_accounts = [ 'facebook' ];

/*
	Inputs
		account (optional) a string with an account id

	Cases
		sucess - a boolean if the 'account' parameter was provided
				 or an array of supported account type ids
*/
function supported(req, params, callback) {
	var account = req.param('account');
	if (account) {
		//return true iff the array contains that account id
		callback(api_utils.wrapResponse({
			params: params,
			success: gen_utils.arrContains(supported_accounts, account)
		}));
	}
	else {
		//return the array of supported account ids
		callback(api_utils.wrapResponse({
			params: params,
			success: supported_accounts
		}));
	}
}
exports.supported = supported;

/*
	Inputs
		

	Cases
		
*/
function linkfacebook(req, params, callback) {
	//TODO
}
exports.linkfacebook = linkfacebook;

/*
	Inputs
		

	Cases
		
*/
function unlink(req, params, callback) {
	//TODO
}
exports.unlink = unlink;

