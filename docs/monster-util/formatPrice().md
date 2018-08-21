title: formatPrice()

# monster.util.formatPrice()

## Syntax
```javascript
monster.util.formatPrice(args);
```

### Parameters
`args` is a mandatory `Object` parameter with the following properties:

Key | Description | Type | Default | Required
--- | --- | --- | --- | ---
`price` | Price to format (number or string representation of a number). | `Number`, `String` | | `true`
`decimals` | Number of digits to appear after the decimal point (if not specified, integers will have no digits and floating numbers with at least one significant number after the decimal point will have two digits). | `Number` | `2` | `false`
`withCurrency` | Hide/show currency symbol. | `Boolean` | `true` | `false`

### Return value
A `String` representation of `price` showing the specified number of digits as well as the currency symbol.

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
	price: 5.5555,
	digits: 3
});
// output: "$5.556"
```
### Format prices without currency
```javascript
monster.util.formatPrice({
	price: 5.000,
	withCurrency: false
});
// output: "5.00"
```
