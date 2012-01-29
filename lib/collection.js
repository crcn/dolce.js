var crema  = require('crema'),
tree 	   = require('./tree'),
sift 	   = require('sift');





var collection = module.exports = function() {
	
	var _rootTree = tree(),
	self = {};

	/**
	 * the *actual* add method
	 */

	var _addRoute = self.add = function(route, value) {
		
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

			routeStr: crema.stringify(route),

			//filterable tags
			tags: route.tags,

			//path to the route -- needed to fill in extra data
			paths: route.channel.paths,

			//explicit chain which gets expanded at runtime
			thru: thru,

			//the callback function
			value: value

		}, type);

	};

	/**
	 * returns TRUE if the given type exists
	 */

	self.contains = function(channel, ops) {

		if(!ops) ops = {};

		var child = _findTree(channel.paths);

		return !!child ? !!_andSifter(ops.tags || {}, child.collections.after).length : false;
	}

	/**
	 * returns collections and their chained data
	 */

	self.get = function(channel, ops) {
		
		if(!ops) ops = {};

		var tags = ops.tags;


		//only allow path/to/collection in get vs pull blown parsing with metadata - not necessary
		var chains = _chains(channel.paths, tags, true);

		return {
			paths: channel.paths,
			tags: ops.tags,
			chains: chains
		}
	};

	/**
	 * finds routes based on the filter tags given WITHOUT expanding them
	 */

	self.find = function(ops) {

		var tagSifter, found = [];

		if(ops.tags) {
			tagSifter = _andSifter(ops.tags);
		} else 
		if(ops.sift) {
			tagSifter = sift({ tags: ops.sift });
		}


		_rootTree.traverse(function(tree) {

			if(tagSifter)
			for(var i = tree.collections.after.length; i--;) {

				var data = tree.collections.after[i];

				if(tagSifter.test(data)) {
					
					found.push(data);

					break;
				}
			}

		});

		return found;
	}

	//changes {tag:value,tag2:value} to [{tag:value},{tag2:value}]
	var _tagsToArray = function(tagsObj) {
			
		var key, tag, tags = [];

		for(key in tagsObj) {
			
			tag = {};
			tag[key] = tagsObj[key];
			tags.push(tag);

		}

		return tags;
	}


	/**
	 */

	var _andSifter = function(tags, target) {

		for(var name in tags) {
			if(tags[name] === true) {
				tags[name] = { $exists: true };
			}
		}

		var tagsArray = _tagsToArray(tags);

		return sift({ tags: { $and: tagsArray }}, target);

	}

	/**
	 */

	var _chains = function(paths, tags) {
		

		var child  = _rootTree.findChild(paths);


		//route does NOT exist? return a greedy endpoint
		if(!child) return [];//_greedyEndpoint(paths, tags);

		var usedGreedyPaths,

		entireChain = _allCollections(child),

		currentData,


		endCollection = _andSifter(tags)(child.collections.after),

		//the collections expanded with all the explicit / implicit / greedy chains
		expandedChains = [],

		expandedChain;



		//now we need to expand the EXPLICIT chain. Stuff like pass -> thru -> route
		for(var i = 0, n = endCollection.length; i < n; i++) {

			currentData = endCollection[i];

			expandedChains.push(_chain(currentData, paths, entireChain));
		}



		return expandedChains;
	};

	var _chain = function(data, paths, entireChain) {
		
		var chain = _chainSifter(data.tags, entireChain),
		usedGreedyPaths = {};


		//filter out any greedy middleware that's used more than once. This can cause problems
		//for greedy middleware such as /**
		return _expand(chain.concat(data), paths).filter(function(route) {

			if(route.type != 'greedy') return true;
			if(usedGreedyPaths[route.routeStr]) return false;
			return usedGreedyPaths[route.routeStr] = true;

		});
	}

	var _greedyEndpoint = function(paths, tags) {
		
		var tree;

		for(var i = paths.length; i--;) {
			if(tree = _rootTree.findChild(paths.slice(0, i))) break;	
		}

		if(!tree) return [];

		var chain = _chainSifter(tags || {}, _greedyCollections(tree));

		return chain;

	}

	var _copy = function(target) {
		var to = {};
		for(var i in target) {
			to[i] = target[i];
		}
		return to;
	}

	/**
	 */

	var _expand = function(chain, paths, usedGreedyPaths) {
		
		var j, n2,  i = 0, n = chain.length;


		var expanded = [];


		for(; i < n; i++) {
			
			var data = chain[i];

			var params = _params(data.paths, paths),
			subChain = [];

			
			for(j = 0, n2 = data.thru.length; j < n2; j++) {
					
				subChain.push(_thru(_fillPaths(data.thru[j], params), data.tags, usedGreedyPaths));

			}

			expanded = expanded.concat.apply(expanded, subChain);

			expanded.push({
				routeStr: data.routeStr,
				paths: data.paths,
				params: params,
				tags: data.tags,
				value: data.value,
				type: data.type
			});
		}

		return expanded;
	}

	/**
	 */

	var _chainSifter = function(tags, target) {

		var test = function(target) {
			
			return target.filter(function(a) {

				var atags = a.tags, av, tv;

				//metadata in the atags (chain) must match the tags given

				//examples of this:
				//-method a/**
				//-method=POST a  --- a/** -> a
				//a --- a (would not go through a/**)
				for(var tagName in atags) {

					av = atags[tagName];
					tv = tags[tagName];

					//MUST have a value - atags

					//Example:

					//-method=POST a/**

					//matches: 
					//-method=POST a

					//does not match:
					//-method a

					if(av != tv && (!tv || av !== true))  return false;
				}

				return true;
			});
		}

		//array exists? return the result
		if(target) return test(target);

		return test;
	}

	/**
	 */

	var _thru = function(paths, tags) {

		var child  = _rootTree.findChild(paths);

		if(!child) return [];


		var chainSifter = _chainSifter(tags);

		chain = chainSifter(_allCollections(child));

		//need to sort the tags because a match for say.. method=DELETE matches both method, and method=DELETE
		var filteredChildren = chainSifter(child.collections.after).sort(function(a, b) {

			return _scoreTags(a.tags) > _scoreTags(b.tags) ? -1 : 1;

		});


		//return only ONE item to go through - this is the best match.
		return _expand(chain.concat(filteredChildren[0]), paths);
	}

	/**
	 * ranks data based on how similar tags are
	 */

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

	/**
	 * hydrates chain, e.g.,  validate/:firstName -> add/user/:firstName
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
		collections = [],
		cpath;

		while(currentParent) {
			 
			cpath = currentParent.pathStr();

			collections = currentParent.collections.greedy.concat(collections);

			currentParent = currentParent.parent();
		}

		return collections;
	};

	/**
	 */

	var _allCollections = function(tree) {
		
		return _greedyCollections(tree).concat(tree.collections.before);

	}


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

