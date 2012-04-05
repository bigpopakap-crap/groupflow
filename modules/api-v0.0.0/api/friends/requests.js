/*
	This API domain:
		/api/friends/requests, api.friends.requests

	REST functions:
		create TODO
		listin TODO
		listout TODO
		accept TODO
		reject TODO
		cancel TODO
	
	Internal-only functions:
		TODO

	Directly touches database tables:
		TODO

	Directly touches session variables:
		TODO
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_validate = require('../util/api-validate.js');
var db = require('../../db.js');

function configure(app, url_prefix) {
	url_prefix += '/requests';

	//configure this api domain
	app.post(url_prefix + '/create', api_utils.restHandler(create));
	app.get(url_prefix + '/listin', api_utils.restHandler(listin));
	app.get(url_prefix + '/listout', api_utils.restHandler(listout));
	app.get(url_prefix + '/accept', api_utils.restHandler(accept));
	app.get(url_prefix + '/reject', api_utils.restHandler(reject));
	app.get(url_prefix + '/cancel', api_utils.restHandler(cancel));
}
exports.configure = configure;

/*
	Inputs:
		TODO

	Cases:
		TODO
*/
function create(req, params, callback) {
	//TODO
}
exports.create = create;

/*
	Inputs:
		offset (optional, default 0) - the offset of the list of friends
		maxcount (optional, default to the max of 50) - the max number of friends to return

	Note that this function does adjust the returned input parameters to the maxcount
		and offset that were actually used. If maxcount was not given, it will be returned
		as set to 50. If one of them is negative, it will return as set to 0

	Cases:
		error: no auth'd user
		success: the list of the usernames who have requested the auth'd user as a friend
*/
function listin(req, params, callback) {
	//TODO
}
exports.listin = listin;

/*
	Inputs:
		offset (optional, default 0) - the offset of the list of friends
		maxcount (optional, default to the max of 50) - the max number of friends to return

	Note that this function does adjust the returned input parameters to the maxcount
		and offset that were actually used. If maxcount was not given, it will be returned
		as set to 50. If one of them is negative, it will return as set to 0

	Cases:
		error: no auth'd user
		success: the list of the usernames who the auth'd user has requests as friends
*/
function listout(req, params, callback) {
	//TODO
}
exports.listout = listout;

/*
	Inputs:
		TODO

	Cases:
		TODO
*/
function accept(req, params, callback) {
	//TODO
}
exports.accept = accept;

/*
	Inputs:
		TODO

	Cases:
		TODO
*/
function reject(req, params, callback) {
	//TODO
}
exports.reject = reject;

/*
	Inputs:
		TODO

	Cases:
		TODO
*/
function cancel(req, params, callback) {
	//TODO
}
exports.cancel = cancel;

/*
Time signature of middle section of "Here Comes The Sun"

 A       B          C         D         E         F            G         H         I
|| - - - |: sun - - | sun - - | sun - - | here we | come - - - | - - - - | - - - - | - - - :||
|| 1 2 3 |: 1   2 3 | 1   2 3 | 1   2 3 | 1    2  | 1    2 3 4 | 1 2 3 4 | 1 2 3 4 | 1 2 3 :||
*/

