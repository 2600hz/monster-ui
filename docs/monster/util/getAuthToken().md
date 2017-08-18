# [monster][monster].[util][util].getAuthToken()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.getAuthToken([connectionName]);
```
### Parameters

###### `connectionName`: [String][string_literal] (optional)

If specified, will return the value of the token of a specific connection (`connectionName`).

### Return
This method returns a [String][string_literal] of the token used by the specified connection.

### Description
This method returns a token linked to a connection given in parameter, and if no connection is specified, it will use the Kazoo connection.

### Examples
```javascript

Before being logged in to Kazoo.
	monster.util.getAuthToken(); // returns undefined;

After being logged in.
	monster.util.getAuthToken(); // returns 'd1jhkodj2n1odj12d1.d21dkj21kod12.d21d12d1212', example of a token returned by kazoo

monster.util.getAuthToken('myConnection'); // returns the token stored in your connection if you created one. This is an advanced use case and shouldn't be used at the moment.

```

[monster]: ../../monster.md
[util]: ../util.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals