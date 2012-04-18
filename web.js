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
app.get('/register', function(req, res, next) {
	//make sure there is NOT an auth'd user
	if (!req.session.user) gen_utils.render(req, res, 'register.ejs');
	else return next();
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
		//get the user's friend list
		api.friends.list(req, {}, function (friend_data) {
			//get the user's incoming friend requests
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

//search users for friends page
app.get('/friends/search', function(req, res, next) {
	if (req.session.user) gen_utils.render(req, res, 'user-friends-search.ejs', { query_submitted: false });
	else return next();
});
//handle the actual search query
app.post('/friends/search', function(req, res, next) {
	if (req.session.user) {
		var query = req.param('query');

		//treat an empty query as a GET request
		if (!query) {
			return res.redirect('/friends/search');
		}

		api.users.search(req, { query: query }, function(data) {
			var response = data.response;

			if (response.success) {
				//there were results returned (or maybe an empty list)
				gen_utils.render(req, res, 'user-friends-search.ejs', {
					query_submitted: true,
					query: query,
					users: response.success,
					error: ""
				});
			}
			else if (response.error) {
				//some error occurred
				gen_utils.render(req, res, 'user-friends-search.ejs', {
					query_submitted: true,
					query: query,
					users: [],
					error: response.error.userMsg
				});
			}
			else {
				//this should no happen, but it should be handled as an error
				gen_utils.err_log('weird case: l02hsaaah29335hG'); //log that this happened
				gen_utils.render(req, res, 'user-friends-search.ejs', {
					query_submitted: true,
					query: query,
					users: [],
					error: 'Uh oh! Something went wrong while processing your request'
				});
			}
		});
	}
	else return next();
});

//group list page
app.get('/groups', function(req, res, next) {
	//make sure there is an auth'd user
	if (req.session.user) {
		//get the user's group list
		api.groups.list(req, {}, function (group_data) {
			//get the incoming group invitations
			api.groups.invitations.me.listin(req, {}, function (invitation_data) {
				var group_response = group_data.response;
				var group_params = group_data.request.params;

				var invitation_response = invitation_data.response;
				var invitation_params = invitation_data.request.params;

				if (group_response.success && invitation_response.success) {
					gen_utils.render(req, res, 'user-groups.ejs', {
						groups: {
							list: group_response.success,
							offset: group_params.offset,
							maxcount: group_params.maxcount
						},
						invitations: {
							list: invitation_response.success,
							offset: invitation_params.offset,
							maxcount: invitation_params.maxcount
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

//group creation page
app.get('/groups/create', function (req, res, next) {
	if (req.session.user) gen_utils.render(req, res, 'user-groups-create.ejs');
	else return next();
});
//handle group creation form submission
app.post('/groups/create', function (req, res, next) {
	api.groups.create(req, gen_utils.getParams(req), function(data) {
		//if successful, go to back to the root, which will go to the homepage
		if (data.response.success) {
			res.redirect('/group?groupid=' + data.response.success.groupid);
		}
		//else display the errors on this page
		else if (data.response.error) {
			gen_utils.render(req, res, 'user-groups-create.ejs', {
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

app.get('/group', function (req, res, next) {
	if (req.session.user) {
		//get the groupid parameter
		var groupid = req.param('groupid');
		if (groupid) {
			//get the group object
			api.groups.get(req, { groupid: groupid }, function (group_data) {

				if (group_data.response.success) {

					//get the user's permissions
					api.groups.members.permissions.me(req, { groupid: groupid }, function (perm_data) {
						//get the permissions if successful, else just default to no permissions
						//TODO display an error on failure?
						var permissions = {};
						if (perm_data.response.success) permissions = perm_data.response.success;					

						//get the group posts
						api.groups.posts.list(req, { groupid: groupid}, function (post_data) {
							var posts = [];
							if (post_data.response.success) posts = post_data.response.success
							//TODO show an error if not success?

							//render the page if the group was gotten
							gen_utils.render(req, res, 'group-home.ejs', {
								group: group_data.response.success,
								permissions: permissions,
								posts: posts
							});
						});
					});

				}
				else {
					//TODO display some error?
					res.redirect('/groups');
				}

			});
		}
		else {
			//no groupid specified, go back to the groups page
			res.redirect('/groups');
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
//linking facebook account
app.post('/settings/facebook/link', function (req, res, next) {
	//make sure there's an auth'd user
	if (req.session.user) {
		api.accounts.facebook.link(req, gen_utils.getParams(req), function (data) {
			//TODO what to do if there is an error?
			console.log(data.response);
			res.redirect('/settings');
		});
	}
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

