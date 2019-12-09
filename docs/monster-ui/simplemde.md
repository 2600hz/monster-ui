title: simplemde()

# monster.ui.simplemde()
The `monster.ui.simplemde()` function convert a simple textarea into a markdown editor.

![simplemde](https://imgur.com/a/8JKzTqg)

## Syntax
```javascript
monster.ui.simplemde(target[, options]);
```

### Parameters

###### `target`: [jQuery Object][jquery] (mandatory)

A jQuery object that will be converted to markdow editor.

###### `options`: [Object][object_literal] (optional)

This will be a JavaScript Object, see the plugin [simplemde docs](https://simplemde.com/) for reference.

## Description
The `monster.ui.simplemde()` method convert a simple textarea element into a powerful markdown editor which is specified by the `target` parameter. The toolbar can be customized or just hide the toolbar, please see [simplemde docs](https://simplemde.com/) for reference.

To initialize the default markdown editor, the only parameter needed is `target`:
```javascript
var $target = $('#textarea-element');

monster.ui.simplemde($target);
```

## Examples
### Hide toolbar
```javascript
var $target = $('#textarea-element');
var overrideOptions = {
  toolbar: false
};

monster.ui.simplemde($target, overrideOptions);
```

[simplemde]: (https://simplemde.com/)
