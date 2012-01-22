var vows = require('vows'),
dolce = require('../'),
assert = require('assert');


vows.describe('Implicit Routes').addBatch({
	
	'An explicit collection of routes': {
		
		topic: function() {
			var collection = dolce.collection();
			
			collection.addObject({
				
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
			assert.equal(topic.get('a', { tags: { method: 'DELETE' }}).collection.length, 1); 
		},

		'-method=DELETE a/b length = 3': function(topic) {
			assert.equal(topic.get('a/b', { tags: { method: 'DELETE' }}).collection.length, 3); //a without DELETE is also added 
		},

		'-method=DELETE a/b length = 6': function(topic) {
			assert.equal(topic.get('a/b/c', {tags: { method: 'DELETE' }}).collection.length, 6);
		},
	}
}).export(module);