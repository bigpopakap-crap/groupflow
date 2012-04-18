/*
	This API domain:
		/api/notifications, api.notifications

	REST functions:
		num - gets the number of notifications this user has
		list - lists the notifications this user has
		markread - marks a notification as read
	
	Internal-only functions:
		notify - adds a new notification for a given user

	Directly touches database tables:
		Notifications

	Directly touches session variables:
		req.session.user (read)
*/
var api_utils = require('./util/api-utils.js');
var api_errors = require('./util/api-errors.js');
var api_warnings = require('./util/api-warnings.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');

function configure(app, url_prefix) {
	url_prefix += '/notifications';

	//configure this api domain
	api_utils.restHandler(app, 'get', url_prefix + '/num', num);
	api_utils.restHandler(app, 'get', url_prefix + '/list', list);
	api_utils.restHandler(app, 'post', url_prefix + '/markread', markread);
}
exports.configure = configure;

/*
	The types of notifications
*/
var TYPES = {
	NEW_GROUP_INVITATION: 'ngi',
	NEW_FRIEND_REQUEST: 'nfr',
	ACCEPTED_FRIEND_REQUEST: 'afr'
}
exports.TYPES = TYPES;

/*
	gets the number of unread notifications for the auth'd user

	Cases:
		Error: no auth, database
		Success: the number of unread notifications
*/
function num(req, params, callback) {
	if (!req.session.user) {
		//no auth' user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else {
		db.query(
			'select count(*) as count from Notifications where username=? and unread=1',
			[ req.session.user.username ],
			function (err, results) {
				if (err) {
					//database error
					return callback(api_errors.database(req.session.user, params, err));
				}
				else if (results.length == 0) {
					//treat it as internal server error
					return callback(api_errors.internalServer(req.session.user, params));
				}
				else {
					//return the number
					return callback(api_utils.wrapResponse({
						params: params,
						success: results[0].count
					}));
				}
			}
		);
	}
}
exports.num = num;

/*
	marks the notification as read

	Inputs:
		notid the notification to mark as read

	Cases:
		Error: bad params, no auth
		Warning: no such notification
		Success: true (the boolean value)
		
*/
function markread(req, params, callback) {
	var paramErrors = api_validate.validate(params, {
		notid: { required: true }
	});

	if (!req.session.user) {
		//no auth' user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else if (paramErrors) {
		//bad params
		return callback(api_errors.badFormParams(req.session.user, params, paramErrors));
	}
	else {
		db.query(
			//make sure to match username also, so that they can't affect others' notifications
			'update Notifications set unread=0 where notid=? and username=?',
			[ params.notid, req.session.user.username ],
			function (err, results) {
				if (err) {
					//database error
					return callback(api_errors.database(req.session.user, params, err));
				}
				else if (results.affectedRows < 1) {
					//no such notification
					return callback(api_errors.noSuchNotification(req.session.user, params, params.notid));
				}
				else {
					//success yay!
					return callback(api_utils.wrapResponse({
						params: params,
						success: true
					}));
				}
			}
		);
	}
}
exports.markread = markread;

/*
	Inputs:
		(none)
		//TODO add paging

	Cases:
		error: no auth'd user
		success: an object
		{
			unread: [ list of notification objects ],
			read: [ list of notification objects ],
		}

		{
			notid, text, href, unread
		}
*/
function list(req, params, callback) {
	if (!req.session.user) {
		//no auth' user
		return callback(api_errors.noAuth(req.session.user, params));
	}
	else {
		db.query(
			'select notid, text, type, unread from Notifications where username=? order by unread desc',
			[ req.session.user.username ],
			function (err, results) {
				if (err) {
					//database error
					return callback(api_errors.database(req.session.user, params, err));
				}
				else {
					results = results.map(dbToApiNotification);

					//split them into two arrays
					var unread = [];
					var read = [];
					for (var i in results) {
						if (results[i].unread) unread.push(results[i]);
						else read.push(results[i]);
					}

					//return the two as a success
					return callback(api_utils.wrapResponse({
						params: params,
						success: {
							unread: unread,
							read: read
						}
					}));
				}
			}
		);
	}
}
exports.list = list;

function dbToApiNotification(not) {
	var href = null;
	switch (not.type) {
		case TYPES.NEW_GROUP_INVITATION: 		href = '/groups'; break;
		case TYPES.NEW_FRIEND_REQUEST: 			href = '/friends'; break;
		case TYPES.ACCEPTED_FRIEND_REQUEST:		href = '/groups'; break;
		default: 								break;
	}

	return {
		notid: not.notid,
		text: not.text,
		href: href,
		unread: (not.unread ? true : false)
	}
}

/*
	Sends a notification to the given user of the given type with the given message
*/
function notify(username, type, text) {
	if (text.length > 240) {
		//TODO log this error
	}

	db.query('select UUID() as uuid', [], function (err, results) {
		if (err) {
			//database error
			return callback(api_errors.database(req.session.user, params, err));
		}
		else {
			var uuid = results[0].uuid;

			db.query(
				'insert into Notifications (notid, timestamp, unread, username, text, type) ' +
							'values (?, NOW(), 1, ?, ?, ?)',
				[ uuid, username, text, type ],
				function (err, results) {
					if (err) {
						console.log('Error adding notification: ' + JSON.stringify(err));
					}
				}
			);
		}
	});
}
exports.notify = notify;

