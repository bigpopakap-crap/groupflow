var express = require('express');
var gen_utils = require('./modules/gen-utils.js');

//configure authentication
//TODO

var app = express.createServer(
	express.logger(),
	express.bodyParser(),
	express.cookieParser(),
	express.session({ secret: process.env.SESSION_SECRET })
	//TODO add everyauth middleware
);
app.use('/public', express.static(__dirname + '/public'));
//TODO everyauth.helpExpress(app);

//configure the api
require('./modules/api.js').configure(app);

/* BEGIN PAGE ROUTING *******************************************/
app.get('/', function(req, res) {
	if (req.user) /* TODO go to a different page */ gen_utils.render(req, res, 'landing.ejs');
	else gen_utils.render(req, res, 'landing.ejs');
});
/* END PAGE ROUTING *********************************************/

var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log('listening on port ' + port);
});
