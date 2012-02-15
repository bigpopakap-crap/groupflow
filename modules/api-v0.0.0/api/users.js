/*
	This API domain:
		/api/users, api.users

	REST functions:
		get - gets the user object given a username
	
	Internal-only functions:
		create - creates a user object without validating inputs
		getbypassword - gets the user by username and password

	Directly touches database tables:
		UsersName (read/write)
		UsersEmail (read/write)
		UsersBlurb (read/write)
		UsersAuth (read/write)
*/
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
exports.configure = function(app, url_prefix) {
	url_prefix += '/users';	

	//configure each of the domains
	blurb.configure(app, url_prefix);
	permissions.configure(app, url_prefix);
	picture.configure(app, url_prefix);
	
	//configure this api domain
	app.get(url_prefix + '/get', api_utils.restHandler(this.get));
	app.get(url_prefix + '/me', api_utils.restHandler(this.me));
}

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
	gets the username of the auth'd user and passes it to the get function
*/
exports.me = function(req, params, callback) {
	if (!req.session.user) {
		//no auth' user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else {
		var username = req.session.user.username;
		return get(req, { username: username }, function(data) {
			//just overwrite the params and relay the response
			data.request.params = params;
			return callback(data);
		});
	}
}

/*
	Inputs:
		username, password

	Gets the user object by username and password
*/
exports.getbypassword = function(req, params, callback) {
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
			[ params.username, params.username, params.username, params.password ],
			getUserCallback(req, params, callback)
		);
	}
}

/*
	Creates a new user object, assuming that all fields have been validated
	and the username is unique (if they are defined)
*/
exports.create = function(req, params, callback) {
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

//the query string to get user data
var GET_QUERY_STRING = 'select n.username, n.firstName, n.lastName, b.blurb ' +
				'from (UsersName n, UsersBlurb b) ' +
				'where n.username=? and b.username=?';
var GET_PASSWORD_QUERY_STRING = 'select n.username, n.firstName, n.lastName, b.blurb ' +
				'from (UsersName n, UsersBlurb b, UsersAuth a) ' +
				'where n.username=? and b.username=? and a.username=? ' +
					'and a.password=?';

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
			//return the first element of the array to the caller, but log an error
			gen_utils.err_log('Username ' + params.username + ' is not unique');
			var user = dbToApiUser(results[0]);
			return callback(api_utils.wrapResponse({
				params: params,
				success: user
			}));
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

