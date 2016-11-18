# [monster][monster].[ui][ui].loadTab()
The `monster.ui.loadTab()` method programmatically loads the navbar tab corresponding to the tab ID passed as argument.

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.ui.loadTab(thisArg, id);
```

### Parameters
* `thisArg` (mandatory)

 Type: [Object][object_literal]

 The context of the app invoking the helper.

* `id` (mandatory)

 Type: [String][string_literal]

 Unique ID referencing a navbar tab of the app.

### Description
This helper is used to virtually trigger a click on a navbar tab so that the callback related to that tab is called. It is powerful in a sense that all the navbar animations are performed accordingly and also take into account if that tab has a `onClick` bypass callback.

The utility of this helper can be found when a user performs an action that need to load content located in another tab.

### Examples
* Load the content of another tab

Specify an `id` when declaring the tabs in render() function
```javascript
var self = this;

monster.ui.generateLayout(self, {
    menus: [
        {
            tabs: [
                {
                    id: 'devices',
                    title: 'List Devices',
                    callback: self.renderListDevices
                },
                {
                    id: 'users',
                    title: 'List Users',
                    callback: self.renderListUsers
                }
            ]
        }
    ]
});
```

Call helper to load another tab
```javascript
{
    renderListDevices: function(args) {
        var self = this;

        monster.ui.loadTab(self, 'users');
    },
    renderListUsers: function(args) {
        var self = this;

        monster.ui.loadTab(self, 'devices');
    }
}
```

This example is just an easy way to show how the helper works and does not have a real purpose.

[monster]: ../../monster.md
[ui]: ../ui.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals