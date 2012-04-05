var api_utils = require('./api-utils.js');

/* helper that wraps the error objects in the response object */
function wrapError(params, error) {
	return api_utils.wrapResponse({
		params: params,
		error: error
	});
}

/* an error when the api call did not match any valid paths */
exports.noSuchApiPath = function (user, params) {
	return wrapError(params, {
		statusCode: 404,
		errorCode: 'NO_SUCH_API_PATH',
		devMsg: 'The requested path does not exist as an API call. ' +
				'Check for a typo in your request path, and the method (GET or POST)',
		userMsg: 'Uh oh! Something went wrong while processing your request',
		paramErrors: {},
		nestedError: null
	});
}

/* an error when the input parameters have errors */
exports.badInputParams = function (user, params, paramErrors) {
	return wrapError(params, {
		statusCode: 400,
		errorCode: 'BAD_INPUT_PARAMS',
		devMsg: 'The input parameters did not satisfy the necessary constraints. See "paramErrors" value',
		userMsg: 'Uh oh! Something went wrong while processing your request',
		paramErrors: paramErrors,
		nestedError: null
	});
}

/* an error when the input parameters have errors, and it is expected that the user entered a form */
exports.badFormParams = function (user, params, paramErrors) {
	return wrapError(params, {
		statusCode: 400,
		errorCode: 'BAD_FORM_PARAMS',
		devMsg: 'The input parameters did not satisfy the necessary constraints. See "paramErrors" value',
		userMsg: 'Some fields were invalid',
		paramErrors: paramErrors,
		nestedError: null
	});
}

/* an error when a user tries to register with a taken username */
exports.usernameTaken = function (user, params, username) {
	return wrapError(params, {
		statusCode: 400,
		errorCode: 'USER_ID_TAKEN',
		devMsg: 'The requested username ' + username + ' already exists',
		userMsg: 'Sorry, that username has already been taken',
		paramErrors: {},
		nestedError: null
	});
}

/* an error communicating with the database */
exports.database = function(user, params, err) {
	return wrapError(params, {
		statusCode: 500,
		errorCode: 'DATABASE',
		devMsg: 'Error communicating with the database',
		userMsg: 'Uh oh! Something went wrong while processing your request',
		paramErrors: {},
		nestedError: err //TODO use the user permissions to determine whether user can see this or not
	});
}

/* a generic internal server error */
exports.internalServer = function(user, params) {
	return wrapError(params, {
		statusCode: 500,
		errorCode: 'INTERNAL_SERVER',
		devMsg: 'Uncaught internal error',
		userMsg: 'Uh oh! Something went wrong while processing your request',
		paramErrors: {},
		nestedError: null
	});
}

/* invalid username/password combination */
exports.invalidLogin = function(user, params) {
	return wrapError(params, {
		statusCode: 400,
		errorCode: 'INVALID_LOGIN',
		devMsg: 'The username/password combination is incorrect',
		userMsg: 'Invalid username/password combination',
		paramErrors: {},
		nestedError: null
	});
}

/* no auth'd user error */
exports.noAuth = function(user, params) {
	return wrapError(params, {
		statusCode: 401,
		errorCode: 'NO_AUTH',
		devMsg: 'This method requires user authentication',
		userMsg: 'Please log in to complete this operation',
		paramErrors: {},
		nestedError: null
	});
}

/* the account was already linked */
exports.accountAlreadyLinked = function(user, params) {
	return wrapError(params, {
		statusCode: 400,
		errorCode: 'ACCOUNT_ALREADY_LINKED',
		devMsg: 'Either the external account or the ' + process.env.APP_NAME + ' account has already been linked',
		userMsg: 'Either the external account or the ' + process.env.APP_NAME + ' account has already been linked',
		paramErrors: {},
		nestedError: null
	});
}

/* can't friend yourself */
exports.selfFriend = function(user, params) {
	return wrapError(params, {
		statusCode: 400,
		errorCode: 'SELF_FRIEND',
		devMsg: 'User cannot send a friend request to himself',
		userMsg: 'It\'s cute, but you can\'t friend yourself',
		paramErrors: {},
		nestedError: null
	});
}

/* username does not exist */
exports.noSuchUsername = function(user, params, username) {
	return wrapError(params, {
		statusCode: 404,
		errorCode: 'NO_SUCH_USERNAME',
		devMsg: 'No user exists with username ' + username,
		userMsg: 'No user found with username "' + username + '"',
		paramErrors: {},
		nestedError: null
	});
}

/*  users are already friends

	if username2 is a falsy value, then it is assumed to be the auth'd user
*/
exports.alreadyFriends = function(user, params, username1, username2) {
	return wrapError(params, {
		statusCode: 400,
		errorCode: 'ALREADY_FRIENDS',
		devMsg: (username2 ?
					'Users ' + username1 + ' and ' + username2 + ' are already friends'
					: 'The authenticated user is already friends with ' + username1),
		userMsg: (username2 ?
					username1 + ' and ' + username2 + ' are already friends'
					: 'You are already friends with ' + username1),
		paramErrors: {},
		nestedError: null
	});
}

/* already incoming friend request */
exports.alreadyIncomingFriendRequest = function(user, params, username) {
	return wrapError(params, {
		statusCode: 400,
		errorCode: 'ALREADY_INCOMING_FRIEND_REQUEST',
		devMsg: 'The authenticated user already has a pending friend request from ' + username,
		userMsg: 'You already have a pending friend request from ' + username +
				 '. Please accept it in order to become friends',
		paramErrors: {},
		nestedError: null
	});
}

/* no incoming friend request from that user */
exports.noSuchIncomingFriendRequest = function(user, params, username) {
	return wrapError(params, {
		statusCode: 404,
		errorCode: 'NO_SUCH_INCOMING_FRIEND_REQUEST',
		devMsg: 'The authenticated user does not have a pending friend request from ' + username,
		userMsg: 'You do not have a pending friend request from ' + username,
		paramErrors: {},
		nestedError: null
	});
}

/* no outgoing friend request to that user */
exports.noSuchOutgoingFriendRequest = function(user, params, username) {
	return wrapError(params, {
		statusCode: 404,
		errorCode: 'NO_SUCH_OUTGOING_FRIEND_REQUEST',
		devMsg: 'The authenticated user does not have a pending friend request to ' + username,
		userMsg: 'You have no friend request pending with ' + username,
		paramErrors: {},
		nestedError: null
	});
}

/* a general error message with no param errors */
exports.genError = function(user, params, message, statusCode) {
	return wrapError(params, {
		statusCode: statusCode || 500,
		errorCode: 'SOME_ERROR',
		devMsg: message.devMsg,
		userMsg: message.userMsg,
		paramErrors: {},
		nestedError: null
	});
}

