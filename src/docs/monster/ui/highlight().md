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
* `element` (mandatory)

 Type: [jQuery object][jquery]

 Target HTML element to highlight.

* `options` (optional)

 Type: [Object][object_literal]

 Default:
 ```javascript
 	{
		startColor: '#22a5ff',
		endColor: '#F2F2F2',
		timer: 2000
	}
 ```

 Lets you override the default options above and specify a callback to be executed after the highlight completely faded out.
    - startColor: Color of the initial highlight.
    - endColor: Color to fade to.
    - timer: Total duration of the highlighting in milliseconds.
    - callback: Callback executed once the fading of the highlight is complete.

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
