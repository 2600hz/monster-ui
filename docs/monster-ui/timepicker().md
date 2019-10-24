title: timepicker()

# monster.ui.timepicker()

## Syntax
```javascript
monster.ui.timepicker($target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | Input or select element to append the plugin to. | `jQuery` | | `true`
`options` | List of options for [jQuery Timepicker plugin][timepicker] (unoverridable options are `timeFormat` and `lang`). | `Object` | | `false`

### Return value
A jQuery timepicker plugin instance.

### Errors
* `"$target" is not a jQuery object`: `$target` is not a jQuery element
* `"options" is not a plain object`: `options` is defined but not a plain object

## Description
The `monster.ui.timepicker()` helper transforms a field into a jQuery timepicker plugin element. It automatically sets the time format to the currently logged-in user's preferences if it exists, and defaults to 24h formatting if it does not. It also uses the language set corresponding to the one set in the whitelabel config.

[timepicker]: https://github.com/jonthornton/jquery-timepicker#options
