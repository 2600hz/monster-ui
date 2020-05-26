title: jsoneditor()

# monster.ui.jsoneditor()
The `monster.ui.jsoneditor()` method generates an instance of a JSON editor with a set of handy methods and properties.

![](images/jsoneditor-preview.png)

## Syntax
```javascript
monster.ui.jsoneditor(target[,options, json, customClass])
```

### Parameters

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | A Jquery object which is automatically contain the JSON Editor | `jQuery` | |`true`
`options` | Let you override default editor options that can be found on the [JSONEditor](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md) page | `Object` | |`false`
`json` | Initial JSON object data to be loaded in the editor | `Object` | |`false`
`customClass` | Custom CSS class for the editor container (overrides the default one, so you have to assing the mandatory `with` and `height` style properties in your custom class) | `String` | `monster-jsoneditor` |`false`

## Description
The `monster.ui.jsoneditor()` method renders a powerfull jsoneditor into the specified `target` which is completely customizable passing the `options` parameter. This method returns the `JSONEditor` instance so you have access to its properties and methods. Please see [JSONEditor](https://github.com/josdejong/jsoneditor) for reference.

To initialize the JSONEditor, you just need to pass the `target` parameter:
```javascript
var $target = $('#jsoneditor');

var jsoneditor = monster.ui.jsoneditor($target)
```

## Examples
### Use the method options

```javascript
var $target = $('#jsoneditor');
/* To know more about all available options please go to:
 https://github.com/josdejong/jsoneditor/blob/master/docs/api.md */
var options {
  mode: 'review',
  modes: ['code', 'tree'],
  search: true
}
var jsoneditor = monster.ui.jsoneditor($target, options);
```

### Get the final JSON object

```javascript
var $target = $('#jsoneditor');
var jsoneditor = monster.ui.jsoneditor($target);

// This funcion gets the valid JSON object. If the JSON is not valid this method throws an exception
jsoneditor.get()
```
