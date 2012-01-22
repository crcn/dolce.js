var vows = require('vows'),
dolce = require('../'),
assert = require('assert');


vows.describe('Explicit Routes').addBatch({
	
	'An explicit collection of routes': {
		
		topic: function() {
			var collection = dolce.collection();
			
			collection.addObject({
				
				'a': 1,
				'a/:b': 1,
				'a/b': 1
			});

			return collection;
		},

		'contains a': function(topic) {
			assert.isTrue(topic.contains('a'));
		},

		'contains a/b': function(topic) {
			assert.isTrue(topic.contains('a/b'));
		},

		'contains a/:b': function(topic) {
			assert.isTrue(topic.contains('a/:b'));
		},

		'does not contain -method=GET a/b': function(topic) {
			assert.isTrue(!topic.contains('a/b', { tags: { method: 'GET'}}));
		}
	}
}).export(module);