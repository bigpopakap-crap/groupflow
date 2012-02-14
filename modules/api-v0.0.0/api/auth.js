//subdomain modules
var register = require('./auth/register.js');
var login = require('./auth/login.js');
var logout = require('./auth/logout.js');
var facebook = require('./auth/facebook.js');

//function to configure the app
exports.configure = function(app, url_prefix) {
	url_prefix += '/auth';	

	//configure each of the domains
	register.configure(app, url_prefix);
	login.configure(app, url_prefix);
	logout.configure(app, url_prefix);
	facebook.configure(app, url_prefix);
}

//subdomains of the api
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.facebook = facebook;

