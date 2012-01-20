
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

	//listeners added to this tree?
	_hasListeners = false,

	//the path value to THIS tree object
	_path   = { value: ops.name, param: ops.param },

	//used for debugging
	_pathStr = _parent ? _parent.path().value + '/' + ops.name : '/',

	//string rep of path to the tree
	_paths = _parent ? _parent.paths().concat(_path) : [_path];

	self.listeners = {

		//middleware is path/**, which means everything *after* path is handled by this route, which
		//means we need to fetch the parent middleware
		greedy: [],

		//handled before after
		before: [],

		//handled last
		after: []
	};


	self.addListener = {
		

		before: function(listener) {
			
			return _addListener(self.listeners, 'before', listener);

		},

		after: function(listener) {
			
			return _addListener(self.listeners, 'after', listener);

		},


		greedy: function(listener) {

			return _addListener(self.listeners, 'greedy', listener);

		}
	};


	var _addListener = function(collection, type, listener) {
		
		var listeners = collection[type];
		listener.path = _pathStr;
		listener.type = type;

		listeners.push(listener);

		_hasListeners = true;

		return {

			/**
			 * removes the listener from the collection
			 */

			dispose: function() {
				
				var i = collection.indexOf(listener);

				//make sure the listener exists before removing it from the collection
				if(i > -1) listeners.splice(i, 1);

			}
		}
	}

	var _greedyListeners = function() {

		if(!_parent) return [];


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

	/**
	 */

	self.paths = function() {
		
		return _paths;

	};



	return self;
}