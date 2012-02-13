/* Creates a database client and activates the queues on it */
var client = require('mysql').createClient({
	host: process.env.RDS_ENDPOINT,
	port: process.env.RDS_PORT,
	user: process.env.RDS_USERNAME,
	password: process.env.RDS_PASSWORD,
	database: process.env.RDS_DATABASE
});
require('mysql-queues').queues(client, (process.env.NODE_ENV === 'testing'));
										//^^ debug if in testing environment

/* wrap the query function in to one that accepts parameters
		callback(err, results, fields)
			retults is the array of JSON items returned

		params are to be reference as @(param1) in the query string
*/
exports.query = function(querystr, params, callback) {
	//replace the params in the query string
	client.query(replaceParams(querystr, params), callback);
}

/* returns a wrapped transaction object
	the transaction object has methods:
		rollback
		commit
		execute
		query (querystr, params, callback) where params get replaced in querystr
			callback(err, info)
*/
exports.startTransaction = function() {
	var trans = client.startTransaction();
	return {
		rollback: trans.rollback,
		commit: trans.commit,
		execute: trans.execute,
		query: function (querystr, params, callback) {	//use parameters
			return trans.query(replaceParams(querystr, params), callback);
		}
	}
}

//helper to replace params in query string
function replaceParams(querystr, params) {
	for (var i in params) {
		var queryReg = new RegExp('@\\(' + i + '\\)', 'g');
		querystr = querystr.replace(queryReg, params[i]);
	}
	return querystr;
}

