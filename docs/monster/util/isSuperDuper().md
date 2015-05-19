# [monster][monster].[util][util].isSuperDuper()

* [Syntax](#syntax)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.isSuperDuper([account]);
```

### Parameters
* `account` (optional)

 Type: [Object][object_literal]
 Account with the same format as an account returned by a GET on the /account/{accountId} API.

### Return
This method returns a [Boolean][boolean].

### Description
This method checks if a user is currently logged in on a Superduper account. By default it will check the current account. If you specify an account, the helper will return whether or not the account specified is a superduper account or not.

### Examples
```javascript
if(monster.util.isSuperDuper()) { 
	// do something if user is on a superduper account
};
```

[monster]: ../../monster.md
[util]: ../util.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Boolean_literals
