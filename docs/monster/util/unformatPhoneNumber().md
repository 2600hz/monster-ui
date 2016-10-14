# [monster][monster].[util][util].unformatPhoneNumber()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.unformatPhoneNumber(phoneNumber[, specialRule]);
```

### Parameters
* `phoneNumber` (mandatory)

 Type: [String][string_literal] OR [Number][integer]

 Formated US phone number to unformat.

* `specialRule` (optional)

 Type: [String][string_literal]

 Only one value: `keepPlus`. If specified, the number will keep the `+`.

### Return
This method returns a [String][string_literal] with the one of the following formats: `+1NPANXXXXXX`, `1NPANXXXXXX` or `NPANXXXXXX`.

### Description
The `monster.util.unformatPhoneNumber()` method is used to easily unformat US phone numbers. If the phone number to unformat contains `+1`, you can choose to keep it by specifying the `specialRule` parameter.

### Examples
* Unformat phone number with `+1`
```javascript
var phoneNumber = '+1 (415) 123-4567',
    unformattedPhoneNUmber = monster.util.unformatPhoneNumber(phoneNumber);

console.log(unformattedPhoneNUmber);
// output: "14151234567"
```

* Unformat phone number without `+1`
```javascript
var phoneNumber = '(415) 123-4567',
    unformattedPhoneNUmber = monster.util.unformatPhoneNumber(phoneNumber);

console.log(unformattedPhoneNUmber);
// output: "4151234567"
```

* Unformat phone number and keep `+`
```javascript
var phoneNumber = '+1 (415) 123-4567',
    unformattedPhoneNUmber = monster.util.unformatPhoneNumber(phoneNumber, 'keepPlus');

console.log(unformattedPhoneNUmber);
// output: "+14151234567"
```

[monster]: ../../monster.md
[util]: ../util.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers