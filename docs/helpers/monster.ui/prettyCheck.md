# monster.ui.prettyCheck
The `monster.ui.prettyCheck` object expose two methods allowing you to customize checkbox/radio.

* [Methods](#methods)
* [Events](#events)
* [Description](#description)
* [Examples](#examples)

![Different states](http://i.imgur.com/Byjs07J.png)

### Methods
* [create()](#create)
* [action()](#action)

### Events
To handle state's changes of the checkbox/radio, several custom event types are available:

* `ifClicked`: user clicked on a customized input or an assigned label
* `ifChanged`: input's "checked", "disabled" or "indeterminate" state is changed
* `ifChecked`: input's state is changed to "checked"
* `ifUnchecked`: "checked" state is removed
* `ifToggled`: input's "checked" state is changed
* `ifDisabled`: input's state  is changed to "disabled"
* `ifEnabled`: "disabled" state is removed
* `ifIndeterminate`: input's state is changed to "indeterminate"
* `ifDeterminate`: "indeterminate" state is removed
* `ifCreated`: input is just customized
* `ifDestroyed`: customization is just removed

To bind these custom events to inputs, use the jQuery [`on()`][on] method.

### Examples
* Create a pretty checkbox
```javascript
monster.ui.prettyCheck.create($('input[type="checkbox"]'));
```

![Image showing the transformation of a checkbox, using monster.ui.prettyCheck.create()](http://i.imgur.com/MsHYyQD.png)

* Bind custom event
```javascript
$('input').on('ifChecked', function() {
    callback();
});
```

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[jquery]: http://api.jquery.com/Types/#jQuery
[on]: http://api.jquery.com/on/