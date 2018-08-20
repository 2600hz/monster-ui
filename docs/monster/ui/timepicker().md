title: timepicker()

# [monster][monster].[ui][ui].timepicker()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)


### Syntax
```javascript
monster.ui.timepicker(target[, options]);
```

### Parameters

###### `target`: [jQuery object][jquery] (mandatory)

Input or select element on which the method will be applied.

###### `options`: [Object][object_literal] (optional)

 Let you specify a map of options for the Timepicker. You can consult the full list here: https://github.com/jonthornton/jquery-timepicker#options

 By default:

* `timeFormat`: [String][string_literal] (optional, default: `is12hMode ? 'g:ia' : 'G:i'`)
* `lang`: [Object][object_literal] (optional, default: `monster.apps.core.i18n.active().timepicker`)

### Description
This helper will transform a field into a jQuery Timepicker element. It will automatically use the time format that the user has chosen in his Monster-UI Settings.

[monster]: ../../monster.md
[ui]: ../ui.md
[jquery]: http://api.jquery.com/Types/#jQuery
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
