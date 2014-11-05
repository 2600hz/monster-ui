# [monster][monster].[util][util].formatPhoneNumber()

* [Syntax](#syntax)
* [Parameter](#parameter)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.formatPhoneNumber(phoneNumber);
```

### Parameter
* `phoneNumber` (mandatory)

 Type: [String][string_literal] OR [Number][integer]

 US phone number to format.

### Return
This method returns a [String][string_literal] with the following format: `+1 (NPA) NXX-XXXX`

### Description
The `monster.util.formatPhoneNumber()` method is used to easily format US phone numbers.

### Examples
* Format phone number starting with `+1`
```javascript
var phoneNumber = '+14151234567',
    formattedPhoneNumber = monster.util.formatPhoneNumber(phoneNumber);

console.log(formattedPhoneNumber);
// output: "+1 (415) 123-4567"
```

* Format phone number without `+1`
```javascript
var phoneNumber = 4151234567,
    formattedPhoneNumber = monster.util.formatPhoneNumber(phoneNumber);

console.log(formattedPhoneNumber);
// output: "+1 (415) 123-4567"
```

[monster]: ../../monster.md
[util]: ../util.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers