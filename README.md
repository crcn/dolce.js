
Dolce is a sweet routing framework for javascript.

```javascript

var collection = require('dolce').collection();



collection.add({

	/**
	 * Extends the signup route. Checks if the user is invited to use the service 
	 * (This is app is currently beta-invite only).
	 */

	'signup/*': function(ops) {
			
		if(!ops.signupToken) throw new Error("You have not been invited yet!");

		//can signup? move onto the real deal!
		this.next();
	},
	
	/**
	 * signs the user up to use the service
	 */
	 
	'signup': function(ops) {
		
		var self = this;

		signupUser(ops.username, ops.password, function(err, result) {
			
			ops.success(result);

		});

	}
});


collection.route('signup').call({
	data: {
		username: 'craig',
		password: '1234567890'
	},
	onError: function(err) {
		console.log(err); //"You have not been invited yet!
	},
	onSuccess: function(user) {
		
	}, 
	onResponse: function(err, user) {
		
	},
	onReturn: function(value) {
		
	}
});

```


## Regular Routes

## Route Parameters

## Route Middleware

## Extending Routes

## Greedy Routes

## Route Tags

## Filtering Routes
