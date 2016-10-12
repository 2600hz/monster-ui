# [monster][monster].[ui][ui].showPasswordStrength()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)

### Syntax
```javascript
monster.ui.showPasswordStrength(input[, options]);
```

### Parameters
* `input` (mandatory)

 Type: [jQuery object][jquery]

 Input on which the method will be applied. Best suited for an input of the `password` type.

* `options` (optional)

 Type: [Object][object_literal]

 Allows you to specify the following options:
  * `container`: A [jQuery object][jquery] in which to append the password strength display. By default, it will be appended after the input.
  * `display`: Set to 'bar' by default, this can be set to 'icon' in order to display the password strength as a color-changing lock icon (with tooltips) instead of a bar.
  * `tooltipPosition`: When the display is set to 'icon', you can choose the position of the tooltip on the icon. Set to 'top' by default, the available positions are 'top', 'right', 'bottom', and 'left'.

### Description
This method allows you to add a password strength indicator for a specific input, in the form of either a bar or an icon.

### Examples

* Using the default options to show a bar below the input
```javascript
monster.ui.showPasswordStrength(yourTemplate.find(':password'));
```

* Using custom options to show an icon in a specific container
```javascript
monster.ui.showPasswordStrength(yourTemplate.find(':password'), {
    display: 'icon',
    container: yourTemplate.find('.your-password-strength-container')
});
```

[monster]: ../../monster.md
[ui]: ../ui.md

[jquery]: http://api.jquery.com/Types/#jQuery
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals