# monster.util.formatMacAddress()

## Syntax
```javascript
monster.util.formatMacAddress(macAddress);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`macAddress` | String to format as MAC address. | `String` | | `true`

### Return value
A `String` representation of a MAC address or an empty `String` if `macAddress` could not be formatted.

### Errors
* `"macAddress" is not a string`

## Description
The `monster.util.formatMacAddress()` method is used to format strings into lowercased string representations of MAC addresses with colons as separators.

## Examples
```javascript
monster.util.formatMacAddress('');
// => ''

monster.util.formatMacAddress('28E0ss974M13');
// => ''

monster.util.formatMacAddress('2');
// => ''

monster.util.formatMacAddress('28E0ff974F1');
// => ''

monster.util.formatMacAddress('28E0ff974F13');
// => '28:e0:ff:97:4f:13'

monster.util.formatMacAddress('  28E0ff974F13  ');
// => '28:e0:ff:97:4f:13'

monster.util.formatMacAddress('$28 E0+ff:97-4F_13}');
// => '28:e0:ff:97:4f:13'
```
