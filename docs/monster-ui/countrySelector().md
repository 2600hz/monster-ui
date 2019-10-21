title: countrySelector()

# monster.ui.countrySelector()

## Syntax
```javascript
monster.ui.countrySelector($target[, selectedValues, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | jQuery object that references a `<select>` element on which the list will be rendered. | `jQuery` | | `true`
`selectedValues` | One or more country codes that will be selected on load. | `String|Array` | `[]` | `false`
`options` | List of options for [jQuery Chosen plugin][chosenOptions].  | `Object` | | `false`

### Return value
An object representing the jQuery Chosen widget that manages the list of countries.

### Errors

* `"$target" is not a jQuery object`: `$target` is not a jQuery element
* `"$target" is not a select input`: `$target` does not reference a `<select>` HTML element
* `"selectedValues" is not a string nor an array`: `$target` is defined but not a string neither an array
* `"options" is not a plain object`: `options` is defined but not a plain object

## Description
This helper will transform a select input field into a list of selectable countries. It makes use of the [`monster.ui.chosen()`][monsterUiChosen] helper under the hood, to make it easier for the user to search and select countries.

[monsterUiChosen]: chosen().md
[chosenOptions]: https://harvesthq.github.io/chosen/options.html#options
