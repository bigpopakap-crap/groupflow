//the api object to use
var api;
exports.useApi = function(module) {
	api = module;
	return this;
}

/* determines if a value is in an array */
function arrContains(arr, val) {
	for (i = 0; i < arr.length; i++) {
		if (arr[i] === val) return true;
	}
	return false;
}
exports.arrContains = arrContains;

/* gets the params from the request */
function getParams(req) {
	if (!req) {
		console.log('getParams() called on undefined request');
		return {};
	}
	else if (!req.method) {
		console.log('getParams() called on request with no method: ');
		console.log(req);
		return {};
	}
	else if (req.method == 'GET') return req.query;
	else if (req.method == 'POST') return req.body;
	else {
		console.log('Handling request that is neither GET nor POST: need to update getParams()')
		return {};
	}
}
exports.getParams = getParams;

/* renders a page with some default view variables */
function render(req, res, path, vars) {
	req = req || {};
	vars = vars || {};

	dflt_render_vars(req, function(dflt_vars) {
		//use default render vars unless otherwise specified
		for (var i in dflt_vars) {
			if (typeof vars[i] == 'undefined')
				vars[i] = dflt_vars[i];
		}

		res.render(path, vars);
	});
}
exports.render = render;

/* helper: default render vars */
function dflt_render_vars(req, callback) {
	req = req || {};

	api.users.permissions.get(req, getParams(req), function(data) {
		//assumes that permissions object is flat to that an empty object
		//		will just have undefined (false) permissions
		var permissions = {};
		if (data.response.success) permissions = data.response.success;

		//return the default vars
		callback({
			layout: false,							//don't user a layout
			resources: {},							//initialize to no resources included yet
			user: req.session.user,					//the user of the request
			param_values: getParams(req),			//the request parameters
			param_errors: {},						//any errors on the request parameters
			errors: [],								//an array of generic error strings
			user_app_permissions: permissions		//user permissions in the app
		});
	});
}

/* logs an error: both using console.log, and writing the error to the database */
function err_log(str) {
	console.log(str);
	//TODO write this string to the database
}
exports.err_log = err_log;

/* returns an error with the given code and message, returns the response so the caller can end it */
function respondErr(res, statusCode, message) {
	res.writeHead(statusCode);
	if (message) res.write(message);
	return res;
}
exports.respondErr = respondErr;

