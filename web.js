var express = require('express');
var gen_utils = require('./modules/gen-utils.js');

var app = express.createServer(
	express.logger(),
	express.bodyParser(),
	express.cookieParser(),
	express.session({ secret: process.env.SESSION_SECRET })
);
app.use('/public', express.static(__dirname + '/public'));

//configure the api (which includes auth)
require('./modules/api.js').configure(app);

/* BEGIN PAGE ROUTING *******************************************/
app.get('/', function(req, res) {
	if (req.session.user) /* TODO go to a different page */ gen_utils.render(req, res, 'landing.ejs');
	else gen_utils.render(req, res, 'landing.ejs');
});
/* END PAGE ROUTING *********************************************/

var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log('listening on port ' + port);
});
