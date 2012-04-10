/*
	This API domain:
		/api/groups/invitations, api.groups.invitations

	REST functions:
		(none)
	
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

	group.configure(app, url_prefix);
	me.configure(app, url_prefix);
}
exports.configure = configure;

//export the subdomains
exports.group = group;
exports.me = me;


