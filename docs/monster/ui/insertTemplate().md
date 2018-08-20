title: insertTemplate()

# [monster][monster].[ui][ui].insertTemplate()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.ui.insertTemplate(target, callback[, options]);
```

### Parameters

###### `target`: [jQuery Object][jquery] (mandatory)

Insert the template at the end of the target element.

###### `callback`: [Function][function] (mandatory)

A function that exposes the helper's callback that will receive the template to insert in the target.

###### `options`: [Object][object_literal] (optional)

List of options to customize the loading view:

* `title`: [String][string_literal] (optional) - title displayed in the loading view
* `text`: [String][string_literal] (optional) - text displayed in the loading view
* `duration`: [Number][integer] (optional, default: `250`) - duration of the fadeIn animation for the inserted template
* `cssClass`: [String][string_literal] (optional, default: `app-content`) - custom CSS classes for the loading view
* `hasBackground`: [Boolean][boolean_literal] (optional, default: `true`) - show the loading spinner/text/title without any background if set to `false` (overridden by `cssClass`)

### Description

The `monster.ui.insertTemplate()` method is a handy helper that gives developers the power to have the same animations when inserting a template in the DOM, but most of all, automatically detects if a request is in progress and add a loading template if it is the case.

### Examples

* Insert a template that does not need data from requests:
```javascript
var self = this,
    initTemplate = function initTemplate() {
        var template = $(monster.template(self, 'myTemplate'));

        // bind events, generate custom elements (tooltips, datepickers ...)

        return template;
    };

monster.ui.insertTemplate($target, function(callback) {
    callback(initTemplate());
});
```

* Insert a template that need data form requests:
```javascript
var self = this,
    initTemplate = function initTemplate(results) {
        var template = $(monster.template(self, 'myTemplate', results));

        // bind events, generate custom elements (tooltips, datepickers ...)

        return template;
    };
monster.ui.insertTemplate($target, function(callback) {
    monster.parallel({
        listUsers: function() {
            // retrieve users
        },
        getAccount: function() {
            // retrieve account data
        }
    }, function(err, results), {
        // feed the data to your template
        callback(initTemplate(results), function() {
            // this callback will be executed once the template is in the DOM
        });
    });
});
```

[monster]: ../../monster.md
[ui]: ../ui.md

[jquery]: http://api.jquery.com/Types/#jQuery
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Integers
[boolean_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Boolean_literals
