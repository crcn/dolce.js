var dolce = require('../lib'),
collection = dolce.collection();


/*

test/taco/johns
test/:param




test/taco

*/

collection.add({
	
	'hello/:name/taco/:last/:cheese/help': function(ops) {
		
	},

	'hello/craig/jefferds': function(ops) {
		
	},

	'hello/**': function() {
		console.log("HELLO")
	},

	':hello/**': function() {
		
	},

	/**
	 */

	'hello/:param/**': function() {
		console.log("CRAIG")
	},

	'hello/craig/taco/last/cheese/help': function() {
		
	}
});

var routes = collection.middleware('hello/craig/taco/last/cheesee/help');


console.log(routes);