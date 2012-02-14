var express = require('express');
var gen_utils = require('./modules/gen-utils.js');
var api = require('./modules/api-v0.0.0/api.js');

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
	if (req.session.user) /* TODO go to a different page */ gen_utils.render(req, res, 'landing.ejs');
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
