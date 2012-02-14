/* Creates a database client and activates the queues on it */
var client = require('mysql').createClient({
	host: process.env.RDS_ENDPOINT,
	port: process.env.RDS_PORT,
	user: process.env.RDS_USERNAME,
	password: process.env.RDS_PASSWORD,
	database: process.env.RDS_DATABASE
});
require('mysql-queues')(client, (process.env.NODE_ENV === 'testing'));
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

/*
	Executes a transaction of queries (if the intermediate results are not important)
		generally used if the queries are just a bunch of INSERTS

	Input:
		an array of queries:
			[ { query: 'INSTERT...', params: {} }, ... ]
		a callback:
			callback(err, data) - returns the database error, or the result of the last query
*/
exports.insertTransaction = function(queries, callback) {
	var trans = this.startTransaction();

	//queue all the queries
	for (var i=0; i<queries.length; i++) {
		trans.query(
			queries[i].query, queries[i].params,
			(function (i) {
				return function (err, info) {
					//rollback if error
					if (err && !trans.rolledback) {
						trans.rollback();
						return callback(err);
					}
					//if last one and no error, do the success callback
					else if (!err && (i == queries.length - 1)) {
						return callback(null, info);
					}
				}
			})(i)
		);
	}

	//commit the transaction
	trans.commit();
}

/* returns a wrapped transaction object (simply to allow use of @(param) replacement)
	the transaction object has methods:
		rollback
		commit
		execute
		query (querystr, params, callback) where params get replaced in querystr
			callback(err, info)
*/
exports.startTransaction = function() {
	var trans = client.startTransaction();
	var queryfn = trans.query; //the original query function

	//set the new wrapped query function
	trans.query = function(querystr, params, callback) {
		return queryfn.call(trans, replaceParams(querystr, params), callback);
	}

	return trans;
}

//helper to replace params in query string
function replaceParams(querystr, params) {
	for (var i in params) {
		var queryReg = new RegExp('@\\(' + i + '\\)', 'g');
		querystr = querystr.replace(queryReg, params[i]);
	}
	return querystr;
}

