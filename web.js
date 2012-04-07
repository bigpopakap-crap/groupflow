var express = require('express');
var api = require('./modules/api-v0.0.0/api.js');
var gen_utils = require('./modules/gen-utils.js').useApi(api);

var app = express.createServer(
	express.logger(),
	express.bodyParser(),
	express.cookieParser(),
	express.session({ secret: process.env.SESSION_SECRET })
);
app.use('/public', express.static(__dirname + '/public'));

//configure the api, which includes the auth stuff
api.configure(app);

/*
	***** BEGIN PAGE ROUTING ******************************************
*/
//go to the landing page, or home page
app.get('/', function(req, res) {
	if (req.session.user) gen_utils.render(req, res, 'user-home.ejs');
	else gen_utils.render(req, res, 'landing.ejs');
});
//handle login POST request
app.post('/', function(req, res) {
	api.auth.login(req, gen_utils.getParams(req), function(data) {
		//if successful, go to back to the root, which will go to the homepage
		if (data.response.success) {
			res.redirect('/');
		}
		//else display the errors on this page
		else if (data.response.error) {
			gen_utils.render(req, res, 'landing.ejs', {
				errors: [data.response.error.userMsg],
				param_errors: data.response.error.paramErrors
			});
		}
		//else in some weird state... log that error and go back to the root
		else {
			//TODO display an error message?
			gen_utils.err_log('weird case: 22jsljf8673SHFHsl29x-28');
			res.redirect('/');
		}
	});
});

//go to the registration page
app.get('/register', function(req, res) {
	gen_utils.render(req, res, 'register.ejs');
});
//handle register POST request
app.post('/register', function(req, res) {
	api.auth.register(req, gen_utils.getParams(req), function(data) {
		//if successful, go to back to the root, which will go to the homepage
		if (data.response.success) {
			res.redirect('/');
		}
		//else display the errors on this page
		else if (data.response.error) {
			gen_utils.render(req, res, 'register.ejs', {
				errors: [data.response.error.userMsg],
				param_errors: data.response.error.paramErrors
			});
		}
		//else in some weird state... log that error and go back to the root
		else {
			//TODO display an error message?
			gen_utils.err_log('weird case: shfihwlsh28HSh2hsa');
			res.redirect('/');
		}
	});
});

//notifications page (same as home)
app.get('/notifications', function(req, res) {
	res.redirect('/');
});

//view friends page
app.get('/friends', function(req, res, next) {
	//make sure there is an auth'd user
	if (req.session.user) {
		api.friends.list(req, {}, function (friend_data) {
			api.friends.requests.listin(req, {}, function (requests_data) {
				var friend_response = friend_data.response;
				var friend_params = friend_data.request.params;

				var requests_response = requests_data.response;
				var requests_params = requests_data.request.params;

				if (friend_response.success && requests_response.success) {
					gen_utils.render(req, res, 'user-friends.ejs', {
						friends: {
							list: friend_response.success,
							offset: friend_params.offset,
							maxcount: friend_params.maxcount
						},
						requests: {
							list: requests_response.success,
							offset: requests_params.offset,
							maxcount: requests_params.maxcount
						}
					});
				}
				else {
					//TODO what to do here?
				}
			});
		});
	}
	else return next();
});
//actions on the friend page
app.post('/friends', function(req, res, next) {
	if (req.session.user) {
		function afterAction(data) {
			if (data.response.success) {
				//redirect to the same page
				res.redirect('/friends');
			}
			else {
				//TODO show some sort of error
			}
		}

		//get the action parameter
		var action = req.param('action');
		if (action == 'accept-request') {
			var username = req.param('username');
			api.friends.requests.accept(req, { username: username }, afterAction);
		}
		else if (action == 'decline-request') {
			var username = req.param('username');
			api.friends.requests.reject(req, { username: username }, afterAction);
		}
		else {
			return next();
		}
	}
	else return next();
});

//account settings page
app.get('/settings', function(req, res, next) {
	//make sure there is an auth'd user
	if (req.session.user) gen_utils.render(req, res, 'user-settings.ejs');
	else return next();
});

//feedback page
app.get('/feedback', function(req, res, next) {
	//make sure there is an auth'd user
	if (req.session.user) gen_utils.render(req, res, 'feedback.ejs');
	else return next();
});

//command line page (for privileged users)
app.get('/devtools/cmdline', function(req, res, next) {
	//make sure the user has access to devtools
	api.users.permissions.get(req, gen_utils.getParams(req), function(data) {
		//data.response.success is the permission object, if it exists
		if (data.response.success && data.response.success.devtools)
			gen_utils.render(req, res, 'devtools/cmd-line.ejs');
		else return next();
	});
});

//app documentation (for privileged users)
app.get('/devtools/appdoc', function(req, res, next) {
	//make sure the user has access to devtools
	api.users.permissions.get(req, gen_utils.getParams(req), function(data) {
		//data.response.success is the permission object, if it exists
		if (data.response.success && data.response.success.devtools)
			gen_utils.render(req, res, 'devtools/app-doc.ejs');
		else return next();
	});
});

//logout path
app.get('/logout', function(req, res) {
	api.auth.logout(req, gen_utils.getParams(req), function(data) {
		//make sure the response was success or warning
		if (data.response.success || data.response.warning) {
			res.redirect('/');
		}
		//else the function returned something it never should have
		else {
			//TODO display an error message?
			gen_utils.err_log('weird case: xxkgh80afh8*HSla-2');
			res.redirect('/');
		}
	});
});

//any unhandled path goes back to the root
app.get('/*', function(req, res) {
	res.redirect('/');
});
/*
	***** END PAGE ROUTING ******************************************
*/

var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log('listening on port ' + port);
});
