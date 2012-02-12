/*
	returns null if the params are okay, or and object with errors for each
	bad input param
		{
			<param1>: {
				devMsg: <string for the developer>
				userMsg: <string for the user (for use in forms)>
			}
		}

	constraints can be (AND ARE CHECKED IN THIS ORDER):
		required (bool) - makes sure that the input param is defined
		minlen (int) - enforces a min # of characters (0 means that no min-length is enforced)
		maxlen (int) - enforces max # of characters	(0 means that no max-length is enforced. the "required" constraint will catch that case)
		isnum (bool) - requires that the field can be converted to a number
		isword (bool) - requires that the field consists of only word characters (letters, nums, and _ )
		singleunderscores (bool) - requires that there are no underscores next to each other		
		nowhite (bool) -requires that there be no whitespace		
		inrange (arr) - requires that the field equals something in the given array.
						if the array is empty, this check will be skipped
		notlike (arr) - requires that the field doesn't resemble any of the given words
						(calculated by levenstein distance). the elements of the array
						must be objects like this:
							{ val: <string>, tol: <int>, ignorecase: <bool> }
							where tol is the min allowed lev. distance
		custom (fn) - function of the form: fn(val, params) that returns either null
							or an object of the form: { devMsg: <string>, userMsg: <string> }
*/
exports.validate = function(params, constraints) {
	constraints = constraints || {};
	var paramErrors = {};

	for (var field in constraints) {
		var value = params[field];
		var required = constraints[field].required;
		var minlen = constraints[field].minlen;
		var maxlen = constraints[field].maxlen;
		var isnum = constraints[field].isnum;
		var isword = constraints[field].isword;
		var singleunderscores = constraints[field].singleunderscores;
		var nowhite = constraints[field].nowhite;
		var inrange = constraints[field].inrange;
		var notlike = constraints[field].notlike;
		var custom = constraints[field].custom;

		var temp; //used to hold values generated within if clauses

		//check each requirement in order
		if (required && !value)
			//required but not there
			paramErrors[field] = required_error(field);

		else if (!value)
			//not required an non-existent, no further checks necessary
			continue;

		else if (minlen && value.length < minlen)
			//too short
			paramErrors[field] = too_short_error(field, minlen);

		else if (maxlen && value.length > maxlen)
			//too long
			paramErrors[field] = too_long_error(field, maxlen);

		else if (isnum && !isNumber(value))
			//not a number
			paramErrors[field] = not_number_error(field);

		else if (isword && !isWord(value))
			//not a word field
			paramErrors[field] = not_word_error(field);

		else if (singleunderscores && hasAdjacentUnderscores(value))
			//has multiple underscores together
			paramErrors[field] = adjacent_underscores_error(field);

		else if (nowhite && hasWhitespace(value))
			//contains whitespace
			paramErrors[field] = has_whitespace_error(field);

		else if (inrange && inrange.length > 0 && !arrContains(inrange, value))
			//not in the range!
			paramErrors[field] = not_in_range_error(field, inrange);

		else if (notlike && (temp = resembles(value, notlike)))
			//the word resembles the taboo string in "temp"
			paramErrors[field] = resembles_error(field, temp);

		else if (custom && (temp = custom(value, params)))
			//violatd the custom constraint
			paramErrors[field] = temp;
	} //go to next constraint

	//finally return null or the paramErrors
	return (JSON.stringify(paramErrors) !== '{}') ? paramErrors : null;
}

/* HELPERS ***************************************************/
//helper that returns true if and only if parseFloat works
function isNumber(str) {
	if (typeof str == 'number') return true;		//if input is a number, return true
	else if (typeof str != 'string') return false;	//now if it is not a string, return false
	else if (str == '') return false;				//if it is empty, it is not a number
	else return !isNaN(str);						//if it is NOT NaN, return true
}

//helper to determine if there are only words characters in the field
function isWord(str) {
	return /^\w*$/.test(str);
}

//helper to determine if a value is in an array
function arrContains(arr, val) {
	for (i = 0; i < arr.length; i++) {
		if (arr[i] === val) return true;
	}
	return false;
}

//helper to determine if the field has adjacent underscores
function hasAdjacentUnderscores(str) {
	return /__/.test(str);
}

//helper to determine if there is any whitespace
function hasWhitespace(str) {
	return /\s/.test(str);
}

//helper to determine whether a word resembles any of the given taboo words
//	returns null if the check is passed, or the taboo word on which it failed
function resembles(str, taboos) {
	//split the input str into words, and test the overall string itself
	var words = str.split(" ");
	words.push(str);

	for (var i in taboos) {
		var taboo = taboos[i].val;						//the taboo word
		var tol = taboos[i].tol || 2;					//the min allowed Lev distance
		var ignorecase =								//should we ignore case?
			(typeof taboos[i].ignorecase == 'undefined') ? true : taboos[i].ignorecase;

		//test each word with the taboo one
		for (var i=0; i < words.length; i++) {
			//ignore case if requested
			var word = ignorecase ? words[i].toLowerCase() : words[i];
			taboo = ignorecase ? taboo.toLowerCase() : taboo;

			if (levenshtein(words[i], taboo) < tol)
				return taboo;
		}
	}

	//haven't returned yet, so return null
	return null;
}

/* THE STANDARD ERRORS ***************************************/
function required_error(field) {
	return {
		devMsg: 'The ' + field + ' param is required',
		userMsg: 'This field is required'
	}
}

function too_short_error(field, minlen) {
	return {
		devMsg: 'The ' + field + ' param must be at least ' + minlen + ' chars long',
		userMsg: 'Must be at least ' + minlen + ' characters long'
	}
}

function too_long_error(field, maxlen) {
	return {
		devMsg: 'The ' + field + ' param cannot exceed ' + maxlen + ' chars',
		userMsg: 'Must not be longer than ' + maxlen + ' characters'
	}
}

function not_number_error(field) {
	return {
		devMsg: 'The ' + field + ' param must represent a number',
		userMsg: 'Please enter a number'
	}
}

function not_word_error(field) {
	return {
		devMsg: 'The ' + field + ' param can only have letters, digits and underscores. ' +
				'(Must satisfy the regexp: ^\\w*$)',
		userMsg: 'Must only contain letters, digits and underscores'
	}
}

function adjacent_underscores_error(field) {
	return {
		devMsg: 'The ' + field + ' param cannot have adjacent underscores',
		userMsg: 'Must not contain adjacent underscores'
	}
}

function has_whitespace_error(field) {
	return {
		devMsg: 'The ' + field + ' param cannot have any whitespace. ' +
				'Check for beginning or trailing whitespace, and consider trimming inputs for the user',
		userMsg: 'Must not contain any whitespace (spaces, tabs, etc.)'
	}
}

function not_in_range_error(field, range) {
	var rangeStr = (function(arr) {
		var str = '';

		for (var i = 0; i < arr.length; i++) {
			str += '\'' + arr[i] + '\' ';
		}

		return str;
	})(range);

	return {
		devMsg: 'The ' + field + ' param must fall in the range: ' + rangeStr,
		userMsg: 'This field must be one of: ' + rangeStr
	}
}

function resembles_error(field, taboo) {
	return {
		devMsg: 'The ' + field + ' param cannot be too close to the string \'' + taboo + '\' in Levenshtein distance',
		userMsg: 'This field cannot resemble \'' + taboo + '\''
	}
}

/* GIANT HELPER: CALCULATES THE levenshtein DISTANCE
	from: http://andrew.hedges.name/experiments/levenshtein/
*/
function levenshtein(a, b) {
	// return the smallest of the three values passed in
	function minimator(x,y,z) {
		if (x < y && x < z) return x;
		if (y < x && y < z) return y;
		return z;
	}

	//START THE FUNCTION
	var cost;
	var m = a.length;
	var n = b.length;
	
	// make sure a.length >= b.length to use O(min(n,m)) space, whatever that is
	if (m < n) {
		var c=a;a=b;b=c;
		var o=m;m=n;n=o;
	}
	
	var r = new Array();
	r[0] = new Array();
	for (var c = 0; c < n+1; c++) {
		r[0][c] = c;
	}
	
	for (var i = 1; i < m+1; i++) {
		r[i] = new Array();
		r[i][0] = i;
		for (var j = 1; j < n+1; j++) {
			cost = (a.charAt(i-1) == b.charAt(j-1))? 0: 1;
			r[i][j] = minimator(r[i-1][j]+1,r[i][j-1]+1,r[i-1][j-1]+cost);
		}
	}
	
	return r[m][n];
}

