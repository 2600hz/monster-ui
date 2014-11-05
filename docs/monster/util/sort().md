# [monster][monster].[util][util].sort()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.sort(array[, sortBy]);
```

### Parameters
* `array` (mandatory)

 Type: [Array][array_literal]

 Array of objects to sort.

* `sortBy` (optional)

 Type: [String][string_literal] OR [Function][function]

 Default: `'name'`

     -  `String`: name of the field by which the array should be sorted. By default, the array is sorted by the field `name`.
     -  `Function`: function applied to sort the objects of the array.

### Return
This method returns the `array` parameter.

### Description
This method sorts an array of objects by the field `name`. It is possible to sort the objects by a different field by calling the method with the `sortBy` parameter. This parameter can either be a field contained by the objects or a function. If not specified, the objects will be sorted by the field `name`.

### Examples
* Sort objects by the field `name`
```javascript
var users = [
        { name: 'Bill', id: '345' },
        { name: 'Lance', id: '122' },
        { name: 'John', id: '847' }
    ];

monster.util.sort(users);
// result: "Bill", "John", "Lance"
```

* Sort objects by an optional field
```javascript
var users = [
        { name: 'Bill', id: '345' },
        { name: 'Lance', id: '122' },
        { name: 'John', id: '847' }
    ];

monster.util.sort(users, 'id');
// result: "Lance", "Bill", "John"
```

* Sort objects by a custom function
```javascript
var users = [
        { name: 'Bill', id: '345' },
        { name: 'Lance', id: '122' },
        { name: 'John', id: '847' }
    ];

monster.util.sort(users, function(a, b) {
    return a.id < b.id ? 1 : -1;
});
// result: "John", "Bill", "Lance"
```

[monster]: ../../monster.md
[util]: ../util.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[array_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Array_literals