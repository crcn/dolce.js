
Dolce is a super sweet routing framework for javascript. [![Build Status](https://secure.travis-ci.org/crcn/dolce.png)](https://secure.travis-ci.org/crcn/dolce)


Basic Example:

```javascript

var router = require('dolce').router();

router.on({
	
	/**
	 * validates authentication credentials
	 */

	'validateLogin': function(ops) {

		if(ops.u != 'username' && ops.p != 'password') return new Error('Invalid Login');

	},

	/**
	 */

	'validateLogin -> postMessage': function(ops) {

		return 'You posted "%s".', ops.message;

	}
});


// a successful dispatch
router.dispatch('postMessage', {
	data: {
		u: 'username',
		p: 'password',
		message: 'Hello Dolce!'
	},

	response: (err, result) {
		console.log(result); //You posted "Hello Dolce!"
	}
});

//an unsuccessful dispatch
router.dispatch('postMessage', {
	
	data: {
		u: 'badUsername',
		p: 'badPassword',
		message: 'Hello World!'
	},

	response: (err, result) {
		console.log(err.message); //Invalid login
	}
});


```


## Regular Routes

## Route Parameters

## Implicit Middleware

## Explicit Middleware

## Greedy Routes

## Route Tags

## Filtering Routes

# API
