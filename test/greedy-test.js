var vows = require('vows'),
dolce = require('../'),
assert = require('assert');


vows.describe('Greedy Routes').addBatch({
	
	'An explicit collection of routes': {
		
		topic: function() {
			var collection = dolce.collection();
			
			collection.addObject({
				
				'a':1,
				'a/b': 1,
				'a/b/c': 1,
				'a/b/c/d': 1,
				'a/**': 1,
				'a/b/**': 1,
				'a/b/c/**': 1,
				'a/b/c/d/**':1,
				'a -> a/:b':1,
				'a -> a/b -> a/b/:c':1,
				'a -> a/b -> a/b/c -> a/b/c/:d':1
			});

			return collection;
		},

		'a length = 2': function(topic) {
			assert.equal(topic.get('a').collection.length, 2); 
		},

		'a/b length = 3': function(topic) {
			assert.equal(topic.get('a/b').collection.length, 3); 
		},

		'a/b/c length = 4': function(topic) {
			assert.equal(topic.get('a/b/c').collection.length, 4); 
		},

		'a/b/c/d length = 5': function(topic) {
			assert.equal(topic.get('a/b/c/d').collection.length, 5); 
		},

		'a/bb length = 4': function(topic) {
			assert.equal(topic.get('a/bb').collection.length, 4); 
		},

		'a/b/cc length = 8': function(topic) {
			assert.equal(topic.get('a/b/cc').collection.length, 8); 
		},

		'a/b/c/dd length = 13': function(topic) {
			assert.equal(topic.get('a/b/c/dd').collection.length, 13); 
		},
	}

}).export(module);