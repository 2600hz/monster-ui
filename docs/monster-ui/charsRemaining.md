title: charsRemaining()

# monster.ui.charsRemaining()

## Syntax
```javascript
monster.ui.charsRemaining($target, args);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | Form element to be checked. | `jQuery` | | `true`
`args` | Aguments to setup the helper | `Object` | | `true`
`args.size` | The maxlength to be validated | `Integer` | | `true`
`args.customClass` | Custom class for the label if needed | `String` | | `false`
`args.type` | Used to support rich text editors | `String` | | `false`

### Errors

* `"$target" is not a jQuery object`: `$target` is not a jQuery element
* `"args" is not a plain object`: `args` is defined but not a plain object

## Description
The `monster.ui.charsRemaining()` method show the remaining characters for the provided element

## Example

```html
<div>
  <input type="text" name="summary" id="summary">
</div>
```
```javascript
var $template = $(appContent.getTemplate({
    name: 'myTemplate'
  })),

monster.ui.charsRemaining($template.find('#summary'), {
  size: 50
});
```
