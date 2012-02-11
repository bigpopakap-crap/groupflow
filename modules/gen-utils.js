/* gets the params from the request */
exports.getParams = function(req) {
	if (!req || !req.method) return {};
	else if (req.method == 'GET') return req.query;
	else if (req.method == 'POST') return req.body;
	else {
		console.log('Handling request that is neither GET nor POST: need to update getParams()')
		return {};
	}
}
