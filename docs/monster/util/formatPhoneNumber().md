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

###### `phoneNumber`: [String][string_literal] (mandatory)

Phone number to format.

### Return
This method returns a [String][string_literal] with a user-friendly format.

To better understand why a returned number has the format it has, here's an explanation: in Monster there are settings in myaccount for user and account to select what preferred formatting should be used.

To better understand we'll use an example with a US phone number: 415-222-3333. The available preferences are the following:
- International, would format the number to: +1 415 222 3333
- National, would format the number to: (415) 222-3333

Then users can select whether they want to display International for all numbers, and add an exception for a list of countries. For instance you could want to display US phone numbers in their national way, but display all numbers from other countries in the international format.


### Description
The `monster.util.formatPhoneNumber()` method is used to easily format phone numbers.

### Examples
* Format phone number starting with `+1`
```javascript
var phoneNumber = '+14151234567',
    formattedPhoneNumber = monster.util.formatPhoneNumber(phoneNumber);

console.log(formattedPhoneNumber);
// output: "+1 415 123 4567" (International, used by default) or "(415) 123-4567" (National) based on the preferred user format"
```

* Format phone number without `+1`
```javascript
var phoneNumber = 4151234567,
    formattedPhoneNumber = monster.util.formatPhoneNumber(phoneNumber);

console.log(formattedPhoneNumber);
// output: "+1 415 123 4567" (International, used by default) or "(415) 123-4567" (National) based on the preferred user format"
```

[monster]: ../../monster.md
[util]: ../util.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers