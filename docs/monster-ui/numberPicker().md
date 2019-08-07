title: numberPicker()

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

## Description
This helper will transform an input field into a number picker, using the jQuery UI Spinner Widget.

However, compared to the default widget setup, this control won't allow to be left empty, nor to enter non-numeric or out of range values (if `min` and `max` parameters were provided for the latter).

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
