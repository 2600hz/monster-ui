title: add()

# [monster][monster].[util][util].[dataFlags][dataFlags].add()

* [Syntax](#syntax)
* [Parameter](#parameter)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.dataFlags.add(flags, object);
```

### Parameter

###### `flags`: [Object][object_literal] (mandatory)

Name of the flag we want to get the value of.

###### `object`: [Object][object_literal] (mandatory)

Object to merge the flags into.

### Return
The updated object (to allow for chaining, as the object itself is already updated by reference)

### Description
Allows developer to add flags in object before saving them in database.

### Examples
```javascript
var user = {
	first_name: 'JR',
	last_name: 'Maitre'
}

monster.util.dataFlags.add({'source': 'smartpbx', 'version': '0.1'}, user);

/* would return
{
	first_name: 'JR',
	last_name: 'Maitre',
	markers: {
		monster: {
			source: 'smartpbx',
			version: '0.1'
		}
	}
};
*/
```


[monster]: ../../../monster.md
[util]: ../../util.md
[dataFlags]: ../dataFlags.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
