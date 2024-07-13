# monster.util.getUserFullName()

## Syntax
```javascript
monster.util.getUserFullName([user]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`user` | A plain JavaScript object that represents a user. | `Object`([#user](#user)) | `monster.apps.auth.currentUser` | `false`

#### `user`
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`first_name` | String to concat `last_name` with. | `String` | | `true`
`last_name` | String to concat `first_name` to. | `String` | | `true`

### Return value
A `String` representing the user's full name.

### Errors
* `"user" is not an object`: `user` is not a plain JavaScript object
* `"user" is missing "first_name" or "last_name`: `user` does not contain `first_name` or `last_name` properties
* `There is no logged in user`: `user` was not provided, and there is no logged in user to get its name

## Description
This method builds the full name of a specific user object, following the [internationalization][i18n] rules that are currently active.

If `user` is not provided, the method will get the full name for the currently logged in user.

## Examples
### Get a user full name, from an user object
```javascript
var user = monster.apps.auth.currentUser;

monster.util.getUserFullName(user);
// output: 'Clark Kent'
```

### Get a user full name, providing the first and last names
```javascript
monster.util.getUserFullName({ first_name: 'John', last_name: 'Doe' });
// output: 'John Doe'
```

### Get the full name of the current logged in user
```javascript
monster.util.getUserFullName();
// output: 'Jane Doe'
```

[i18n]: ../internationalization.md
