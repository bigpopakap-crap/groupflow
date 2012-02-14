/*
	This API domain:
		/api/users/blurb, api.users.blurb

	REST functions:
		set - updates the user's blurb
	
	Internal-only functions:
		--

	Directly touches database tables:
		UsersBlurb (write)
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_validate = require('../util/api-validate.js');
var db = require('../../db.js');

exports.configure = function(app, url_prefix) {
	url_prefix += '/blurb';

	//configure this domain
	app.post(url_prefix + '/set', api_utils.restHandler(this.set));
}

/*
	Cases:
		success: returns the new blurb string
		error: returns a database or input params error
*/
exports.set = function(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		blurb: { required: true, maxlen: 560, notrailingwhite: true }
	});

	if (!req.session.user) {
		//no auth' user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		//make sure the user param is there
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//update the user blurb
		db.query(
			'update UsersBlurb set blurb=? where username=?',
			[ params.blurb, req.session.user.username ],
			function (err) {
				if (err) return callback(api_errors.database(req.session.user, params, err));
				else return callback(api_utils.wrapResponse({
					params: params,
					success: params.blurb
				}));
			}
		);
	}
}
