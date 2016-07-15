/*
	This file loads all modules which are to be tested.
*/

//Note: require() is provided by require1k.js
const example = require('./example_module');


QUnit.test("example", function( assert ) {
  assert.ok(example.increment(1) === 2);
});
