# monster.ui.prettyCheck.action()

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

 Function executed after the action was applied to the `target`.

### Description
This method is used to change the state of the inputs on which the `create()` method was applied. When calling this method, it is also possible to specify a callback that will be executed after the state of the input was changed.

### Examples