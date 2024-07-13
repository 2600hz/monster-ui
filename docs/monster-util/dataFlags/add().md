# monster.util.dataFlags.add()

## Syntax
```javascript
monster.util.dataFlags.add(flags, object);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`flags` | Name of the flag we want to get the value of. | `Object` | | `true`
`object` | Object to merge the flags into. | `Object` | | `true`

### Return value
The updated `object` (to allow for chaining, as the object itself is already updated by reference)

## Description
Allows developer to add flags in object before saving them in database.

## Examples
### Add flags to a user object
```javascript
var user = {
	first_name: 'John',
	last_name: 'Doe'
}

monster.util.dataFlags.add({
  source: 'smartpbx',
  version: '0.1'
}, user);

/* returns
{
  first_name: 'John',
  last_name: 'Doe',
  markers: {
    monster: {
      source: 'smartpbx',
      version: '0.1'
    }
  }
}
*/
```
