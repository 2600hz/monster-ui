title: highlight()

# [monster][monster].[ui][ui].highlight()
The `monster.ui.highlight()` method quickly highlights an element then fades it back to normal, from blue to gray by default.

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.ui.highlight(element[, options]);
```

### Parameters

###### `element`: [jQuery object][jquery] (mandatory)

Target HTML element to highlight.

###### `options`: [Object][object_literal] (optional)

* `startColor`: [String][string_literal] (optional, default: `#22a5ff`) - color of the initial highlight
* `endColor`: [String][string_literal] (optional, default: `#F2F2F2`) - color to fade to
* `timer`: [Number][integer] (optional, default `2000`) - total duration of the highlight in milliseconds
* `callback`: [Function][function] (optional) - executed once the fading of the highlight is complete

### Return

[undefined][undefined]

### Description

This function will highlight a target element by changing its background color to `startColor` then fading it to `endColor` in `timer` milliseconds. If the element is out of the view, the page will be scrolled back to that element. Once the fading is complete if the `callback` function has been provided, it will be executed.

### Examples
* Highlight an element using the default settings
```javascript
var target = $('#element_to_highlight');
monster.ui.highlight(target);
```

* Highlight an element in green ('#3B3') then fade it back to white ('#FFF') in 5 seconds, and finally display a message in the console.
```javascript
var target = $('#element_to_highlight');
monster.ui.highlight(target, {
	startColor: '#3B3',
	endColor: '#FFF',
	timer: 5000,
	callback: function() {
		console.log('Highlight complete.');
	}
});
```

[monster]: ../../monster.md
[ui]: ../ui.md

[jquery]: http://api.jquery.com/Types/#jQuery
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[undefined]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
