# monster.ui.timepicker()

## Syntax
```javascript
monster.ui.timepicker(target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | Input or select element on which the method will be applied. | `jQuery` | | `true`
`options` | List of options for [jQuery Timepicker plugin][timepicker]. | `Object` | | `false`

## Description
This helper will transform a field into a jQuery Timepicker element. It will automatically use the time format that the user has chosen in his Monster-UI Settings.

[timepicker]: https://github.com/jonthornton/jquery-timepicker#options
