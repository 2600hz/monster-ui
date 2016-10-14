# [monster][monster].[ui][ui].slider()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.ui.slider(target, options);
```

### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

  A jQuery object inside which the slider will be inserted using the [append()][append] method.

* `options` (mandatory)

 Type: [Object][object_literal]

 Let you specify a map of options for the slider, they are the same than for the [jQuery Slider][jquery_slider_options] method. It also takes two more custom parameters:
    - i18n: to define the text in the tooltips
    - unit: unit of the value for the handles and limits

###Return
This method returns the slider container as a [jQuery object][jquery].

### Description
The `monster.ui.slider()` method allows you to generate a jQuery Slider with the look and feel of Monster UI. All the original options of the slider are available.

###Examples
* Create a slider with a max and min handle
```javascript
var target = $('#slider'),
    options = {
        range: true,
        min: 100,
        max: 50000,
        step: 100,
        value: 1500,
        unit: 'MB',
        i18n: {
            maxHandle: {
                text: 'Throttle Data at:'
            },
            minHandle: {
                text: 'Warn Administrators at:'
            }
        }
    };

monster.ui.slider(target, options);
```

[monster]: ../../monster.md
[ui]: ../ui.md

[jquery]: http://api.jquery.com/Types/#jQuery
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[append]: http://api.jquery.com/append/
[jquery_slider_options]: http://api.jqueryui.com/slider/#options