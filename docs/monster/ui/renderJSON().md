# [monster][monster].[ui][ui].renderJSON()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)


### Syntax
```javascript
monster.ui.renderJSON(data, target[, args]);
```

### Parameters
* `data` (mandatory)

 Type: [JSON][PlainObject]

Data to Pretty Print

* `target` (mandatory)

 Type: [jQuery object][jquery]

 Template on which the method will be applied. It will automatically fill that div with the JSON viewer.

* `args` (optional)

 Type: [Object][PlainObject]

 Default: `{
     sort: false,
     level: 2
 }`

 Let you specify a map of options for this helper.

 * `args.sort` (optional)
Type: [Boolean][Boolean]
 Default: `false`

Sets whether the keys will be sorted alphabetically or not.

 * `args.trigger` (optional)
Type: [Integer][Integer]
 Default: `2`

Set the number of level that will be expanded automatically.

### Description
This helper will use the data provided in parameter and show it in a JSON viewer in the UI, in the container provided

[monster]: ../../monster.md
[ui]: ../ui.md
[jquery]: http://api.jquery.com/Types/#jQuery
[PlainObject]: http://api.jquery.com/Types/#PlainObject
[Integer]: http://api.jquery.com/Types/#Integer
[Boolean]: http://api.jquery.com/Types/#Boolean
[String]: http://api.jquery.com/Types/#String
