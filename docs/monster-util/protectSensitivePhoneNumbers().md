# monster.util.protectSensitivePhoneNumbers()

## Syntax
```javascript
monster.util.protectSensitivePhoneNumbers();
```

### Return value
A `String` representing a phone number.

## Description
This method looks for phone numbers displayed in the current page. Any phone number found in the DOM will then be "randomized", and the displayed value will be changed. This is only useful to sanitize phone numbers data before taking a screenshot for example. We've been using this internally and that's why we add it to the source today. Do not try to update information after using this function, refresh the page that you were on and nothing will have changed in the back-end.

Once the function is done, it will print a log in the console with a list of the changes that were applied.

We have added a shortcut for this function in Monster, press `?` to find the assigned key (by default, it is assigned to `shift+s`).

## Examples
### Replace phone numbers displayed in a page.
```javascript
monster.util.protectSensitivePhoneNumbers()
// output:
0 - replace (415) 123-7900 by +1 555 942 9464
1 - replace (415) 123-7965 by +1 555 712 8859
2 - replace (415) 123-7944 by +1 555 619 1779
```
