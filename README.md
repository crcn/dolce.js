
```javascript

var dolce = require('dolce');


var api = dolce({
	
	/**
	 */
	 
	'authorize': function(credits, callback) {
		if(credits.user != 'user' || credits.pass != 'hello') throw new Error('Unauthorized');

		if(!this.next()) callback();
	},

	/**
	 */

	'authorize -> getAccountInfo': function(credits, callback) {
		callback(false, 'success!');
	}
});


api.getAcountInfo({ user: 'user', pass: 'pass' }, function() {
	
});

```