# monster.ui.monthpicker()

## Syntax
```javascript
monster.ui.monthpicker(target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | Input on which the method will be applied. | `jQuery` | | `true`
`options` | | `Object`([#/options](#options)) | | `false`

#### `options`

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`selectedMonth` | Used to set the selected month (when not set nothing is selected). | `Date` | `null` | `false`
`minMonth` | Used to set the minimum selectable month (when not set there is no minimum). | `Date` | `null` | `false`
`maxMonth` | Used to set the maximum selectable month (when not set there is no maximum). | `Date` | `null` | `false`

## Description
This helper will transform a field into a jQuery MonthPicker element.
