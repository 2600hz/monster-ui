# Monster UI Javascript Style Guide() {

* [Strings](#strings)
* [Variables](#variables)
* [Whitespace](#whitespace)
* [Semicolons](#semicolons)
* [Naming Conventions](#naming-conventions)

## Strings
* Use single quotes `''` for strings
```javascript
// bad
var name = "Bob Parr";

// good
var name = 'Bob Parr';

// bad
var fullName = "Bod" + this.lastName;

// good
var fullName = 'Bob' + this.lastName;
```

* Strings longer that 80 characters should be written across multiple lines using string concatenation

* Note: If overused, long strings with concatenation could impact performance
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
	'with this, you would get nowhere fast.'

```

## Variables
* Always use `var` to declare variables. Not doing so will result in global variables. We want to avoid polluting the global namespace
```javascript
// bad
superPower = new SuperPower();

// good
var superPower = new SuperPower();
```

* Use one var declaration for multiple variables and declare each variable on a new line
```javascript
// bad
var items = getItems();
var goSportsTeam = true;
var dragonball = 'z';

// good
var items = getItems(),
	goSportsTeam = true,
	dragonball = 'z';
```

* Declare unassigned variables last. This is helpful when later on you might need to assign a variable depending on one of the previous assigned variables
```javascript
// bad
var i, len, dragonball,
	items = getItems(),
	goSportsTeam = true;

// bad
var i, items = getItems(),
	dragonball,
	gotSportsTeam = true,
	len;

// good
var gotSportsTeam = true,
	items = getItems(),
	dragonball,
	len,
	i;
```

* Assign variables at the top of their scope. This helps avoid issues with variable declaration and assignment hoisting related issues
```javascript
// bad
function() {
	test();
	console.log('doing stuff ...');

	// ...other stuff...

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
	console.log('doing stuff'...);

	// ...other stuff...

	if (name === 'test') {
		return false;
	}

	return name;
}

// bad
function() {
	var name = getName();

	if(!arguments.length) {
		return false;
	}

	// ...doing stuff...

	return true;
}

// good
function() {
	if (!arguments.length) {
		return false;
	}

	var name = getName();

	// ...doing stuff...

	return true;
}
```

## Whitespace
* Use hard tabs set to 4 spaces
```javascript
// bad
function() {
∙∙var name;
}

// bad
function() {
∙∙∙∙var name;
}

// good
function() {
————var name;
}
```

* Place 1 space before the leading brace
```javascript
// bad
function test(){
	console.log('test');
}

// good
function test()∙{
	console.log('test');
}

// bad
user.set('attr',{
	age: 38,
	country: 'France'
});

// good
user.set('attr',∙{
	age: 38,
	country: 'France'
});
```

* Set off operators with spaces
```javascript
// bad
var x=y+z;

// good
var x∙=∙y∙+∙z;
```

* End files with a single newline character
```javascript
// bad
(function(global) {
	// ...logic...
})(this);

// bad
(function(global) {
	// ...logic...
});╛
╛

// good
(function(global) {
	// ...logic...
});╛
```

* Use indentation when making long method chain
```javascript
// bad
$('item').find('.selected').highlight().end().find('.open').updateCount();

// good
$('#items')
	.find('.selected')
		.highlight()
		.end()
	.find('.open')
		.updateCount();

// bad
var leds = stage.selectAll('.led').data(data).enter().append('svg:svg').class('led', true)
	.attr('width', (radius + margin) * 2).append('svg:g')
	.attr('transform', 'translate(' + (radius + margin) + ',' + (radius + margin) + ')')
	.call(tron.led);

// good
var leds = stage.selectAll('.led')
		.data(data)
	.enter().append('svg:svg')
		.class('led', true)
		.attr('width', (radius + margin) * 2)
	.append('svg:g')
		.attr('transform', 'translate(' + (radius + margin) + ',' + (radius + margin) + ')')
		.call(tron.led);

```

## Semicolons
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

/**
 * good 
 * guards against the function becoming an argument 
 * when two files with IIFEs are concatenated
*/
;(function() {
	var name = 'Skywalker';
	return name;
})();
```

[Read more](http://stackoverflow.com/questions/7365172/semicolon-before-self-invoking-function/7365214#7365214)

## Naming Conventions
* When saving a reference to `this` use `self`
```javascript
// bad
function() {
	var that = this;
	return function() {
		console.log(that);
	};
}

// bad
function() {
	var _this = this;
	return function() {
		console.log(_this);
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

# };