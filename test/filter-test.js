var vows = require('vows'),
dolce = require('../'),
assert = require('assert'),
flatten = require('./flattenCollections');


vows.describe('Finding routes').addBatch({
	
	'A mixed collection': {
		
		topic: function() {
			var collection = require('./test-helper').collection({
				'-hook test': 1,
				'-method=GET test2': 1,
				'-hook=test test3': 1,
				'-method=POST test3': 2
			});

			return collection;
		},

		'has 1 hook': function(topic) {
			assert.equal(topic.find({ tags: { hook: true }}).length, 2);
		},

		'has 1 -method=GET': function(topic) {
			assert.equal(topic.find({ tags: { method: 'GET'}}).length, 1);
		}
	}
}).export(module);