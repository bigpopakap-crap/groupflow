var api_utils = require('./api-utils.js');

/* helper that wraps the error objects in the response object */
function wrapWarning(params, warning) {
	return api_utils.wrapResponse({
		params: params,
		warning: warning
	});
}

/* an error when the api call did not match any valid paths */
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

