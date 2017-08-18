# [monster][monster].waterfall()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)

### Syntax
```javascript
monster.waterfall(tasks[, callback]);
```

### Parameters

###### `tasks`: [Array][array_literal] (mandatory)

An array containing functions to run. Each function is passed a `callback(err, result)` which it must call on completion with an error `err` (which can be `null`) and an optional `result` value.

###### `callback(err[, result])`: [Function][function] (optional)

An optional callback to run once all the functions have completed. This function gets a `results` containing all the result arguments passed to the task callbacks.

### Description
The `monster.waterfall()` method is a simple wrapper for the `async.waterfall()` method, allowing you to run each task in a serialized manner, with the ability to access the result of the previously run task. For more information, check out the [Async.js][async_waterfall] documentation.

[monster]: ../monster.md

[array_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Array_literals

[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[async_waterfall]: http://caolan.github.io/async/docs.html#waterfall