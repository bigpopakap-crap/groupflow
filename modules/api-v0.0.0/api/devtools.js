var gen_utils = require('../../gen-utils.js');
var api_validate = require('./util/api-validate.js');
var db = require('../db.js');
var permissions = require('./users/permissions.js');

exports.configure = function(app, url_prefix) {
	url_prefix += '/devtools';

	//configure the actions in this API domain
	app.post(url_prefix + '/sqlquery', handleSqlQuery);
}

//handles executing a sql query for the user
//	if the user has no access to devtools, calls next()
//	calling next is important to hide the existence of this functionality
function handleSqlQuery(req, res, next) {
	//make sure the user has devtools access
	var params = gen_utils.getParams(req);
	permissions.get(req, params, function(data) {
		//data.response.success is the permission object, if it exists
		if (data.response.success && data.response.success.devtools) {
			//validate the input params
			var paramErrors = api_validate.validate(params, {
				query: { required: true }
			});

			//return param errors if there were any
			if (paramErrors) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write('Please include a query');
				res.end();
			}
			else {
				//execute the query
				db.query(params.query, [], function(err, results) {
					//put the database response into one object
					var response = JSON.stringify({
						err: err,
						results: results
					});
					
					//send the response
					res.writeHead(200, {'Content-Type': 'application/json'});
					res.write(response);
					res.end();
				});
			}
		}
		else {
			//user does not have permissions to access devtools
			return next();
		}
	});
}

