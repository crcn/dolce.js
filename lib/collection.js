var crema  = require('crema'),
tree 	   = require('./tree'),
sift 	   = require('sift');



var routeTypes = {
	'*': 'extend',
	'+': 'extend',
	'**': 'greedy'
}


var collection = module.exports = function() {
	
	var _rootTree = tree(),
	self = {},
	_id = 0;


	var _addRoute = self.add = function(route, value) {

		var tree, type, paths = route.channel.paths, 
		lastPath = paths[paths.length - 1].value, 
		secondLastPath = paths.length > 1 ? paths[paths.length - 2].value : null;


		if(type = routeTypes[lastPath]) {
			
			//remove the asterick
			route.channel.paths.pop();

		} else {

			type = 'endpoint';

		}


		var thru = [], cthru = route.thru;

		while(cthru) {
			thru.unshift(cthru.channel.paths);
			cthru = cthru.thru;
		}

		//next, let's find the tree this route belongs too
		tree = _findTree(route.channel.paths, true);


		//add the data to the tree obj
		return tree.addListener(type, {

			routeStr: crema.stringify(route),

			//filterable tags
			tags: route.tags,

			//path to the route -- needed to fill in extra data
			paths: route.channel.paths,

			//explicit chain which gets expanded at runtime
			thru: thru,

			id: _id++,

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

		return !!child ? !!_andSifter(ops, child.collections.endpoint).length : false;
	}

	/**
	 * returns collections and their chained data
	 */

	self.get = function(channel, ops) {
		
		if(!ops) ops = {};


		//only allow path/to/collection in get vs pull blown parsing with metadata - not necessary
		var chains = _chains(channel.paths, ops, true).sort(function(a, b) {
			return Number(a[a.length - 1].priority) > Number(b[b.length - 1].priority) ? -1 : 1;
		});

			

		return {
			paths: channel.paths,
			tags: ops.tags,
			chains: chains
		}
	};



	/**
	 */

	self.remove = function(channel, ops) {

		var child = _findTree(channel.paths),
		sifter = _andSifter(ops);

		for(var i = child.collections.endpoint.length; i--;) {
			if(sifter.test(child.collections.endpoint[i])) {
				child.collections.endpoint.splice(i, 1);
			}
		}

	}

	/**
	 * finds routes based on the filter tags given WITHOUT expanding them
	 */

	self.find = function(ops) {

		var tagSifter, found = [];

		if(ops.tags) {
			tagSifter = _andSifter(ops);
		} else 
		if(ops.siftTags) {
			tagSifter = sift({ tags: ops.siftTags });
		}



		_rootTree.traverse(function(tree) {

			if(tagSifter)
			for(var i = tree.collections.endpoint.length; i--;) {

				var data = tree.collections.endpoint[i];

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

	var _andSifter = function(ops, target) {

		var tags = ops.tags || {};

		for(var name in tags) {
			if(tags[name] === true) {
				tags[name] = { $exists: true };
			}
		}

		var $and = _tagsToArray(tags);

		if(ops.siftTags) $and.push(ops.siftTags);

		return sift({ tags: { $and: $and }}, target);

	}

	/**
	 */

	var _chains = function(paths, ops) {
		

		var child  = _rootTree.findChild(paths);


		//route does NOT exist? return a greedy endpoint
		if(!child) return [];//_greedyEndpoint(paths, tags);

		var entireChain = _allCollections(child),

		currentData,

		endCollection = _andSifter(ops)(child.collections.endpoint),

		//the collections expanded with all the explicit / implicit / greedy chains
		expandedChains = [],

		expandedChain;


		//now we need to expand the EXPLICIT chain. Stuff like pass -> thru -> route
		for(var i = 0, n = endCollection.length; i < n; i++) {

			currentData = endCollection[i];
			
			expandedChains.push((ops.expand == undefined || ops.expand == true) ? _chain(currentData, paths, entireChain) : [currentData]);
		}



		return expandedChains;
	};

	var _chain = function(data, paths, entireChain) {

		var tags = data.tags;

		var chain = _siftChain(data.tags, entireChain);


		var usedGreedyPaths = {};


		//filter out any greedy middleware that's used more than once. This can cause problems
		//for greedy middleware such as /**
		return _expand(chain.concat(data), paths).filter(function(route) {

			if(route.type != 'greedy') return true;
			if(usedGreedyPaths[route.id]) return false;
			return usedGreedyPaths[route.id] = true;

		});
	}

	var _greedyEndpoint = function(paths, tags) {
		
		var tree;

		for(var i = paths.length; i--;) {
			if(tree = _rootTree.findChild(paths.slice(0, i))) break;	
		}

		if(!tree) return [];

		var chain = _siftChain(tags || {}, _greedyCollections(tree));

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

	var _expand = function(chain, paths) {
		
		var j, n2,  i = 0, n = chain.length;


		var expanded = [];


		for(; i < n; i++) {
			
			var data = chain[i];

			var params = _params(data.paths, paths),
			subChain = [];
			
			for(j = 0, n2 = data.thru.length; j < n2; j++) {
					
				subChain.push(_thru(_fillPaths(data.thru[j], params), data.tags));

			}

			expanded = expanded.concat.apply(expanded, subChain);

			expanded.push({
				routeStr: data.routeStr,
				paths: data.paths,
				cmpPath: paths,
				params: params,
				id: data.id,
				tags: data.tags,
				value: data.value,
				type: data.type
			});
		}

		return expanded;
	}


	/**
	 */

	var _siftChain = function(tags, target) {

		return target.filter(function(a) {

			var atags = a.tags;


			if(a.greedy) {


				//examples of this:
				//-method a/**
				//-method=POST a  --- a/** -> a
				//a --- a (would not go through a/**)
				if(atags.unfilterable) return true;

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

						if(av != tv && (!tv || av !== true) && av != '*')  return false;
					}

			} else {


				for(var tagName in tags) {

					var tv = tags[tagName],
					av     = atags[tagName];

						

					//"-m=a a" matches: "-m=a a/+", "-m a", "a", "-b a"
					//"-m=a a" does NOT match: "-m=b a/+"
					if(tv != av && av !== undefined && av !== true) return false;
				}

			}


			return true;
		});
	}


	/**
	 */

	var _thru = function(paths, tags) {

		var child  = _rootTree.findChild(paths);

		if(!child) return [];


		//need to sort the tags because a match for say.. method=DELETE matches both method, and method=DELETE
		//NOTE - chainSifter was previously used here. Since it's EXPLICIT, we do NOT want to filter out the routes.
		var filteredChildren = child.collections.endpoint.sort(function(a, b) {

			return _scoreTags(a.tags, tags) > _scoreTags(b.tags, tags) ? -1 : 1;

		});

		var targetChild = filteredChildren[0];


		var chain = _siftChain(targetChild.tags, _allCollections(child));


		//return only ONE item to go through - this is the best match.
		return _expand(chain.concat(targetChild), paths);
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
		gcol = [],
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
		
		return _greedyCollections(tree).concat(tree.collections.extend);

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

