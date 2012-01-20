var dolce = require('../lib'),
collection = dolce.collection();


/*

test/taco/johns
test/:param




test/taco

*/

collection.add({

	/**
	 */

	'thruAgain -> thru': function(){},

	/**
	 */

	'thruAgain': function(){},

	/**
	 */

	'thru -> hello/**': function() {},

	/**
	 */
	
	'hello/:world': function() {},

	/**
	 */

	'thru -> hello/:world/test': function() {}
});


console.log(collection.get('hello/world'));
console.log(collection.get('hello/world/test'));