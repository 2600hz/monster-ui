# [monster][monster].[util][util].formatPrice()

* [Syntax](#syntax)
* [Parameter](#parameter)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.formatPrice(price[, decimals]);
```

### Parameter
* `price` (mandatory)

 Type: [String][string_literal] OR [Number][integer]

 Price to format (either a number or a string representation of a number).

* `decimals` (optional)

 Type: [String][string_literal] OR [Number][integer]

 The number of decimals that will shown. If not specified, integer will show no decimals and floats will show two decimals.

### Return
This method returns a [String][string_literal] representation of the provided price, showing the specified number of decimals.

### Description
The `monster.util.formatPrice()` method is used to easily format prices.

### Examples
* Formatting prices
```javascript
monster.util.formatPrice(3);
// output: "3"
monster.util.formatPrice("3.3");
// output: "3.30"
monster.util.formatPrice(3.3333);
// output: "3.33"

monster.util.formatPrice(5, "3");
// output: "5.000"
monster.util.formatPrice("5.5", 3);
// output: "5.500"
monster.util.formatPrice("5.5555", "3");
// output: "5.555"
```

[monster]: ../../monster.md
[util]: ../util.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers