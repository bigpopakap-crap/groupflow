/*
	This API domain:
		/api/groups, api.groups

	REST functions:
		create - creates a new group
		list - lists the group the auth'd user is a part of
	
	Internal-only functions:
		(none) - todo

	Directly touches database tables:
		Groups (read/write)

	Directly touches session variables:
		req.session.user (read)
*/
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_warnings = require('./util/api-warnings.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');

//subdomain modules
//TODO

//function to configure the app
function configure(app, url_prefix) {
	url_prefix += '/groups';	

	//configure each of the domains
	//TODO
	
	//configure this api domain
	app.post(url_prefix + '/create', api_utils.restHandler(create));
	app.get(url_prefix + '/list', api_utils.restHandler(list));
	//TODO
}
exports.configure = configure;

/*
	Inputs:
		name - string, required, no weird chars, min 4 chars, max 24 chars
		description - string, required, no weird chars, min 12 chars, max 240 chars
		memberpost - boolean, required
		memberinvite - boolean, required

	Cases:
		error: database error or input params error
		success: the group object

	Group object looks like:
	{
		groupid: (str),
		name: (str),
		description: (str)
	}
	
*/
function create(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		name: { required: true, minlen: 4, maxlen: 24, isname2: true },
		description: { required: true, minlen: 12, maxlen: 240, isname2: true },
		memberpost: { required: true, isbool: true },
		memberinvite: { required: true, isbool: true }
	});

	//convert the booleans to actual booleans
	params.memberpost = (params.memberpost === 'true');
	params.memberinvite = (params.memberinvite === 'true');

	if (!req.session.user) {
		//make sure there is an auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		//something wrong with the given parameters
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//create the group. first get a unique group id
		db.query('select UUID() as uuid', [], function(err, results) {
			if (err) {
				//database error
				return callback(api_errors.database(req.session.user, params, err));
			}
			else {
				var uuid = results[0].uuid;

				//now enter values into: Groups, GroupFlags
				db.insertTransaction(
					[
						{ query: 'insert into Groups (groupid, name, description) values(?, ?, ?)',
						  params: [ uuid, params.name, params.description ] },
						{ query: 'insert into GroupFlags (groupid, memberpost, memberinvite) values(?, ?, ?)',
						  params: [ uuid, (params.memberpost ? 1 : 0), (params.memberinvite ? 1 : 0) ] },
						{ query: 'select * from Groups where groupid=?',
						  params: [ uuid ] }
					],
					function (err, results) {
						if (err) {
							//database error
							return callback(api_errors.database(req.session.user, params, err));
						}
						else {
							//there is exactly one entry, return it as success
							var group = dbToApiGroup(results[0]);
							return callback(api_utils.wrapResponse({
								params: params,
								success: group
							}));
						}
					}
				);
			}
		});
	}
}
exports.create = create;

/*
	TODO
*/
function list(req, params, callback) {
	//TODO
}
exports.list = list;

function dbToApiGroup(group) {
	return {
		groupid: group.groupid,
		name: group.name,
		description: group.description
	}
}

//subdomains of the api
//TODO

