# monster.util.getBookkeepers()

## Syntax
```javascript
monster.util.getBookkeepers();
```

### Return value
An `Array[Object]`.

## Description
This method returns a list of bookkeepers available for Monster UI depending on how they where configured in `config.js`.

Each bookkeeper contains a `label` (internationalized text) and `value` (identifier) properties.

The list of bookkeepers will always contain at least one value (`default`).

## Example
```javascript
monster.util.getBookkeepers();
// -> [{
//      label: 'Default',
//      value: 'default'
//    }, {
//      label: 'Braintree',
//      value: 'braintree'
//    }, {
//      label: 'HTTP',
//      value: 'http'
//    }, {
//      label: 'Kazoo',
//      value: 'kazoo'
//    }]
```
