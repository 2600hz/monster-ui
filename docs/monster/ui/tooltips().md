# [monster][monster].[ui][ui].tooltips()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)


### Syntax
```javascript
monster.ui.tooltips(target[, args]);
```

### Parameters

###### `target`: [jQuery object][jquery] (mandatory)

Template on which the method will be applied. It will automatically find the tooltips field and add an event so that when a user mouseover it, it shows a tooltip. 
 This helper allows us to lazy-load the tooltips instead of loading them all at once when we first load the template, which could be heavy on the browser.

###### `args`: [Object][object_literal] (optional, default: `{}`)

Let you specify a map of options for this helper:

* `selector`: [String][string_literal] (optional, default: `[data-toggle="tooltip"]`) - sets the CSS Selector to call the tooltip method on
* `trigger`: [String][string_literal] (optional, default: `mouseover`) - sets the Event to use to call the Bootstrap tooltip method on
* `options`: [Object][object_literal] (optional, default: `{}`) - options to customize the Bootstrap 2.3.1 Tooltips. Full list of options [here](http://getbootstrap.com/2.3.2/javascript.html#tooltips)

### Description
This helper will find all the item under the specified selector and will allow the lazy-loading of tooltips on them automatically.

[monster]: ../../monster.md
[ui]: ../ui.md
[jquery]: http://api.jquery.com/Types/#jQuery
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
