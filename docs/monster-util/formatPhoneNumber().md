# monster.util.formatPhoneNumber()

## Syntax
```javascript
monster.util.formatPhoneNumber(phoneNumber);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`phoneNumber` | E.164 formatted phone number. | `String` | | `true`

### Return value
A `String` representation of the phone number user-friendly formatted.

## Description
The `monster.util.formatPhoneNumber()` method is used to easily format phone numbers.

To better understand why a returned number has the format it has, here's an explanation: in Monster there are settings in Control Center for users and accounts to select what preferred formatting should be used.

To better understand we'll use an example with a US phone number: `415-222-3333`. The available preferences are the following:

* International, would format the number to: `+1 415 222 3333`
* National, would format the number to: `(415) 222-3333`

Then users can select whether they want to display International for all numbers, and add an exception for a list of countries. For instance you could want to display US phone numbers in their national way, but display all numbers from other countries in the international format.

## Examples
### Format phone number
```javascript
var phoneNumber = '+14151234567';
var formattedPhoneNumber = monster.util.formatPhoneNumber(phoneNumber);

console.log(formattedPhoneNumber);
// possible outputs:
// - '+1 415 123 4567': International, used by default
// - '(415) 123-4567': National, based on the preferred user format
```
