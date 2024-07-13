# monster.util.formatNumber()

## Syntax
```javascript
monster.util.formatNumber(args);
```

### Parameters
`args` is a mandatory `Object` parameter with the following properties:

Key | Description | Type | Default | Required
--- | --- | --- | --- | ---
`number` | Number to format. | `Number`, `String` | | `true`
`digits` | Exact number of fractional digits to use (will pad with 0(s) and round as needed to enforce `digits`). | `Number` | | `false`
`style` | Formatting style to use. | `String('currency'|'decimal'|'percent')` | `decimal` | `false`

### Return value
A `String` representation of `number`.

### Errors
* `"number" is not a valid number or not castable into a number`: `number` is not a `Number` or `String`, or is `NaN`, or is a `String` either not convertible into a `Number` or empty
* `"digits" is not a positive integer`: `digits` is defined but not a positive `Number` integer
* `"style" is not one of currency, decimal, percent`: `style` is defined but not a valid option

## Description
The `monster.util.formatNumber()` method is used to easily format numbers as plain numbers, prices and percentages by applying specific formatting rules set by the locale and/or currency code.

### Locale & currency code
The locale set at the framework level is automatically used to format `number` correctly following its specificities for all `style` options (currency symbol positioning, grouping separators and fractional digits).

The currency code set at the framework level is automatically used to format `number` correctly following its specificities and those of the locale when `style` is set to `currency`.

## Examples
### Format as plain number
```javascript
monster.util.formatNumber({ number: 5 });                   // -> "5"
monster.util.formatNumber({ style: 'decimal', number: 5 }); // -> "5"
monster.util.formatNumber({ number: -5 });                  // -> "-5"
monster.util.formatNumber({ number: 5000 });                // -> "5,000"
monster.util.formatNumber({ number: '5.5' });               // -> "5.5"
monster.util.formatNumber({ number: 5.4321 });              // -> "5.432"
monster.util.formatNumber({ number: 5, digits: 3 });        // -> "5.000"
monster.util.formatNumber({ number: 5.55, digits: 1 });     // -> "5.6"
```
### Format as price
```javascript
monster.util.formatNumber({ style: 'currency', number: 5 });              // -> "$5.00"
monster.util.formatNumber({ style: 'currency', number: -5 });             // -> "-$5.00"
monster.util.formatNumber({ style: 'currency', number: '5.5' });          // -> "$5.50"
monster.util.formatNumber({ style: 'currency', number: 5.54321 });        // -> "$5.54"
monster.util.formatNumber({ style: 'currency', number: 5, digits: 3 });   // -> "$5.000"
monster.util.formatNumber({ style: 'currency', number: 5, digits: 1 });   // -> "$5.0"
monster.util.formatNumber({ style: 'currency', number: 5.5, digits:0 });  // -> "$6"
```
### Format as percentage
```javascript
monster.util.formatNumber({ style: 'percent', number: .5 });                // -> "50%"
monster.util.formatNumber({ style: 'percent', number: '.5' });              // -> "50%"
monster.util.formatNumber({ style: 'percent', number: 0.5 });               // -> "50%"
monster.util.formatNumber({ style: 'percent', number: -5, digits: 2 });     // -> "-50.00%"
monster.util.formatNumber({ style: 'percent', number: .555 });              // -> "56%"
monster.util.formatNumber({ style: 'percent', number: .12345, digits: 2 }); // -> "12.35%"
monster.util.formatNumber({ style: 'percent', number: .5, digits: 3 });     // -> "50.000%"
```
