# monster.util.unformatPhoneNumber()

## Syntax
```javascript
monster.util.unformatPhoneNumber(phoneNumber[, specialRule]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`phoneNumber` | Formated US phone number to unformat. | `String`, `Number` | | `true`
`specialRule` | If specified, the number will keep the `+`. | `String('keepPlus')` | | `false`

### Return value
A `String` representation of `phoneNumber` in one of the following format:

* `+1NPANXXXXXX`
* `1NPANXXXXXX`
* `NPANXXXXXX`.

## Description
The `monster.util.unformatPhoneNumber()` method is used to easily unformat US phone numbers. If the phone number to unformat contains `+1`, you can choose to keep it by specifying the `specialRule` parameter.

## Examples
### Unformat phone number with `+1`
```javascript
var phoneNumber = '+1 (415) 123-4567';
var unformattedPhoneNUmber = monster.util.unformatPhoneNumber(phoneNumber);

console.log(unformattedPhoneNUmber);
// output: "14151234567"
```

### Unformat phone number without `+1`
```javascript
var phoneNumber = '(415) 123-4567';
var unformattedPhoneNUmber = monster.util.unformatPhoneNumber(phoneNumber);

console.log(unformattedPhoneNUmber);
// output: "4151234567"
```

### Unformat phone number and keep `+`
```javascript
var phoneNumber = '+1 (415) 123-4567';
var unformattedPhoneNUmber = monster.util.unformatPhoneNumber(phoneNumber, 'keepPlus');

console.log(unformattedPhoneNUmber);
// output: "+14151234567"
```
