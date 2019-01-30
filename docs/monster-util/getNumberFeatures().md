title: getNumberFeatures()

# monster.util.getNumberFeatures()

## Syntax
```javascript
monster.util.getNumberFeatures(number);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`number` | A plain JavaScript object that contains number data. | `Object`| | `true`

### Return value
An `Array` that contain the list of feature codes that are available for the phone number.

### Errors
* `"number" is null or undefined`: `number` parameter is `null` or `undefined`, or was not provided
* `"number" is not an object`: `number` is not a plain JavaScript object

## Description
This method gets the available features of a phone number object.

## Examples
### Get a phone number available features
```javascript
var numberData;

// ...

monster.util.getNumberFeatures(numberData);
// output: [ 'cnam', 'e911']
```
