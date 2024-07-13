# monster.util.toFriendlyDate()

## Syntax
```javascript
monster.util.toFriendlyDate(date, format[, user, isGregorian, timezone]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | :-- | :-: | :-: | :-:
`date` | A `Date` instance, Gregorian or Unix timestamp representing the date to format. | `Date`, `Number` | | `true`
`format` | | `String`([#format](#format)) | `dateTime` | `false`
`user` | Specific user to get the format settings from. | `Object` | `monster.apps.auth.currentUser` | `false`
`isGregorian` | Indicates whether or not a Gregorian or Unix timestamp is expected (overridden if `date` is of type `Date`).  | `Boolean` | `true` | `false`
`timezone` | Specific timezone identifier to use for the formatting. | `String` | `monster.apps.auth.currentUser.timezone` | `false`

#### `format`
Shortcuts corresponding to pre-sets of Moment.js [date](https://momentjs.com/docs/#year-month-and-day-tokens) and [time](https://momentjs.com/docs/#hour-minute-second-millisecond-and-offset-tokens) tokens:

* `calendarDate`:`MMMM DD, YYYY`
* `date`: `MM/DD/YYYY`
* `dateTime`: `MM/DD/YYYY - hh:mm:ss`
* `shortDate`: `MM/DD/YY`
* `shortDateTime`: `MM/DD/YY - hh:mm`
* `shortTime`: `hh:mm`
* `time`: `hh:mm:ss`

> Note: Date tokens order (`M/D/Y`, `D/M/Y` or `Y/M/D`) and time format(`12h` or `24h`) will be automatically set according to the user's preferences.

### Return value
A `String` representation of a date.

## Description
This method formats a Gregorian/Unix timestamp or a `Date` instance into a string representation of the corresponding date. The format of this representation can be customized by specifying the `format` parameter.

By default, the timezone of the specified or logged in user will be used to format the date. If that timezone is not set, then the account timezone will be used. If not set, the browser's timezone will be used as a last resort.

## Examples
### Create a friendly date
```javascript
var date = new Date(2000, 0, 1, 14, 10, 0);

// let's assume our currently logged in user has set their time and date display
// settings to Day/Month/Year and 24 hour mode

monster.util.toFriendlyDate(date);
// output: "01/01/2000 - 14:10:00"
```

### Create a friendly date with custom formats
```javascript
var date = new Date(2000, 0, 1, 14, 10, 0);

monster.util.toFriendlyDate(date, 'shortDate');
// output: "01/01/00"

monster.util.toFriendlyDate(date, 'time');
// output: "14:10:00"

var gregorian = monster.util.dateToGregorian(date);

monster.util.toFriendlyDate(gregorian);
// output: "01/01/2000 - 14:10:00"
```
