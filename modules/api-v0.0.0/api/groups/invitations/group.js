/*
	This API domain:
		/api/groups/invitations/group, api.groups.invitations.group

	REST functions:
		listout - lists all outgoing group invitations for a particular group
		cancel - cancels an outgoing invitation initiated by the auth'd user
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		GroupInvitations (read/write)
		TODO

	Directly touches session variables:
		req.session.user
*/
var api_utils = require('../../util/api-utils.js');
var api_errors = require('../../util/api-errors.js');
var api_warnings = require('../../util/api-warnings.js');
var api_validate = require('../../util/api-validate.js');
var db = require('../../../db.js');

//other api modules
var members = require('../members.js');

function configure(app, url_prefix) {
	url_prefix += '/group';

	//configure this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/listout', listout);
	api_utils.restHandler(app, 'post', url_prefix + '/cancel', cancel);
}
exports.configure = configure;

/*
	Inputs
		groupid - the id of the group to see outgoing invitations for
		offset (optional, default 0) - the offset of the list of invitations
		maxcount (optional, default to the max of 50) - the max number of invitations to return

	Note that this function does adjust the returned input parameters to the maxcount
		and offset that were actually used. If maxcount was not given, it will be returned
		as set to 50. If one of them is negative, it will return as set to 0

	Cases:
		Error:  no auth,
				missing input params,
				auth'd user not in group,
				auth'd user doesn't have permission
		Success:
				the array of invitation objects where the groupid is the one given
*/
function listout(req, params, callback) {
	paramErrors = api_validate.validate(params, {
		groupid: { required: true },
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
	else if (paramErrors) {
		//errors in passed parameters
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//check if the user is in the group and has permission at the same time
		members.permissions.me(req, params, function (data) {
			var response = data.response;

			if (response.error) {
				//relay the error, whatever it is
				return callback(data);
			}
			else if (response.success) {
				//got the permissions. can the user view the invitations?
				if (response.success.viewinvitations) {
					//the user can view the invitations!
					db.query(
						'select * from GroupInvitations where groupid=? limit ?, ?',
						[ params.groupid, params.offset, params.maxcount ],
						function (err, results) {
							if (err) {
								//database error
								return callback(api_errors.database(req.session.user, params, err));
							}
							else {
								//directly return the results, they have the correct object structure
								return callback(api_utils.wrapResponse({
									params: params,
									success: results
								}));
							}
						}
					);
				}
				else {
					//return the generic no permission error
					return callback(api_errors.noPermission(req.session.user, params));
				}
			}
			else {
				//some weird case - return internal server error and log it
				gen_utils.err_log('weird case: opghwhHIG--2u');
				return callback(api_errors.internalServer(req.session.user, params));
			}
		});
	}
}
exports.listout = listout;

/*
	TODO
*/
function cancel(req, params, callback) {
	//TODO
}
exports.cancel = cancel;


