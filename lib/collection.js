var crema  = require('crema'),
disposable = require('./disposable'),
tree 	   = require('./tree'),
sift 	   = require('sift');



//changes {tag:value,tag2:value} to [{tag:value},{tag2:value}]
var tagsToArray = function(tagsObj) {
		
	var key, tag, tags;

	for(key in tagsObj) {
		
		tag = {};
		tag[key] = tagsObj[key];
		tags.push(tag);

	}

	return tags;
}

var collection = module.exports = function() {
	
	var _rootTree = tree(),
	self = {};

	/**
	 * adds a new listener / listeners to the collection
	 */

	self.add = function(typeOrListeners, listener) {
		
		var type;

		if(typeof typeOrListeners == 'object') {
			
			var disp = disposable();

			for(type in typeOrListeners) {
				
				disp.add(self.add(type, typeOrListeners[type]));

			}

			return disp;
				
		}


		//next we need to parse the type into an expression
		crema(typeOrListeners).forEach(function(route) {
			
			_add(route, listener);
		
		});
	}

	/**
	 */

	self.middleware = function(type, tags) {
		
		var i, n, path, paths, currentTree = _rootTree, listeners = [];

		if(!tags) tags = {};

		//type is only available as a channel - for speed.
		paths = crema.parseChannel(type).paths;

		var listeners = _rootTree.findListeners(paths);

		//route does NOT exist? return a blank array
		if(!listeners) return [];

		//otherwise we need to filter this stuff
		return _filterMiddleware(listeners, tags);
	}

	/**
	 * filters metadata based on the tags given
	 */


	var _filterMiddleware = function(middleware, tags) {

		//need to switch to filterable tags
		var tagsArray = tagsToArray(tags);

		//first we need to fetch the listeners that *really* count - the ones at the end.
		var filteredMiddleware = sift({ tags: { $and: tagsArray }}, middleware.pop() || []);

		//if there's nothing, then we cannot continue
		if(!filteredMiddleware.length) return [];
		

		//everything after the initial route
		var  orSifter = sift({ tags: { $or: tagsArray } });

		for(var i = middleware.length; i--;) {
			
			filteredMiddleware = orSifter(middleware[i]).concat(filteredMiddleware);
		}

		return filteredMiddleware;
	}
	

	/**
	 * the *actual* add method
	 */

	var _add = function(route, callback) {
		
		var tree, type, lastPath = route.channel.paths[route.channel.paths.length - 1].value;

		//first lets establish whether or not the expression is OVERRIDING, or EXTENDING 
		if(lastPath == '*') {

			type = 'before';

			//remove the asterick
			route.channel.paths.pop();

		//everything AFTER this route is handleable by this listener
		} else if(lastPath == '**') {
			
			type = 'greedy';

			route.channel.paths.pop();

		
		} else {
			
			type = 'after';

		}



		//next, let's find the tree this route belongs too
		tree = _findTree(route.channel.paths, true);

		//add the listener to the tree obj
		return tree.addListener({

			//filterable tags
			tags: route.tags,

			//explicit middleware
			thru: 

			//the callback function
			callback: callback

		}, type);

	}


	/**
	 * finds the deepest tree associated with the given paths
	 */


	var _findTree = function(paths, createIfNotFound) {
		
		var i, n, path, currentTree = _rootTree;

		for(i = 0, n = paths.length; i < n; i++) {
			
			path = paths[i];

			if(!(currentTree = currentTree.child(path, createIfNotFound))) break;

		}

		return currentTree;

	}



	return self;
}

