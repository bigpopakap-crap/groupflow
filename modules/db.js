/* Creates a database client */
var client = require('mysql').createClient({
	host: process.env.RDS_ENDPOINT,
	port: process.env.RDS_PORT,
	user: process.env.RDS_USERNAME,
	password: process.env.RDS_PASSWORD,
	database: process.env.RDS_DATABASE
});

/* wrap the query function in to one that accepts parameters
		callback(err, results, fields)
			retults is the array of JSON items returned

		params are to be reference as @(param1) in the query string
*/
exports.query = function(querystr, params, callback) {
	//replace the params in the query string
	for (var i in params) {
		var queryReg = new RegExp('@\\(' + i + '\\)', 'g');
		querystr = querystr.replace(queryReg, params[i]);
	}

	client.query(querystr, callback);
}

