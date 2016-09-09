# [monster][monster].[util][util].isAdmin()

* [Syntax](#syntax)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.isAdmin([user]);
```

### Parameters
* `user` (optional)

 Type: [Object][object_literal]
 User with the same format as an account returned by a GET on the /users/{userid} API.

### Return
This method returns a [Boolean][boolean].

### Description
This method checks if a user is currently logged in as an admin user.

### Examples
```javascript
if(monster.util.isAdmin()) { 
	// do something if user is an admin
};
```

[monster]: ../../monster.md
[util]: ../util.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Boolean_literals
