/*
	This API domain:
		/api/notifications, api.notifications

	REST functions:
		num - gets the number of notifications this user has
		list - lists the notifications this user has
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		(none) TODO

	Directly touches session variables:
		req.session.user (read)
*/
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');

function configure(app, url_prefix) {
	url_prefix += '/notifications';

	//configure this api domain
	app.get(url_prefix + '/num', api_utils.restHandler(num));
	app.get(url_prefix + '/list', api_utils.restHandler(list));
}
exports.configure = configure;

function num(req, params, callback) {
	if (!req.session.user) {
		//no auth' user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else {
		//TODO for now, just return 0
		callback(api_utils.wrapResponse({
			success: 0
		}));
	}
}
exports.num = num;

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
	if (!req.session.user) {
		//no auth' user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else {
		//TODO for now, just return an empty list
		callback(api_utils.wrapResponse({
			success: []
		}));
	}
}
exports.list = list;

