title: keyValueEditor()

# monster.ui.keyValueEditor()

## Syntax
```javascript
monster.ui.keyValueEditor($target, options);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | A jQuery object inside which the key-value editor will be inserted using the [append()][append] method. | `jQuery` | | `true`
`options` | A plain JavaScript object that contains options to set up the editor. | `Object`([#options](#options)) | | `false`

#### options
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`data` | JSON object that contains the data to be handled by the editor. | `Object` | `{}` | `false`
`inputName` | String to be set as prefix for the text fields' ID and name attributes. | `String` | `data` | `false`
`i18n` | Define custom text labels to use instead of the default ones. | `Object`([#i18n](#i18n)) | | `false`

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
* `"options.data" is not a plain object`: `options.data` is not a plain JavaScript object
* `"options.inputName" is not a string`: `options.inputName` was provided, but it is not a `String` value
* `"options.i18n.addLink" is not a string`: `options.i18n.addLink` was provided, but it is not a `String` value
* `"options.i18n.keyPlaceholder" is not a string`: `options.i18n.keyPlaceholder` was provided, but it is not a `String` value
* `"options.i18n.valuePlaceholder" is not a string`: `options.i18n.valuePlaceholder` was provided, but it is not a `String` value

## Description
The `monster.ui.keyValueEditor()` method allows you to generate a list of rows to display and edit key-value pairs, with the look and feel of Monster UI.

The key and value inputs are displayed as two same-lenght columns of text fields. There is also a third smaller column that contains delete icons, which allow to delete each data row. It also provides a "Add Data Row" link button at the bottom, which allows to add new key-value entries to the list.

The editor is expanded by default to the full width of the container. The dimensions can be adjusted via additional CSS rules nonetheless.

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

[append]: http://api.jquery.com/append/
