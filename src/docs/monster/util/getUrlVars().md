# [monster][monster].[util][util].getUrlVars()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.getUrlVars([key]);
```
### Parameters
* `key` (optional)
 Type: [String][string_literal]

If specified, will return the value of a specific parameter (`key`).

### Return
This method returns an [Object][object_literal] of all the parameters by default.
If a parameter (`key`) is specified, it will return its value or `undefined`

### Description
This method returns the different URL GET parameters of the window.

### Examples
```javascript
Page URL: http://mycompany.com/monster?test=documentation&date=142109383929

monster.util.getUrlVars(); // returns { test: 'documentation', date: '142109383929' }
monster.util.getUrlVars('test'); // returns 'documentation'
monster.util.getUrlVars('nope'); // returns undefined
```

[monster]: ../../monster.md
[util]: ../util.md

[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Boolean_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals