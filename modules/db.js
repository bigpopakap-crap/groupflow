/* Creates a database client */
var client = require('mysql').createClient({
	host: process.env.RDS_ENDPOINT,
	port: process.env.RDS_PORT,
	user: process.env.RDS_USERNAME,
	password: process.env.RDS_PASSWORD,
	database: process.env.RDS_DATABASE
});

//wrap the query function in one that escapes params
exports.query = function(querystr, params, callback) {
	//TODO use client.query()
}
