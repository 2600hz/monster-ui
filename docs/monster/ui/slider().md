title: slider()

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

###### `target`: [jQuery object][jquery] (mandatory)

A jQuery object inside which the slider will be inserted using the [append()][append] method.

###### `options`: [Object][object_literal] (mandatory)

Let you specify a map of options for the slider, they are the same than for the [jQuery Slider][jquery_slider_options] method. It also takes three more custom, and optional, parameters:

* `i18n`: [String][string_literal] (optional) - define the text in the tooltips
* `unit`: [String][string_literal] (optional) - unit of the value for the handles and limits
* `friendlyPrint`: [Function][function] (optional) - takes the value returned by the slider and returns a different value, to make it look friendlier to the end-user

### Return
This method returns the slider container as a [jQuery object][jquery].

### Description
The `monster.ui.slider()` method allows you to generate a jQuery Slider with the look and feel of Monster UI. All the original options of the slider are available.

### Examples
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

* Create a slider with a set of steps that the end-user will have to choose from. We also show the use of the friendlyPrint function, which will take the value selected by the user and return a different value, that would be more meaningful to the end-user.

In this example, instead of displaying 3600 in the tooltip of the result, we would display "1 hour". In order to get the real value ("3600"), the developer needs to check the value stored in the data-real-value attribute of the slider ($('.slider-container [data-real-value]').attr('data-real-value') for example).

```javascript
var target = $('#slider'),
    options = {
        range: 'max',
        steps: [30, 60, 300, 1800, 3600],
        value: 30,
        friendlyPrint: function(val) {
            return monster.util.friendlyTimer(val, 'shortVerbose');
        },
        i18n: {
            maxHandle: {
                text: "Abort After"
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
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
