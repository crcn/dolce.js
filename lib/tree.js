var crema = require('crema');

var tree = module.exports = function(ops) {

	//ops doesn't exist? it's the root
	if(!ops) ops = { name: '', 
	param: false, 
	parent: null,
	depth: 0,
	deepest: 0};

	//child trees
	var _children = {},

	//THIS tree
	self = {},

	//parent tree obj
	_parent = ops.parent,

	//the root tree /
	_root   = ops.root || self,

	//collections added to this tree?
	_hasListeners = false,

	//the path value to THIS tree object
	_path   = { value: ops.name, param: ops.param },

	//used for debugging
	_pathStr = _parent ? _parent.path().value + '/' + ops.name : '/',

	//string rep of path to the tree
	_paths = _parent ? _parent.paths().concat(_path) : [_path],

	_pathStr = crema.stringifyPaths(_paths);

	self.collections = {

		//chain is path/**, which means everything *after* path is handled by this route, which
		//means we need to fetch the parent chain
		greedy: [],

		//handled before after
		before: [],

		//handled last
		after: []
	};


	self.addListener = {
		

		before: function(data) {
			
			return _addListener(self.collections, 'before', data);

		},

		after: function(data) {
			
			return _addListener(self.collections, 'after', data);

		},


		greedy: function(data) {

			return _addListener(self.collections, 'greedy', data);

		}
	};


	var _addListener = function(collection, type, data) {
		
		var collections = collection[type];
		data.path = _pathStr;
		data.type = type;

		collections.push(data);

		_hasListeners = true;

		return {

			/**
			 * removes the data from the collection
			 */

			dispose: function() {
				
				var i = collections.indexOf(data);

				//make sure the data exists before removing it from the collection
				if(i > -1) collections.splice(i, 1);

			}
		}
	}

	var _greedyListeners = function() {

		if(!_parent) return [];
	}

	/**
	 * traverse the tree
	 */

	self.traverse = function(callback) {
		callback(this);

		for(var name in _children) {
			_children[name].traverse(callback);
		}
	}


	/**
	 * retrieves a child path
	 */

	self.child = function(path, createIfNotFound) {
		
		//if the path is a parameter, then the NAME is __param as well
		var name = path.param ? '__param' : path.value;

		//return the child if it exists
		if(_children[name]) return _children[name];

		//otherwise, *create* the child 
		if(createIfNotFound) {

			return _children[name] = tree({ name: name,
				param: path.param, 
				parent: self, 
				root: _root,
				depth: ops.depth + 1, 
				deepest: 0 });

		}

		return null;
	}

	/**
	 * finds a child based paths given
	 */

	self.findChild = function(paths, index, weighTowardsParam) {
		
		var currentPath, foundChild, childTree;


		if(index == undefined) index = 0;

		//are we at the end?
		if(paths.length - index == 0) {

			return _hasListeners ? self : null;

		}


		currentPath = paths[index];




		//if we're weighing for parameters, then a route has not been defined
		//for the given path
		if(!weighTowardsParam || !(childTree = _children.__param)) {

			childTree = _children[currentPath.value];

		} 

		if(childTree) {

			//if there's a child, ALWAYS weigh towards finding specific paths first
			if(!(foundChild = childTree.findChild(paths, index + 1, false))) {

				//otherwise try finding parameter-based route
				foundChild = childTree.findChild(paths, index + 1, true);	

			}

		}
		
		return foundChild;
	};


	/**
	 * returns the current parent
	 */

	self.parent = function() {

		return _parent;

	};

	self.path = function() {
		
		return _path;
	}

	self.pathStr = function() {
		
		return _pathStr;

	}

	/**
	 */

	self.paths = function() {
		
		return _paths;

	};



	return self;
}