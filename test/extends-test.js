var vows = require('vows'),
assert = require('assert'),
flatten = require('./flattenCollections'),
crema = require('crema')


vows.describe('Extends Routes').addBatch({
	
	'An explicit collection of routes': {
		
		topic: function() {

			var collection = require('./test-helper').collection({
				'a':1,
				'a/*':1
			});

			collection.add(crema('a/*').pop(), 1);
			collection.add(crema('a/*').pop(), 1);
			collection.add(crema('a/*').pop(), 1);
			collection.add(crema('a/*').pop(), 1);
			collection.add(crema('-ab a/*').pop(), 1);

			return collection;
		},

		'a length = 3': function(topic) {
			assert.equal(flatten(topic.get('a')).length, 7); 
		}
	}

}).export(module);