
Dolce is a collection library used primarily for routing.  [![Build Status](https://secure.travis-ci.org/crcn/dolce.png)](https://secure.travis-ci.org/crcn/dolce)

## Use Cases:




## Basic Example:

```javascript
var dolce = require('dolce'),
col1 = dolce.collection(),
col2 = dolce.collection(),
col3 = dolce.collection(),
col4 = dolce.collection(),
col5 = dolce.collection();

//explicit middleware
col1.add('hello', 'HELLO');
col1.add('hello -> world', 'WORLD');

console.log(col1.get('world')); //[{ value: 'HELLO' }, { value: 'WORLD' }]

//parameters
col5.add('validate/:name');
col5.add('validate/:firstName -> add/user/:firstName/:lastName');
logCollection(col5.get('add/user/craig/condon')); //[{ value: 'HELLO' }, { value: 'WORLD' }]

//implicit middleware
col2.add('hello/*', 'HELLO')
col2.add('hello', 'WORLD');

console.log(col2.get('hello')); //[{ value: 'HELLO' }, { value: 'WORLD' } ]

//greedy middleware
col3.add('hello/**', 'HELLO')
col3.add('hello/awesome/**', 'AWESOME');
col3.add('hello/awesome/world', 'WORLD');

console.log(col3.get('hello/awesome/world')); //[{ value: 'HELLO' }, { value: 'AWESOME' }, { value: 'WORLD' } ]

//filtering middleware
col4.add('-method=UPDATE users/:userid','update user');
col4.add('-method=DELETE users/:userid', 'delete user');
col4.add('-method=GET users/:userid', 'get user');

console.log(col4.get('users/14732843', { tags: { method: 'GET' } })); //[{ tags: { method: 'GET' }, value: 'get user' }];
```


