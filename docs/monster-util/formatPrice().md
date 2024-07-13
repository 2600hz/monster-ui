# monster.util.formatPrice()

!!! warning
    Although `monster.util#formatPrice` is not strictly deprecated (as in "removed from the util module"), it is now considered a legacy function and should be avoided as it might be removed in the future. For similar formatting functionalities, use [`monster.util#formatNumber`](./formatNumber().md) instead.

## Syntax
```javascript
monster.util.formatPrice(args);
```

### Parameters
`args` is a mandatory `Object` parameter with the following properties:

Key | Description | Type | Default | Required
--- | --- | --- | --- | ---
`price` | Price to format (number or string representation of a number). | `Number`, `String` | | `true`
`digits` | Number of digits to appear after the decimal point (if not specified, integers will have no digits and floating numbers with at least one significant number after the decimal point will have two digits). | `Number` | `2` | `false`
`withCurrency` | Whether or not to show the currency symbol. | `Boolean` | `true` | `false`

### Return value
A `String` representation of `price` showing the specified number of digits as well as the currency symbol.

### Errors

* `"price" is not a valid number or not castable into a number`: `price` is `NaN`, of a type other than `Number` and not castable into a valid `Number`
* `"digits" is not a positive integer`: `digits` is defined but not a positive `Number` integer
* `"withCurrency" is not a boolean`: `withCurrency` is defined but not of type `Boolean`

## Description
The `monster.util.formatPrice()` method is used to easily format prices.

## Examples
### Format prices with currency
```javascript
monster.util.formatPrice({
	price: 3
});
// output: "$3"

monster.util.formatPrice({
	price: '3.3'
});
// output: "$3.30"

monster.util.formatPrice({
	price: 3.3333
});
// output: "$3.33"

monster.util.formatPrice({
	price: 5,
	digits: 3
});
// output: "$5.000"

monster.util.formatPrice({
	price: '5.5',
	digits: 3
});
// output: "$5.500"

monster.util.formatPrice({
	price: -5.5555,
	digits: 3
});
// output: "-$5.556"
```
### Format prices without currency
```javascript
monster.util.formatPrice({
	price: 5.001,
	withCurrency: false
});
// output: "5.00"
```
