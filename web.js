var express = require('express');

//configure authentication
//TODO

var app = express.createServer(
	express.logger(),
	express.bodyParser(),
	express.cookieParser(),
	express.session({ secret: process.env.SESSION_SECRET })
	//TODO add everyauth middleware
);

//configure the api
require('./modules/api.js').configure(app);

/* BEGIN PAGE ROUTING *******************************************/
app.get('/', function(req, res) {
	res.send('Hello world! - from ' + process.env.APP_NAME);
});
/* END PAGE ROUTING *********************************************/

var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log('listening on port ' + port);
});
