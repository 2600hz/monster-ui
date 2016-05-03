# [monster][monster].[ui][ui].wysiwyg()
The `monster.ui.wysiwyg()` function generates a WYSIWYG from a set of customizable options and insert it inside a jQuery object.

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Customization](#cutomization)
* [Examples](#examples)

![WYSIWYG](http://i.imgur.com/Y5CESZv.png)

### Syntax
```javascript
monster.ui.wysiwyg(target[, options]);
```

### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

 A jQuery object inside which the WYSIWYG will be inserted using the [prepend()][prepend] method.

* `options` (optional)

 Type: [Object][object_literal] OR [Boolean][boolean_literal]

 If this parameter is set to `false`, no toolbar will be added to the WYSIWYG. If it is a JavaScript object, it can be used to add new options or override existing options available by default listed below:
    - fontSize (dropdown list)
        + small
        + normal
        + huge
    - fontEffect (grouped buttons)
        + bold
        + italic
        + underline
        + strikethrough
    - fontColor (dropdown buttons)
    - textAlign (dropdown buttons)
        + left
        + center
        + right
        + justify
    - list (dropdown buttons)
        + unordered
        + ordered
    - indentation (grouped buttons)
        + indent
        + outdent
    - link (grouped buttons)
        + create
        + delete
    - image (single button)
    - editing (grouped buttons)
        + undo
        + redo
    - horizontalRule (single button)
    - macro (dropdown list) *disabled by default*

### Return
This method returns the WYSIWYG editor container as a [jQuery object][jquery].

### Description
The `monster.ui.wysiwyg()` method adds a configurable WYSIWYG inside a container specified by the `target` parameter. The options in the toolbar can be removed and new ones can be added easily.

For the default CSS styles to apply, the wysiwyg container specified as the `target` parameter needs to have the CSS class `wysiwyg-container` as follow:
```html
<div class="wysiwyg-container"></div>
```
If the CSS class `transparent` is added to the container, the toolbar will have a transparent background.

To initialize the wysiwyg with the default toolbar, the only parameter needed is `target`:
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container'));

monster.ui.wysiwyg(target);
```

### Customization
Here is the structure of the different types of options, how they will be rendered and the description of each field:

![Dropdown button](http://i.imgur.com/rRfr9VI.png)

* dropdown list

```javascript
fontSize: {
    weight: 0,
    title: '',
    icon: '',
    command: '',
    options: {
        small: {
            weight: 0,
            text: '',
            args: '',
        },
        { ... }
    }
}
```

* dropdown buttons

```javascript
textAlign: {
    weight: 0,
    title: '',
    icon: '',
    options: {
        left: {
            weight: 0,
            title: '',
            icon: '',
            command: ''
        },
        { ... }
    }
}
```

* grouped buttons

```javascript
fontEffect: {
    weight: 0,
    options: {
        bold: {
            weight: 0,
            title: '',
            icon: '',
            command: ''
        },
        { ... }
    }
}
```

* single button

```javascript
image: {
    weight: 0,
    title: '',
    icon: '',
    command: ''
}
```

##### weight
This value of the `weight` key is used to sort the options in the toolbar. By default, the value of `weight` is a multiple of 10.

##### title
The value of the `title` key is the text that will be displayed when hovering the corresponding button/label in the toolbar.

##### icon
The value of the `icon` key is the CSS class(es) that will added to a `<i></i>` element in the corresponding option. By default, [Font Awesome icons (v3.2.1)][font_awesome] are used but this can be changed easily by overriding the value of the key.

##### text
When defining a dropdown of text, you do not need to specify an icon since it is not a button. Instead, the value of the `text` key is used as the label of the option.

##### command
The value of the `command` key is an [execCommand][exec_command]. To add a new option in the toolbar, add it to the `options` parameter using one of the three different structure depending if the new option should be a dropdown, a group of buttons or a single button.

##### args
The value of the `args` key will be used as an extra parameter of the [execCommand][exec_command]. In the default options, it is used to specify the size of the text in the `fontSize` option and to define the `macro` string.

##### options
The `options` object is used to list the different options inside a dropdown or group.

##### ante, post
When defining an option containing the `args` key, you can specify parameters before and after it. See the "Change color model to RGB" and "Add macro" examples.

### Examples
* Remove some elements from the toolbar
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    overrideOptions = {
        fontSize: {
            options: {
                small: false
            }
        },
        fontEffect: {
            options: {
                strikethrough: false,
                underline: false
            }
        },
        fontColor: false,
        list: false,
        horizontalRule: false
    };

monster.ui.wysiwyg(target, overrideOptions);
```

* Add macro
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    options = {
        macro: {
            options: {
                { weight: 1, text: "Title", args: "title" },
                { weight: 2, text: "Last name", args: "last_name" },
                { weight: 3, text: "Conference's date", args: "conference_date" },
                { weight: 4, text: "Conference's time", args: "conference_start_time" }
            }
        }
    };

monster.ui.wysiwyg(target, options);
```
By default, macros will be bold and inserted between a couple of pair of curly braces as shown in the following screenshot:

![Macro](http://i.imgur.com/jCgTEXk.png)

If you want to change the surrounding elements of the macro, you need to use the `ante` and `post` keys and specify it as their value like shown below:
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    options = {
        macro: {
            options: { ... },
            ante: "[",
            post: "]"
        }
    };

monster.ui.wysiwyg(target, options);
```
Now the macro will only be surrounded by a single pair of square brackets.

* Add new option to remove all formating from the current selection
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    newOption = {
        removeFormat: {
            weight: 25,
            title: 'Remove format',
            icon: 'icon-eraser',
            command: 'removeFormat'
        }
    };

monster.ui.wysiwyg(target, newOptions);
```

* Change color model to RGB
```javascript
var target = $(document.getElementByClassName('wysiwyg-container')),
    overrideColorOption = {
        fontColor: {
            options: ['255,255,255', '0,0,0', '238,236,225', '...'],
            ante: 'rgb(',
            post: ')'
        }
    }
```
By default, the colors are defined using the hexadecimal color model and the `ante` key has the value of #.

[monster]: ../../monster.md
[ui]: ../ui.md

[jquery]: http://api.jquery.com/Types/#jQuery
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[prepend]: http://api.jquery.com/prepend/
[font_awesome]: http://fortawesome.github.io/Font-Awesome/3.2.1/icons/
[exec_command]: https://developer.mozilla.org/en-US/docs/Web/API/document.execCommand
[boolean_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Boolean_literals