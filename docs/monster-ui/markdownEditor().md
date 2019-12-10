title: markdownEditor()

# monster.ui.markdownEditor()
The `monster.ui.markdownEditor()` function convert a simple textarea into a markdown editor.

![](images/markdownEditor-preview.png)

## Syntax
```javascript
monster.ui.markdownEditor(target[, options]);
```

### Parameters

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | A jQuery object that will be converted to markdow editor. | `jQuery` | | `true`
`options` | This will be a JavaScript Object, see the plugin [markdownEditor docs](https://simplemde.com/) for reference. | `Object`([#/options](#options)) | | `false`

## Description
The `monster.ui.markdownEditor()` method convert a simple textarea element into a powerful markdown editor which is specified by the `target` parameter. The toolbar can be customized or hidden completely, please see [markdownEditor docs](https://simplemde.com/) for reference.

To initialize the default markdown editor, the only parameter needed is `target`:
```javascript
var $target = $('#textarea-element');

monster.ui.markdownEditor($target);
```

## Examples
### Hide toolbar
```javascript
var $target = $('#textarea-element');
var overrideOptions = {
  toolbar: false
};

monster.ui.markdownEditor($target, overrideOptions);
```

[markdownEditor]: (https://simplemde.com/)
