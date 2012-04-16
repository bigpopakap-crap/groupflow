/*
	This API domain:
		/api/users, api.users

	REST functions:
		get - gets the user object given a username
		me - gets the user object of the auth'd user
		search - case-sensitive search of username, first name and last name
	
	Internal-only functions:
		getarr - gets an array of user objects given an array of usernames
		create - creates a user object without validating inputs
		getbypassword - gets the user by username and password

	Directly touches database tables:
		UsersName (read/write)
		UsersEmail (read/write)
		UsersBlurb (read/write)
		UsersAuth (read/write)

	Directly touches session variables:
		req.session.user (read)
*/
var bcrypt = require('bcrypt');
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_warnings = require('./util/api-warnings.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');

//subdomain modules
var blurb = require('./users/blurb.js');
var permissions = require('./users/permissions.js');
var picture = require('./users/picture.js');

//function to configure the app
function configure(app, url_prefix) {
	url_prefix += '/users';	

	//configure each of the domains
	blurb.configure(app, url_prefix);
	permissions.configure(app, url_prefix);
	picture.configure(app, url_prefix);
	
	//configure this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/get', get);
	api_utils.restHandler(app, 'get', url_prefix + '/me', me);
	api_utils.restHandler(app, 'get', url_prefix + '/search', search);
}
exports.configure = configure;

/*
	Inputs:
		username

	Cases:
		error: database error or input params error
		success: the user object
		warning: no such user

	Gets the user object by their username. The user object looks like:
		{
			username: <string>,
			name: {
				full: <string>,
				first: <string>,
				last: <string>
			},
			blurb: <string>
		}
*/
function get(req, params, callback) {
	//make sure the username is there
	var paramErrors = api_validate.validate(params, {
		username: { required: true }
	});

	//check for errors on the input
	if (paramErrors) {
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//now execute the database query
		db.query(
			GET_QUERY_STRING,
			[ params.username, params.username ],
			getUserCallback(req, params, callback)
		);
	}
}
exports.get = get;

/*
	Inputs:
		usernames: an array of usernames

	Note that if any of these usernames doesn't exist, it will just silently
		be dropped from the array

	Cases:
		Error: database error, no usernames param
		Success: the array of user objects
*/
function getarr(req, params, callback) {
	//make sure the username is there
	var paramErrors = api_validate.validate(params, {
		usernames: { required: true, isarray: true }
	});

	//TODO convert usernames to array (what if it is an array already?)

	//check for errors on the input
	if (paramErrors) {
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	//if array is empty, just return an empty array
	else if (params.usernames.length == 0) {
		return callback(api_utils.wrapResponse({
			params: params,
			success: []
		}));
	}
	else {
		dbReqUserObjList(req, params, callback,
						 ARR_QUERY_STRING(params.usernames),
						 params.usernames.concat(params.usernames));
	}
}
exports.getarr = getarr;

/*
	Inputs:
		query (string)
		TODO - paging of results? probably do that way later...

	Note: checks case-sensitive for exact matches on username, first name or last name

	Cases:
		error: database error
		success: the list of matching user objects
*/
function search(req, params, callback) {
	//default to empty search string
	params.query = params.query || '';
	dbReqUserObjList(req, params, callback,
					 SEARCH_QUERY_STRING,
					 [ params.query, params.query, params.query ]);
}
exports.search = search;

/*
	gets the username of the auth'd user and passes it to the get function
*/
function me(req, params, callback) {
	if (!req.session.user) {
		//no auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else {
		//use the cached user object in the session
		return callback(api_utils.wrapResponse({
			params: params,
			success: req.session.user
		}));
	}
}
exports.me = me;

/*
	Inputs:
		username, password

	Gets the user object by username and password
*/
function getbypassword(req, params, callback) {
	//make sure the username is there
	var paramErrors = api_validate.validate(params, {
		username: { required: true },
		password: { required: true }
	});

	//check for errors on the input
	if (paramErrors) {
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//now execute the database query
		db.query(
			GET_PASSWORD_QUERY_STRING,
			[ params.username, params.username, params.username ],
			function (err, results) {
				//if a user was returned, make sure the passwords match
				if (!err && results && results[0]) {
					var hash = results[0].password;
					if (!passwordMatchesHash(params.password, hash)) {
						//set the array to the empty array
						results = [];
					}
				}

				//now call the function to return the user object
				return getUserCallback(req, params, callback)(err, results);
			}
		);
	}
}
exports.getbypassword = getbypassword;

//helper: returns true if the password matches the hash
function passwordMatchesHash(password, hash) {
	return bcrypt.compare_sync(password, hash);
}

/*
	Creates a new user object, assuming that all fields have been validated
	and the username is unique (if they are defined)
*/
function create(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		//assume that if the params are there, they are valid
		username: { required: true },
		password: { required: true },
		firstName: { required: true },
		lastName: { required: true },
		email: { required: true }
	});

	if (paramErrors) {
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		var initBlurb = 'Hello, world! I just joined ' + process.env.APP_NAME + '!';

		//TODO add Groupflow as a friend, and put the user in the groups
		//			Groupflow Announcements and Groupflow Feedback

		//enter values into: UsersName, UsersEmail, UsersAuth, UsersBlurb
		db.insertTransaction(
			[
				{ query: 'insert into UsersName values(?, ?, ?)',
				  params: [ params.username, params.firstName, params.lastName ] },
				{ query: 'insert into UsersEmail values(?, ?)',
				  params: [ params.username, params.email ] },
				{ query: 'insert into UsersAuth values(?, ?)',
				  params: [ params.username, params.password ] },
				{ query: 'insert into UsersBlurb values(?, ?)',
				  params: [ params.username, initBlurb ] },
				{ query: GET_QUERY_STRING,
				  params: [ params.username, params.username ] }
			],
			getUserCallback(req, params, callback)
		);
	}
}
exports.create = create;

//the query string to get user data
var GET_QUERY_STRING = 'select n.username, n.firstName, n.lastName, b.blurb ' +
				'from (UsersName n, UsersBlurb b) ' +
				'where n.username=? and b.username=?';
var GET_PASSWORD_QUERY_STRING = 'select n.username, n.firstName, n.lastName, b.blurb, a.password ' +
				'from (UsersName n, UsersBlurb b, UsersAuth a) ' +
				'where n.username=? and b.username=? and a.username=?';
var SEARCH_QUERY_STRING = 'select n.username, n.firstName, n.lastName, b.blurb ' +
				'from (UsersName n, UsersBlurb b) ' +
				'where (n.username=? or n.firstName=? or n.lastName=?) and n.username=b.username';
function ARR_QUERY_STRING(usernames) {
	var questions = '';
	for (i = 0; i < usernames.length; i++) {
		if (i == 0) questions += '?';
		else questions += ',?';
	}

	return 'select n.username, n.firstName, n.lastName, b.blurb ' +
			'from (UsersName n, UsersBlurb b) ' +
			'where n.username=b.username and n.username in (' + questions + ') ' +
			'order by field(n.username, ' + questions + ')';
}

//handles the when the database returns the user data
function getUserCallback(req, params, callback) {
	return function (err, results) {
		if (err) {
			//return a database error
			return callback(api_errors.database(req.session.user, params, err));
		}
		else if (results.length < 1) {
			//return a warning that the user doesn't exist
			return callback(api_warnings.noSuchUser(req.session.user, params, params.username));
		}
		else if (results.length > 1) {
			//this shouldn't happen, return an internal server error
			gen_utils.err_log('Username ' + params.username + ' is not unique');
			return callback(api_errors.internalServer(req.session.user, params));
		}
		else {
			//return the first element of the array to the caller
			var user = dbToApiUser(results[0]);
			return callback(api_utils.wrapResponse({
				params: params,
				success: user
			}));
		}
	}
}

/*
	Makes a database call for a list of user objects
		querystr - the string of SQL to use
		queryparams - the array of params in the SQL query
*/
function dbReqUserObjList(req, params, callback, querystr, queryparams) {
	db.query(
		querystr,
		queryparams,
		function(err, results) {
			if (err) {
				//return a database error
				return callback(api_errors.database(req.session.user, params, err));
			}
			else {
				//map the returned objects to api user objects and return them
				results = results.map(function(user) {
					return dbToApiUser(user);
				});
				return callback(api_utils.wrapResponse({
					params: params,
					success: results
				}));
			}
		}
	);
}

//helper: takes the user object from the database and returns the object
//	as it is structured in the API
function dbToApiUser(user) {
	return {
		username: user.username,
		name: {
			first: user.firstName,
			last: user.lastName,
			full: user.firstName + ' ' + user.lastName
		},
		blurb: user.blurb
	};
}

//subdomains of the api
exports.blurb = blurb;
exports.permissions = permissions;

