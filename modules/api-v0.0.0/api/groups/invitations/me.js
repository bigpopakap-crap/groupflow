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
		TODO

	Directly touches session variables:
		req.session.user
*/
var api_utils = require('../../util/api-utils.js');
var api_errors = require('../../util/api-errors.js');
var api_warnings = require('../../util/api-warnings.js');
var api_validate = require('../../util/api-validate.js');
var db = require('../../../db.js');

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
		(none)

	Cases:
		Error: no auth, database
		Success: an array of pending request objects, where the auth'd user is the recipient
*/
var listin = listfun('recipient');
exports.listin = listin;

/*
	Inputs:
		(none)

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
		if (!req.session.user) {
			//no auth'd user
			return callback(api_errors.noAuth(req.session.user, params));
		}
		else {
			db.query(
				'select * from GroupInvitations where ' + role + '=?',
				[ req.session.user.username ],
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
	TODO
*/
function reject(req, params, callback) {
	//TODO
}
exports.reject = reject;

/*
	TODO
*/
function cancel(req, params, callback) {
	//TODO
}
exports.cancel = cancel;

