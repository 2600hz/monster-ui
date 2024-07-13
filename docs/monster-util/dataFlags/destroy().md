# monster.util.dataFlags.destroy()

## Syntax
```javascript
monster.util.dataFlags.destroy(flagName, object);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`flagName` | Name of the flag we want to delete from the object. | `String` | | `true`
`object` | Object where you want to delete the flag from. | `Object` | | `true`

### Return value
The updated `object` (to allow for chaining, as the object itself is already updated by reference)

## Description
The method deletes the property `flagName` from the object and return the updated object.

## Examples
### Remove a flag from a user object
```javascript
var user = {
  first_name: 'John',
  last_name: 'Doe',
  markers: {
    monster: {
      source: 'smartpbx',
      version: '0.1'
    }
  }
};

monster.util.dataFlags.destroy('source', user);
/* returns
{
	first_name: 'John',
	last_name: 'Doe',
	markers: {
		monster: {
      version: '0.1'
    }
	}
}
*/
```
