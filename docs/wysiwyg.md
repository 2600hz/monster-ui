### monster.ui.wysiwyg
The wysiwyg() method generate a WYSIWYG from a set of default options and insert it inside the specified jQuery object.

##### Syntax
```javascript
monster.ui.wysiwyg(target[, options]);
```
##### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

 A jQuery object inside which the WYSIWYG will be inserted,

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
The wysiwyg() method adds a configurable WYSIWYG inside the a container specified by the `target` parameter.
###### HTML container
###### CSS
For the CSS styles to apply, the wysiwyg container specified as the *target* parameter needs to have the CSS class wysiwyg-container:
```html
<div class="wysiwyg-container"></div>
```

##### Examples
* Remove elements from toolbar
```javascript
var target = $(document.getElementByClassName('wysiwyg-container')),
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
        }
    };

monster.ui.wysiwyg(target, options);
```
* Add macro
```javascript
var target = $(document.getElementByClassName('wysiwyg-container')),
    options = {
        macro: {
            options: {
                user_name: 'User\'s name',
                user_email: 'User\'s email',
                date_of_the_day: 'Date of the day'
            }
        }
    };

monster.ui.wysiwyg(target, options);
```

[jquery]: http://api.jquery.com/Types/#jQuery
[javascript_object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals