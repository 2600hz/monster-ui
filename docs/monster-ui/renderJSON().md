# monster.ui.renderJSON()

## Syntax
```javascript
monster.ui.renderJSON(data, target[, args]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`data` | Data to pretty print. | `JSON` | | `true`
`target` | Template on which the method will be applied. It will automatically fill that div with the JSON viewer. | `jQuery` | | `true`
`args` | Let you specify a map of options for this helper. | `Object`([#/args](#args)) | | `false`

#### args
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`sort` |  Whether the keys will be sorted alphabetically or not. | `Boolean` | `false` | `false`
`level` | Set the number of level that will be expanded automatically. | `Number` | `2` | `false`
`them` | Viewer background them. | `String('light' | 'dark')` | `light` | `false`

## Description
This helper will use the data provided in parameter and show it in a JSON viewer in the UI, in the container provided

