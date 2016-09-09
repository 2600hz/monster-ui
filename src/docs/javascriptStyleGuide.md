# 2600hz JavaScript Style Guide() {

*Freely inspired from [Airbnb's JavaScript Style Guide](https://github.com/airbnb/javascript)*


## Table of Contents

1. [Types](#types)
1. [Objects](#objects)
1. [Arrays](#arrays)
1. [Strings](#strings)
1. [Functions](#functions)
1. [Properties](#properties)
1. [Variables](#variables)
1. [Hoisting](#hoisting)
1. [Conditional Expressions & Equality](#conditional-expressions--equality)
1. [Blocks](#blocks)
1. [Comments](#comments)
1. [Whitespace](#whitespace)
1. [Commas](#commas)
1. [Semicolons](#semicolons)
1. [Type Casting & Coercion](#type-casting--coercion)
1. [Naming Conventions](#naming-conventions)
1. [jQuery](#jquery)
1. [Underscore](#underscore)


## Types

- **Primitives**: When you access a primitive type you work directly on its value
	+ `string`
	+ `number`
	+ `boolean`
	+ `null`
	+ `undefined`

```javascript
var foo = 1,
	bar = foo;

bar = 9;

console.log(foo, bar); // => 1, 9
```

- **Complex**: When you access a complex type you work on a reference to its value
	+ `object`
	+ `array`
	+ `function`

```javascript
var foo = [1, 2],
	bar = foo;

bar[0] = 9;

console.log(foo[0], bar[0]); // => 9, 9
```

**[▲ back to top](#table-of-contents)**


## Objects

- Use the literal syntax for object creation.

```javascript
// bad
var models = new Object();

// good
var models = {};
```

- Try not to use [reserved words](http://es5.github.io/#x7.6.1) as keys. It won't work in IE8. [More info](https://github.com/airbnb/javascript/issues/61)

```javascript
// bad
var superman = {
		default: { clark: 'kent' },
		private: true
	};

// good
var superman = {
		defaults: { clark: 'kent' },
		hidden: true
	};
```

- Use readable synonyms in place of reserved words.

```javascript
// bad
var superman = {
		class: 'alien'
	};

// bad
var superman = {
		klass: 'alien'
	};

// good
var superman = {
		type: 'alien'
	};
```

**[▲ back to top](#table-of-contents)**


## Arrays

- Use the literal syntax for array creation

```javascript
// bad
var families = new Array();

// good
var families = [];
```

- If you don't know the length of an array, use Array#push.

```javascript
var spareNumbers = [];


// bad
spareNumbers[spareNumbers.length] = 'abracadabra';

// good
spareNumbers.push('abracadabra');
```

- When you need to copy an array use Array#slice. [jsPerf](http://jsperf.com/converting-arguments-to-an-array/7)

```javascript
var len = numbers.length,
	numbersCopy = [],
	i;

// bad
for (i = 0; i < len; i++) {
  numbersCopy[i] = numbers[i];
}

// good
numbersCopy = numbers.slice();
```

- To convert an array-like object to an array, use Array#slice.

```javascript
function trigger() {
	var args = Array.prototype.slice.call(arguments);
	// ...stuff...
}
```

**[▲ back to top](#table-of-contents)**


## Strings

- Use single quotes `''` for strings

```javascript
// bad
var fullName = "John Doe";

// good
var fullName = 'John Doe';

// bad
var fullName = "John " + user.lastName;

// good
var fullName = 'John ' + user.lastName;
```

- Strings longer than 80 characters should be written across multiple lines using string concatenation.
- Note: If overused, long strings with concatenation could impact performance. [jsPerf](http://jsperf.com/ya-string-concat) & [Discussion](https://github.com/airbnb/javascript/issues/40)

```javascript
// bad
var errorMessage = 'This is a super long error that was thrown because of Batman. When you stop to think about how Batman had anything to do with this, you would get nowhere fast.';

// bad
var errorMessage = 'This is a super long error that was thrown because \
of Batman. When you stop to think about how Batman had anything to do \
with this, you would get nowhere \
fast.';

// good
var errorMessage = 'This is a super long error that was thrown because ' +
  'of Batman. When you stop to think about how Batman had anything to do ' +
  'with this, you would get nowhere fast.';
```

- When programmatically building up a string, use Array#join instead of string concatenation. Mostly for IE: [jsPerf](http://jsperf.com/string-vs-array-concat/2).

```javascript
var messages,
	length,
	items,
	i;

messages = [
	{
		state: 'success',
		message: 'This one worked.'
	},
	{
		state: 'success',
		message: 'This one worked as well.'
	},
	{
		state: 'error',
		message: 'This one did not work.'
	}
];

length = messages.length;

// bad
function inbox(messages) {
	items = '<ul>';

	for (i = 0; i < length; i++) {
		items += '<li>' + messages[i].message + '</li>';
	}

	return items + '</ul>';
}

// good
function inbox(messages) {
	items = [];

	for (i = 0; i < length; i++) {
		items[i] = messages[i].message;
	}

	return '<ul><li>' + items.join('</li><li>') + '</li></ul>';
}
```

**[▲ back to top](#table-of-contents)**


## Functions

- Function expressions:

```javascript
// anonymous function expression
var anonymous = function() {
		return true;
	};

// named function expression
var named = function named() {
		return true;
	};

// immediately-invoked function expression (IIFE)
(function() {
	console.log('Welcome to the Internet. Please follow me.');
})();
```

- Never declare a function in a non-function block (if, while, etc). Assign the function to a variable instead. Browsers will allow you to do it, but they all interpret it differently, which is bad news bears.
- **Note:** ECMA-262 defines a `block` as a list of statements. A function declaration is not a statement. [Read ECMA-262's note on this issue](http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf#page=97).

```javascript
// bad
if (currentUser) {
	function test() {
		console.log('Nope.');
	}
}

// good
var test;
if (currentUser) {
	test = function test() {
		console.log('Yup.');
	};
}
```

- Never name a parameter `arguments`, this will take precedence over the `arguments` object that is given to every function scope.

```javascript
// bad
function nope(name, options, arguments) {
	// ...stuff...
}

// good
function yup(name, options, args) {
	// ...stuff...
}
```

**[▲ back to otp](#table-of-contents)**


## Properties

- Use dot notation when accessing properties.

```javascript
var luke = {
		jedi: true,
		age: 28
	};

// bad
var isJedi = luke['jedi'];

// good
var isJedi = luke.jedi;
```

- Use subscript notation `[]` when accessing properties with a variable.

```javascript
var luke = {
		jedi: true,
		age: 28
	};

function getProp(prop) {
	return luke[prop];
}

var isJedi = getProp('jedi');
```

**[▲ back to top](#table-of-contents)**


## Variables

- Use a single `var` keyword to declare several variables.

```javascript
// bad
var cardType = getCardType(cardNumber);
var activate = true;
var result = '';

// good
var cardType = getCardType(cardNumber),
	activate = true,
	result = '';
```

- Declare unassigned variables last. This is helpful when later on you might need to assign a variable depending on one of the previous assigned variables.

```javascript
// bad
var i, len, result,
	cardType = getCardType(cardNumber),
	activate = true;

// good
var cardType = getCardType(cardNumber),
	activate = true,
	result,
	len,
	i;
```

- Assign variables at the top of their scope. This helps avoid issues with variable declaration and assignment hoisting related issues.

```javascript
// bad
function() {
	test();
	console.log('doing stuff..');

	//..other stuff..

	var name = getName();

	if (name === 'test') {
		return false;
	}

	return name;
}

// good
function() {
	var name = getName();

	test();
	console.log('doing stuff..');

	//..other stuff..

	if (name === 'test') {
		return false;
	}

	return name;
}

// bad
function() {
	var name = getName();

	if (!arguments.length) {
		return false;
	}

	return true;
}

// good
function() {
	if (!arguments.length) {
		return false;
	}

	var name = getName();

	return true;
}
```

**[▲ back to top](#table-of-contents)**


## Hoisting

- Variable declarations get hoisted to the top of their scope, their assignment does not.

```javascript
// we know this wouldn't work (assuming there
// is no notDefined global variable)
function example() {
	console.log(notDefined); // => throws a ReferenceError
}

// creating a variable declaration after you
// reference the variable will work due to
// variable hoisting. Note: the assignment
// value of `true` is not hoisted.
function example() {
	console.log(declaredButNotAssigned); // => undefined
	var declaredButNotAssigned = true;
}

// The interpreter is hoisting the variable
// declaration to the top of the scope,
// which means our example could be rewritten as:
function example() {
	var declaredButNotAssigned;
	console.log(declaredButNotAssigned); // => undefined
	declaredButNotAssigned = true;
}
```

- Anonymous function expressions hoist their variable name, but not the function assignment.

```javascript
function example() {
	console.log(anonymous); // => undefined

	anonymous(); // => TypeError anonymous is not a function

	var anonymous = function() {
		console.log('anonymous function expression');
	};
}
```

- Named function expressions hoist the variable name, not the function name or the function body.

```javascript
function example() {
	console.log(named); // => undefined

	named(); // => TypeError named is not a function

	superPower(); // => ReferenceError superPower is not defined

	var named = function superPower() {
		console.log('Flying');
	};
}

// the same is true when the function name
// is the same as the variable name.
function example() {
	console.log(named); // => undefined

	named(); // => TypeError named is not a function

	var named = function named() {
		console.log('named');
	}
}
```

- Function declarations hoist their name and the function body.

```javascript
function example() {
	superPower(); // => Flying

	function superPower() {
		console.log('Flying');
	}
}
```

- For more information refer to [JavaScript Scoping & Hoisting](http://www.adequatelygood.com/2010/2/JavaScript-Scoping-and-Hoisting) by [Ben Cherry](http://www.adequatelygood.com/)

**[▲ back to top](#table-of-contents)**


## Conditional Expressions & Equality

- Use `===` and `!==` over `==` and `!=`.
- Conditional expressions are evaluated using coercion with the `ToBoolean` method and always follow these simple rules:
	+ **Objects** evaluate to **true**
	+ **Undefined** evaluates to **false**
	+ **Null** evaluates to **false**
	+ **Booleans** evaluate to **the value of the boolean**
	+ **Numbers** evaluate to **false** if **+0, -0, or NaN**, otherwise **true**
	+ **Strings** evaluate to **false** if an empty string `''`, otherwise **true**

```javascript
if ([0]) {
	// true
	// An array is an object, objects evaluate to true
}
```

- Use shortcuts.

```javascript
// bad
if (name !== '') {
	// ...stuff...
}

// good
if (name) {
	// ...stuff...
}

// bad
if (collection.length > 0) {
	// ...stuff...
}

// good
if (collection.length) {
	// ...stuff...
}
```

- For more information see [Truth Equality and JavaScript](http://javascriptweblog.wordpress.com/2011/02/07/truth-equality-and-javascript/#more-2108) by Angus Croll

**[▲ back to top](#table-of-contents)**


## Blocks

- Use braces with all multi-line blocks.

```javascript
// bad
if (test)
	return false;

// good
if (test) {
	return false;
}

// bad
function() { return false; }

// good
function() {
	return false;
}
```

**[▲ back to top](#table-of-contents)**


## Comments

- Use `/** ... */` for multiline comments. Include a description, specify types and values for all parameters and return values.

```javascript
// bad
// make() returns a new element
// based on the passed in tag name
//
// @param {String} tag
// @return {Element} element
function make(tag) {

	// ...stuff...

	return element;
}

// good
/**
 * make() returns a new element
 * based on the passed in tag name
 *
 * @param {String} tag
 * @return {Element} element
 */
function make(tag) {

	// ...stuff...

	return element;
}
```

- Use `//` for single line comments. Place single line comments on a newline above the subject of the comment. Put an empty line before the comment.

```javascript
// bad
var active = true;  // is current tab

// good
// is current tab
var active = true;

// bad
function getCardType(number) {
	console.log('fetching type...');
	// set the default type to 'no type'
	var type = type || 'no type';

	return type;
}

// good
function getCardType(number) {
	console.log('fetching type...');

	// set the default type to 'no type'
	var type = type || 'no type';

	return type;
}
```

- Prefixing your comments with `FIXME` or `TODO` helps other developers quickly understand if you're pointing out a problem that needs to be revisited, or if you're suggesting a solution to the problem that needs to be implemented. These are different than regular comments because they are actionable. The actions are `FIXME -- need to figure this out` or `TODO -- need to implement`.

- Use `// FIXME:` to annotate problems

```javascript
function buildRequest(options) {

	// FIXME: don't know if options is defined
	options = $.extend(true, options, defaultOptions);

	return options;
}
```

- Use `// TODO:` to annotate solutions to problems

```javascript
function buildRequest(options) {

	// TODO: should check if options is undefined
	options = $.extend(true, options, defaultOptions);

	return options;
}
```

**[▲ back to top](#table-of-contents)**


## Whitespace

- Place 1 space before the leading brace.

```javascript
// bad
function error(){
	console.log('error');
}

// good
function error()∙{
	console.log('error');
}

// bad
monster.pub('auth.initApp',{
	app: self,
	callbackSuccess: function callbackSuccess() { /* ...stuff... */ }
});

// good
monster.pub('auth.initApp',∙{
	app: self,
	callbackSuccess: function callbackSuccess() { /* ...stuff... */ }
});
```

- Set off operators with spaces.

```javascript
// bad
var username=firstName+lastName;

// good
var username∙=∙firstName∙+∙lastName;
```

- Use indentation when making long method chains.

```javascript
// bad
$('#items').find('.selected').highlight().end().find('.open').updateCount();

// good
$('#items')
	.find('.selected')
		.highlight()
		.end()
	.find('.open')
		.updateCount();

// bad
var leds = stage.selectAll('.led').data(data).enter().append('svg:svg').class('led', true)
	.attr('width',  (radius + margin) - 2).append('svg:g')
	.attr('transform', 'translate(' + (radius + margin) + ',' + (radius + margin) + ')')
	.call(tron.led);

// good
var leds = stage.selectAll('.led')
		.data(data)
	.enter().append('svg:svg')
		.class('led', true)
		.attr('width',  (radius + margin) * 2)
	.append('svg:g')
		.attr('transform', 'translate(' + (radius + margin) + ',' + (radius + margin) + ')')
		.call(tron.led);
```

**[▲ back to top](#table-of-contents)**


## Commas

- Leading commas: **Nope.**

```javascript
// bad
var story = [
		once
	  , upon
	  , aTime
	];

// good
var story = [
		once,
		upon,
		aTime
	];

// bad
var hero = {
		heroName: 'Mr. Incredible'
	  , superPower: 'strength'
	  , firstName: 'Bob'
	  , lastName: 'Parr'
	};

// good
var hero = {
		heroName: 'Mr. Incredible',
		superPower: 'strength',
		firstName: 'Bob',
		lastName: 'Parr'
	};
```

- Additional trailing comma: **Nope.** This can cause problems with IE6/7 and IE9 if it's in quirksmode. Also, in some implementations of ES3 would add length to an array if it had an additional trailing comma. This was clarified in ES5 ([source](http://es5.github.io/#D)):

	> Edition 5 clarifies the fact that a trailing comma at the end of an ArrayInitialiser does not add to the length of the array. This is not a semantic change from Edition 3 but some implementations may have previously misinterpreted this.

```javascript
// bad
var hero = {
		firstName: 'Kevin',
		lastName: 'Flynn',
	};

var heroes = [
		'Batman',
		'Superman',
	];

// good
var hero = {
		firstName: 'Kevin',
		lastName: 'Flynn'
	};

var heroes = [
		'Superman',
		'Batman'
	];
```

**[▲ back to top](#table-of-contents)**


## Semicolons

- Although [not mandatory in javascript](http://inimino.org/~inimino/blog/javascript_semicolons), every statement should be terminated with a semicolon.

```javascript
// bad
(function() {
	var name = 'Skywalker'
	return name
})()

// good
(function() {
	var name = 'Skywalker';
	return name;
})();

// good (guards against the function becoming an argument when two files with IIFEs are concatenated)
;(function() {
	var name = 'Skywalker';
	return name;
})();
```

[Read more](http://stackoverflow.com/a/7365214/1712802).

**[▲ back to top](#table-of-contents)**


## Type Casting & Coercion

- Perform type coercion at the beginning of the statement.
- Strings:

```javascript
//  => discount = 9;

// bad
var totalDiscount = discount + '';

// good
var totalDiscount = '' + discount;

// bad
var totalDiscount = '' + discount + ' total discount';

// good
var totalDiscount = discount + ' total discount';
```

- Use `parseInt` for Numbers and always with a radix for type casting.

```javascript
var inputValue = '4';

// bad
var val = new Number(inputValue);

// bad
var val = +inputValue;

// bad
var val = inputValue >> 0;

// bad
var val = parseInt(inputValue);

// good
var val = Number(inputValue);

// good
var val = parseInt(inputValue, 10);
```

- Booleans:

```javascript
var type = 0;

// bad
var hasType = new Boolean(type);

// good
var hasType = Boolean(type);

// good
var hasType = !!type;
```

**[▲ back to top](#table-of-contents)**


## Naming Conventions

- Avoid single letter names. Be descriptive with your naming.

```javascript
// bad
function r() {
	// ...stuff...
}

// good
function request() {
	// ..stuff..
}
```

- Use camelCase when naming objects, variables and functions, even for acronyms.

```javascript
// bad
var formatted_user_data = {};
function ParseURL() {}
var n = {
		id: '+14151234568'
	};

// good
var formattedUserData = {};
function parseUrl() {}
var number = {
		id: '+14151234568'
	};
```

- When saving a reference to `this` use `self`.

```javascript
// bad
function() {
	var _this = this;
	return function() {
		console.log(_this);
	};
}

// bad
function() {
	var that = this;
	return function() {
		console.log(that);
	};
}

// good
function() {
	var self = this;
	return function() {
		console.log(self);
	};
}
```

- All our applications are defined as an object. By convention, every function defined at the root of the application should declare a variable `self` to reference the scope of the application (`this`).

```javascript
{
	bindEvents: function() {
		var self = this;
		// Some code...
	}
}
```

- The data returned by the APIs, does not follow the same conventions. Most properties will be lowercased, each word separated by an underscore. For obvious reasons, these properties must __not__ be renamed.

```javascript
{
	getUserName: function(accountId, userId) {
		var self = this;

		self.callApi({
			resource: 'user.get',
			data: {
				accountId: accountId,
				userId: userId
			},
			success: function(data) {
				var user = data.data;

				return user.first_name + ' ' + user.last_name;
			}
		});
	}
	/* ... */
}
```

- Name your functions. This is helpful for stack traces.

```javascript
// bad
var log = function(msg) {
		console.log(msg);
	};

// good
var log = function log(msg) {
		console.log(msg);
	};
```

- **Note:** IE8 and below exhibit some quirks with named function expressions.  See [http://kangax.github.io/nfe/](http://kangax.github.io/nfe/) for more info.

**[▲ back to top](#table-of-contents)**


## jQuery

- Prefix jQuery object variables with a `$`.

```javascript
// bad
var sidebar = $('.sidebar');

// good
var $sidebar = $('.sidebar');
```

- Cache jQuery lookups.

```javascript
// bad
function setSidebar() {
	$('.sidebar').hide();

	// ...stuff...

	$('.sidebar').css({
		'background-color': 'pink'
	});
}

// good
function setSidebar() {
	var $sidebar = $('.sidebar');
	$sidebar.hide();

	// ...stuff...

	$sidebar.css({
		'background-color': 'pink'
	});
}
```

- When accessing `$(this)` multiple times, reference it as a `$this` variable to call it only once.

```javascript
// bad
$.each($appList, function(index, value) {
	var id = $(this).data('id');

	$(this).hide();

	// ...stuff..
});

// good
$.each($appList, function(index, value) {
	var $this = $(this),
		id = $this.data('id');

	$this.hide();

	// ...stuff..
});
```

- For DOM queries use Cascading `$('.sidebar ul')` or parent > child `$('.sidebar > ul')`. [jsPerf](http://jsperf.com/jquery-find-vs-context-sel/16)
- Use `find` with scoped jQuery object queries.

```javascript
// bad
$('ul', '.sidebar').hide();

// bad
$('.sidebar').find('ul').hide();

// good
$('.sidebar ul').hide();

// good
$('.sidebar > ul').hide();

// good
$sidebar.find('ul').hide();
```

**[▲ back to top](#table-of-contents)**


## Underscore

- Prefer using Underscore helpers when manipulating JavaScript objects (non-DOM elements).

```javascript
var collection: {
		one: 1,
		two: 2,
		three: 3
	};

// bad
$.each(collection, function(index, value) {
	// ...stuff...
});

// good
_.each(collection, function(value, key, list) {
	// ...stuff...
});
```

**[▲ back to top](#table-of-contents)**


# };