/*
	Creates a new ORM connected to the MySQL database at the given location

	options (defaults are that of the underlying 'mysql' module)
		host - the host of the database
		port - the port to use
		user - the user to login with
		password - the password to use for the user
		database - the name of the database to use
*/
module.exports = function(options) {
	options = options || {};

	//create the database client and activates the queues on it
	var dbclient = require('mysql').createClient({
		host: options.host,
		port: options.port,
		user: options.user,
		password: options.password,
		database: options.database
	});
	require('mysql-queues')(dbclient, (process.env.NODE_ENV === 'testing'));
									//^^ debug if in testing environment

	/*
		The enum of types of the columns in the created tables

		string - translates to VARCHAR. options:
			length (num): length of the string (min 1, max 255, default 255)
			notnull (bool): if true, adds NOT NULL
			primary (bool): if true, adds PRIMARY KEY
	*/
	var sqltypes = {
		string: function (options) {
			options = options || {};
			return 'VARCHAR(' + normalizeNumberInput(options.length, 255, 1, 255) + ')' +
				    (options.notnull ? ' NOT NULL' : '') +
					(options.primary ? ' PRIMARY KEY' : '');
		}
	}

	//helper array to keep track of all models created
	var models = {};

	/*
		Gets the model of the given name (or undefined/null if there was no model defined)
	*/
	function getModel(name) {
		return models[name];
	}

	/*
		Defines a new model (if the name has been defined before, then
		it overwrites the previous definition)
		
		name (str) - the name of the object (used for the database table)
		definition (obj) - the definition of the model (see documentation of Model())
	*/
	function define(name, definition) {
		//create the model, store it and then return it
		var model = Model(name, definition);
		models[name] = model;
		return model;
	}

	/*
		Syncs the models with the database
		TODO
	*/
	function sync(/* TODO */) {
		//TODO
	}

	/*
		The public portion of the ORM
	*/
	return  {
		sqltypes: sqltypes,
		getModel: getModel,
		define: define,
		sync: sync
	}
}

/*
	Creates a new model with the given name
	
	name (str) - the name of the object (used for the database table)
	definition (obj) - has the following fields:
		fields: an associative array with the columns of the table
					  values map to the type of the column
		apply: a function (or array of functions, which are applied in order)
				that are applied to the object, where "this" is the object
		//TODO uniqueness of values?
*/
function Model(name, definition) {
	//default the input values
	name = name; //this is here for completeness (all three inputs are listed in one block)
	var pubfields = (definition && definition.fields) || {};
	var applyfns = (definition && definition.apply) || [];

	//if the apply function is a function not an array, make it a singleton
	if (typeof applyfns == 'function')
		applyfns = [applyfns];

	//TODO define the model
	/*
		select() - a query() with count=false
		count() - a query() with count=true
		all() - shorthand for select with no "where"
		countall() - shorthand for count() with no "where"

		internal:
			query() - starts a query with options:
				where: some constraints TODO
				count: is this just a count?
	*/
	
	/*
		The public portion of the Model
	*/
	return {
		//TODO actually define this, remove the temp vars
		pubfields: pubfields,
		applyfns: applyfns,
		name: name
	}
}


/* ***********************************************************************************
 	HELPERS HELPER HELPERS HELPERS
* *************************************************************************************/
//helper that takes a number (that may be undefined or null), and
//	returns it or the default number, and ensures that it is within the given range
function normalizeNumberInput(num, dflt, min, max) {
	num = (typeof num == 'undefined' || num === null) ? dflt : num;
	min = (typeof min == 'undefined' || min === null) ? num : min;
	max = (typeof max == 'undefined' || max === null) ? num : max;
	return Math.min(Math.max(num, min), max);
}
