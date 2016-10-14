# [monster][monster].[ui][ui].protectField()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)

![](http://i.imgur.com/0c0QP2X.png)

### Syntax
```javascript
monster.ui.protectField(field[, template]);
```

### Parameters
* `field` (mandatory)

 Type: [jQuery object][jquery]

 Input on which the method will be applied. The type of the input needs to be `password`.

* `template` (optional)

 Type: [jQuery object][jquery]

 Default: `$(html)`

 Let you specify a container where the element passed as the `field` parameter is. If this parameter is omitted, the default value of `$(html)` will be used.

### Description
This method allow the user to see the value of a password input when this input is on focus.

[monster]: ../../monster.md
[ui]: ../ui.md

[jquery]: http://api.jquery.com/Types/#jQuery
