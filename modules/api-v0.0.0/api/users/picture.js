/*
	This API domain:
		/api/users/picture, (no internal module)

	REST functions:
		get - gets the picture for the given username (REST only)
		me - gets the picture for the auth'd user (REST only)
	
	Internal-only functions:
		--

	Directly touches database tables:
		(none)

	Directly touches session variables:
		req.session.user (read)
*/
var gen_utils = require('../../../gen-utils.js');
var api_validate = require('../util/api-validate.js');
var url_path = '/';
var accounts = require('../accounts.js');

function configure(app, url_prefix) {
	url_prefix += '/picture';
	url_path = url_prefix;

	//configure this domain
	app.get(url_prefix + '/get', get);
	app.get(url_prefix + '/me', me);
}
exports.configure = configure;

/*
	Cases:
		error: 400 bad picture type, 404 no username
		success: the image
*/
function get(req, res) {
	var params = gen_utils.getParams(req);
	var paramErrors = api_validate.validate(params, {
		username: { required: true },
		type: { range: ['square', 'small', 'normal', 'large'] }
	});

	if (paramErrors && paramErrors.username) {
		//no username was given
		gen_utils.respondErr(res, 400, 'The username parameter is required').end();
	}
	else if (paramErrors && paramErrors.type) {
		//the type parameter was not one of the allowed values
		gen_utils.respondErr(res, 400, 'The type parameter must be one of: square, small, normal or large').end();
	}
	else {
		accounts.facebook.get(req, { username: params.username }, function (data) {
			if (data.response.success) {
				//the facebook id was gotten
				var fbid = data.response.success;
				var type = params.type;

				res.redirect('https://graph.facebook.com/' + fbid + '/picture' + 
								(type ? '?type=' + type : ''));
			}
			else {
				//no linked facebook, use placeholder images
				//redirect to the image of the corresponding size
				var type = params.type;
				if (!type || type == 'square' || type == 'small') {
					res.redirect('/public/images/default_userpic_small.png');
				}
				else if (type == 'normal') {
					res.redirect('/public/images/default_userpic_medium.png');
				}
				else {
					res.redirect('/public/images/default_userpic_large.png');
				}
			}
		});
	}
}

/*
	Cases:
		error: 401 no auth'd user, 400 bad picture type
		success: the image
*/
function me(req, res) {
	if (!req.session.user) {
		//no auth' user
		gen_utils.respondErr(res, 401, 'This method requires user authentication').end();
	}
	else {
		//redirect to the get method with the correct username
		var params = gen_utils.getParams(req);
		var type = params.type;
		res.redirect(
			url_path +
			'/get?username=' + req.session.user.username +
			(type ? '&type=' + type : '')
		);
	}
}

