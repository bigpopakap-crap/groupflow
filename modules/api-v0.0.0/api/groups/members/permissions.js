/*
	This API domain:
		/api/groups/members/permissions, api.groups.members.permissions

	REST functions:
		me - gets the auth'd users permissions for a group they are in
	
	Internal-only functions:
		none

	Directly touches database tables:
		GroupMembers (read)
		GroupFlags (read)

	Directly touches session variables:
		req.session.user
*/
var api_utils = require('../../util/api-utils.js');
var api_errors = require('../../util/api-errors.js');
var api_warnings = require('../../util/api-warnings.js');
var api_validate = require('../../util/api-validate.js');
var db = require('../../../db.js');

//other api modules
var groups = require('../../groups.js');

function configure(app, url_prefix) {
	url_prefix += '/permissions';

	//configure this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/me', me);
}
exports.configure = configure;

/*
	Inputs:
		groupid (required)

	Case:
		error: no group id, group doesn't exist, database
		success: the user permissions object
*/
function me(req, params, callback) {
	paramErrors = api_validate.validate(params, {
		groupid: { required: true }
	});

	if (!req.session.user) {
		//make sure there is an auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		//errors in the input parameters
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//get the groupflags and make sure the user is in the group
		db.query('select f.memberpost, f.memberinvite, m.status from (GroupFlags f, GroupMembers m) ' +
					'where m.groupid=f.groupid and m.username=? and m.groupid=?',
			[ req.session.user.username, params.groupid ],
			function (err, results) {
				if (err) {
					//database error
					return callback(api_errors.database(req.session.user, params, err));
				}
				else if (results.length == 0) {
					//no such group, since there were no results returned
					return callback(api_errors.noSuchGroup(req.session.user, params, params.groupid));
				}
				else {
					//return the user permissions based on the flags and status
					var permissions = groupStatusToPermissions(results[0]);

					if (permissions) {
						return callback(api_utils.wrapResponse({
							params: params,
							success: permissions
						}));
					}
					else {
						//something went wrong in the last function
						return callback(api_errors.internalServer(req.session.user, params));
					}
				}
			}
		);
	}
}
exports.me = me;

/*
	converts the group to a permissions object, where the flags object
	contains:
		memberpost (1 or 0) as a number
		memberinvite (1 or 0) as a number
		status ('owner', 'admin', 'member')
*/
function groupStatusToPermissions(flags) {
	switch (flags.status) {
		case 'owner':		return {
								receive: true,				//receive posts?
								post: true,					//make posts?
								delete: true,				//delete OTHERS' posts (can always delete own)
								invite: true,				//invite their friends?
								cancel: true,				//cancel OTHERS' outgoing invitations? (can always cancel your own)
								leave: false,				//leave the group? (only the owner can't)
								kick: true,					//kick others out?
								promote: true,				//promote a member to admin?
								demote: true,				//demote admin back to member?
								viewmembers: true,			//view list of members?
								permissions: 'view'			//view or edit member permissions?
							};
		case 'admin':		return {
								receive: true,
								post: true,
								delete: true,
								invite: true,
								cancel: true,
								leave: true,
								kick: true,
								promote: true,
								demote: false,
								viewmembers: true,
								permissions: 'view'
							};
		case 'member': 		return {
								receive: true,
								post: (memberpost ? true : false),
								delete: false,
								invite: (memberinvite ? true : false),
								cancel: false,
								leave: false,
								kick: false,
								promote: false,
								demote: false,
								viewmembers: true,
								permissions: 'none'
							};
		default:			gen_utils.err_log('unhandled status type in groupStatusToPermissions(): ' + flags.status);
							return null;
	}
}

