# monster.ui.numberPicker()

## Syntax
```javascript
monster.ui.numberPicker($target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | Input element on which the method will be applied. | `jQuery` | | `true`
`options` | List of options for [jQuery UI Spinner Widget][spinner]. | `Object` | | `false`
`options.change` | Callback on value change (note that this function will not override the widget's behavior to exclude invalid values, but can be used to retrieve the new value). | `Function` | | `false`

## Description
This helper will transform an input field into a number picker, using the jQuery UI Spinner Widget.

However, compared to the default widget setup, this control won't allow to be left empty, nor to enter non-numeric or out of range values (if `min` and `max` parameters were provided for the latter). This validation is performed through an internal handler for the widget's `change` event.

## Examples
### Create a number picker with a max and min limits
```javascript
var $target = $('#quantity');
var options = {
  min: 10,
  max: 50
};

monster.ui.numberPicker($target, options);
```

[spinner]: https://api.jqueryui.com/spinner/
