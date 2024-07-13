# monster.ui.keyValueEditor()

## Syntax
```javascript
monster.ui.keyValueEditor($target, options);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | Container of the widget inserted with `jQuery#append`. | `jQuery` | | `true`
`options` | List of initialization options. | `Object`([#options](#options)) | | `false`

#### options
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`data` | Key/value pairs to initialize the editor with. | `Object` | `{}` | `false`
`inputName` | String to be set as prefix for the text fields' name attribute. | `String` | `data` | `false`
`i18n` | Override default i18n strings. | `Object`([#i18n](#i18n)) | | `false`

#### i18n
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`addLink` | Text to be displayed in the link button to add new data rows. | `String` | `+ Add Data Row` | `false`
`keyPlaceholder` | Text placeholder to be displayed in the key inputs. | `String` | `Data key` | `false`
`valuePlaceholder` | Text placeholder to be displayed in the value inputs. | `String` | `Data value` | `false`

### Return value
A `jQuery` object representing the key-value editor widget.

### Errors
* `"$target" is not a jQuery object`: `$target` is not a jQuery object
* `"options.data" is not a plain object`: `options.data` is not a plain object
* `"options.inputName" is not a string`: `options.inputName` is not a `String` value
* `"options.i18n.addLink" is not a string`: `options.i18n.addLink` is not a `String` value
* `"options.i18n.keyPlaceholder" is not a string`: `options.i18n.keyPlaceholder` is not a `String` value
* `"options.i18n.valuePlaceholder" is not a string`: `options.i18n.valuePlaceholder` is not a `String` value

## Description
The `monster.ui.keyValueEditor()` creates a widget to manage a dynamic list of key-value pair with the look and feel of Monster UI.

The key and value inputs are displayed as two same-length columns while the third, smaller column, contains an actionable element to delete each data row. It also provides a "Add Data Row" link button at the bottom allowing the addition of an unlimited number of extra rows.

By default, the widget will match the width of its `$target` container.

When this widget is used inside a form, and [`monster.ui.getFormData()`][getFormData] is used to parse the form into an object, then `inputName` will be the property under which key/value pairs are collected in an array.

## Examples
### Create an empty key-value editor, with default options
```javascript
var $target = $('#data_container');

monster.ui.keyValueEditor($target);
```

### Create an editor by providing all its options
```javascript
var target = $('#custom_data_container');
var data = {
  'Key 1': 'Value 1',
  'Key 2': 'Value 2',
}
var options = {
  data: data,
  inputName: 'custom_data',
  i18n: {
    addLink: self.i18n.active().customData.addLink,
    keyPlaceholder: self.i18n.active().customData.keyPlaceholder,
    valuePlaceholder: self.i18n.active().customData.valuePlaceholder
  }
};

monster.ui.keyValueEditor(target, options);
```

[getFormData]: getFormData().md
