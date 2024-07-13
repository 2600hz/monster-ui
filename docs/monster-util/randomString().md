# monster.util.randomString()

## Syntax
```javascript
monster.util.randomString(length[, preset]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`length` | Number of character to include in the output string. | `Number` | | `true`
`preset` | | `String`([#preset](#preset)) | `safe` | `false`

#### `preset`
Characters to choose from when creating the output string. You can either specify one of the predefined set of characters by specifying the corresponding preset key or a custom string of characters to choose from.

* `alpha`: `1234567890abcdefghijklmnopqrstuvwxyz`
* `letters`: `abcdefghijklmnopqrstuvwxyz`
* `numerals`: `1234567890`
* `hex`: `1234567890abcdef`
* `safe`: `23456789abcdefghjkmnpqrstuvwxyz`

### Return value
A `String` representing a random suit of `length` characters picked from `preset`.

## Description
This method generates a string of `length` random characters chosen from either a preset or a custom string of characters.

If the `preset` parameter is not defined, the default preset used will be `safe`, which is a mix of `letters` and `numerals` minus characters that could be confused for one another (e.g. l for I, 0 for O ...).

For alphabet characters, the method will discretely decide to randomly convert them from lower to upper case or not.

## Examples
### Generate a random string of 50 characters
```javascript
monster.util.randomString(50);
// output: '8F5GN8kr6gyTRuKAjG53Rxms644QVEn3dyUcyPJb5k93g2CvHF'
```

### Generate a random string of 4 numerals
```javascript
monster.util.randomString(4, 'numerals');
// output: '0986'
```

### Generate a random string of 10 custom characters
```javascript
monster.util.randomString(10, '!@#$%^&*()_+{}|:"<>?~`-=[]\;\',./');
// output: ']/{]#=&!:;'
```

[monster]: ../../monster.md
[util]: ../util.md

[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
