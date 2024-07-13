# monster.ui.protectField()

![](http://i.imgur.com/0c0QP2X.png)

## Syntax
```javascript
monster.ui.protectField(field[, template]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`field` | Input on which the method will be applied. The type of the input needs to be `password`. | `jQuery` | | `true`
`template` | Let you specify a container where the element passed as the `field` parameter is. If this parameter is omitted, the default value of `$(html)` will be used. | `jQuery` | `$('html')` | `false`

## Description
This method allow the user to see the value of a password input when this input is on focus.
