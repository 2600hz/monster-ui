# monster.util.isReseller()

## Syntax
```javascript
monster.util.isReseller([account]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`account` | Account with the same format as an account returned by a GET on the /account/{accountId} API. | `Object` | `monster.apps.auth.originalAccount` | `false`

### Return value
A `Boolean` indicating whether or not the logged in account is a reseller.

## Description
The `monster.util#isReseller` method checks if the account provided is a reseller or not. If not `account` is provided, the check is made against the original account.

## Examples
```javascript
if(monster.util.isReseller()) {
	// do something if original account is a reseller
}

if(monster.util.isReseller(someOtherAccount)) {
  // do something if someOtherAccount is a reseller
};
```

[monster]: ../../monster.md
[util]: ../util.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Boolean_literals
