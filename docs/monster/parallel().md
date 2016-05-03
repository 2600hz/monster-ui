# [monster][monster].parallel()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.parallel(tasks[, callback]);
```

### Parameters
* `tasks` (mandatory)

 Type: [Array][array_literal] OR [Object][object_literal]

 An array or object containing functions to run. Each function is passed a `callback(err, result)` which it must call on completion with an error `err` (which can be `null`) and an optional `result` value.

* `callback(err, result)` (optional)

 Type: [Function][function]

 An optional callback to run once all the functions have completed. This function gets a `results` array (or object) containing all the result arguments passed to the task callbacks.

### Description
Run the `tasks` array or object of functions asynchronously, without waiting until the previous function has completed. If any of the functions pass an error to its callback, the main `callback` is immediately called with the value of the error. Once the `tasks` have completed, the results are passed to the main `callback` as an array or object.

If `tasks` is an object, each property will be run as a function and the results will be passed to the main `callback` as an object instead of an array. This can be a more readable way of handling results from `monster.parallel`.

### Examples
* Get users's information as an object
```javascript
var app = {
    getUsersData: function(callback) {
        var self = this;

        monster.parallel({
                user: function(callback) {
                    self.getUser(function(userData) {
                        callback(null, userData);
                    });
                },
                devices: function(callback) {
                    self.listDevices(self.userId, function(devicesData) {
                        callback(null, devicesData);
                    });
                },
                callflows: function(callback) {
                    self.listCallflows(self.userId, function(callflowsData) {
                        callback(null, callflowsData);
                    })
                }
            }, function(err, results) {
                /**
                 - `results` is an object containing:
                 - {
                 -     user: ...,
                 -     devices: ...,
                 -     callflows: ...
                 - }
                 */

                callback && callback(results);
            }
        );
    }
}
```

[monster]: ../monster.md

[array_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Array_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions