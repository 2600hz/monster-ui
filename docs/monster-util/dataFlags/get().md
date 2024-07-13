# monster.util.dataFlags.get()

## Syntax
```javascript
monster.util.dataFlags.get(flagName, object);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`flagName` | Name of the flag we want to get the value of. | `String` | | `true`
`object` | Object in which the flag is set. | `Object` | | `true`

### Return value
The value of the flag, so any JSON value is possible

## Description
This method looks into the flags and check if there's any matching the flagName provided. If yes it will return its value, if no, it will return `undefined`.

## Examples
### Retrieve the value of a flag
```javascript
var user = {
	first_name: 'John',
	last_name: 'Doe',
	markers: {
		monster: {
			source: 'smartpbx'
		}
	}
}

monster.util.dataFlags.get('source', user); //  => returns 'smartpbx';
```
