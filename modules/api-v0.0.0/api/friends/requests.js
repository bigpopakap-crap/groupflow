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
		username - the username of the user to send the request

	Cases:
		error: 	 no auth'd user,
				 username doesn't exist
				 username is the auth'd user
				 username is already friends with auth'd user
				 username has already requested the auth'd user as a friend
				 database error
		warning: there is already a request pending with that user
		success: the request was sent (and none of the above occurred)
*/
function create(req, params, callback) {
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
		//get the two important vars
		var username = params.username;
		var user = req.session.user;

		//make sure the user isn't friend requesting himself
		if (username == user.username) {
			//TODO return the error
		}

		//make sure the username exists
		//TODO

		//make sure the two aren't already friends
		//TODO

		//make sure the other user hasn't already requested the auth'd user
		//TODO

		//check if a request is already pending with the other user
		//TODO

		//add the request to the database
		//TODO
	}
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
var listin = listfun('requester', 'recipient');
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
var listout = listfun('recipient', 'requester');
exports.listout = listout;

/*
	Returns a REST handler function that lists the incoming/outgoing
	friend requests of the auth'd user

	Incoming: endpoint = 'requester', origin = 'recipient'
	Outgoing: endpoint = 'recipient', origin = 'requester'
*/
function listfun(endpoint, origin) {
	return function(req, params, callback) {
		var paramErrors = api_validate.validate(params, {
			offset: { isnum: true },
			maxcount: { isnum: true }
		});

		//correct the maxcount and offset
		if (typeof params.offset == 'undefined') params.offset = 0;			//default values
		if (typeof params.maxcount == 'undefined') params.maxcount = 50;
		params.offset = parseInt(params.offset);							//convert to ints
		params.maxcount = parseInt(params.maxcount);
		params.offset = Math.max(params.offset, 0);							//offset is at least 0
		params.maxcount = Math.min(Math.max(params.maxcount, 0), 50);		//maxcount between 0 and 50								

		if (!req.session.user) {
			//no auth'd user
			return callback(api_errors.noAuth(req.session.user, params));
		}
		else {
			var username = req.session.user.username;

			db.query(
				'select ' + endpoint + ' from FriendRequests where ' + origin + '=? limit ?, ?',
				[username, params.offset, params.maxcount],
				function (err, results) {
					if (err) {
						//return a database error
						return callback(api_errors.database(req.session.user, params, err));
					}
					else {
						//create an array of requesters' usernames
						results = results.map(function(entry) {
							return entry[endpoint];
						});

						//return true iff the results array is not empty
						return callback(api_utils.wrapResponse({
							params: params,
							success: results
						}));
					}
				}
			);
		}
	}
}

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

