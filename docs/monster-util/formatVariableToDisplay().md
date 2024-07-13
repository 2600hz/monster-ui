# monster.util.formatVariableToDisplay()

## Syntax
```javascript
monster.util.formatVariableToDisplay(string);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`string` | Text that will be changed into a formatted text. | `String` | | `true`

### Return value
A `String` representing the formatted input.

## Description
This method allow developers to transform text coming from the back-end (for example Service Plan items...) that hasn't been i18ned to be displayed in a more user-friendly way than just displaying the variable name.

## Examples
### Transforms a variable into a more readable string
```javascript
monster.util.formatVariableToDisplay('this_is_a_test');
// output: 'This Is A Test'
```

[monster]: ../../monster.md
[util]: ../util.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
