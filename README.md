
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

router.dispatch('users', { 
	data: { 
		username: 'crcn' 
	}, 
	tags: { 
		method: 'POST' 
	} 
}, function(err, result) {
	//added user
}); 
```


## Explicit Middleware

```javascript
router.on({

	/**
	 * returns whether an account exists
	 */

	'account/exists': function(ops) {
		
		var self = this;

		userExists(ops.user, function(yes) {
			
			if(yes) return self.error('User already exists');

			self.next();
		})
	},

	/**
	 * signs the user up
	 */

	'account/exists -> signup': function() {
		//sign up user
	}
});
```

Here's another example:

```javascript
router.on({
	
	/**
	 */

	'parseBody -> parseCookies -> signup': function(ops) {

		//do stuff
		console.log(ops.body);
	}
});
```

## Implicit Middleware

Implicit middleware allows you to inject routes without explicitly defining them. This example for instance would allow you to drop in an "alpha" check to make sure a user has been invited to a service before signing up:

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

I typically drop implicit middleware in separate files, and load load them in as plugins which can be taken out without breaking the app. The plugin above might be separated as such:

- `plugins/auth/signup.js` - plugin which signs the user up.
- `plugins/auth/beta_signup.js` - drop-in plugin that checks if a user can signup or not.

## Greedy Middleware

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
		//admin function - gets caught by /** because of -perm
	}
})
```

Note that greedy middleware is filterable based on tags. The above greedy `/**` middleware looks for the `perm` tag to identify
private routes.

Another Example:

```javascript
router.on({
	
	'my/**': function() {
		//private zone! 	
	},

	'my/profile': function() {
		//goes through my/** before getting here
	},

	'my/photos': function() {
		//goes through my/** 
	}
})
```

# API


## router.dispatch(route[, ops][, ack]);

- `route` - the route to dispatch
- `ops` - the options for the route. Passed to each callback
	- `tags` - the tags to filter with
- `ack` - acknowledgement callback of the given route 


