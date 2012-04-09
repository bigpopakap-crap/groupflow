var gen_utils = require('../../../gen-utils.js');

/* set an internal api function to one accessible from a GET or POST

	handler(req, params, callback)
		req - the request object
		params - the REST params passed to the function
		callback - takes the JSON response
*/
exports.restHandler = function(app, method, path, handler) {
	//make the method uppercase
	method = method.toUpperCase();

	//print out the path if there is one
	if (method && path) console.log('API: ' + method + (method == 'GET' ? '  ' : ' ') + path);

	//get the correct function to set the handler
	var setfun;
	switch (method) {
		case 'GET': setfun = app.get;
					break;
		case 'POST': setfun = app.post;
					break;
		default: console.log('setfun not set in api-utils.restHandler!');
					return;
	}

	setfun.call(
		app,
		path,
		function(req, res) {
			handler(req, gen_utils.getParams(req), function(json) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(JSON.stringify(json, null, 4));
				res.end();
			});
		}
	)
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

