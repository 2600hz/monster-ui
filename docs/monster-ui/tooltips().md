# monster.ui.tooltips()

## Syntax
```javascript
monster.ui.tooltips(target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | Template on which the method will be applied. It will automatically find the tooltips field and add an event so that when a user mouseover it, it shows a tooltip. This helper allows us to lazy-load the tooltips instead of loading them all at once when we first load the template, which could be heavy on the browser. | `jQuery` | | `true`
`options` | | `Object`([#/options](#options)) | | `false`

#### options
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`selector` | Sets the CSS Selector to call the tooltip method on. | `Object` | `[data-toggle="tooltip"]` | `false`
`trigger` | Sets the Event to use to call the Bootstrap tooltip method on. | `String` | `mouseover | `false`
`options` | Options to customize the [Bootstrap Tooltips plugin][tooltips]. | `Object` | | `false`

## Description
This helper will find all the item under the specified selector and will allow the lazy-loading of tooltips on them automatically.

[tooltips]: http://getbootstrap.com/2.3.2/javascript.html#tooltips
