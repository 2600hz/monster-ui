# monster.util.getCurrentTimeZone()

## Syntax
```javascript
monster.util.getCurrentTimeZone();
```

### Return value
A `String` identifier for the current time zone.

## Description
The `monster.util.getCurrentTimezone` method returns a [TZ database name](https://www.wikiwand.com/en/Tz_database) representing the timezone set for the currently authenticated session.

By default, the time zone of the logged in user will be returned (`monster.apps.auth.currentUser.timezone`). If that time zone is not set, then the account time zone will be used (`monster.apps.auth.currentAccount.timezone`). If not set, the browser’s time zone will be used as a last resort.

## Examples
### Get current time zone
```javascript
monster.util.getCurrentTimeZone();
// output: "America/Los_Angeles"
```
