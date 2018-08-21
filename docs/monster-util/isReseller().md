title: isReseller()

# monster.util.isReseller()

## Syntax
```javascript
monster.util.isReseller([account]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`account` | Account with the same format as an account returned by a GET on the /account/{accountId} API. | `Object` | | `false`

### Return value
A `Boolean` indicating whether or not the logged in account is a reseller.

## Description
This method checks if an account is a reseller or not. A reseller account is an account with the `is_reseller` attribute set to true.

## Example
```javascript
if(monster.util.isReseller()) {
	// do something if account is a reseller
};
```

[monster]: ../../monster.md
[util]: ../util.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Boolean_literals
