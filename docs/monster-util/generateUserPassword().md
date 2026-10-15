---
title: generateUserPassword()
---

# monster.util.generateUserPassword()

## Syntax
```javascript
monster.util.generateUserPassword();
```

### Return value
A `String` representing a randomly generated password.

## Description
This method generates a random password for a user.

If `userPassword.requirements` is defined in `config.js`, the password will contain, for each requirement, the specified number of characters of the corresponding set. Characters are then added up to `userPassword.minLength` (`12` by default) and the result is shuffled.

Key | Description | Type
:-: | --- | :-:
`numOfLowercase` | Number of characters from `abcdefghijklmnopqrstuvwxyz`. | `Number`
`numOfUppercase` | Number of characters from `ABCDEFGHIJKLMNOPQRSTUVWXYZ`. | `Number`
`numOfNumbers` | Number of characters from `1234567890`. | `Number`
`numOfSpecialCharacters` | Number of characters from `!@#$%^&*()_+~|}{:;,.-`. | `Number`

If `userPassword.requirements` is not defined, the password is a string of 8 characters generated with [randomString()][randomString] using the `safe` preset.

## Examples
### Generate a password with no requirements configured
```javascript
monster.util.generateUserPassword();
// output: 'r7Kd3mQx'
```

### Generate a password with requirements configured
```javascript
// config.js: userPassword: { requirements: { numOfUppercase: 2, numOfLowercase: 2, numOfNumbers: 2, numOfSpecialCharacters: 2 }, minLength: 12 }
monster.util.generateUserPassword();
// output: '4aT#kP9Zx!q2'
```

[randomString]: randomString().md
