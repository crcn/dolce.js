var dolce = require('../lib');


var target = dolce({

	/**
	 */

	'delay': function(ops, callback) {
		console.log('delay')

		setTimeout(this, 1000, ops, callback);
	},

	/**
	 */
	
	'delay -> timeout': function(ops, callback) {
		console.log('timeout')
		setTimeout(this, 1000, ops, callback);
	},

	'delay -> timeout -> delay -> sayHello': function(ops, callback) {
		console.log("hello %s", ops.name);

		callback();
	}
})


target.sayHello({ name: 'test' }, function() {
	console.log("done!");
})