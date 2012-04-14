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
		status (optional, defaults to 'member') - the status you want to give them

	Cases:
	
*/
function create(req, params, callback) {
	
}

//export the subdomains
exports.group = group;
exports.me = me;


