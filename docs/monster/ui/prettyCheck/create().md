# [monster][monster].[ui][ui].[prettyCheck][prettyCheck].create()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

![Different states](http://i.imgur.com/Byjs07J.png)

### Syntax
```javascript
monster.ui.prettyCheck.create(target[, inputType]);
```

### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

 Either an element containing checkbox/radio or a single checkbox/radio element.

* `inputType` (optional)

 Type: [String][string_literal]

 Default: `checkbox`

 Type of input to prettify, with three values allowed: `checkbox`, `radio` and `all`. If not specified, the default value of `checkbox` will be used.

### Description
This method is used to transform normal looking checkbox/radio to styled ones with the look and feel of Monster UI. To do that, you just need to give the method a `target` parameter containing the checkbox/radio or directly the checkbox/radio element.

If you specify an element containing both checkboxes and radio buttons without specifying the `inputType` parameter, only the checkboxes will be styled. To style all the inputs, call the method with the `inputType` parameter set to `all`.

### Examples
* Transform checkboxes only
```javascript
monster.ui.prettyCheck.create($('input'));
```

![Image showing the transformation of a checkbox, using monster.ui.prettyCheck.create()](http://i.imgur.com/MsHYyQD.png)

* Transform radio buttons only
```javascript
monster.ui.prettyCheck.create($('input'), 'radio');
```

* Transform checkboxes and radios buttons
```javascript
monster.ui.prettyCheck($('input'), 'all');
```

[monster]: ../../../monster.md
[ui]: ../../ui.md
[prettyCheck]: ../prettyCheck.md

[jquery]: http://api.jquery.com/Types/#jQuery
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals