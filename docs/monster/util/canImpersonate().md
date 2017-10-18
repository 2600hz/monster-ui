# [monster][monster].[util][util].canImpersonate()

* [Syntax](#syntax)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.canImpersonate([accountId]);
```

### Parameters

###### `accountId`: [String][string_literal] (optional)

Account ID of the Account that you want to impersonate a user from.

### Return
This method returns a [Boolean][boolean].

### Description
We only let super duper admins impersonate users from subaccounts. If you're not a super duper admin, or if you're using the account you logged in with, you shouldn't have access to impersonating. We use this method to make sure that the user has the right to try to impersonate a user.

### Examples
```javascript
if(monster.util.canImpersonate('123412341234123412341234')) { 
	// do something if user can impersonate
};
```

[monster]: ../../monster.md
[util]: ../util.md


[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Boolean_literals
