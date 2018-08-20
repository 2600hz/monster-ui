title: renderJSON()

# [monster][monster].[ui][ui].renderJSON()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)


### Syntax
```javascript
monster.ui.renderJSON(data, target[, args]);
```

### Parameters

###### `data`: [JSON][json] (mandatory)

Data to Pretty Print

###### `target`: [jQuery object][jquery] (mandatory)

Template on which the method will be applied. It will automatically fill that div with the JSON viewer.

###### `args`: [Object][object_literal] (optional)

Let you specify a map of options for this helper:

* `sort`: [Boolean][boolean_literal] (optional, default: `false`) - sets whether the keys will be sorted alphabetically or not.
* `level`: [Number][integer] (optional, default `2`) - set the number of level that will be expanded automatically.
* `theme`: `light`| `dark` [String][string_literal] (optional, default: `light`) - choose a theme for the JSON viewer; 'light' or 'dark' are the only accepted options at the moment; Choose `dark` for a dark background :)

### Description
This helper will use the data provided in parameter and show it in a JSON viewer in the UI, in the container provided

[monster]: ../../monster.md
[ui]: ../ui.md

[jquery]: http://api.jquery.com/Types/#jQuery
[json]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[boolean_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Boolean_literals
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals

