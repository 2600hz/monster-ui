# [monster][monster].[ui][ui].getFormData()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)

### Syntax
```javascript
monster.ui.getFormData(rootNode[, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName]);
```

### Parameters
The parameters are the same than the [form2js][form2js] function.

### Description
This method is a wrapper of the form2js function. Its goal is to clean the object returned by form2js of all empty keys when the form passed as a parameter contains inputs without a `name` parameter.

[monster]: ../../monster.md
[ui]: ../ui.md

[form2js]: https://github.com/maxatwork/form2js#form2js