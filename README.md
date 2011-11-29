## Syntactic sugar for javascript functions

### Motification


## Example

```javascript
var target = dolce({
	
	/**
	 */

	'authorize': function(ops) {
		if(ops.user != 'user' && pass != 'pass') throw new Error('incorrect username / password');

		if(!this.next({ user: })) {
			
		}
	},

	/**
	 */

	'authorize -> getAccount': function(ops) {
		this.callback()
	}
});


target.getAccount({ user: 'user', pass: 'pass'}, function(err, result) {
	
});
```