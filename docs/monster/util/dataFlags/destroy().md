# [monster][monster].[util][util].[dataFlags][dataFlags].destroy()

* [Syntax](#syntax)
* [Parameter](#parameter)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.dataFlags.destroy(flagName, object);
```

### Parameter

###### `flagName`: [String][string_literal] (mandatory)

Name of the flag we want to delete from the object.

###### `object`: [Object][object_literal] (mandatory)

Object where you want to delete the flag from

### Return
The updated object (to allow for chaining, as the object itself is already updated by reference)

### Description
The method deletes the property `flagName` from the object and return the updated object.

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

monster.util.dataFlags.delete('source', user); //  => returns 'smartpbx';
/*
{
	first_name: 'JR',
	last_name: 'Maitre',
	markers: {
		monster: {}
	}
}
*/
```

[monster]: ../../../monster.md
[util]: ../../util.md
[dataFlags]: ../dataFlags.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals