# monster.util.getAuthToken()

## Syntax
```javascript
monster.util.getAuthToken([connectionName]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`connectionName` | If specified, will return the value of the token of a specific connection. | `String` | | `false`

### Return value
A `String` representing the authentication token used by the specified connection.

## Description
This method returns a token linked to a connection given in parameter, and if no connection is specified, it will use the Kazoo connection.

## Examples
### Before being logged in to Kazoo
```javascript
monster.util.getAuthToken();
// output: undefined;
```

### After being logged in
```javascript
monster.util.getAuthToken();
// output: 'd1jhkodj2n1odj12d1.d21dkj21kod12.d21d12d1212', example of a token returned by kazoo

monster.util.getAuthToken('myConnection');
// returns the token stored in your connection if you created one.
// This is an advanced use case and shouldn't be used at the moment.
```
