var dolce = require("../"),
crema = require("crema");

exports.collection = function(target) {
	

	var col = dolce.collection();

	for(var type in target) {
		crema(type).forEach(function(route) {
			col.add(route, target[type]);
		})
	}

	var oldGet = col.get, oldContains = col.contains;

	col.get = function(type, ops) {
		return oldGet(crema.parseChannel(type), ops);
	}

	col.contains = function(type, ops) {
		return oldContains(crema.parseChannel(type), ops);
	}

	return col;
}

