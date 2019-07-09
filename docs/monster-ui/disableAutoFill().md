title: disableAutoFill()

# monster.ui.disableAutoFill()

## Syntax
```javascript
monster.ui.disableAutoFill($target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`$target` | Form element containing the fields to temporarily obfuscate. | `jQuery` | | `true`
`options` | Lets you override default options ([jquery.disableAutoFill](https://github.com/terrylinooo/jquery.disableAutoFill#options)). | `Object` | | `false`

## Description
The `monster.ui.disableAutoFill()` method temporarily obfuscates form fields `name` attributes to disable browsers/password managers auto filling of username/password `input` elements.

Field `name`s get automatically deobfuscated on form submit or when the `options.submitButton` is clicked.

## Examples

### Get form data on submit
```html
<form id="my_form">
  <input type="text" name="username" placeholder="Username">
  <input type="password" name="password" placeholder="Password">
</form>
```
```javascript
var $template = $(appContent.getTemplate({
    name: 'myForm'
  })),
  $form = $template.find('#my_form');

monster.ui.disableAutoFill($form);

$form
  .on('submit', function() {
    var formData = monster.ui.getFormData('my_form');

    // formData -> { username: '', password: '' }
  });
```
