/*
	This API domain:
		/api/groups/invitations, api.groups.invitations

	REST functions:
		create - creates a new group invitation
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		(none)

	Directly touches session variables:
		(none)
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_warnings = require('../util/api-warnings.js');
var api_validate = require('../util/api-validate.js');
var db = require('../../db.js');

//other modules
var members = require('./members.js');
var users = require('../users.js');

//subdomain modules
var group = require('./invitations/group.js');
var me = require('./invitations/me.js');

function configure(app, url_prefix) {
	url_prefix += '/invitations';

	//configure this api domain
	api_utils.restHandler(app, 'post', url_prefix + '/create', create);

	group.configure(app, url_prefix);
	me.configure(app, url_prefix);
}
exports.configure = configure;

/*
	Inputs:
		username (required) - username of the user to invite
		groupid (required) - the group to invite them to

	Cases:
		Error:
				params not passed
				no auth'd user,
				group doesn't exist (as seen by auth'd user),
				auth'd user has no permission to invite,
				username doesn't exist,
				username already in group

		Warning:
				username already has pending invitation

		Success:
				the invitation object
				{
					requester: (username),
					recipient: (username),
					groupid: (groupid)
				}
*/
function create(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		username: { required: true },
		groupid: { required: true }
	});

	if (!req.session.user) {
		//no auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		//errors in passed parameters
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//check if the group exists AND whether the auth'd user has permission to invite
		members.permissions.me(req, params, function (data) {
			var response = data.response;

			if (response.error) {
				//relay it, whatever it was
				return callback(data);
			}
			else if (response.success) {
				//the group exists! do they have invitation permission?
				if (response.success.invite) {
					//the user has permission to invite!
					//now check if the other user exists
					users.get(req, params, function (data) {
						var response = data.response;

						if (response.error) {
							//some error, relay it
							return callback(data);
						}
						else if (response.warning) {
							//no such user, return that error
							return callback(api_errors.noSuchUsername(req.session.user, params, params.username));
						}
						else {
							//the user exists! yay!
							//check whether the user is already a member of the group
							members.is(req, params, function (data) {
								var response = data.response;

								if (response.error) {
									//relay the error
									return callback(data);
								}
								else if (response.success) {
									//the user is already part of the group, return that error
									return callback(api_errors.alreadyInGroup(req.session.user, params, params.username, params.groupid));
								}
								else {
									//try adding the new invitation, return a warning if it was already there
									db.query(
										'insert into GroupInvitations (requester, recipient, groupid) values (?, ?, ?)',
										[ req.session.user.username, params.username, params.groupid ],
										function (err, results) {
											if (err && (err.number == 1060 || err.number == 1061 || err.number == 1062)) {
												//warn that there was already an outgoing request
												return callback(api_warnings.groupInvitationAlreadySent(req.session.user, params, params.username, params.groupid));
											}
											else if (err) {
												//some other database error
												return callback(api_errors.database(req.session.user, params, err));
											}
											else {
												//TODO send the recipient a notification of the request

												//successfully sent the request!
												return callback(api_utils.wrapResponse({
													params: params,
													success: {
														requester: req.session.user.username,
														recipient: params.username,
														groupid: params.groupid
													}
												}));
											}
										}
									);
								}
							});
						}
					});
				}
				else {
					//return the generic no permission error
					return callback(api_errors.noPermission(req.session.user, params));
				}
			}
			else {
				//some weird case - return internal server error and log it
				gen_utils.err_log('weird case: sibn;wah#8sh');
				return callback(api_errors.internalServer(req.session.user, params));
			}
		});
	}
}
exports.create = create;

//export the subdomains
exports.group = group;
exports.me = me;


