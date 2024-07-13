# monster.parallel()

## Syntax
```javascript
monster.parallel(tasks[, callback]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`tasks` | An array or object containing functions to run. Each function is passed a `callback(err, result)` which it must call on completion with an error `err` (which can be `null`) and an optional `result` value. | `Array`, `Object` | | `true`
`callback(err, result)` | An optional callback to run once all the functions have completed. This function gets a `results` array (or object) containing all the result arguments passed to the task callbacks. | `Function` | | `false`

## Description
Run the `tasks` array or object of functions asynchronously, without waiting until the previous function has completed. If any of the functions pass an error to its callback, the main `callback` is immediately called with the value of the error. Once the `tasks` have completed, the results are passed to the main `callback` as an array or object.

If `tasks` is an object, each property will be run as a function and the results will be passed to the main `callback` as an object instead of an array. This can be a more readable way of handling results from `monster.parallel`.

## Examples
### Get users information as an object
```javascript
monster.parallel({
  user: function(callback) {
    getUser(function(userData) {
      callback(null, userData);
    });
  },
  devices: function(callback) {
    listDevices(app.userId, function(devicesData) {
      callback(null, devicesData);
    });
  },
  callflows: function(callback) {
    listCallflows(app.userId, function(callflowsData) {
      callback(null, callflowsData);
    });
  }
}, function(err, results) {
  // `results` is an object with the following keys:
  // - `user`
  // - `devices`
  // - `callflows`

  // Do things with `results`
});
```
