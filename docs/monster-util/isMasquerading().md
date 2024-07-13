# monster.util.isMasquerading()

## Syntax
```javascript
monster.util.isMasquerading();
```

### Return value
A `Boolean` indicating whether or not the account logged in is being masqueraded.

## Description
This method checks if the current session is using the account that was used to log in or if it's using one of the sub-accounts.

## Example
```javascript
if(monster.util.isMasquerading()) {
	// do something specific for users who are using a sub-account.
};
```
