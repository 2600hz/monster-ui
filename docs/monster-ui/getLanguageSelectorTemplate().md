title: getLanguageSelectorTemplate()

# monster.ui.getLanguageSelectorTemplate()

## Syntax
```javascript
monster.ui.getLanguageSelectorTemplate(args);
```

### Parameters
`args` is a `Object` parameter with the following properties:

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`selectedLanguage` | IETF language tag. | `String` | | `false`
`showDefault` | Whether or not to include a default option in the language list. | `Boolean` | `false` | `false`
`attributes` | List of key/value corresponding to HTML attributes set on the `select` tag. | `Object` | | `false`

### Return value
A `String` representing the language select list template.

### Errors
* `"args" is not a plain object`: `args` is not a plain object
* `"selectedLanguage" is not a string`: `selectedLanguage` is not a `String` value
* `"showDefault" is not a boolean`: `showDefault` is not a boolean value
* `"attributes" is not a plain object`: `attributes` is not a plain object

## Description

The `monster.ui.getLanguageSelectorTemplate()` method allows you to get a template to render `select` list of the languages that are supported by Monster UI.

Optionally, it is possible to add a "Default" item at the beggining of the list, by setting `showDefault` as `true`. This can be useful in cases where the user does not want to select a specific language and there is a preset choice.

Additionally, HTML attributes for the `select` tag can be provided as a plain Javascript object, where each `key` correspond to the attribute name, and the `value` to the attribute's value. It is worth to mention that the value should be of type `String` to be rendered properly; otherwise, an unexpected value may be assigned to the attribute.

## Examples
### Get the template with the default configurations:
```javascript
monster.ui.getLanguageSelectorTemplate();
// output: <select><option value="en-US">English</option><!-- ... --></select>
```
### Get a template, specifying the selected language and some HTML attributes:
```javascript
monster.ui.getLanguageSelectorTemplate({
  selectedLanguage: 'fr-FR',
  attributes: {
    'name': 'user_language',
    'class': 'list-selector',
    'multiple': ''
  }
});
// output: <select name="user_language" class="list-selector" multiple=""><option value="en-US" selected>English</option><!-- ... --></select>
```
