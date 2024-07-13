# monster.util.canImpersonate()

## Syntax
```javascript
monster.util.canImpersonate([accountId]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`accountId` | Account ID of the account that you want to impersonate a user from. | `Object` | | `false`

### Return value
A `Boolean` indicating whether or not the current or specified account is allowed to impersonate users.

## Description
We only let super duper admins impersonate users from subaccounts. If you're not a super duper admin, or if you're using the account you logged in with, you shouldn't have access to impersonating. We use this method to make sure that the user has the right to try to impersonate a user.

## Examples
### Check if a specific account allow impersonation
```javascript
if(monster.util.canImpersonate('123412341234123412341234')) {
	// do something if user can impersonate
};
```
