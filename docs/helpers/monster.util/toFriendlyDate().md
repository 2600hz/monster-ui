# monster.util.toFriendlyDate()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.toFriendlyDate(timestamp[, format]);
```

### Parameters
* `timestamp` (mandatory)

 Type: [Number][integer]

 [Gregorian timestamp][gregorian_timestamp] to transform in friendly date.

* `format` (optional)

 Type: [String][string_literal]

 Default: `'MM/DD/year - hh:mm12h'`

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

### Return
This method returns a [String][string_literal] representation of a date.

### Description
This method formats a Gregorian timestamp into a string representation of the corresponding date. This representation can be customized by specifying the `format` parameter.

To display dates with just the month/day/year, the `format` parameter can be set to `short`.

### Examples
* Create a friendly date
```javascript
var gregorianTimestamp = monster.util.dateToGregorian(new Date(2014,0,1)),
    date = monster.util.toFriendlyDate(gregorianTimestamp);

console.log(date);
// output: "01/01/2014 - 12:00AM"
```

* Create a friendly date with custom formats
```javascript
var gregorianTimestamp = monster.util.dateToGregorian(new Date(2014,0,1)),
    date24h = monster.util.toFriendlyDate(gregorianTimestamp, 'hh:mm:ss MM-DD-YY'),
    bigDate = monster.util.toFriendlyDate(gregorianTimestamp, 'day, DD month year'),
    shortDate = monster.util.toFriendlyDate(gregorianTimestamp, 'short');

console.log(date24h);
// output: "00:00:00 01-01-2014"

console.log(bigDate);
// output: "Wednesday, 01 January 2014"

console.log(shortDate);
// output: "01/01/2014"
```

[gregorian_timestamp]: http://www.erlang.org/documentation/doc-5.4.13/lib/stdlib-1.13.12/doc/html/calendar.html
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals