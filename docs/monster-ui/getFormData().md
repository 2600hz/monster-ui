# monster.ui.getFormData()

## Syntax
```javascript
monster.ui.getFormData(rootNode[, delimiter, skipEmpty, nodeCallback]);
```

### Parameters
The parameters are the same than the [form2js][form2js] function.

### Return value
An `Object` representation of the form.

## Description
This method is a wrapper of the form2js function. Its goal is to clean the object returned by form2js of all empty keys when the form passed as a parameter contains inputs without a `name` parameter.

[form2js]: https://github.com/maxatwork/form2js#form2js
