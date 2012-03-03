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
	var coltypes = {
		string: function (options) {
			options = options || {};
			return 'VARCHAR(' + normalizeNumberInput(options.length, 255, 1, 255) + ')' +
				    (options.notnull ? ' NOT NULL' : '') +
					(options.primary ? ' PRIMARY KEY' : '');
		}
	};

	/*
		The enum of query types
	*/
	var querytypes = {
		select: 'SELECT'
	};

	//helper array to keep track of all tables created
	var tables = {};

	/*
		Gets the table of the given name (or undefined/null if there was no table defined)
	*/
	function getTable(name) {
		return tables[name];
	}

	/*
		Defines a new table (if the name has been defined before, then
		it overwrites the previous definition)
		
		name (str) - the name of the object (used for the database table)
		definition (obj) - the definition of the table (see documentation of Table())
	*/
	function define(name, definition) {
		//create the table, store it and then return it
		var table = Table(name, definition);
		tables[name] = table;
		return table;
	}

	/*
		Syncs the tables with the database
		TODO
	*/
	function sync(/* TODO */) {
		//TODO
	}

	/* *************************************************************************
	BEGIN SUBCLASSES BEGIN SUBCLASSES BEGIN SUBCLASSES
	************************************************************************** */
	/*
		Creates a new table with the given name
	
		name (str) - the name of the object (used for the database table)
		definition (obj) - has the following fields:
			fields: an associative array with the columns of the table
						  values map to the type of the column
			apply: a function (or array of functions, which are applied in order)
					that are applied to the object, where "this" is the object
			//TODO uniqueness of values?
	*/
	function Table(name, definition) {
		//default the input values
		name = name; //this is here for completeness (all three inputs are listed in one block)
		var pubfields = (definition && definition.fields) || {};
		var applyfns = (definition && definition.apply) || [];

		//if the apply function is a function not an array, make it a singleton
		if (typeof applyfns == 'function')
			applyfns = [applyfns];

		//TODO define the table
		/*
			GET methods:
			select() - a query() with count=false
			count() - a query() with count=true
			all() - shorthand for select with no "where"
			countall() - shorthand for count() with no "where"
			(PRIVATE) query() - starts a query with options:
				where: some constraints TODO
				count: is this just a count?

			UPDATE methods:
			TODO
		*/
	
		/*
			The public portion of the Table
		*/
		return {
			//TODO actually define this, remove the temp vars
			pubfields: pubfields,
			applyfns: applyfns,
			name: name
		}
	}

	/*
		Creates a new query object

		type - the type of the query (SELECT, UPDATE, etc...)
		options - options related to which query is being used

		for SELECT queries, options is:
			table - the table to select from
	*/
	function Query(type, options) {
		options = options || {};	//the passed options

		/*
			The "where" part of the query. Objects in this
			are stored in the order the constraint was added, and are object
			of the form:
			{
				col (string) - the name of the colum
				op (string) - the operator
				val (string) - the value to compare the column with
			}
		
			Example:
			{ col: 'id', op: '=', val: 'shx392' }

			This is simply concatenated in the SQL string
			'SELECT * FROM table WHERE id=?', args: shx392

			IMPORTANT NOTE: all of these are assumed to be joined by ANDs
			TODO how to support ORs?
		*/
		var constraints = [];		//the "where" part

		/*
			Adds a new constraint that is ANDed with the other ones
			
			col (string) - the name of the colum
			op (string) - the operator
			val (string) - the value to compare the column with

			This is simply concatenated in the SQL string
			where('id', '=', 'shx392')
			'SELECT * FROM table WHERE id=?', args: shx392
		*/
		function where(col, op, val) {
			constraints.push({
				col: col,
				op: op,
				val: val
			});
		}
		var and = where;

		/*
			Actually executes this query. Callback takes the args:

			callback(err, objects)
				err - the err returns from the 'mysql' module, or null
				objects - an array of the ORM objects
					empty array if there were no objects returned

			Note that queries that were expected to return one result
			are still returned in array form
		*/
		function execute(callback) {
			//TODO
		}

		/*
			The public portion of the query object
		*/
		return {
			where: where,
			and: and,
			execute: execute
		}
	}
	/* *************************************************************************
	END SUBCLASSES END SUBCLASSES END SUBCLASSES
	************************************************************************** */

	/*
		The public portion of the ORM
	*/
	return  {
		coltypes: coltypes,
		querytypes: querytypes,
		getTable: getTable,
		define: define,
		sync: sync
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

