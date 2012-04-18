var api_utils = require('./api-utils.js');

/* helper that wraps the error objects in the response object */
function wrapWarning(params, warning) {
	return api_utils.wrapResponse({
		params: params,
		warning: warning
	});
}

/* no facebook account linked */
exports.noFacebookAccountLinked = function (user, params) {
	return wrapWarning(params, {
		statusCode: 404,
		errorCode: 'NO_FACEBOOK_ACCOUNT_LINKED',
		devMsg: 'There is no linked Facebook account',
		userMsg: 'There is no Facebook account linked',
		paramErrors: {},
		nestedError: null
	});
}

/* no such user warning */
exports.noSuchUser = function (user, params, username) {
	return wrapWarning(params, {
		statusCode: 404,
		errorCode: 'NO_SUCH_USER',
		devMsg: 'There is no user with the username ' + username,
		userMsg: 'No user with username ' + username + ' could be found',
		paramErrors: {},
		nestedError: null
	});
}

/* friend request already has been sent */
exports.friendRequestAlreadySent = function (user, params, username) {
	return wrapWarning(params, {
		statusCode: 400,
		errorCode: 'FRIEND_REQUEST_ALREADY_SENT',
		devMsg: 'The authenticated user already has a friend request pending with ' + username,
		userMsg: 'You already have a friend request pending with ' + username,
		paramErrors: {},
		nestedError: null
	});
}

/* group invitation was already sent to that user for that group */
exports.groupInvitationAlreadySent = function (user, params, username, groupid) {
	return wrapWarning(params, {
		statusCode: 400,
		errorCode: 'GROUP_INVITATION_ALREADY_SENT',
		devMsg: 'The user ' + username + ' already has a group invitation pending for group ' + groupid,
		userMsg: username + ' already has a pending invitation to the group',
		paramErrors: {},
		nestedError: null
	});
}

/* no such group warning */
exports.noSuchGroup = function (user, params, groupid) {
	return wrapWarning(params, {
		statusCode: 404,
		errorCode: 'NO_SUCH_GROUP',
		devMsg: 'There is no groupd with the id ' + groupid,
		userMsg: 'No group with id ' + groupid + ' could be found',
		paramErrors: {},
		nestedError: null
	});
}

