# monster.util.gregorianToDate()

## Syntax
```javascript
monster.util.gregorianToDate(timestamp);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`timestamp` | Gregorian timestamp representing a date. | `Number` | | `true`

### Return value
A `Date` instance.

### Errors
* `'timestamp' is not a valid Number`: `timestamp` is `NaN` or of a type other than `Number`

## Description
The `monster.util.gregorianToDate()` method converts a Gregorian timestamp into a `Date` instance.

To preserve legacy behavior, if `timestamp` is of type `String` the method will try to coerce it into a `Number` but it is not recommended to rely on this behavior.

## Examples
### Convert a Gregorian timestamp into a `Date` instance
```javascript
var timestamp = 63113932800;

monster.util.gregorianToDate(timestamp);

// output: Sat Jan 01 2000 00:00:00 GMT-0800 (Pacific Standard Time)
```
