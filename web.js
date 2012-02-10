var express = require('express');
var mysql = require('mysql');
var db = mysql.createClient({
	host: process.env.RDS_ENDPOINT,
	port: process.env.RDS_PORT,
	user: process.env.RDS_USERNAME,
	password: process.env.RDS_PASSWORD,
	database: process.env.RDS_DATABASE
});

var app = express.createServer(express.logger());

app.get('/', function(req, res) {
	db.query('select * from UsersMeta', function(err, results, fields) {
		console.log(err);
		console.log(results);
		console.log(fields);
		res.send('Hello world! - from ' + process.env.APP_NAME);
	});
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log('listening on port ' + port);
});
