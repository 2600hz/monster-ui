# monster.series()

## Syntax
```javascript
monster.series(tasks[, callback]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`tasks` | An array or object containing functions to run. Each function is passed a `callback(err, result)` which it must call on completion with an error `err` (which can be `null`) and an optional `result` value. | `Array`, `Object` | | `true`
`callback(err, result)` | An optional callback to run once all the functions have completed. This function gets a `results` array (or object) containing all the result arguments passed to the task callbacks. | `Function` | | `false`

## Description
The `monster.series()` method is a simple wrapper for the `async.series()` method, allowing you to run each task in a serialized manner. For more information, check out the [Async.js][async_series] documentation.

[async_series]: https://github.com/caolan/async#seriestasks-callback
