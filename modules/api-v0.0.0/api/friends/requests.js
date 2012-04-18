/*
	This API domain:
		/api/friends/requests, api.friends.requests

	REST functions:
		create - creates a new friend request
		listin - lists incoming friend requests
		listout - lists outgoing friend requests
		isin - determines if there is an incoming friend request from a certain user
		isout - determines if there is an outgoing friend request to a certain user
		accept - accepts an incoming friend request
		reject - rejects and incoming friend request
		cancel - cancels an outgoing (and pending) friend request
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		Friendships (read/write)
		FriendRequests (read/write)

	Directly touches session variables:
		req.session.user
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_warnings = require('../util/api-warnings.js');
var api_validate = require('../util/api-validate.js');
var db = require('../../db.js');

//other api domains
var users = require('../users.js');
var friends = require('../friends.js');
var notifications = require('../notifications.js');

function configure(app, url_prefix) {
	url_prefix += '/requests';

	//configure this api domain
	api_utils.restHandler(app, 'post', url_prefix + '/create', create);
	api_utils.restHandler(app, 'get', url_prefix + '/listin', listin);
	api_utils.restHandler(app, 'get', url_prefix + '/listout', listout);
	api_utils.restHandler(app, 'get', url_prefix + '/isin', isin);
	api_utils.restHandler(app, 'get', url_prefix + '/isout', isout);
	api_utils.restHandler(app, 'post', url_prefix + '/accept', accept);
	api_utils.restHandler(app, 'post', url_prefix + '/reject', reject);
	api_utils.restHandler(app, 'post', url_prefix + '/cancel', cancel);
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
		success: the other user object, when the request was sent (and none of the above occurred)
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
		//errors in the input parameters
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//get the two important vars
		var username = params.username;
		var user = req.session.user;

		//make sure the user isn't friend requesting himself
		if (username == user.username) {
			return callback(api_errors.selfFriend(req.session.user, params));
		}

		//make sure the username exists
		users.get(req, { username: username }, function(data) {
			var response = data.response;

			if (response.error) {
				//relay the error
				return callback(data);
			}
			else if (response.warning) {
				//no such user, return that error
				return callback(api_errors.noSuchUsername(req.session.user, params, username));
			}
			else if (response.success) {
				//the user exists wooo!!
				var user2 = response.success;

				//make sure the two aren't already friends
				friends.is(req, { username: user2.username }, function(data) {
					var response = data.response;

					if (response.error) {
						//relay the error
						return callback(data);
					}
					else if (response.success) {
						//they are already friends, return that error
						return callback(api_errors.alreadyFriends(req.session.user, params, user2.username));
					}
					else {
						//they aren't friends already woo!

						//make sure the other user hasn't already requested the auth'd user
						isin(req, { username: user2.username }, function (data) {
							var response = data.response;

							if (response.error) {
								//relay the error
								return callback(data);
							}
							else if (response.success) {
								//there is an incoming request, return that error
								return callback(api_errors.alreadyIncomingFriendRequest(req.session.user, params, user2.username));
							}
							else {
								//there is no incoming request yay!
								//add the request to the database, warning if it was there already
								db.query(
									'insert into FriendRequests (requester, recipient) values (?, ?)',
									[ user.username, user2.username ],
									function (err, results) {
										if (err && (err.number == 1060 || err.number == 1061 || err.number == 1062)) {
											//warn that there was already an outgoing request
											return callback(api_warnings.friendRequestAlreadySent(req.session.user, params, user2.username));
										}
										else if (err) {
											//some other database error
											return callback(api_errors.database(req.session.user, params, err));
										}
										else {
											//send the recipient a notification of the request
											notifications.notify(
												params.username,
												notifications.TYPES.NEW_FRIEND_REQUEST,
												user.username + ' wants to be your friend'
											);

											//successfully sent the request!
											return callback(api_utils.wrapResponse({
												params: params,
												success: user2
											}));
										}
									}
								); //end database insert
							}
						}); //end making sure there isn't an incoming request
					}
				}); //end making sure they aren't already friends
			}
			else {
				//some weird case - return internal server error and log it
				gen_utils.err_log('weird case: 39dhja333hs0');
				return callback(api_errors.internalServer(req.session.user, params));
			}
		}); //end making sure username exists
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

		if (!req.session.user) {
			//no auth'd user
			return callback(api_errors.noAuth(req.session.user, params));
		}
		else if (paramErrors) {
			return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
		}
		else {
			//correct the maxcount and offset
			if (typeof params.offset == 'undefined') params.offset = 0;			//default values
			if (typeof params.maxcount == 'undefined') params.maxcount = 50;
			params.offset = parseInt(params.offset);							//convert to ints
			params.maxcount = parseInt(params.maxcount);
			params.offset = Math.max(params.offset, 0);							//offset is at least 0
			params.maxcount = Math.min(Math.max(params.maxcount, 0), 50);		//maxcount between 0 and 50								

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

						//call the users getarr function on that
						users.getarr(req, { usernames: results }, function(data) {
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
								gen_utils.err_log('weird case: H2k02hs');
								return callback(api_errors.internalServer(req.session.user, params));
							}
						});
					}
				}
			);
		}
	}
}

/*
	Inputs:
		username - the username from whom the request must have come

	Cases:
		error: no username param
		success: true if the request exists (is pending), false otherwise
				 (could also be false if the user doesn't exist)
*/
var isin = isfun('requester', 'recipient');
exports.isin = isin;

/*
	Inputs:
		username - the username to whom the request must have been sent

	Cases:
		error: no username param
		success: true if the request exists (is pending), false otherwise
				 (could also be false if the user doesn't exist)
*/
var isout = isfun('recipient', 'requester');
exports.isout = isout;

/*
	Returns a REST handler function that determines the existence of incoming/outgoing
	friend requests of the auth'd user

	Incoming: endpoint = 'requester', origin = 'recipient'
	Outgoing: endpoint = 'recipient', origin = 'requester'
*/
function isfun(endpoint, origin) {
	return function(req, params, callback) {
		var paramErrors = api_validate.validate(params, {
			username: { required: true }
		});

		if (!req.session.user) {
			//no auth'd user
			return callback(api_errors.noAuth(req.session.user, params));
		}
		else if (paramErrors) {
			return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
		}
		else {
			var user = req.session.user;

			db.query(
				'select * from FriendRequests where ' + origin + '=? and ' + endpoint + '=? limit 1',
				[ user.username, params.username ],
				function (err, results) {
					if (err) {
						//return a database error
						return callback(api_errors.database(req.session.user, params, err));
					}
					else {
						//return true if and only if there was at least one result
						return callback(api_utils.wrapResponse({
							params: params,
							success: (results.length > 0)
						}));
					}
				}
			);
		}
	}
}

/*
	Inputs:
		username - the person who sent the request you want to accept

	Cases:
		error: database, no such incoming friend request
		success: the username of the new friend
*/
function accept(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		username: { required: true }
	});

	if (!req.session.user) {
		//no auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		var user = req.session.user;

		//check that there in an incoming request
		isin(req, { username: params.username }, function(data) {
			var response = data.response;

			if (response.error) {
				//relay the error
				return callback(data);
			}
			else if (!response.success) {
				//there is no incoming request, return that error
				return callback(api_errors.noSuchIncomingFriendRequest(req.session.user, params, params.username));
			}
			else {
				//there is no incoming request yay!
				//remove the entry from the request table, add the friendship in that table
				db.insertTransaction(
					[
						{ query: 'delete from FriendRequests where requester=? and recipient=?',
							params: [ params.username, user.username ] },
						{ query: 'insert into Friendships (lesser, greater) values (?, ?)',
							params: [ user.username, params.username ].sort() }
					],
					function (err, results) {
						if (err) {
							//relay the database error
							return callback(api_errors.database(req.session.user, params, err));
						}
						else {
							//send a notification of the accepted friend request
							notifications.notify(
								params.username,
								notifications.TYPES.ACCEPTED_FRIEND_REQUEST,
								req.session.user.username + ' accepted your friend request. Invite them to some groups!'
							);

							//return the username of the new friend
							return callback(api_utils.wrapResponse({
								params: params,
								success: params.username
							}));
						}
					}
				);
			}
		});
	}
}
exports.accept = accept;

/*
	Inputs:
		username - the person who sent the request you want to reject

	Cases:
		error: database, no such incoming friend request
		success: the username of the old friend
*/
var reject = deletefun('requester', 'recipient', function(req, params) {
	return api_errors.noSuchIncomingFriendRequest(req.session.user, params, params.username)
});
exports.reject = reject;

/*
	Inputs:
		username - the person to whom you want to cancel an outgoing request

	Cases:
		error: database, no such outgoing friend request
		success: the username of the person to whom the request was cancelled
*/
var cancel = deletefun('recipient', 'requester', function(req, params) {
	return api_errors.noSuchOutgoingFriendRequest(req.session.user, params, params.username)
});
exports.cancel = cancel;

/*
	Function that returns a REST handler that delets incoming/outgoing requests

	incoming: endpoint=requester , origin=recipient
	outgoing: endpoint=recipient , origin=requester
*/
function deletefun(endpoint, origin, noReqErrGen) {
	return function(req, params, callback) {
		var paramErrors = api_validate.validate(params, {
			username: { required: true }
		});

		if (!req.session.user) {
			//no auth'd user
			return callback(api_errors.noAuth(req.session.user, params));
		}
		else if (paramErrors) {
			return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
		}
		else {
			var user = req.session.user;

			//delete the request, and check how many rows were affected to determine whether
			//		there was a friend request to begin with
			db.query(
				'delete from FriendRequests where ' + endpoint + '=? and ' + origin + '=?',
				[ params.username, user.username ],
				function (err, results) {
					if (err) {
						//relay the database error
						return callback(api_errors.database(req.session.user, params, err));
					}
					else if (results.affectedRows < 1) {
						//there is no incoming request, return that error
						return callback(noReqErrGen(req, params));
					}
					else {
						//return the username of the new friend
						return callback(api_utils.wrapResponse({
							params: params,
							success: params.username
						}));
					}
				}
			);
		}
	}
}


/*
Time signature of middle section of "Here Comes The Sun"

 A       B          C         D         E         F            G         H         I
|| - - - |: sun - - | sun - - | sun - - | here we | come - - - | - - - - | - - - - | - - - :||
|| 1 2 3 |: 1   2 3 | 1   2 3 | 1   2 3 | 1    2  | 1    2 3 4 | 1 2 3 4 | 1 2 3 4 | 1 2 3 :||
*/

