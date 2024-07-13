# monster.util.getNumberFeatures()

## Syntax
```javascript
monster.util.getNumberFeatures(number);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`number` | A plain JavaScript object loosely representing a Kazoo phone number. | `Object`| | `true`

### Return value
An `Array` that contains the list of feature codes that are available for the phone number. If no features are available, the array is empty.

### Errors
* `"number" is not an object`: `number` is not a plain JavaScript object

## Description
This method returns the features available of a specific phone number object.

## Examples
### Get a phone number available features
```javascript
var numberData = getNumberData('+14441234567');

// ...

monster.util.getNumberFeatures(numberData);
// output: [ 'cnam', 'e911']
```
