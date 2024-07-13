# monster.util.isAdmin()

## Syntax
```javascript
monster.util.isAdmin([user]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`user` | User object with the same format as an account returned by a GET on the /users/{userid} API. | `Object` | | `false`

### Return value
A `Boolean` indication whether or not the current or specified user is an admin.

## Description
This method checks if a user is currently logged in as an admin user.

## Example
```javascript
if(monster.util.isAdmin()) {
	// do something if user is an admin
};
```
