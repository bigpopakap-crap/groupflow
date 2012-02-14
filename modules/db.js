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

//does the same thing as the client query
exports.query = function(querystr, params, callback) {
	return client.query(querystr, params, callback);
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

//return the client's corresponding function
exports.startTransaction = function() {
	return client.startTransaction();
}

