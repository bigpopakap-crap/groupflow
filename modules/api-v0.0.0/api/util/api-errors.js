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
		devMsg: 'The requested path does not exist as an API call. Check for a typo in your request path',
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
	return wrapError({
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
	return wrapError({
		statusCode: 401,
		errorCode: 'NO_AUTH',
		devMsg: 'This method requires user authentication',
		userMsg: 'Please log in to complete this operation',
		paramErrors: {},
		nestedError: null
	});
}

