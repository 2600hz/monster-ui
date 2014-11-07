# [monster][monster].[util][util].getBusinessDate()
The `monster.utilgetBusinessDate()` method adds or removes business days to the current date or to a specific date.

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.util.getBusinessDate(days[, from])
```

### Parameters
* `days` (mandatory)

 Type: [Number][integer]

 Number of business days to add or remove.

* `from` (optional)

 Type: [Date][date]

 Default: `new Date()`

 JavaScript Date instance from witch to add or remove business days.

### Return
This method returns a JavaScript Date instance.

### Description
This method adds or removes a number of business days to the date of the day if the optional parameter is not specified. If the method is called with the optional *from* parameter, the number of business days will be added or removed to this specific date.

### Examples
* Adding business days to current date
```javascript
// current date: Wed Jan 01 2014 00:00:00 GMT-0800

var date = monster.util.getBusinessDate(4);

console.log(date);
// output: Tue Jan 07 2014 00:00:00 GMT-0800

```
* Removing business days to current date
```javascript
// current date: Wed Jan 01 2014 00:00:00 GMT-0800

var date = monster.util.getBusinessDate(-4);

console.log(date);
// output: Thu Dec 26 2013 00:00:00 GMT-0800
```
* Adding business days to specific date
```javascript
var date = new Date(70, 1, 1);

console.log(monster.util.getBusinessDate(4, date));
// output: Wed Jan 07 1970 00:00:00 GMT-0800
```

[monster]: ../../monster.md
[util]: ../util.md

[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date