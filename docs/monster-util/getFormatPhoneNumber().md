# monster.util.getFormatPhoneNumber()

## Syntax
```javascript
monster.util.getFormatPhoneNumber(phoneNumber);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`phoneNumber` | Phone number to analyze and get available formats for. | `String` | | `true`

### Return value
An `Object` literal.

If the phone number has an unknown format, the function returns at least the following fields:

Key | Description | Type
:-: | --- | :-:
`isValid` | Whether or not the number has a known format. In this case it is `false`. | `Boolean`
`originalNumber` | Contains the number submitted originally. | `String`
`userFormat` | The way the user should see the number displayed (if the number doesn't have any proper format found, then it will most of the time be equal to the originalNumber). | `String`

Then if the number submitted was a valid phone number, it should also return the following fields:

Key | Description | Type
:-: | --- | :-:
`country` | | `Object`
`country.code` | Contains a valid ISO 3166-1 alpha-2 country code (example: `FR` for France, `US` for United States etc...). | `Object`
`country.name` | Friendly name of the country linked to the code (if code is US, name will be "`United States`" for instance). | `String`
`e164Number` | Contains a valid E164 Number. When sending a number to the different Kazoo APIs, this is usually the expected format. (`+14152223333` for a US phone number, `+33612345566` for a FR phone number etc...). | `String`
`internationalFormat` | A proper international format that you could find on a website for example, it is the default way that Monster uses to display phone number in the system (`+1 415 222 333` for a US phone number, `+33 6 12 34 55 66` for a FR phone number etc...). | `String`
`isValid` | Whether or not the number has a known format. In this case it is `true`. | `Boolean`
`nationalFormat` | A proper national format that you expect to see in the number's country. For instance, a US phone number in the US is displayed `(415) 222-3333` without the "`+1`", a FR phone number in France is displayed `06 33 44 12 23`. | `String`
`numberType` | The type of the number based on the number itself; able to distinguish Fixed-line, Mobile, Fixed-line or mobile, Toll-free, Premium Rate, Shared Cost, VoIP, Personal Numbers, UAN, Pager, and Voicemail, whenever feasible. | `String('FIXED_LINE_OR_MOBILE' | 'FIXED_LINE' | 'MOBILE' | 'TOLL_FREE' | 'PREMIUM_RATE' | 'SHARED_COST' | 'VOIP' | 'PERSONAL_NUMBER' | 'UAN' | 'PAGER' | 'VOICEMAIL')`
`originalNumber` | The number given as a parameter before the analyze occurred. | `String`
`userFormat` | In Monster there are settings in myaccount for user and account to select what preferred formatting should be used, they have the option between International or National, or they can even default to International and specify a list of countries for which they want to see phone numbers display with their "national format". This field represents the value after Monster got the right setting for the current user. | `String`
`userFormatType` | This will indicate which "preference" was chosen from the user / account to format the phone number, can be `international`, `national` or `international_with_exceptions`. | `String`


## Description
The `monster.util.formatPhoneNumber()` method is used to get the available formats for a phone number and display information about it. This helper is also used by the `formatPhoneNumber` helper to automatically display phone numbers.

## Examples
### Get available formats for proper e164 phone numbers
```javascript
// for a US phone number
monster.util.getFormatPhoneNumber('+14152223333');

// output
{
  "isValid": true,
  "originalNumber": "+14152223333",
  "userFormat": "+1 415 222 3333",
  "e164Number": "+14152223333",
  "nationalFormat": "(415) 222-3333",
  "internationalFormat": "+1 415 222 3333",
  "country": {
    "code": "US",
    "name": "United States"
  },
  "numberType": "FIXED_LINE_OR_MOBILE",
  "userFormatType": "international"
}

// for a French phone number
monster.util.getFormatPhoneNumber('+33612345677');

// output
{
  "isValid": true,
  "originalNumber": "+33612345677",
  "userFormat": "+33 6 12 34 56 77",
  "e164Number": "+33612345677",
  "nationalFormat": "06 12 34 56 77",
  "internationalFormat": "+33 6 12 34 56 77",
  "country": {
    "code": "FR",
    "name": "France"
  },
  "numberType": "MOBILE",
  "userFormatType": "international"
}
```

### Format phone number without `+1`.

```javascript
monster.util.getFormatPhoneNumber('4152223333');

// output
{
  "isValid": true,
  "originalNumber": "4152223333",
  "userFormat": "+1 415 222 3333",
  "e164Number": "+14152223333",
  "nationalFormat": "(415) 222-3333",
  "internationalFormat": "+1 415 222 3333",
  "country": {
    "code": "US",
    "name": "United States"
  },
  "numberType": "FIXED_LINE_OR_MOBILE",
  "userFormatType": "international"
}
```
This works only for proper US phone numbers, because we default to "US" if we can't find a proper prefix. Then if the parser understand that it's not a US phone number, it will just return the required fields.


Now an example that doesn't work. We try to get the format for a French phone number, without supplying a properly formatted number (with `+33`). The helper defaults to "US" and attempts to parse it, but the result indicates that it is not a valid number.
```javascript
monster.util.getFormatPhoneNumber('0633441122');

// output
{
  "isValid": false,
  "originalNumber": "0633441122",
  "userFormat": "+1 0633441122",
  "e164Number": "+10633441122",
  "nationalFormat": "0633441122",
  "internationalFormat": "+1 0633441122",
  "country": {
    "code": "US",
    "name": "United States"
  },
  "userFormatType": "international"
}
```
