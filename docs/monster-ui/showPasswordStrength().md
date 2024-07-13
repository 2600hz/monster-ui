# monster.ui.showPasswordStrength()

## Syntax
```javascript
monster.ui.showPasswordStrength(input[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`input` | Input on which the method will be applied. Best suited for an input of the `password` type. | `jQuery` | | `true`
`options` | | `Object`([#/options](#options)) | | `false`

#### options
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`container` | Where to append the password strength display (by default, it will be appended after the `input`). | `jQuery` | | `false`
`display` | Type of indicator to display: a bar, an emoji or a color-changing lock icon. | `String('bar' | 'emoji' | 'icon')` | `bar` | `false`
`tooltipPosition` | When the display is set to 'icon', you can choose the position of the tooltip on the icon. | `String('top' | 'bottom' | 'right' | 'left')` | `top` | `false`

### Errors
* `"input" is not a jQuery object`: `input` is not a jQuery object.
* `"options" is not a plain object`: `options` is not a plain JavaScript object.
* ``"options.display" is not a valid display option. It should be `bar`, `emoji` or `icon` ``: `options.display` does not contain a valid value. It should be one of the following: `bar`, `emoji` or `icon`.
* ``"options.tooltipPosition" is not a valid tooltip position option. It should be one of `top`, `bottom`, `left` or `right`.``: `options.tooltipPosition` does not contain a valid value. It should be one of the following: `top`, `bottom`, `left` or `right`.
* `"options.container" is not a jQuery object`: `options.container` parameter was provided, but it is not a `jQuery` object.

## Description
This method allows you to add a password strength indicator for a specific input, in the form of a bar, an emoji or a color-changing lock icon.

## Examples
### Using the default options to show a bar below the input
```javascript
monster.ui.showPasswordStrength(template.find(':password'));
```

### Using custom options to show an icon in a specific container
```javascript
monster.ui.showPasswordStrength(template.find(':password'), {
    display: 'icon',
    container: template.find('.your-password-strength-container')
});
```
