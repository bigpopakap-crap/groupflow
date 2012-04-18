/*
	This API domain:
		/api/accounts, api.accounts

	REST functions:
		link - links the user's facebook account so they can log in with it
		get - returns the user's facebook id
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		UsersFacebookId (read/write)

	Directly touches session variables:
		req.session.user
*/
var base64url = require('b64url');
var crypto = require('crypto');
var gen_utils = require('../../../gen-utils.js');
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_warnings = require('../util/api-warnings.js');
var api_validate = require('../util/api-validate.js');
var db = require('../../db.js');

function configure(app, url_prefix) {
	url_prefix += '/facebook';

	//configure the actions in this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/get', get);
	api_utils.restHandler(app, 'post', url_prefix + '/link', link);
}
exports.configure = configure;

/*
	Cases:
		Error: no auth, database
		Warning: facebook not linked
		Success: the facebook id
*/
function get(req, params, callback) {
	if (!req.session.user) {
		//no auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else {
		db.query(
			'select fbid from UsersFacebookId where username=? limit 1',
			[ req.session.user.username ],
			function (err, results) {
				if (err) {
					//database
					return callback(api_errors.database(req.session.user, params, err));
				}
				else if (results.length == 0 || !results[0].fbid) {
					//no account linked
					return callback(api_warnings.noFacebookAccountLinked(req.session.user, params));
				}
				else {
					//account linked!
					return callback(api_utils.wrapResponse({
						params: params,
						success: results[0].fbid
					}));
				}
			}
		);
	}
}
exports.get = get;

/*
	Inputs
		The signed request from facebook

	Cases
		error - database error, or account already linked, or params, no auth
		success - true
*/
function link(req, params, callback) {
	//error when something is wrong with the signed request
	function sr_error(callback) {
		return callback(api_errors.badInputParams(req.session.user, {}, {
			signed_req: {
				devMsg: 'Something was wrong with the signed_request',
				userMsg: 'The value of this field is corrupted'
			}
		}));
	}

	//make sure there's and auth'd user
	var user = req.session.user;
	if (!user) {
		return callback(api_errors.noAuth(req.session.user, {}));
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
		'insert into UsersFacebookId (username, fbid) values(?, ?)',
		[user.username, fbid],
		function(err, results) {
			if (err && (err.number == 1060 || err.number == 1061 || err.number == 1062)) {
				//account already linked
				return callback(api_errors.accountAlreadyLinked(req.session.user, {}));
			}
			else if (err) {
				//some other error
				return callback(api_errors.database(req.session.user, {}, err));
			}
			else {
				//yay! linked!
				return callback(api_utils.wrapResponse({
					params: {},
					success: true
				}));
			}
		}
	);
}
exports.link = link;

/* helper: decodes a signed_request from facebook (from https://gist.github.com/1139981) */
function decode_sr(signed_request) {
	var secret = process.env.FB_APP_SECRET;

    encoded_data = signed_request.split('.',2);
	//make sure that the length of the array is 2
	if (encoded_data.length != 2) {
		return null;
	}

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

