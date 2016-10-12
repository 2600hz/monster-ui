# [monster][monster].[util][util].toFriendlyDate()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.toFriendlyDate(timestamp[, format, user]);
```

### Parameters
* `timestamp` (mandatory)

 Type: [Number][integer] OR [Date][date]

 [Gregorian timestamp][gregorian_timestamp] or JavaScript Date to transform in friendly date.

* `format` (optional)

 Type: [String][string_literal]

 The following strings (not case-sensitive) can be used for pre-set formats:
    -   `'dateTime'`: 'MM/DD/year - hh:mm:ss'
    -   `'shortDateTime'`: 'MM/DD/YY - hh:mm'
    -   `'date' or 'short'`: 'MM/DD/year'
    -   `shortDate`: 'MM/DD/YY'
    -   `time`: 'hh:mm:ss'
    -   `shortTime`: 'hh:mm'

 Default: `'dateTime'`

 Set of characters that will be replaced to render the date following those rules:
    -   `year`: full year
    -   `YY`: last two digits of the year
    -   `month`: name of the month
    -   `MM`: month in a two digit format
    -   `day`: name of the day
    -   `DD`: date of the day
    -   `hh`: hours
    -   `mm`: minutes
    -   `ss`: seconds
    -   `12h`: AM/PM suffix (if not specified, hours will be displayed in a 24h format)

 Note: The date (M/D/Y, D/M/Y, or Y/M/D) and time (12h or 24h) formats will be automatically set according to the user's preferences. It is not advised to set them manually.

* `user` (optional)

 Type: [Object][object_literal]

 Default: monster.apps.auth.currentUser

 The user from which to get the date and time preferences. This will be the currently logged-in user by default.

### Return
This method returns a [String][string_literal] representation of a date.

### Description
This method formats a Gregorian timestamp or a JavaScript Date into a string representation of the corresponding date. This representation can be customized by specifying the `format` parameter.

### Examples
* Create a friendly date
```javascript
var date = new Date(2015, 2, 24);

console.log(monster.util.toFriendlyDate(date));
// output: "03/24/2015 - 00:00:00"
```

* Create a friendly date with custom formats
```javascript
var gregorianTimestamp = monster.util.dateToGregorian(new Date(2015, 2, 24)),
    date24h = monster.util.toFriendlyDate(gregorianTimestamp, 'hh:mm:ss MM-DD-YY'),
    bigDate = monster.util.toFriendlyDate(gregorianTimestamp, 'day, DD month year'),
    shortDate = monster.util.toFriendlyDate(gregorianTimestamp, 'short');

console.log(date24h);
// output: "00:00:00 03-24-15"

console.log(bigDate);
// output: "Tuesday, 24 March 2015"

console.log(shortDate);
// output: "03/24/2015"
```

[monster]: ../../monster.md
[util]: ../util.md

[gregorian_timestamp]: http://www.erlang.org/documentation/doc-5.4.13/lib/stdlib-1.13.12/doc/html/calendar.html
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date