/* gets the params from the request */
exports.getParams = function(req) {
	if (!req) {
		console.log('getParams() called on undefined request');
		return {};
	}
	else if (!req.method) {
		console.log('getParams() called on request with no method: ');
		console.log(req);
	}
	else if (req.method == 'GET') return req.query;
	else if (req.method == 'POST') return req.body;
	else {
		console.log('Handling request that is neither GET nor POST: need to update getParams()')
		return {};
	}
}

/* renders a page with some default view variables */
exports.render = function(req, res, path, vars) {
	req = req || {};
	vars = vars || {};
	
	//use default render vars unless otherwise specified
	var dflt_vars = this.dft_render_vars(req);
	for (var i in dflt_vars) {
		if (typeof vars[i] == 'undefined')
			vars[i] = dflt_vars[i];
	}

	res.render(path, vars);
}

/* default render vars */
exports.dft_render_vars = function(req) {
	req = req || {};
	return {
		layout: false,
		resources: {},
		user: req.session.user,
		request: {
			params: this.getParams(req)
		}
	}
}

/* logs an error: both using console.log, and writing the error to the database */
exports.err_log = function(str) {
	console.log(str);
	//TODO write this string to the database
}
