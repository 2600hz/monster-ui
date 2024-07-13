# monster.ui.datepicker()

## Syntax
```javascript
monster.ui.datepicker(target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | Input on which the method will be applied. | `jQuery` | | `true`
`options` | Let you override default options that can be found on the [jQuery UI Datepicker Widget][datepicker] page.  | `Object` | | `false`

### Return value
A `jQuery` object representing the datepicker widget.

## Description
This helper will transform a field into a jQuery Date Picker. It will automatically use the date format that the user has chosen in his Monster-UI Settings.

[datepicker]: http://api.jqueryui.com/datepicker/
