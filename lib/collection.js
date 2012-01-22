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
	 * adds a new data  to the collection
	 */

	self.add = function(type, value) {
		
		var disp = disposable();


		//next we need to parse the type into an expression
		crema(type).forEach(function(route) {

			disp.add(_addRoute(route, value));
		
		});

		return disp;
	};

	self.addObject = function(target) {

		var disp = disposable();

		for(type in target) {
			
			disp.add(self.add(type, target[type]));

		}

		return disp;
	};

	/**
	 * the *actual* add method
	 */

	var _addRoute = self.addRoute = function(route, value) {
		
		var tree, type, lastPath = route.channel.paths[route.channel.paths.length - 1].value;

		//first lets establish whether or not the expression is OVERRIDING, or EXTENDING 
		if(lastPath == '*') {

			type = 'before';

			//remove the asterick
			route.channel.paths.pop();

		//everything AFTER this route is handleable by this data
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


		//add the data to the tree obj
		return tree.addListener[type]({

			//filterable tags
			tags: route.tags,

			//path to the route -- needed to fill in extra data
			paths: route.channel.paths,

			//explicit middleware which gets expanded at runtime
			thru: thru,

			//the callback function
			value: value

		}, type);

	};

	/**
	 */

	self.contains = function(type, ops) {

		if(!ops) ops = {};

		var child = _findTree(_parseChannel(type).paths);

		return !!child ? !!_andSifter(ops.tags || {}, child.collections.after).length : false;
	}


	/**
	 */

	self.get = function(type, ops) {
		
		if(!ops) ops = {};

		var tags = ops.tags;


		//prepare the sifters here since we're _middleware is recursive
		var sifters = {
			and:  _andSifter(tags),
			or: sift({ tags: function(a) {

				//if the tag is NOT the same and it DOES exist, then it's a false match.
				for(var tagName in tags) {

					if(a[tagName] != tags[tagName] && a[tagName] !== true)  return false;
				}

				return true;
			}})
		};

		//only allow path/to/collection in get vs pull blown parsing with metadata - not necessary
		var channel = _parseChannel(type),
		collections = _collections(channel.paths, sifters, true);

		return {
			paths: channel.paths,
			tags: ops.tags,
			collections: collections
		}
	};

	/**
	 */

	var _andSifter = function(tags, target) {

		var tagsArray = tagsToArray(tags);

		return sift({ tags: { $and: tagsArray }}, target);

	}

	/**
	 */

	var _parseChannel = function(type) {

		return type instanceof Array ? type : crema.parseChannel(type);

	}


	/**
	 */

	var _collections = function(paths, sifters) {
		

		var child  = _rootTree.findChild(paths);

		//route does NOT exist? return a blank array
		if(!child) return [];


		var middleware = _siftMiddleware(child, sifters),
		collections = sifters.and(child.collections.after),
		expandedCollections = [],
		currentCollection;



		//now we need to expand the EXPLICIT middleware. Stuff like pass -> thru -> route
		for(var i = 0, n = collections.length; i < n; i++) {

			expandedCollections.push(_expand(middleware.concat(collections[i]), paths, sifters));

		}


		return expandedCollections;
	};

	var _expand = function(collections, paths, sifters) {
		
		var j, n2,  i = 0, n = collections.length;


		var expanded = [];

		for(; i < n; i++) {


			
			var data = collections[i];
			var params = _params(data.paths, paths),
			middleware = [];

			
			for(j = 0, n2 = data.thru.length; j < n2; j++) {
					
				middleware.push(_thru(_fillPaths(data.thru[j], params), sifters));

			}

			expanded = expanded.concat.apply(expanded, middleware);

			expanded.push({
				paths: data.paths,
				params: params,
				tags: data.tags,
				value: data.value
			});
		}

		return expanded;
	}

	var _thru = function(paths, sifters) {

		var child  = _rootTree.findChild(paths);

		if(!child) return [];

		middleware = _siftMiddleware(child, sifters);

		//need to sort the tags because a match for say.. method=DELETE matches both method, and method=DELETE
		var filteredChildren = sifters.or(child.collections.after).sort(function(a, b) {
			return _scoreTags(a.tags) > _scoreTags(b.tags) ? -1 : 1;
		});

		//return only ONE item to go through - this is the best match.
		return _expand(middleware.concat(filteredChildren[0]), paths, sifters);
	}

	var _scoreTags = function(tags, match) {
		var score = 0;


		for(var tag in match) {

			var tagV = tags[tag];
			
			if(tagV == match[tag]) {

				score += 2;

			} else 
			if(tagV) {

				score += 1;

			}
		}

		return score;
	}

	var _siftMiddleware = function(child, sifters) {
		
		return sifters.or(_greedyCollections(child).concat(child.collections.before));

	}



	/**
	 * hydrates middleware, e.g.,  validate/:firstName -> add/user/:firstName
	 */

	var _fillPaths = function(paths, params) {
		var i, path, n = paths.length, newPaths = [];

		for(i = 0; i < n; i++) {
			
			path = paths[i];

			newPaths.push({
				value: path.param ? params[path.value] : path.value,
				param: path.param
			});
		}

		return newPaths;
	}

	/**
	 * returns the parameters associated with the found path against the queried path, e.g., add/:name/:last and add/craig/condon 
	 */

	var _params = function(treePaths, queryPaths) {
		
		var i, treePath, queryPath, params = {};

		for(i = treePaths.length; i--;) {

			treePath = treePaths[i];
			queryPath = queryPaths[i];

			if(treePath.param) {

				params[treePath.value] = queryPath.value;

			}

		}


		return params;
	};

	/**
	 */

	var _greedyCollections = function(tree) {
		
		var currentParent = tree,
		collections = [];

		while(currentParent) {

			collections = currentParent.collections.greedy.concat(collections);

			currentParent = currentParent.parent();
		}

		return collections;
	};


	/**
	 * filters collection based 
	 */


	var _filterData = function(before, after, sifters, topLevel) {

		//need to switch to filterable tags
		var filteredCollection = [];

		if(topLevel) {
			
			//first we need to fetch the collection that *really* count - the ones at the end.
			filteredCollection = sifters.and(after);

			//if there's nothing, then we cannot continue
			if(!filteredCollection.length) return [];

		} else {

			//otherwise append *both* routes and filter against it
			before = before.concat(after);
		}

		return sifters.or(before).concat(filteredCollection);
	};
	

	


	/**
	 * finds the deepest tree associated with the given paths
	 */


	var _findTree = function(paths, createIfNotFound) {
		
		var i, path, n = paths.length, currentTree = _rootTree;

		for(i = 0; i < n; i++) {
			
			path = paths[i];

			if(!(currentTree = currentTree.child(path, createIfNotFound))) break;

		}

		return currentTree;

	};



	return self;
}

