title: getUserFullName()

# monster.util.getUserFullName()

## Syntax
```javascript
monster.util.getUserFullName([user]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`user` | | `Object`([#user](#user)) | Current logged in user. | `false`

#### `user`
A plain JavaScript object that represents a user, which must contain at least the properties `first_name` and `last_name`, which will be used to build the full name string.

### Return value
A `String` representing the user's full name.

## Description
This method builds the full name of a specific user object, following the [internationalization][i18n] rules that are currently active.

If the `user` object is not provided, the function will get the full name for the current logged in user.

## Examples
### Get a user full name, from an user object
```javascript
monster.util.getUserFullName(user);
```

### Get a user full name, providing the first and last names
```javascript
monster.util.getUserFullName({ first_name: 'John', last_name: 'Doe' });
```

### Get the full name of the current logged in user
```javascript
monster.util.getUserFullName();
```

[i18n]: ../internationalization.md
