# [monster][monster].[util][util].randomString()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.randomString(length, chars);
```

### Parameters
* `length` (mandatory)

 Type: [Number][integer]

 Number of character to include in the output string.

* `chars` (optional)

 Type: [String][string_literal]

 Default: `'23456789abcdefghjkmnpqrstuvwxyz'`

 Characters to choose from when creating the output string.

### Return
This method returns a [String][string_literal].

### Description
This method generates a string of `length` random characters chosen from either the `chars` parameter or `23456789abcdefghjkmnpqrstuvwxyz` by default.

### Examples
* Generate a random string of 5 characters
```javascript
monster.util.randomString(5);
// output: 'xh3re'
```

* Generate a random string of 4 digits only
```javascript
monster.util.randomString(4, '1234567890');
// output: '6557'
```

[monster]: ../../monster.md
[util]: ../util.md

[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
