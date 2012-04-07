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
	app.get(url_prefix + '/list', api_utils.restHandler(list));
	app.get(url_prefix + '/is', api_utils.restHandler(is));
}
exports.configure = configure;

/*
	Inputs:
		offset (optional, default 0) - the offset of the list of friends
		maxcount (optional, default to the max of 50) - the max number of friends to return
		(NOT YET) sort (optional, defaults to 'username') - how the results should be sorted
			'username', 'name', 'length'

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
			'select * from Friendships where lesser=? or greater=? limit ?, ?',
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
							//sort the array by firstname
							response.success = response.success.sort(function(a, b) {
								return a.firstName.localeCompare(b.firstName);
							});

							//successful! return the array
							return callback(api_utils.wrapResponse({
								params: params,
								success: response.success
							}));
						}
						else {
							//some weird case - return internal server error and log it
							gen_utils.err_log('weird case: 2hdlsh2888fhsl');
							return callback(api_errors.internalServer(req.session.user, params));//weird case, log it
							
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


//subdomains of the api
exports.requests = requests;

