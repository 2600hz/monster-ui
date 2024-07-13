# monster.ui.getJsoneditor()

## Syntax
```javascript
monster.ui.getJsoneditor(target)
```

### Parameters

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | The JSON Editor widget container. | `jQuery` | |`true`

### Return
An instance of the JSONEditor or `null` if the editor's container does not exist.

## Description
The `monster.ui.getJsoneditor()` method provides access to the editor's instance from the DOM using the `target` parameter, which is the [JSONEditor](./jsoneditor().md) container. This method returns the `JSONEditor` instance.

To get the JSONEditor, you just need to pass the `target` parameter:
```javascript
// Editor's container
var $target = $('#jsoneditor');

var jsoneditor = monster.ui.getJsoneditor($target)
```
