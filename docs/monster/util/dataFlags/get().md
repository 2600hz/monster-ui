title: get()

# [monster][monster].[util][util].[dataFlags][dataFlags].get()

* [Syntax](#syntax)
* [Parameter](#parameter)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.dataFlags.get(flagName, object);
```

### Parameter

###### `flagName`: [String][string_literal] (mandatory)

Name of the flag we want to get the value of.

###### `object`: [Object][object_literal] (mandatory)

Object in which the flag is set.

### Return
The value of the flag, so any JSON value is possible

### Description
This method looks into the flags and check if there's any matching the flagName provided. If yes it will return its value, if no, it will return `undefined`.

### Examples
```javascript
var user = {
	first_name: 'JR',
	last_name: 'Maitre',
	markers: {
		monster: {
			source: 'smartpbx'
		}
	}
}

monster.util.dataFlags.get('source', user); //  => returns 'smartpbx';
```

[monster]: ../../../monster.md
[util]: ../../util.md
[dataFlags]: ../dataFlags.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
