# [monster][monster].[ui][ui].tooltips()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)


### Syntax
```javascript
monster.ui.tooltips(target[, args]);
```

### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

 Template on which the method will be applied. It will automatically find the tooltips field and add an event so that when a user mouseover it, it shows a tooltip. 
 This helper allows us to lazy-load the tooltips instead of loading them all at once when we first load the template, which could be heavy on the browser.

* `args` (optional)

 Type: [Object][PlainObject]

 Default: `{}`

 Let you specify a map of options for this helper.

 * `args.selector` (optional)
Type: [String][String]
 Default: `'[data-toggle="tooltip"]''`

Sets the CSS Selector to use to call the Bootstrap tooltip method on.

 * `args.trigger` (optional)
Type: [String][String]
 Default: `'mouseover''`

Sets the Event to use to call the Bootstrap tooltip method on.

 * `args.options` (optional)
 Type: [Object][PlainObject]
 Default: `{}`

Options to customize the Bootstrap 2.3.1 Tooltips. Full list of options here: http://getbootstrap.com/2.3.2/javascript.html#tooltips

### Description
This helper will find all the item under the specified selector and will allow the lazy-loading of tooltips on them automatically.

[monster]: ../../monster.md
[ui]: ../ui.md
[jquery]: http://api.jquery.com/Types/#jQuery
[PlainObject]: http://api.jquery.com/Types/#PlainObject
[String]: http://api.jquery.com/Types/#String
