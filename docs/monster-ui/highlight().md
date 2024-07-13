# monster.ui.highlight()
The `monster.ui.highlight()` method quickly highlights an element then fades it back to normal, from blue to gray by default.

## Syntax
```javascript
monster.ui.highlight(element[, options]);
```

## Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`element` | Target element to highlight. | `jQuery` | | `true`
`options` | | `Object`([#/options](#options)) | | `false`

### options
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`startColor` | Color of the initial highlight. | `String` | `#2297FF` | `false`
`endColor` | Color to fade to. | `String` | `#F2F2F2` | `false`
`timer` | Total duration of the highlight in milliseconds. | `Number` | `2000` | `false`
`callback` | Executed once the fading of the highlight is complete. | `Function` | | `false`

## Description

This function will highlight a target element by changing its background color to `startColor` then fading it to `endColor` in `timer` milliseconds. If the element is out of the view, the page will be scrolled back to that element. Once the fading is complete if the `callback` function has been provided, it will be executed.

## Examples
### Highlight an element using the default settings
```javascript
var target = $('#element_to_highlight');

monster.ui.highlight(target);
```

### Highlight an element with custom colors
```javascript
var target = $('#element_to_highlight');

monster.ui.highlight(target, {
  startColor: '#3B3',
  endColor: '#FFF',
  timer: 5000,
  callback: function() {
    console.log('Highlight complete.');
  }
});
```
Highlight an element in green `#3B3` then fade it back to white `#FFF` in 5 seconds, and finally display a message in the console.

