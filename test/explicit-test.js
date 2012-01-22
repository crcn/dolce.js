var vows = require('vows'),
dolce = require('../'),
assert = require('assert');


vows.describe('Explicit Routes').addBatch({
	
	'An explicit collection of routes': {
		
		topic: function() {
			var collection = dolce.collection();
			
			collection.addObject({
				
				'a': 1,
				'a -> b': 1,
				'b -> c': 1,
				'c -> d': 1,
				'a -> b -> c -> d -> aa': 1,
				'aa -> bb': 1,
				'aa -> bb -> cc': 1
			});

			return collection;
		},

		'a length = 1': function(topic) {
			assert.equal(topic.get('a').collection.length, 1); //1 
		},

		'b length = 2': function(topic) {
			assert.equal(topic.get('b').collection.length, 2); //3
		},

		'c length = 3': function(topic) {
			assert.equal(topic.get('c').collection.length, 3); //6
		},

		'd length = 4': function(topic) {
			assert.equal(topic.get('d').collection.length, 4); //10
		},

		'aa length = 11': function(topic) {
			assert.equal(topic.get('aa').collection.length, 11);
		},

		'bb length = 12': function(topic) {
			assert.equal(topic.get('bb').collection.length, 12);
		},

		'cc length = 24': function(topic) {
			assert.equal(topic.get('cc').collection.length, 24); //11 + 12 + 1
		}
	}
}).export(module);