# monster.ui.chosen()

## Syntax
```javascript
monster.ui.chosen($target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | Select element to invoke the chosen plugin on. | `jQuery` | | `true`
`options` | List of options for [jQuery Chosen plugin][chosenOptions]. | `Object` | | `false`

### Return value
jQuery Chosen widget instance.

## Description
This helper will transform a field into a jQuery Chosen element.

### Tag mode
When setting the `tags` option to `true`, you will be able to add new options to the select element by hitting enter if no results are selected from the list of existing ones.

[chosenOptions]: https://harvesthq.github.io/chosen/options.html#options
