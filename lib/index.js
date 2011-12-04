var crema = require('crema'),
step = require('step');

function getStepper(route, inner, func) {

	var flattened = [],
	steps = [],
	thru = route;

	while(thru) {
		flattened.unshift(thru.channel.value);
		thru = thru.thru;
	}

	flattened.forEach(function(method) {
		steps.push(function() {
			inner[method].apply(this, arguments);
		});
	});

	steps.pop();
	steps.push(func)

	return function() {
		var csteps = steps.concat();

		//next function a step function?
		if(typeof this == 'function') csteps.push(this);

		step.fn.apply(this, csteps).apply(this, arguments);
	};
}

module.exports = function(target) {
	
	var augmented = {}, inner = {};


	for(var method in target) {
		
		var route = crema(method)[0],
		newMethod = route.channel.value,
		func = target[method];

		augmented[newMethod] = getStepper(route, augmented, func);
	}


	return augmented;
}