title: randomString()

# monster.util.randomString()

## Syntax
```javascript
monster.util.randomString(length, chars);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`length` | Number of character to include in the output string. | `Number` | | `true`
`chars` | Characters to choose from when creating the output string. | `String` | `23456789abcdefghjkmnpqrstuvwxyz` | `false`

### Return value
A `String` representing a random suit of `length` characters.

## Description
This method generates a string of `length` random characters chosen from either the `chars` parameter or `23456789abcdefghjkmnpqrstuvwxyz` by default.

## Examples
### Generate a random string of 5 characters
```javascript
monster.util.randomString(5);
// output: 'xh3re'
```

### Generate a random string of 4 digits only
```javascript
monster.util.randomString(4, '1234567890');
// output: '6557'
```

[monster]: ../../monster.md
[util]: ../util.md

[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
