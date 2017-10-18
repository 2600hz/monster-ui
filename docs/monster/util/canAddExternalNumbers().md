# [monster][monster].[util][util].canAddExternalNumbers()

* [Syntax](#syntax)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.canAddExternalNumbers([account]);
```

### Parameters

###### `account`: [Object][object_literal] (optional)

Account with the same format as an account returned by a GET on the /account/{accountId} API.

### Return
This method returns a [Boolean][boolean].

### Description
We only let accounts with the key `wnm_allow_additions` set to `true` add "external" numbers to the platform via API. So in order to expose the UI features that let users add external numbers we use this helper to check if the current account (or account provided in parameter) has the right to do it.

### Examples
```javascript
if(monster.util.canAddExternalNumbers() { 
	// do something if user are allowed to add external numbers
};
```

[monster]: ../../monster.md
[util]: ../util.md


[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Boolean_literals
