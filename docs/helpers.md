# Using Monster Helpers

We created some helpers for the Monster-UI framework, contained in the monster.ui and monster.util variables. In this doc we'll help you understand what they do and when to use it.


### monster.ui
The monster.ui object contains the different helpers to render common UI things like popups, alert box and confirm box

##### monster.ui.alert
If you want to display a simple message in a popup to the user, you can use the monster.ui.alert helper. You can use it with 2 different constructors, first:
monster.ui.alert('This is my alert message');

or with the first argument defined, to change the color and icon displayed in the box:

	monster.ui.alert('error', 'This is my Error alert message');
	monster.ui.alert('info', 'This is my Info alert message');
	monster.ui.alert('warning', 'This is my Warning alert message');

![Image showing the different state of the alert box](http://i.imgur.com/QzKsyf8.png)

Basically calling monster.ui.alert without the first argument, will default it to "error".

##### monster.ui.dialog
This is the helper to use when you want to wrap your templates in a popup with the look and feel of the Monster-UI.
It takes 2 arguments, the first is a HTML template, and the second is the map of options used by the [jQuery Dialog](http://api.jqueryui.com/dialog/).

popup.html

	popup = monster.ui.dialog(popupHtml, {
        title: self.i18n.active().failover.failoverTitle,
        width: '540px'
    });

This code will display:
![Image showing a simple Monster-UI popup](http://i.imgur.com/c2XMtjd.png)

Basically a Monster-UI dialog comes with the section highlighted in red section for the title, and then a div where your template is added.

##### monster.ui.confirm
The monster.ui.confirm helper, creates a confirm box, allowing you to confirm or cancel something with a popup. Here's an example showing how to use it:

app.js

	clickLogout: function() {
        var self = this;

        monster.ui.confirm(self.i18n.active().confirmLogout, function() {
            self._logout();
        });
    },

![Image showing a Monster-UI confirm box to log out of the UI](http://i.imgur.com/Xh4NoRU.png)

The confirm helper, takes 2 required arguments and one optional:
* First: the text you want to display in the Header of the confirm box
* Second: A callback linked to the OK button
* Optional third: A callback linked to the cancel button

By default, clicking on the cancel button just closes the confirm box, if you want to do something else, you'll need to specify your own callback.

##### monster.ui.table
More doc coming soon, we're using [datatables.net](http://datatables.net/) for our tables. You can see an example of how to use it with Monster in the monster-balance module.

##### monster.ui.prettyCheck
If you're using unskinned checkboxes, and would like to use pretty checkboxes, you can use the monster.ui.prettyCheck.create method to transform the existing checkboxes.

Here's en example:

app.js

	var $template = $(monster.ui.template(self, 'test.html');
	monster.ui.prettyCheck($template);

![Image showing the transformation of a checkbox, using monster.ui.prettyCheck](http://i.imgur.com/x5S1PwS.png)

You only need to give the jQuery object to prettyCheck and it will transform all the checkboxes, into pretty checkboxes.

##### monster.ui.validate
The validation in the Monster-UI has its own documentation, you can see it [here](https://github.com/2600hz/monster-ui/blob/master/docs/validation.md)


### monster.utils
