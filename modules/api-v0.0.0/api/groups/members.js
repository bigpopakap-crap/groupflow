/*
	This API domain:
		/api/groups/members, api.groups.members

	REST functions:
		list - lists all the members of a group, with their statuses
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		GroupMembers

	Directly touches session variables:
		req.session.user
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_warnings = require('../util/api-warnings.js');
var api_validate = require('../util/api-validate.js');
var db = require('../../db.js');

//subdomain modules
var permissions = require('./members/permissions.js');

//other modules
var groups = require('../groups.js');
var users = require('../users.js');

function configure(app, url_prefix) {
	url_prefix += '/members';

	//configure subdomains
	permissions.configure(app, url_prefix);

	//configure this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/list', list);
}
exports.configure = configure;

/*
	Inputs:
		groupid (required)
		status (optional) - one of 'owner', 'admin', 'member'
		offset (optional, default 0) - the offset of the list of friends
		maxcount (optional, default to the max of 50) - the max number of friends to return

	Note: sorts results by the user's status. First 'owner', then 'admin', then 'member'

	Note that this function does adjust the returned input parameters to the maxcount
		and offset that were actually used. If maxcount was not given, it will be returned
		as set to 50. If one of them is negative, it will return as set to 0

	Cases:
		error: param errors, database, no such group
		success: the list of user objects
*/
function list(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		groupid: { required: true },
		status: { inrange: [ 'any', 'member', 'admin', 'owner' ] },
		offset: { isnum: true },
		maxcount: { isnum: true }
	});

	//set default values
	if (!params.status) params.status = 'any';

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
		//check that the group exists (from the user's view)
		groups.get(req, params, function (data) {
			var response = data.response;

			if (response.error) {
				//some error, relay it
				return callback(data);
			}
			else if (response.warning) {
				//no such group - return that error
				return callback(api_errors.noSuchGroup(req.session.user, params, params.groupid));
			}
			else if (response.success) {
				//the group exists! now get members of the group

				//if status isn't 'any', filter results for that status
				var filterstr = (params.status != 'any' ? ' and status=?' : '');
				var filterparams = (params.status != 'any' ? [ params.status ] : []);

				db.query(
					'select username from GroupMembers where groupid=?' + filterstr +
						' order by field(status, ?, ?, ?)',
					[ params.groupid ].concat(filterparams, ['owner', 'admin', 'member']),
					function (err, results) {
						if (err) {
							//return a database error
							return callback(api_errors.database(req.session.user, params, err));
						}
						else {
							//get a list of usernames of members
							var members = results.map(function(entry) {
								return entry.username;
							});

							//convert this to a list of user objects
							users.getarr(req, { usernames: members }, function (data) {
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
									gen_utils.err_log('weird case: 767629ahshsHIE');
									return callback(api_errors.internalServer(req.session.user, params));
								}
							});
						}
					}
				);
			}
			else {
				//some weird case - return internal server error and log it
				gen_utils.err_log('weird case: hhgi-295haahslwish');
				return callback(api_errors.internalServer(req.session.user, params));
			}
		});
	}
}
exports.list = list;

//export the subdomains
exports.permissions = permissions;

