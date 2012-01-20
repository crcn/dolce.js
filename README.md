
Dolce is a super sweet routing framework for javascript. [![Build Status](https://secure.travis-ci.org/crcn/dolce.png)](https://secure.travis-ci.org/crcn/dolce)


## Basic Example:

```javascript

var router = require('dolce').router();

router.on({
	
	/**
	 * validates authentication credentials
	 */

	'validateLogin': function(ops) {

		if(ops.data.u != 'username' && ops.data.p != 'password') return new Error('Invalid Login');

		this.next();
  
	},

	/**
	 * posts a new message
	 */

	'validateLogin -> postMessage': function(ops) {

		return 'You posted "%s".' + ops.data.message;

	}
});


// a successful dispatch
router.dispatch('postMessage', {
		data: {
			u: 'username',
			p: 'password',
			message: 'Hello Dolce!'
		}
	},
	function (err, result) {
		console.log(result); //You posted "Hello Dolce!"
	}
);

//an unsuccessful dispatch
router.dispatch('postMessage', { 
		data: {
			u: 'badUsername',
			p: 'badPassword',
			message: 'Hello World!'
		}
	},	
	function (err, result) {
		console.log(err.message); //Invalid login
	}
);


```

## Syntax

TODO


## Regular Routes

```javascript
router.on({
	
	'some/route': function() {
		
	},

	'another/route/:param': function() {
		
	},

	'some/:param': function() {
		
	}

});

```

## Route Tags

Tags are filterable items you can attach to your routes. For example:

```javascript
router.on({
	
	/**
	 * add a user
	 */

	'-method=POST -anotherTag users': function() {
		return 'added user';
	},

	/**
	 * get all users
	 */

	'-method=GET users': function() {
		return 'some user';
	}

	/**
	 * remove a user
	 */

	'-method=DELETE users/:user': function() {
		return 'deleted user';
	}

});

router.dispatch('users', { data: { username: 'crcn' }, tags: { method: 'POST' } }, function(err, result) {
	//added user
}); 
```


## Explicit Middleware

Explicit middleware consist of routes you explictly define

```javascript
router.on({
	
	/**
	 * parses the POST body, along with any cookies before getting to the login route
	 */

	'postBody -> parseCookies -> login': function() {
		
	},

	/**
	 * returns whether an account exists
	 */

	'account/exists': function() {
		
	},

	/**
	 * signs the user up
	 */

	'account/exists -> signup': function() {
		
	}
});
```

## Implicit Middleware

Implicit middleware allows you to inject routes without explicitly defining them. For example

```javascript
router.on({

	/**
	 * invite check route. This will be removed once the application is out of alpha
	 */
	
	'signup/*': function() {
		//check if the account is invited
	},

	/**
	 * signs the user up
	 */

	'signup': function() {
		//sign the user up
	}
});
```

## Greedy Routes

```javascript
router.on({
	
	/**
	 * permissions middleware
	 */

	'-perm /**': function() {
		
		if(ops.perm != this.last.tags.perm) return new Error('Unauthorized.');

	},

	/**
	 */

	'-perm=SUPER invite/users': function() {
		//admin function
	}
})
```

# API


## router.dispatch(route[, ops][, ack]);

- `route` - the route to dispatch
- `ops` - the options for the route. Passed to each callback
	- `tags` - the tags to filter with
- `ack` - acknowledgement callback of the given route 


