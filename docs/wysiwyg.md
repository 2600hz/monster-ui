### monster.ui.wysiwyg
The wysiwyg() method generate a WYSIWYG from a set of overridable options and insert it inside a jQuery object.

##### Syntax
```javascript
monster.ui.wysiwyg(target[, options]);
```
##### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

 A jQuery object inside which the WYSIWYG will be inserted using the [prepend()][prepend] method,

* `options` (optional)

 Type: [JavaScript object literal][javascript_object_literal]

 List of toolbar's options:
    - fontSize (dropdown)
        + small
        + normal
        + huge
    - fontEffect (group)
        + bold
        + italic
        + underline
        + strikethrough
    - fontColor (dropdown)
    - textAlign (dropdown)
        + left
        + center
        + right
        + justify
    - list (dropdown)
        + unordered
        + ordered
    - indentation (group)
        + indent
        + outdent
    - link (group)
        + create
        + delete
    - image (single)
    - editing (group)
        + undo
        + redo
    - horizontalRule (single)
    - macro (dropdown)

##### Description
The wysiwyg() method adds a configurable WYSIWYG inside a container specified by the `target` parameter.
###### HTML container
###### CSS
###### Icon (Font Awesome)
For the CSS styles to apply, the wysiwyg container specified as the *target* parameter needs to have the CSS class wysiwyg-container:
```html
<div class="wysiwyg-container"></div>
```
Here is the structure of the different types of options:
* dropdown

```javascript
fontSize: {
    title: '',
    icon: '',
    options: {
        small: {
            title: '',
            command: '',
            args: ''
        }
    }
}
```

* group

```javascript
fontEffect: {
    bold: {
        title: '',
        icon: '',
        command: ''
    }
}
```

* single

```javascript
image: {
    title: '',
    icon: '',
    command: ''
}
```
##### Examples
* Remove elements from toolbar
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    options = {
        fontSize: {
            options: {
                huge: false
            }
        },
        fontEffect: {
            strikethrough: false
        },
        fontColor: false,
        list: {
            options: {
                unordered: false,
                ordered: false
            }
        },
        horizontalRule: false
    };

monster.ui.wysiwyg(target, options);
```
* Add macro
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    options = {
        macro: {
            options: {
                macro1_name: 'Macro1\'s, name',
                macro2_name: 'Macro2\'s name'
            }
        }
    };

monster.ui.wysiwyg(target, options);
```
* Add new option to remove all formating from the current selection
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    newOption = {
        removeFormat: {
            title: 'Remove format',
            icon: 'eraser',
            command: 'removeFormat'
        }
    };

monster.ui.wysiwyg(target, newOptions);
```

[jquery]: http://api.jquery.com/Types/#jQuery
[javascript_object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[prepend]: http://api.jquery.com/prepend/