title: toFriendlyDate()

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

###### `timestamp`: [Number][integer] OR [Date][date] (mandatory)

[Gregorian timestamp][gregorian_timestamp] or JavaScript Date to transform in friendly date.

###### `format`: [String][string_literal] (optional, default: `dateTime`)

The following strings (not case-sensitive) can be used for pre-set formats:
* `shortDateTime`: 'MM/DD/YY - hh:mm'
* `dateTime`: 'MM/DD/year - hh:mm:ss'
* `shortDate`: 'MM/DD/YY'
* `shortTime`: 'hh:mm'
* `time`: 'hh:mm:ss',
* `calendarDate`:'month DD, year'
* `date`: 'MM/DD/year'

Set of characters that will be replaced to render the date following those rules:
* `year`: full year
* `YY`: last two digits of the year
* `month`: name of the month
* `MM`: month in a two digit format
* `day`: name of the day
* `DD`: date of the day
* `hh`: hours
* `mm`: minutes
* `ss`: seconds
* `12h`: AM/PM suffix (if not specified, hours will be displayed in a 24h format),
* `ordinal`: the ordinal suffix of the day (`st`, `nd`, `rd` or `th`)

Note: The date (M/D/Y, D/M/Y, or Y/M/D) and time (12h or 24h) formats will be automatically set according to the user's preferences. It is not advised to set them manually.

###### `user`: [Object][object_literal] (optional, default: `monster.apps.auth.currentUser`)

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
// output: "24/03/2015 - 00:00:00"
```

* Create a friendly date with custom formats
```javascript
var jsDate = new Date(2015, 2, 24),
    gregorianTimestamp = monster.util.dateToGregorian(jsDate),
    timeDate = monster.util.toFriendlyDate(gregorianTimestamp, 'time - date'),
    shortDate = monster.util.toFriendlyDate(jsDate, 'shortDate'),
    verbose = monster.util.toFriendlyDate(gregorianTimestamp, 'day, DDordinal of month year');

console.log(timeDate);
// output: "00:00:00 - 24/03/2015"

console.log(shortDate);
// output: "24/03/15"

console.log(verbose);
// output: "Tuesday, 24th of March 2015"
```

[monster]: ../../monster.md
[util]: ../util.md

[gregorian_timestamp]: http://www.erlang.org/documentation/doc-5.4.13/lib/stdlib-1.13.12/doc/html/calendar.html
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
