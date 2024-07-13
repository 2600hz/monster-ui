# monster.util.getCurrencySymbol()

## Syntax
```javascript
monster.util.getCurrencySymbol();
```
### Return value
* `String` representation of the currency symbol

## Description
The `monster.util#getCurrencySymbol` method returns the currency symbol based on the current language (`monster.config.whitelabel.language`) and currency code set for Monster UI (`monster.config.currencyCode`).

## Examples
```javascript
// monster.config.whitelable.language -> en-US
// monster.config.currencyCode -> USD
monster.util.getCurrencySymbol();
// -> '$'

// monster.config.whitelable.language -> fr-FR
// monster.config.currencyCode -> USD
monster.util.getCurrencySymbol();
// -> '$US'
```
