/*
	This API domain:
		/api/groups/members/permissions, api.groups.members.permissions

	REST functions:
		my - gets the auth'd users permissions for a group they are in
		list - gets a list of users and their permissions for a group that
				the auth'd user is an admin or owner of
	
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

function configure(app, url_prefix) {
	url_prefix += '/permissions';

	//configure this api domain
	//TODO
}
exports.configure = configure;

function my(req, params, callback) {
	//TODO
}
exports.my = my;

function list(req, params, callback) {
	//TODO
}
exports.list = list;

