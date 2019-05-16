title: getCurrentTimeZone()

# monster.util.getCurrentTimeZone()

## Syntax
```javascript
monster.util.getCurrentTimeZone();
```

### Return value
A `String` identifier for the current time zone.

## Description
This method gets the identifier of the current time zone.

By default, the time zone of the logged in user will be returned (`monster.apps.auth.currentUser.timezone`). If that time zone is not set, then the account time zone will be used (`monster.apps.auth.currentAccount.timezone`). If not set, the browser’s time zone will be used as a last resort.

## Examples
### Get current time zone
```javascript
monster.util.getCurrentTimeZone();
// output: "America/Los_Angeles"
```
