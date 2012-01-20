module.exports = function() {
	
	var disposables = [],
	self = {};

	/**
	 */

	self.add = function(item) {
		
		disposables.push(item);

	}

	/**
	 */

	self.dispose = function() {
		
		disposables.forEach(function(item) {
			
			//disposable item?
			if(item.dispose) item.dispose();

		});

		//remove all the disposables
		disposables = [];
		
	}

	return self;
}