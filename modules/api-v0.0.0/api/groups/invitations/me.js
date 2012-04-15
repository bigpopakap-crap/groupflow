/*
	This API domain:
		/api/groups/invitations/me, api.groups.invitations.me

	REST functions:
		listin - lists all incoming group invitations
		listout - lists all outgoing group invitations sent by the auth'd user
				  can be filtered by which group
		accept - accepts an invitation
		reject - rejects an invitation
		cancel - cancels an outgoing invitation initiated by the auth'd user
	
	Internal-only functions:
		(none)

	Directly touches database tables:
		GroupInvitations (read/write)
		GroupMembers (read/write)

	Directly touches session variables:
		req.session.user
*/
var api_utils = require('../../util/api-utils.js');
var api_errors = require('../../util/api-errors.js');
var api_warnings = require('../../util/api-warnings.js');
var api_validate = require('../../util/api-validate.js');
var db = require('../../../db.js');

//other api modules
var invitations = require('../invitations.js');

function configure(app, url_prefix) {
	url_prefix += '/me';

	//configure this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/listin', listin);
	api_utils.restHandler(app, 'get', url_prefix + '/listout', listout);
	api_utils.restHandler(app, 'post', url_prefix + '/accept', accept);
	api_utils.restHandler(app, 'post', url_prefix + '/reject', reject);
	api_utils.restHandler(app, 'post', url_prefix + '/cancel', cancel);
}
exports.configure = configure;

/*
	Inputs:
		offset (optional, default 0) - the offset of the list of friends
		maxcount (optional, default to the max of 50) - the max number of friends to return

	Note that this function does adjust the returned input parameters to the maxcount
		and offset that were actually used. If maxcount was not given, it will be returned
		as set to 50. If one of them is negative, it will return as set to 0

	Cases:
		Error: no auth, database
		Success: an array of pending request objects, where the auth'd user is the recipient
*/
var listin = listfun('recipient');
exports.listin = listin;

/*
	Inputs:
		offset (optional, default 0) - the offset of the list of friends
		maxcount (optional, default to the max of 50) - the max number of friends to return

	Note that this function does adjust the returned input parameters to the maxcount
		and offset that were actually used. If maxcount was not given, it will be returned
		as set to 50. If one of them is negative, it will return as set to 0

	Cases:
		Error: no auth, database
		Success: an array of pending request objects, where the auth'd user is the requester
*/
var listout = listfun('requester');
exports.listout = listout;

/*
	Base for the two list functions:
		role = 'requester' for outgoing invitations
		role = 'recipient' for incoming invitations
*/
function listfun(role) {
	return function(req, params, callback) {
		var paramErrors = api_validate.validate(params, {
			offset: { isnum: true },
			maxcount: { isnum: true }
		});

		if (!req.session.user) {
			//no auth'd user
			return callback(api_errors.noAuth(req.session.user, params));
		}
		else if (paramErrors) {
			return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
		}
		else {
			//correct the maxcount and offset
			if (typeof params.offset == 'undefined') params.offset = 0;			//default values
			if (typeof params.maxcount == 'undefined') params.maxcount = 50;
			params.offset = parseInt(params.offset);							//convert to ints
			params.maxcount = parseInt(params.maxcount);
			params.offset = Math.max(params.offset, 0);							//offset is at least 0
			params.maxcount = Math.min(Math.max(params.maxcount, 0), 50);		//maxcount between 0 and 50								

			db.query(
				'select * from GroupInvitations where ' + role + '=? limit ?, ?',
				[ req.session.user.username, params.offset, params.maxcount ],
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
	}
}

/*
	TODO
*/
function accept(req, params, callback) {
	//TODO
}
exports.accept = accept;

/*
	Inputs:
		groupid - the group invitation to reject

	(Since the invitations have unique (recipient, groupid) pairings, this
		pair uniquely defines the invitation)

	Cases:
		Error: no auth, param errors, no pending group invitation
		Success: the groupid
*/
var reject = deletefun('recipient', function (req, params) {
	return api_errors.noSuchIncomingGroupInvitation(req.session.user, params, params.groupid);
});
exports.reject = reject;

/*
	Inputs:
		username - the recipient of the invitation
		groupid - the group invitation to reject

	(Since the invitations have unique (recipient, groupid) pairings, this
		pair uniquely defines the invitation)

	Cases:
		Error: no auth, param errors, no pending group invitation
		Success: the groupid
*/
var cancel = deletefun('requester', function (req, params) {
	return api_errors.noSuchOutgoingGroupInvitation(req.session.user, params, params.username, params.groupid);
});
exports.cancel = cancel;

function deletefun(role, noInvErrGen) {
	return function (req, params, callback) {
		//switch the param errors criteria based on whether we are doing incoming or
		//		outgoing invitations
		var paramErrors;
		switch (role) {
			//outgoing invitations
			case 'requester':		paramErrors = api_validate.validate(params, {
										username: { required: true },
										groupid: { required: true }
									});
									break;

			//incoming invitations
			case 'recipient':		paramErrors = api_validate.validate(params, {
										groupid: { required: true }
									});
									break;

			default: 				gen_utils.err_log('weird case: bihea;jhwi:L');
									return callback(api_errors.internalServer(req.session.user, params));
		}

		if (!req.session.user) {
			//no auth'd user
			return callback(api_errors.noAuth(req.session.user, params));
		}
		else if (paramErrors) {
			//errors in input parameters
			return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
		}
		else {
			//the criteria on which to match the invitation (fields joined with ANDs)
			var criteria = { groupid: params.groupid };
			switch (role) {
				//outgoing invitations
				case 'requester': 		criteria[role] = req.session.user.username;
										criteria.recipient = params.username;
										break;

				//incoming invitations
				case 'recipient': 		criteria[role] = req.session.user.username;
										break;

				default:				gen_utils.err_log('weird case: s8%h9sfqhhn');
										return callback(api_errors.internalServer(req.session.user, params));		
			}

			//cancel the invitation
			invitations.cancelExec(criteria, function (status, err) {
				switch (status) {
					case 'deleted': 	return callback(api_utils.wrapResponse({
											params: params,
											success: params.groupid
										}));
				
					case 'noaction': 	return callback(noInvErrGen(req, params));
				
					case 'error': 		return callback(api_errors.database(req.session.user, params, err));
				
					default: 			gen_utils.err_log('weird case: $$%h9HLFSH[hphhn');
										return callback(api_errors.internalServer(req.session.user, params));
				}
			});
		}
	}
}

