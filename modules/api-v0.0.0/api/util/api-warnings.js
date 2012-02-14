var api_utils = require('./api-utils.js');

/* helper that wraps the error objects in the response object */
function wrapError(params, warning) {
	return api_utils.wrapResponse({
		params: params,
		warning: warning
	});
}

/* an error when the api call did not match any valid paths */
exports.noSuchUser = function (user, params, username) {
	return wrapError(params, {
		statusCode: 404,
		errorCode: 'NO_SUCH_USER',
		devMsg: 'There is no user with the username ' + username,
		userMsg: 'No user with username ' + username + ' could be found',
		paramErrors: {},
		nestedError: null
	});
}
