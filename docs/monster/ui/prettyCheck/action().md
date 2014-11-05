# [monster][monster].[ui][ui].[prettyCheck][prettyCheck].action()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.ui.prettyCheck.action(target[, action, callback]);
```

### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

 Either an element containing the checkbox/radio or the checkbox/radio itself.

* `action` (mandatory)

 Type: [String][string_literal]

 Action to apply on the checkbox/radio in the `target` element. Available actions are:
    - `check`: change input's state to "checked"
    - `uncheck`: remove "checked" state
    - `toggle`: toggle "checked" state
    - `disable`: change input's state to "disabled"
    - `enable`: remove "disabled" state
    - `indeterminate`: change input's state to  "indeterminate"
    - `determiate`: remove "indeterminate" state
    - `update`: apply input changes which were done outside the plugin
    - `destroy`: remove all traces of prettyCheck

* `callback` (optional)

 Type: [Function][function]

 Function executed after the action was applied to the `target`. If the `target` contains several several checkboxes/radio, this function will be executed for each element.

### Description
This method is used to change the state of the inputs on which the `create()` method was applied. When calling this method, it is also possible to specify a callback that will be executed after the state of the input was changed.

### Examples
* Disable a single element
```javascript
monster.ui.prettyCheck.action($('#confirm'), 'disable');
```

* Enable several elements
```javascript
monster.ui.prettyCheck.action($('input[type="checkbox"]'), 'enable');
```

* Open an alert window when checking an element
```javascript
var self = this,
    template = $('#confirm_section'),
    radio = template.find('#confirm_radio'),
    checkbox = template.find('#confirm_box');

radio.on('ifChecked', function() {
    monster.ui.prettyCheck.action(checkbox, 'check', function() {
        monster.ui.alert(self.i18n.active().autoCheck);
    });
});
```

This example use [custom events][events] to detect when an element is checked and automatically check another element while displaying a message to the user with the [monster.ui.alert()][alert] method.



[monster]: ./../../monster.md
[ui]: ../../ui.md
[prettyCheck]: ../prettyCheck.md

[jquery]: http://api.jquery.com/Types/#jQuery
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[events]: ../prettyCheck.md#events
[alert]: ../alert().md