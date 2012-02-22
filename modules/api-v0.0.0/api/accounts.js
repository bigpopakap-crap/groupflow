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
var base64url = require('b64url');
var crypto = require('crypto');
var gen_utils = require('../../gen-utils.js');
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');

function configure(app, url_prefix) {
	url_prefix += '/accounts';

	//configure the actions in this api domain
	app.get(url_prefix + '/supported', api_utils.restHandler(supported));
	app.post(url_prefix + '/linkfacebook', api_utils.restHandler(linkfacebook));
	app.post(url_prefix + '/unlink', api_utils.restHandler(unlink));
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
		return callback(api_utils.wrapResponse({
			params: params,
			success: gen_utils.arrContains(supported_accounts, account)
		}));
	}
	else {
		//return the array of supported account ids
		return callback(api_utils.wrapResponse({
			params: params,
			success: supported_accounts
		}));
	}
}
exports.supported = supported;

/*
	Inputs
		The signed request from facebook

	Cases
		error - database error, or account already linked
		success - true
*/
function linkfacebook(req, params, callback) {
	//error when something is wrong with the signed request
	function sr_error(callback) {
		return callback(api_errors.badInputParams(req.session.user, params, {
			signed_req: {
				devMsg: 'Something was wrong with the signed_request',
				userMsg: 'The value of this field is corrupted'
			}
		}));
	}

	//make sure there's and auth'd user
	var user = req.session.user;
	if (!user) {
		return callback(api_errors.noAuth(req.session.user, params));
	}

	//check that the signed request parameter is there
	var signed_req = params.signed_request;
	if (!signed_req) {
		return sr_error(callback);
	}

	//decode the signed request and make sure it parses
	var decoded_sr = decode_sr(signed_req);
	if (!decoded_sr) {
		return sr_error(callback);
	}

	//check that that user_id field is there
	var fbid = decoded_sr.user_id;
	if (!fbid) {
		return sr_error(callback);
	}

	//try putting the data in the table
	db.query(
		'insert into UsersFacebookId values(?, ?)',
		[user.username, fbid],
		function(err, results) {
			if (err && (err.number == 1060 || err.number == 1061 || err.number == 1062)) {
				//account already linked
				return callback(api_errors.accountAlreadyLinked(req.session.user, params));
			}
			else if (err) {
				//some other error
				return callback(api_errors.database(req.session.user, params, err));
			}
			else {
				//yay! linked!
				return callback(api_utils.wrapResponse({
					params: params,
					success: true
				}));
			}
		}
	);
}
exports.linkfacebook = linkfacebook;

/* helper: decodes a signed_request from facebook (from https://gist.github.com/1139981) */
function decode_sr(signed_request) {
	var secret = process.env.FB_APP_SECRET;

    encoded_data = signed_request.split('.',2);
    // decode the data
    sig = encoded_data[0];
    json = base64url.decode(encoded_data[1]);
    data = JSON.parse(json); // ERROR Occurs Here!

    // check algorithm - not relevant to error
    if (!data.algorithm || data.algorithm.toUpperCase() != 'HMAC-SHA256') {
        return null;
    }

    // check sig - not relevant to error
    expected_sig = crypto.createHmac('sha256',secret).update(encoded_data[1]).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace('=','');
    if (sig !== expected_sig) {
        return null;
    }

    return data;
}

/*
	Inputs
		TODO

	Cases
		TODO
*/
function unlink(req, params, callback) {
	//TODO
}
exports.unlink = unlink;

