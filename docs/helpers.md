# Using Monster Helpers

We created some helpers for the Monster-UI framework, contained in the monster.ui and monster.util variables. In this doc we'll help you understand what they do and when to use it.


## monster.ui
The monster.ui object contains the different helpers to render common UI things like popups, alert box and confirm box

#### monster.ui.alert
If you want to display a simple message in a popup to the user, you can use the monster.ui.alert helper. You can use it with 2 different constructors, first:

	monster.ui.alert('This is my alert message');

or with the first argument defined, to change the color and icon displayed in the box:

	monster.ui.alert('warning', 'This is my Warning alert message');
	monster.ui.alert('error', 'This is my Error alert message');
	monster.ui.alert('info', 'This is my Info alert message');

![Image showing the different state of the alert box](http://i.imgur.com/mwmT4Z4.png)

Basically calling monster.ui.alert without the first argument, will default it to "error".

#### monster.ui.dialog
This is the helper to use when you want to wrap your templates in a popup with the look and feel of the Monster-UI.
It takes 2 arguments, the first is a HTML template, and the second is the map of options used by the [jQuery Dialog](http://api.jqueryui.com/dialog/).

popup.html

	popup = monster.ui.dialog(popupHtml, {
        title: self.i18n.active().failover.failoverTitle,
        width: '540px'
    });

This code will display:
![Image showing a simple Monster-UI popup](http://i.imgur.com/bEdqrcJ.png)

Basically a Monster-UI dialog comes with the section highlighted in red section for the title, and then a div where your template is added.

#### monster.ui.confirm
The monster.ui.confirm helper, creates a confirm box, allowing you to confirm or cancel something with a popup. Here's an example showing how to use it:

app.js

	clickLogout: function() {
        var self = this;

        monster.ui.confirm(self.i18n.active().confirmLogout, function() {
            self._logout();
        });
    },

![Image showing a Monster-UI confirm box to log out of the UI](http://i.imgur.com/Cuuwl7b.png)

The confirm helper, takes 2 required arguments and one optional:
* First: the text you want to display in the Header of the confirm box
* Second: A callback linked to the OK button
* Optional third: A callback linked to the cancel button

By default, clicking on the cancel button just closes the confirm box, if you want to do something else, you'll need to specify your own callback.

#### monster.ui.table
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
The validation in the Monster-UI has its own documentation, you can see it [here](https://github.com/2600hz/monster-ui/blob/master/docs/validation.md).

## monster.utils
The helpers located in the monster.utils are used in the JavaScript to help you with common problems such as formatting phone numbers, transforming a gregorian date to a human date or creating a random string.

#### monster.utils.toFriendlyDate
The Kazoo API use [Gregorian seconds](http://www.erlang.org/documentation/doc-5.4.13/lib/stdlib-1.13.12/doc/html/calendar.html) for most of the `created_at`, `updated_at` etc.. attributes, and we usually need to display those dates in the UI. In order to display these dates in a user-friendly way, we created this helper, it should be really easy to use, here's an example:

	monster.util.toFriendlyDate(63566552033); // Outputs: 05/05/2014 - 04:33 PM
	monster.util.toFriendlyDate(63566552033, 'short'); // Outputs: 05/05/2014

#### monster.utils.gregorianToDate
This helper is used if you want to get a JavaScript Date object, from a gregorian time.

	monster.util.gregorianToDate(63566552033); // Returns a JS Date Object

#### dateToGregorian
This helper is the opposite of gregorianToDate, and takes a JS date and returns a number of gregorian seconds:

	monster.util.dateToGregorian(new Date()); // Returns '63566886312'

#### unformatPhoneNumber
This helper is useful to parse an input where an end-user was asked to type a phone number for example. It strips all the non-digits characters and returns the new string. There is is an option to keep '+', here's an example:

app.js

	monster.util.unformatPhoneNumber('+1 (415) 492-1234'); // returns '14154921234'
	monster.util.unformatPhoneNumber('+1 (415) 492-1234', 'keepPlus'); // returns '+14154921234'

#### formatPhoneNumber
This helper does the opposite of the previous helper and formats a number nicely. It only works for US numbers for now, here's an example:

app.js

	monster.util.formatPhoneNumber('+14154921234'); // returns +1 (415) 492-1234
	monster.util.formatPhoneNumber('41541921234'); // returns (415) 492-1234

#### randomString
This helper was created because we needed ways to create random strings for different things, it works very simply by taking a number of characters to random, and an optional string containing the allowed characters to be randomed. By default, if you don't specify the second argument, the random characters will be contained in this list: `23456789abcdefghjkmnpqrstuvwxyz`

app.js

	monster.util.randomString(5); // Could return '24mz2' but not '0o!!!'
	monster.util.randomString(4, 'abc') // Could return 'baca' but not 'dsoo'

#### sort
Finally the sort helper helps us ordering the different list of data we're showing in the UI. It is very specific to the Kazoo API since the first argument it takes is an array of objects, such as an array of devices, or users for example. By default it will sort the array alpabetically based on the 'name' attribute of the different objects. If you would like to sort alphabetically on another field, you can specify the name of the field in the second argument.

Here's an example:

	var listUsers = [
		{ name: 'Paulo', 'id': 'b12' },
		{ name: 'Cisfran' 'id', 'c14'},
		{ name: 'Walou', 'id': 'a52' }
	];

	monster.utils.sort(listUsers); // returns  cisfran, paulo, walou
	monster.utils.sort(listUsers, 'id'); //returns walou, paulo, cisfran
