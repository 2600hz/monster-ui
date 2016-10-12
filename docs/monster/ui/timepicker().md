# [monster][monster].[ui][ui].timepicker()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)


### Syntax
```javascript
monster.ui.timepicker(target[, options]);
```

### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

 Input or select element on which the method will be applied.

* `options` (optional)

 Type: [Object][PlainObject]

 Default: 
 ```js
 {
    timeFormat: is12hMode ? 'g:ia' : 'G:i',
    lang: monster.apps.core.i18n.active().timepicker
 }
 ```

 Let you specify a map of options for the Timepicker. You can consult the full list here: https://github.com/jonthornton/jquery-timepicker#options
 By default

### Description
This helper will transform a field into a jQuery Timepicker element. It will automatically use the time format that the user has chosen in his Monster-UI Settings.

[monster]: ../../monster.md
[ui]: ../ui.md
[jquery]: http://api.jquery.com/Types/#jQuery
[PlainObject]: http://api.jquery.com/Types/#PlainObject
