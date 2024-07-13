# monster.ui.countrySelector()

## Syntax
```javascript
monster.ui.countrySelector($target[, args]);
```

### Parameters

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | jQuery object that references a `<select>` element on which the list will be rendered. | `jQuery` | | `true`
`args` | Additional arguments to initialize the selector. | `Object`([#args](#args)) | | `false`

#### `args`

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`selectedValues` | One or more country codes that will be selected on load. | `String|Array` | `[]` | `false`
`options` | Configuration options for this helper.  | `Object`([#options](#options)) | | `false`

#### `options`
The helper options supports the ones available for the [jQuery Chosen plugin][chosenOptions], as well as a custom option named `showEmptyOption`. This parameter is a `boolean` which indicates whether to add an empty item to the choices list. Having this empty option allows the control to have an empty state.

### Return value
An object representing the jQuery Chosen instance that manages the list of countries.

### Errors

* `"$target" is not a jQuery object`: `$target` is not a jQuery element
* `"$target" is not a select input`: `$target` does not reference a `<select>` HTML element
* `"args" is not a plain object`: `args` is defined but not a plain object
* `"args.selectedValues" is not a string nor an array`: `args.selectedValues` is defined but not a string neither an array
* `"args.options" is not a plain object`: `args.options` is defined but not a plain object

## Description
This helper will transform a select input field into a list of selectable countries. It makes use of the [`monster.ui.chosen()`][monsterUiChosen] helper under the hood, to make it easier for the user to search and select countries.

[monsterUiChosen]: chosen().md
[chosenOptions]: https://harvesthq.github.io/chosen/options.html#options
