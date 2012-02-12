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
