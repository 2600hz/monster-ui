title: spinner()

# monster.ui.spinner()

## Syntax
```javascript
monster.ui.spinner(target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | Input element on which the method will be applied. | `jQuery` | | `true`
`options` | List of options for [jQuery UI Spinner Widget][spinner]. | `Object` | | `false`

## Description
This helper will transform a field into a jQuery UI Spinner Widget.

## Examples
### Create a spinner with a max and min limits
```javascript
var $target = $('#quantity');
var options = {
  min: 10,
  max: 50
};

monster.ui.spinner($target, options);
```

[spinner]: https://api.jqueryui.com/spinner/
