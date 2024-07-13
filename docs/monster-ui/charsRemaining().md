# monster.ui.charsRemaining()

## Syntax
```javascript
monster.ui.charsRemaining($target, args);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | Form element to be checked. | `jQuery` | | `true`
`args` | Aguments to setup the helper | `Object`([#/args](#args)) | | `false`

#### args
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`size` | Prevent the user to enter more than this number of characters | `Number` | 0 | `false`
`customClass` | Custom class for the label if needed | `String` | | `false`

### Errors

* `"$target" is not a jQuery object`: `$target` is not a jQuery element
* `"args" is not a plain object`: `args` is defined but not a plain object

## Description
The `monster.ui.charsRemaining()` method indicates the remaining count of characters in `$target` up to `args.size`.

## Example

```html
// myTemplate.html
<div>
  <input type="text" name="summary" id="summary">
</div>
```
```javascript
var $template = $(appContext.getTemplate({
    name: 'myTemplate'
  }));

monster.ui.charsRemaining($template.find('#summary'), {
  size: 50
});
```
