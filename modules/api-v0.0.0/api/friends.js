/*
	This API domain:
		/api/friends, api.friends

	REST functions:
		list - lists the friends of the auth'd user
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		Friendships (read/write)

	Directly touches session variables:
		(none) TODO
*/
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');

function configure(app, url_prefix) {
	url_prefix += '/friends';

	//actions in this api domain
	app.get(url_prefix + '/list', api_utils.restHandler(list));
	app.get(url_prefix + '/is', api_utils.restHandler(is));
}
exports.configure = configure;

/*
	Inputs:
		offset (optional, default 0) - the offset of the list of friends
		maxcount (optional, default to the max of 50) - the max number of friends to return
		sort (optional, defaults to 'username') - how the results should be sorted
			'username', 'name', 'length'

	Cases:
		error: no auth'd user
		success: the list of (TODO: id's or user objects?)
		TODO
*/
function list(req, params, callback) {
	//TODO
}
exports.list = list;

/*
	Checks whether the auth'd user is friends with another user

	Inputs:
		username (required) - the username of a user

	Cases
		Error: missing params, database error
		Success: bool
			true if the auth'd user is friends with the given username
			false otherwise (not friends, or username doesn't exist)
*/
function is(req, params, callback) {
	//make sure the username is there
	var paramErrors = api_validate.validate(params, {
		username: { required: true }
	});

	//check for auth'd user and errors on the input
	if (!req.session.user) {
		//no auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//order the usernames
		var usernames = [ req.session.user.username, params.username ].sort();
		db.query(
			'select * from Friendships where lesser=? and greater=? limit 1',
			usernames,
			function (err, results) {
				if (err) {
					//return a database error
					return callback(api_errors.database(req.session.user, params, err));
				}
				else {
					//return true iff the results array is not empty
					return callback(api_utils.wrapResponse({
						params: params,
						success: (results.length > 0 ? true : false)
					}));
				}
			}
		);
	}
}
exports.is = is;

