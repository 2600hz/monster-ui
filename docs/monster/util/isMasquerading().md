# [monster][monster].[util][util].isMasquerading()

* [Syntax](#syntax)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.isMasquerading();
```

### Return
This method returns a [Boolean][boolean].

### Description
This method checks if the current session is using the account that was used to log in or if it's using one of the sub-accounts.

### Examples
```javascript
if(monster.util.isMasquerading()) { 
	// do something specific for users who are using a sub-account.
};
```

[monster]: ../../monster.md
[util]: ../util.md

[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Boolean_literals