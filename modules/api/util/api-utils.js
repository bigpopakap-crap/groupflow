var gen_utils = require('../../gen-utils.js');

/* converts an internal api function to one accessible from a GET or POST

	handler(req, params, callback)
		req - the request object
		params - the REST params passed to the function
		callback - takes the JSON response
*/
exports.restHandler = function(handler) {
	return function(req, res) {
		handler(req, gen_utils.getParams(req), function(json) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(json, null, 4));
			res.end();
		});
	}
}

/* wraps the response data into the correct structure
	options:
		error: the error object to return (used for when the operation couldn't complete)
		warning: the warning object to return (used for when the operation completes and doesn't have
												anything useful to return. I.e. user doesn't exist in api.users.get())
		succes: the successs object to return
		params: the request params
*/
exports.wrapResponse = function(options) {
	options = options || {};

	return {
		response: {
			error: options.error,
			success: options.success,
			warning: options.warning
		},
		request: {
			params: options.params
		}
	}
}
