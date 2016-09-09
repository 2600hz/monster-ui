# [monster][monster].series()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)

### Syntax
```javascript
monster.series(tasks[, callback]);
```

### Parameters
* `tasks` (mandatory)

 Type: [Array][array_literal] OR [Object][object_literal]

 An array or object containing functions to run. Each function is passed a `callback(err, result)` which it must call on completion with an error `err` (which can be `null`) and an optional `result` value.

* `callback(err, result)` (optional)

 Type: [Function][function]

 An optional callback to run once all the functions have completed. This function gets a `results` array (or object) containing all the result arguments passed to the task callbacks.

### Description
The `monster.series()` method is a simple wrapper for the `async.series()` method, allowing you to run each task in a serialized manner. For more information, check out the [Async.js][async_series] documentation.

[monster]: ../monster.md

[array_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Array_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[async_series]: https://github.com/caolan/async#seriestasks-callback