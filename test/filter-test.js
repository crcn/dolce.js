var vows = require('vows'),
dolce = require('../'),
assert = require('assert'),
flatten = require('./flattenCollections');


vows.describe('Implicit Routes').addBatch({
	
	'An explicit collection of routes': {
		
		topic: function() {
			var collection = dolce.collection();
			
			collection.addObject({
				
				'-method a/**':1,
				'a': 1,
				'-method a': 1,//should NOT get added
				'-method=DELETE  a': 1,

				'-method=GET    a -> a/b': 1,
				'-method=DELETE a -> a/b': 1,

				'-method=GET    a -> a/b -> a/b/c': 1,
				'-method=DELETE a -> a/b -> a/b/c': 1,
			});

			return collection;
		},

		'-method=DELETE a length = 1': function(topic) {
			assert.equal(flatten(topic.get('a', { tags: { method: 'DELETE' }})).length, 2); 
		},

		'-method=DELETE a/b length = 4': function(topic) {
			assert.equal(flatten(topic.get('a/b', { tags: { method: 'DELETE' }})).length, 4); //a without DELETE is also added 
		},

		'-method=DELETE a/bc length = 8': function(topic) {

			assert.equal(flatten(topic.get('a/b/c', {tags: { method: 'DELETE' }})).length, 8);
		},
	}
}).export(module);