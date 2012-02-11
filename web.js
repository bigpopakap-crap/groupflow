var express = require('express');
var db = require('./modules/db.js');

var app = express.createServer(express.logger());

app.get('/', function(req, res) {
	res.send('Hello world! - from ' + process.env.APP_NAME);
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log('listening on port ' + port);
});
