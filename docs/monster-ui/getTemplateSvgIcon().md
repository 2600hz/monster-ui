title: getTemplateSvgIcon()

# monster.ui.getTemplateSvgIcon()

## Syntax
```javascript
monster.ui.getTemplateSvgIcon(args);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`args` | Arguments to indicate how to render the SVG icon. | `Object`([#/args](#args)) | | `false`

#### args
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`id` | ID of the icon to be rendered. | `String` | | `false`
`cssClass` | Custom CSS classes to be applied to the SVG tag. | `String` | `svg-icon <icon-id-prefix>` | `false`

### Return value
A `String` representing the SVG icon template.

### Errors
* `"args" is not a plain object`: `args` is not a plain JavaScript object
* `"args.id" is undefined`: Icon `id` was not provided
* `"args.id" is not a string`: `id` was provided, but is not a `String` value
* `"args.cssClass" is not a string`: `cssClass` was provided, but it is not a `String` value

## Description

The `monster.ui.getTemplateSvgIcon()` method allows you to get a template to render an [SVG icon][svgIcons] simply by specifying the ID of the icon, and optionally any CSS classes to be applied. If no CSS classes are provided, the class `svg-icon` is set by default, along with a class that matches the icon ID prefix.

## Examples
### Get a template for a specific SVG icon:
```javascript
monster.ui.getTemplateSvgIcon({ id: 'telicon2--phone-outbound' });
// output: <svg class="svg-icon telicon2"><use xlink:href="#tellicon--phone-outbound" ⁄></svg>
```
### Get a template, applying custom CSS classes:
```javascript
monster.ui.getTemplateSvgIcon({ id: 'g-drive--color', cssClass: 'my-icon-class icon-large' });
// output: <svg class="my-icon-class icon-large"><use xlink:href="#g-drive--color" ⁄></svg>
```

[svgIcons]: ../svgIcons.md
