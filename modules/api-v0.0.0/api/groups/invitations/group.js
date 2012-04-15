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

function configure(app, url_prefix) {
	url_prefix += '/group';

	//configure this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/listout', listout);
	api_utils.restHandler(app, 'post', url_prefix + '/cancel', cancel);
}
exports.configure = configure;

/*
	TODO
*/
function listout(req, params, callback) {
	//TODO
}
exports.listout = listout;

/*
	TODO
*/
function cancel(req, params, callback) {
	//TODO
}
exports.cancel = cancel;


