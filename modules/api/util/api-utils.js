var gen_utils = require('../../gen-utils.js');

/* converts an internal api function to one accessible from a GET or POST

	handler(user, params, callback)
		user - the user of the session
		params - the REST params passed to the function
		callback - takes the JSON response
*/
exports.restHandler = function(handler) {
	return function(req, res) {
		handler(req.user, gen_utils.getParams(req), function(json) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(json));
			res.end();
		});
	}
}

/* wraps the response data into the correct structure
	options:
		error: the error object to return
		warning: the warning object to return
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
