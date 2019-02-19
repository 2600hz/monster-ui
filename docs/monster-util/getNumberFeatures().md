title: getNumberFeatures()

# monster.util.getNumberFeatures()

## Syntax
```javascript
monster.util.getNumberFeatures(number);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`number` | A plain JavaScript object that represents a Kazoo phone number. | `Object`| | `true`

### Return value
An `Array` that contains the list of feature codes that are available for the phone number.

### Errors
* `"number" is not an object`: `number` is not a plain JavaScript object
* `"number" does not represent a Kazoo phone number`: `number` does not have the expected feature properties for a Kazoo phone number object

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
