/*
	This API domain:
		/api/friends, api.friends

	REST functions:
		list - lists the friends of the auth'd user
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		(none) TODO

	Directly touches session variables:
		(none) TODO
*/
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_validate = require('./util/api-validate.js');

function configure(app, url_prefix) {
	url_prefix += '/friends';

	//TODO
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
		TODO
*/
function is(req, params, callback) {
	//TODO
}
exports.is = is;

