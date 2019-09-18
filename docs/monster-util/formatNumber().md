title: formatNumber()

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
* `"number" is not a valid number or not castable into a number`: `number` is not a `Number` or `String`, or `NaN`, or a `String` either not convertible into a `Number` or empty
* `"digits" is not a positive integer`: `digits` is defined but not a positive `Number` integer
* `"style" is not one of currency, decimal, percent`: `style` is defined but not a valid option

## Description
The `monster.util.formatNumber()` method is used to easily format numbers.

When the formatting style is `currency`, the locale and currency code set at the framework level are automatically used to format `number` correctly (namely: currency symbol position, grouping separators and fractional digits).

## Examples
### Format as plain number
```javascript
monster.util.formatNumber({
  number: 5
});
// output: "5"

monster.util.formatNumber({
  number: '5.5'
});
// output: "5.5"

monster.util.formatNumber({
  number: 5,
  digits: 3
});
// output: "5.000"

monster.util.formatNumber({
  number: 5.5,
  digits: 3
});
// output: "5.556"

monster.util.formatNumber({
  number: '5',
  digits: 2
});
// output: "5.00"

monster.util.formatNumber({
  number: -5,
  digits: 2
});
// output: "-5.00"
```
### Format as currency number
```javascript
monster.util.formatNumber({
  style: 'currency',
  number: 5
});
// output: "$5.00"

monster.util.formatNumber({
  style: 'currency',
  number: '5.5'
});
// output: "$5.50"

monster.util.formatNumber({
  style: 'currency',
  number: 5,
  digits: 3
});
// output: "$5.000"

monster.util.formatNumber({
  style: 'currency',
  number: 5.5,
  digits: 3
});
// output: "$5.556"

monster.util.formatNumber({
  style: 'currency',
  number: '5',
  digits: 1
});
// output: "$5.0"

monster.util.formatNumber({
  style: 'currency',
  number: -5
});
// output: "-$5.00"
```
### Format as percent number
```javascript
monster.util.formatNumber({
  style: 'percent',
  number: .5
});
// output: "50%"

monster.util.formatNumber({
  style: 'percent',
  number: '.5'
});
// output: "50%"

monster.util.formatNumber({
  style: 'percent',
  number: 0.5
});
// output: "50%"

monster.util.formatNumber({
  style: 'percent',
  number: .5432,
  digits: 3
});
// output: "54.320%"

monster.util.formatNumber({
  style: 'percent',
  number: '.55555',
  digits: 2
});
// output: "55.56%"

monster.util.formatNumber({
  style: 'percent',
  number: -5,
  digits: 2
});
// output: "-50.00%"
```
