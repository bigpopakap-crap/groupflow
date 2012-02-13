/*
	This API domain:
		/api/users, api.users

	REST functions:
		get - gets the user object given a username
	
	Internal-only functions:
		create - creates a user object without validating inputs
*/
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_warnings = require('./util/api-warnings.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');

//subdomain modules
var blurb = require('./users/blurb.js');
var permissions = require('./users/permissions.js');

//function to configure the app
exports.configure = function(app, url_prefix) {
	url_prefix += '/users';	

	//configure each of the domains
	blurb.configure(app, url_prefix);
	permissions.configure(app, url_prefix);
	
	//configure this api domain
	app.get(url_prefix + '/get', api_utils.restHandler(this.get));
}

/*
	Inputs:
		username (required)

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
exports.get = function(req, params, callback) {
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
			'select n.username, n.firstName, n.lastName, b.blurb ' +
				'from (UsersName n, UsersBlurb b) ' +
				'where n.username=\'@(username)\'',
			{ username: params.username },
			function (err, results) {
				if (err) {
					//return a database error
					return callback(api_errors.database(req.session.user, params, err));
				}
				else if (results.length < 1) {
					//return a warning that the user doesn't exist
					callback(api_warnings.noSuchUser(req.session.user, params, params.username));
				}
				else if (results.length > 1) {
					//return the first element of the array to the caller, but log an error
					get_utils.err_log('Username ' + params.username + ' is not unique');
					var user = dbToApiUser(results[0]);
					callback(api_utils.wrapResponse({
						params: params,
						success: user
					}));
				}
				else {
					//return the first element of the array to the caller
					var user = dbToApiUser(results[0]);
					callback(api_utils.wrapResponse({
						params: params,
						success: user
					}));
				} //end if-else on database return values
			} //end callback from database
		); //end db.query
	} //end if-else on param errors
}

/*
	Creates a new user object, assuming that all fields have been validated
	and the username is unique
*/
function create(req, params, callback) {
	//TODO use transactions to make sure all tables are updated atomically
	//		https://github.com/bminer/node-mysql-queues
	callback('not implemented');
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

