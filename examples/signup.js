var dolce = require('../lib'),
collection = dolce.collection();


/*

test/taco/johns
test/:param




test/taco

*/

collection.add({
	
	'hello/:param/test/:another/:param/to/:see': function(ops) {
		
	},

	'hello/param/test/another/param/to/see': function(ops) {
		
	},

	'hello/craig/taco/last/cheese/help': function() {
		
	}
});


console.log(collection.middleware('hello/param/test/another/param/to/see'));
console.log(collection.middleware('hello/paramm/test/another/param/to/see'));