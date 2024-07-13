# monster.ui.getSvgIconTemplate()

## Syntax
```javascript
monster.ui.getSvgIconTemplate(args);
```

### Parameters
`args` is a `Object` parameter with the following properties:

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`id` | Symbol ID of the icon to be rendered. | `String` | | `true`
`attributes` | List of key/value corresponding to HTML attributes set on the SVG tag. | `Object` | | `false`

### Return value
A `String` representing the SVG icon template.

### Errors
* `"args" is not a plain object`: `args` is not a plain JavaScript object
* `"id" is not a string`: `id` is not a `String` value
* `"attributes" is not a plain object`: `attributes` is not a plain JavaScript object

## Description

The `monster.ui.getSvgIconTemplate()` method allows you to get a template to render an [SVG icon][svgIcons] simply by specifying the ID of the icon, and optionally any attributes to be added to the SVG class.

These attributes should be provided as a plain Javascript object, where each `key` correspond to the attribute name, and the `value` to the attribute's value. It is worth to mention that the value should be of type `String` to be rendered properly; otherwise, an unexpected value may be assigned to the attribute.

The class `svg-icon` is set by default, along with a class that matches the icon ID prefix. If a `class` attribute is provided, these classes are appended to its collection, if they are not present already.

## Examples
### Get a template for a specific SVG icon:
```javascript
monster.ui.getSvgIconTemplate({ id: 'telicon2--phone-outbound' });
// output: <svg class="svg-icon telicon2"><use xlink:href="#telicon2--phone-outbound" ⁄></svg>
```
### Get a template, applying custom CSS classes:
```javascript
monster.ui.getSvgIconTemplate({
  id: 'g-drive--color',
  attributes: {
    'class': 'my-icon-class icon-large',
    'data-tooltip': 'Click here',
    disabled: "true"
  }
});
// output: <svg class="my-icon-class icon-large svg-icon g-drive" data-tooltip="Click here" disabled="true"><use xlink:href="#g-drive--color" ⁄></svg>
```

[svgIcons]: ../svgIcons.md
