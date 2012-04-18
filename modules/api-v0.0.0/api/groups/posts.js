/*
	This API domain:
		/api/groups/posts, api.groups.posts

	REST functions:
		list - lists all group posts, ordered from most recent to least recent
		create - creates a new post to the group
	
	Internal-only functions:
		system - creates a system post to the group

	Directly touches database tables:
		GroupPosts
		GroupPostsRecipients

	Directly touches session variables:
		req.session.user
*/
var api_utils = require('../util/api-utils.js');
var api_errors = require('../util/api-errors.js');
var api_warnings = require('../util/api-warnings.js');
var api_validate = require('../util/api-validate.js');
var db = require('../../db.js');

//other modules
var groups = require('../groups.js');

function configure(app, url_prefix) {
	url_prefix += '/posts';

	//configure this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/list', list);
	api_utils.restHandler(app, 'post', url_prefix + '/create', create);
}
exports.configure = configure;

/*
	Inputs:
		groupid

	Note it doesn't matter what the user's permissions are currently in the group,
	any post which they can see based on the GroupPostsRecipients table will be
	shown to them

	//TODO add paging

	Cases:
		Error: no auth'd user, no such group, database
		Success: the post objects
		{
			poster: username,
			content: " the text "
		}
*/
function list(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		groupid: { required: true }
	});

	if (!req.session.user) {
		//make sure there is an auth'd user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		//something wrong with the given parameters
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		//make sure the group exists
		groups.get(req, params, function (data) {
			var response = data.response;

			if (response.success) {
				var group = response.success;

				//get all postids this user has received
				db.query(
					'select postid from GroupPostsRecipients where username=?',
					[ req.session.user.username ],
					function (err, results) {
						if (err) {
							//database error
							return callback(api_errors.database(req.session.user, params, err));
						}
						else {
							//convert the results to just a list of postids
							var postids = results.map(function(entry) {
								return entry.postid;
							});

							//if an empty array, just return an empty array
							if (postids.length == 0) {
								return callback(api_utils.wrapResponse({
									params: params,
									success: []
								}));
							}

							//get the posterid and content of each post
							db.query(
								ARR_QUERY_STRING(postids),
								postids,
								function (err, results) {
									if (err) {
										//database error
										return callback(api_errors.database(req.session.user, params, err));
									}
									else {
										//return the posts as a success
										return callback(api_utils.wrapResponse({
											params: params,
											success: results
										}));
									}
								}
							);
						}
					}
				);
			}
			else if (response.warning) {
				//no such group! return that error
				return callback(api_errors.noSuchGroup(req.session.user, params, params.groupid));
			}
			else if (response.error) {
				//relay the error
				return callback(data);
			}
			else {
				//TODO weird case
			}
		});
	}
}
exports.list = list;

function ARR_QUERY_STRING(postids) {
	var questions = '';
	for (i = 0; i < postids.length; i++) {
		if (i == 0) questions += '?';
		else questions += ',?';
	}

	return 'select poster, content ' +
			'from GroupPosts ' +
			'where postid in (' + questions + ') ' +
			'order by timestamp desc';
}

/*
	Inputs:
		groupid
		text (max 240 chars)

	Cases:
		Error: no auth'd user, bad params, no permission to post, database
		Success: the text of the post
*/
function create(req, params, callback) {
	//TODO
}
exports.create = create;

/*
	Inputs:
		groupid
		text (max 240 chars)

	Cases:
		Error: bad params, database
		Success: the text of the post
*/
function system(req, params, callback) {
	//TODO
}
exports.system = system;

/*
	Helper for "create" and "system"

	Inputs:
		poster: the username of the poster of the message,
				or NULL if it is a system post
		groupid
		text (max 240 chars)

	Cases:
		Error: bad params, database
		Success: the text of the post
*/
function post(req, params, callback) {
	//TODO
}

