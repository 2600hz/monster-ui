# [monster][monster].[util][util].formatVariableToDisplay()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.formatVariableToDisplay(string);
```

### Parameters
* `string` (mandatory)

 Type: [String][string_literal]

Text that will be changed into a formatted text.

### Return
This method returns a [String][string_literal].

### Description
This method allow developers to transform text coming from the back-end (for example Service Plan items...) that hasn't been i18ned to be displayed in a more user-friendly way than just displaying the variable name.

### Examples
* Transforms a variable into a more readable String
```javascript
monster.util.formatVariableToDisplay('this_is_a_test');
// output: 'This Is A Test'
```

[monster]: ../../monster.md
[util]: ../util.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
