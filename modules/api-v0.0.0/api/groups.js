/*
	This API domain:
		/api/groups, api.groups

	REST functions:
		get - gets a group object from its id
		create - creates a new group
		list - lists the group the auth'd user is a part of
	
	Internal-only functions:
		getarr - converts an array of usernames of groups to an array of group objects

	Directly touches database tables:
		Groups (read/write)
		GroupFlags (read/write)
		GroupMembers (read/write)

	Directly touches session variables:
		req.session.user (read)
*/
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_warnings = require('./util/api-warnings.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');

//subdomain modules
var invitations = require('./groups/invitations.js');
var members = require('./groups/members.js');

//function to configure the app
function configure(app, url_prefix) {
	url_prefix += '/groups';	

	//configure each of the domains
	invitations.configure(app, url_prefix);
	members.configure(app, url_prefix);
	
	//configure this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/get', get);
	api_utils.restHandler(app, 'post', url_prefix + '/create', create);
	api_utils.restHandler(app, 'get', url_prefix + '/list', list);
}
exports.configure = configure;

/*
	Inputs
		groupid (required) - a string id of the group to fetch

	Cases:
		error: database error, missing groupid param, no auth
		warning: no such group
		success: the group object

	the group object looks like:
	{
		groupid: (str),
		name: (str),
		description: (str)
	}
*/
function get(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		groupid: { required: true }
	});

	if (!req.session.user) {
		//make sure there is an auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		//something wrong with the given parameters
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//get the group if the user is in it
		db.query(
			'select g.* from (Groups g, GroupMembers m) where m.username=? and m.groupid=? and m.groupid=g.groupid',
			[ req.session.user.username, params.groupid ],
			getGroupCallback(req, params, callback)
		);
	}
}
exports.get = get;

/*
	Inputs:
		groupids: an array of group ids

	Note that if any of these group ids doesn't exist, it will just silently
		be dropped from the array

	Cases:
		Error: database error, no groupids param
		Success: the array of group objects
*/
function getarr(req, params, callback) {
	//make sure the groupid is there
	var paramErrors = api_validate.validate(params, {
		groupids: { required: true, isarray: true }
	});

	//TODO convert groupids to array (what if it is an array already?)

	//check errors on the input
	if (paramErrors) {
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	//if array is empty, return an empty array
	else if (params.groupids.length == 0) {
		return callback(api_utils.wrapResponse({
			params: params,
			success: []
		}));
	}
	else {
		dbReqGroupObjList(req, params, callback,
						  ARR_QUERY_STRING(params.groupids),
						  params.groupids.concat(params.groupids));
	}
}
exports.getarr = getarr;

/*
	Inputs:
		name - string, required, no weird chars, min 4 chars, max 60 chars
		description - string, required, no weird chars, min 12 chars, max 240 chars
		memberpost - boolean (if it is a non-empty string, it is considered true)
		memberinvite - boolean (if it is a non-empty string, it is considered true)

	Cases:
		error: database error or input params error
		success: the group object
*/
function create(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		name: { required: true, minlen: 4, maxlen: 60, isname2: true },
		description: { required: true, minlen: 12, maxlen: 240, isname2: true }
	});

	//convert the flags to booleans
	params.memberpost = (params.memberpost ? true : false);
	params.memberinvite = (params.memberinvite ? true : false);

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

				//now enter values into: Groups, GroupFlags, GroupMembers
				//the user who created the group is set as the owner
				db.insertTransaction(
					[
						{ query: 'insert into Groups (groupid, name, description) values(?, ?, ?)',
						  params: [ uuid, params.name, params.description ] },
						{ query: 'insert into GroupFlags (groupid, memberpost, memberinvite) values(?, ?, ?)',
						  params: [ uuid, (params.memberpost ? 1 : 0), (params.memberinvite ? 1 : 0) ] },
						{ query: 'insert into GroupMembers (groupid, username, status) values (?, ?, ?)',
						  params: [ uuid, req.session.user.username, 'owner'] },
						{ query: 'select * from Groups where groupid=?',
						  params: [ uuid ] }
					],
					getGroupCallback(req, params, function () {
						//TODO post a group-created message to the group
						
						//call the callback with the correct arguments
						callback.apply(null, arguments);
					})
				);
			}
		});
	}
}
exports.create = create;

/*
	Inputs:
		mystatus - (optional) one of 'any', 'member', 'admin', 'owner'
				 defaults to 'any'
		offset (optional, default 0) - the offset of the list of friends
		maxcount (optional, default to the max of 50) - the max number of friends to return

	Note: sorts results by the user's status. First 'owner', then 'admin', then 'member'

	Note that this function does adjust the returned input parameters to the maxcount
		and offset that were actually used. If maxcount was not given, it will be returned
		as set to 50. If one of them is negative, it will return as set to 0
		
*/
function list(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		mystatus: { inrange: [ 'any', 'member', 'admin', 'owner' ] },
		offset: { isnum: true },
		maxcount: { isnum: true }
	});

	//set default values
	if (!params.mystatus) params.mystatus = 'any';

	//correct the maxcount and offset
	if (typeof params.offset == 'undefined') params.offset = 0;			//default values
	if (typeof params.maxcount == 'undefined') params.maxcount = 50;
	params.offset = parseInt(params.offset);							//convert to ints
	params.maxcount = parseInt(params.maxcount);
	params.offset = Math.max(params.offset, 0);							//offset is at least 0
	params.maxcount = Math.min(Math.max(params.maxcount, 0), 50);		//maxcount between 0 and 50

	if (!req.session.user) {
		//make sure there is an auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		//something wrong with the given parameters
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//set the query string based on the params.mystatus parameter
		var querystr = 'select groupid from GroupMembers where username=?';
		var queryparams = [ req.session.user.username ];
		switch (params.mystatus) {
			case 'member': 	querystr += ' and status=?';
							queryparams.push(params.mystatus);
							break;
			case 'admin':	querystr +=  ' and status=?';
							queryparams.push(params.mystatus);
							break;
			case 'owner':	querystr += ' and status=?';
							queryparams.push(params.mystatus);
							break;
			case 'any': 	//do nothing, fall through to default
			default:		break; //no extra filters needed
		}

		//do the sorting
		querystr += ' order by field(status, ?, ?, ?)';
		queryparams.push('owner');
		queryparams.push('admin');
		queryparams.push('member');

		//do the limiting
		querystr += ' limit ?, ?';
		queryparams.push(params.offset);
		queryparams.push(params.maxcount);

		//make the query!
		db.query(
			querystr,
			queryparams,
			function (err, results) {
				if (err) {
					//return a database error
					return callback(api_errors.database(req.session.user, params, err));
				}
				else {
					//create an array of just the group id's
					var groups = results.map(function(entry) {
						return entry.groupid;
					});

					//call the getarr function on that array
					getarr(req, { groupids: groups }, function (data) {
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
							gen_utils.err_log('weird case: uyyyt92yg0058$2z');
							return callback(api_errors.internalServer(req.session.user, params));
						}
					});
				}
			}
		);
	}
}
exports.list = list;

//handles when the database returns the group data
function getGroupCallback(req, params, callback) {
	return function (err, results) {
		if (err) {
			//database error
			return callback(api_errors.database(req.session.user, params, err));
		}
		else if (results.length < 1) {
			//return a warning that the group doesn't exist
			return callback(api_warnings.noSuchGroup(req.session.user, params, params.groupid));
		}
		else if (results.length > 1) {
			//this shouldn't happen, return an internal server error
			gen_utils.err_log('Group ID ' + params.groupid + ' is not unique');
			return callback(api_errors.internalServer(req.session.user, params));
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
}

function ARR_QUERY_STRING(groupids) {
	var questions = '';
	for (i = 0; i < groupids.length; i++) {
		if (i == 0) questions += '?';
		else questions += ',?';
	}

	return 'select * ' +
			'from Groups ' +
			'where groupid in (' + questions + ') ' +
			'order by field(groupid, ' + questions + ')';
}

/*
	Makes a database call for a list of user objects
		querystr - the string of SQL to use
		queryparams - the array of params in the SQL query
*/
function dbReqGroupObjList(req, params, callback, querystr, queryparams) {
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
					return dbToApiGroup(user);
				});
				return callback(api_utils.wrapResponse({
					params: params,
					success: results
				}));
			}
		}
	);
}

//converts a row of the Groups table to a JSON object
function dbToApiGroup(group) {
	return {
		groupid: group.groupid,
		name: group.name,
		description: group.description
	}
}

//subdomains of the api
exports.invitations = invitations;
exports.members = members;

