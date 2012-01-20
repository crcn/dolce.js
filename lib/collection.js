var crema  = require('crema'),
disposable = require('./disposable'),
tree 	   = require('./tree'),
sift 	   = require('sift');



//changes {tag:value,tag2:value} to [{tag:value},{tag2:value}]
var tagsToArray = function(tagsObj) {
		
	var key, tag, tags = [];

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

	self.get = function(type, tags) {
		
		var tagsArray = tagsToArray(tags);


		var sifters = {
			and:  sift({ tags: { $and: tagsArray }}),
			or: sift({ tags: function(a) {

				//if the tag is NOT the same and it DOES exist, then it's a false match.
				for(var tagName in tags) {

					if(a[tagName] != tags[tagName] && a[tagName] !== true) return false;
				}

				return true;
			}})
		};


		return _middleware(crema.parseChannel(type).paths, sifters);
	}

	/**
	 */

	var _middleware = function(paths, sifters, useOr) {
		

		var child = _rootTree.findChild(paths);


		//route does NOT exist? return a blank array
		if(!child) return [];

		//combine the greedy listeners with the overriding listeners, and the final listeners.
		//NOTE that greedy listeners come before ANYTHING ELSE. e.g: b/**, and a -> b, would parse to b/** -> a -> b
		var filteredListeners = _filterListeners(_greedyListeners(child).concat(child.listeners.before), child.listeners.after, sifters, useOr),
		expandedListeners = [];



		//now we need to expand the EXPLICIT middleware. Stuff like pass -> thru -> route
		for(var i = 0, n = filteredListeners.length; i < n; i++) {
			var listener = filteredListeners[i];

			for(var j = 0, n2 = listener.thru.length; j < n2; j++) {
				
				expandedListeners.push(_middleware(listener.thru[j], sifters, true));
			}


			expandedListeners.push([listener]);
		}



		return Array.prototype.concat.apply([], expandedListeners);
	}

	/**
	 */

	var _greedyListeners = function(tree) {
		
		var currentParent = tree;
		listeners = [];

		while(currentParent) {

			listeners = currentParent.listeners.greedy.concat(listeners);

			currentParent = currentParent.parent();
		}

		return listeners;
	}


	/**
	 * filters listeners based 
	 */


	var _filterListeners = function(before, after, sifters, useOr) {

		//need to switch to filterable tags
		var filteredListeners = [];

		if(!useOr) {
			
			//first we need to fetch the listeners that *really* count - the ones at the end.
			filteredListeners = sifters.and(after);

			//if there's nothing, then we cannot continue
			if(!filteredListeners.length) return [];

		} else {

			//otherwise append *both* routes and filter against it
			before = before.concat(after);
		}

		return sifters.or(before).concat(filteredListeners);
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

		var thru = [], cthru = route.thru;

		while(cthru) {
			thru.unshift(cthru.channel.paths);
			cthru = cthru.thru;
		}



		//next, let's find the tree this route belongs too
		tree = _findTree(route.channel.paths, true);

		//add the listener to the tree obj
		return tree.addListener[type]({

			//filterable tags
			tags: route.tags,

			//explicit middleware which gets expanded at runtime
			thru: thru,

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

