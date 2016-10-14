# [monster][monster].pub()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.pub(alias[, data]);
```

### Parameters
* `topic` (mandatory)

 Type: [String][string_literal]

 Alias for the method to publish

* `data` (optional)

 Type: [Object][object_literal] OR [Array][array_literal] OR [String][string_literal] OR [Number][integer] OR [Function][function]

 Default: `{}`

 Parameters passed to the method published

### Description
The `monster.pub()` method let you publish all the methods that were exposed by other developers of Monster applications or let you access the Monster Core Apps and Monster Common Controls methods to perform common actions (see examples).

To see how to make a method publishable, go to the related [documentation][events].

### Examples
* Hide `myaccount` by publishing the related method exposed by the `myaccount` core app
```javascript
monster.pub('myaccount.hide');
```
* Invoke the `buyNumbers` common control
```javascript
monster.pub('common.buyNumbers');
```

[monster]: ../monster.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[array_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Array_literals
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[events]: ../events.md