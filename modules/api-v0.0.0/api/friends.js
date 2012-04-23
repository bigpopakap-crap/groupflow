/*
	This API domain:
		/api/friends, api.friends

	REST functions:
		list - lists the friends of the auth'd user
		is - determines whether the auth'd user is friends with a given user
		state - gets the relationship the auth'd user has with the given user
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		Friendships (read/write)
		FriendRequests (read)

	Directly touches session variables:
		session.user
*/
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');

//other api domains
var users = require('./users.js');

//subdomain modules
var requests = require('./friends/requests.js');

function configure(app, url_prefix) {
	url_prefix += '/friends';

	//configure each of the domains
	requests.configure(app, url_prefix);

	//actions in this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/list', list);
	api_utils.restHandler(app, 'get', url_prefix + '/is', is);
	api_utils.restHandler(app, 'get', url_prefix + '/state', state);
}
exports.configure = configure;

/*
	Inputs:
		offset (optional, default 0) - the offset of the list of friends
		maxcount (optional, default to the max of 50) - the max number of friends to return
		(NOT YET) sort (optional, defaults to 'username') - how the results should be sorted
			'username', 'name', 'length'
	
	NOTE: sort is not not yet an option, currently doesn't sort globally, but each
		batch of results is sorted by username

	Note that this function does adjust the returned input parameters to the maxcount
		and offset that were actually used. If maxcount was not given, it will be returned
		as set to 50. If one of them is negative, it will return as set to 0

	Cases:
		error: no auth'd user
		success: the list of user objects of friends
*/
function list(req, params, callback) {
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
			'select * from Friendships where lesser=? or greater=?' +
					' order by lesser, greater' +
					' limit ?, ?',
			[username, username, params.offset, params.maxcount],
			function (err, results) {
				if (err) {
					//return a database error
					return callback(api_errors.database(req.session.user, params, err));
				}
				else {
					//create an array of friends' usernames
					var friends = results.map(function(entry) {
						return (entry.lesser == username ? entry.greater : entry.lesser);
					});

					//call the users getarr function on that
					users.getarr(req, { usernames: friends }, function(data) {
						var response = data.response;

						if (response.error) {
							//relay the error
							return callback(data);
						}
						else if (response.success) {
							//successful! return the array
							return callback(api_utils.wrapResponse({
								params: params,
								success: response.success
							}));
						}
						else {
							//some weird case - return internal server error and log it
							gen_utils.err_log('weird case: 2hdlsh2888fhsl');
							return callback(api_errors.internalServer(req.session.user, params));
						}
					});
				}
			}
		);
	}
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

/*
	Inputs: username

	Cases:
		Error: database, no such user
		Success: returns a string representing the relationship
			is - this is the auth'd user
			incoming - there is a pending request from the given user
			outgoing - there is a pending request TO the given user
			friends - they are friends
			none - none of the above
*/
function state(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		username: { required: true }
	});

	if (!req.session.user) {
		//no auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else {
		var user = req.session.user;

		//check if it is the auth'd user
		if (user.username == params.username) {
			return callback(api_utils.wrapResponse({
				params: params,
				success: 'is'
			}));
		}

		//check whether the user exists
		users.get(req, params, function (data) {
			var response = data.response;

			if (response.success) {
				//user exists, now check whether they're friends
				is(req, params, function (data) {
					var response = data.response;

					if (response.success === true) {
						//they're friends, return that state
						return callback(api_utils.wrapResponse({
							params: params,
							success: 'friends'
						}));
					}
					else if (response.success === false) {
						//not friends, check if there's a friend request
						db.query('select * from FriendRequests where (requester=? and recipient=?) or (requester=? and recipient=?)',
								[ user.username, params.username, params.username, user.username ],
								function (err, results) {
							//there will be at most 1 result
							if (err) {
								//database error
								return callback(api_errors.database(req.session.user, params, err));
							}
							else if (results.length == 0) {
								//no friend requests pending
								return callback(api_utils.wrapResponse({
									params: params,
									success: 'none'
								}));
							}
							else if (results[0].requester == user.username) {
								//outgoing request
								return callback(api_utils.wrapResponse({
									params: params,
									success: 'outgoing'
								}));
							}
							else {
								//incoming request
								return callback(api_utils.wrapResponse({
									params: params,
									success: 'incoming'
								}));
							}
						});
					}
					else if (response.error) callback(data); //relay the error
					else {
						//some weird case - return internal server error and log it
						gen_utils.err_log('weird case: O02HFHSLhss');
						return callback(api_errors.internalServer(req.session.user, params));
					}
				}); //end lookup friendship
			}
			else if (response.warning) return callback(api_errors.noSuchUsername(req.session.user, params, username)); //no such user error
			else if (response.error) return callback(data); //relay the error
			else {
				//some weird case - return internal server error and log it
				gen_utils.err_log('weird case: 457ahwlh hsHF');
				return callback(api_errors.internalServer(req.session.user, params));
			}
		}); //end look up user
	}
}
exports.state = state;

//subdomains of the api
exports.requests = requests;

