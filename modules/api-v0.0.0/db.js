/* Creates a database client and activates the queues on it */
var client = require('mysql').createClient({
	host: process.env.DB_ENDPOINT,
	port: process.env.DB_PORT,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE
});
require('mysql-queues')(client, (process.env.NODE_ENV === 'testing'));
								//^^ debug if in testing environment

//does the same thing as the client query
function query(querystr, params, callback) {
	return client.query(querystr, params, callback);
}
exports.query = query;

/*
	Executes a transaction of queries (if the intermediate results are not important)
		generally used if the queries are just a bunch of INSERTS

	Input:
		an array of queries:
			[ { query: 'INSTERT...', params: [...] }, ... ]
		a callback:
			callback(err, data) - returns the database error, or the result of the last query
*/
function insertTransaction(queries, callback) {
	var trans = startTransaction();

	//queue all the queries
	for (var i=0; i<queries.length; i++) {
		trans.query(
			queries[i].query,
			queries[i].params,
			(function (i) {
				if (i < queries.length - 1) {
					//function for everything but the last query
					return function (err, info) {
						if (err && !trans.rolledback) {
							trans.rollback();
							return callback(err, info);
						}
					}
				}
				else {
					//function for the last query
					return function(err, info) {
						if (err) {
							if (!trans.rolledback) trans.rollback();
							return callback(err, info);
						}
						else {
							//succes!
							return callback(err, info);
						}
					}
				}
			})(i)
		);
	}

	//commit the transaction
	trans.commit();
}
exports.insertTransaction = insertTransaction;

//return the client's corresponding function
function startTransaction() {
	return client.startTransaction();
}
exports.startTransaction = startTransaction;

