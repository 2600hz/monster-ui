# monster.util.unixToDate()

## Syntax
```javascript
monster.util.unixToDate(timestamp);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`timestamp` | Unix timestamp representing a date. | `Number` | | `true`

### Return value
A `Date` instance.

### Errors
* `'timestamp' is not a valid Number`: `timestamp` is `NaN` or of a type other than `Number`

## Description
The `monster.util.unixToDate()` method converts Unix timestamps into `Date` instances.

If for some reason, the `timestamp` is in a higher or lower unit order than milliseconds (deci, centi, micro, nano ...), the method will try to convert it into milliseconds.

## Examples
### Convert a Unix timestamp into a `Date` instance
```javascript
var timestamp = 946713600;

monster.util.unixToDate(timestamp);

// output: Sat Jan 01 2000 00:00:00 GMT-0800 (Pacific Standard Time)
```
