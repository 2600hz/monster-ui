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

##### monster.ui.protectField
Allows you to see the value of an input of type password when focusing it. We use it to display the SIP Password of a device for example, it shows the password when you focus the field, and shows a password field when you're not focusing the field.
In order to use it, just call the following method with the 2 arguments: the first one is a jQuery object representing the password input you want to "protect", the second argument is optional and represents the container (the template) of this input.

	monster.ui.protectField(jQueryPasswordInput, containerOfInput);

#### monster.ui.wysiwyg
The wysiwyg() method generate a WYSIWYG from a set of overridable options and insert it inside a jQuery object.

![WYSIWYG](http://i.imgur.com/Y5CESZv.png)
##### Syntax
```javascript
monster.ui.wysiwyg(target[, options]);
```
##### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

 A jQuery object inside which the WYSIWYG will be inserted using the [prepend()][prepend] method

* `options` (optional)

 Type: [JavaScript object literal][javascript_object_literal] OR [Javascript boolean literal][javascript_boolean_literal]

 If this parameter is set at `false`, no toolbar will be added to the WYSIWYG. If it is a JavaScript object, it can be used to add new options or override existing options available by default listed bellow:
    - fontSize (dropdown list)
        + small
        + normal
        + huge
    - fontEffect (grouped buttons)
        + bold
        + italic
        + underline
        + strikethrough
    - fontColor (dropdown buttons)
    - textAlign (dropdown buttons)
        + left
        + center
        + right
        + justify
    - list (dropdown buttons)
        + unordered
        + ordered
    - indentation (grouped buttons)
        + indent
        + outdent
    - link (grouped buttons)
        + create
        + delete
    - image (single button)
    - editing (grouped buttons)
        + undo
        + redo
    - horizontalRule (single button)
    - macro (dropdown list) *disabled by default*

##### Description
The wysiwyg() method adds a configurable WYSIWYG inside a container specified by the `target` parameter. The options in the toolbar can be removed and new ones can be added easily.

For the default CSS styles to apply, the wysiwyg container specified as the `target` parameter needs to have the CSS class `wysiwyg-container` as follow:
```html
<div class="wysiwyg-container"></div>
```
If the CSS class `transparent` is added to the container, the toolbar will have a transparent background.

To initialize the wysiwyg with the default toolbar, the only parameter needed is `target`:
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container'));

monster.ui.wysiwyg(target);
```

##### Customize
Here is the structure of the different types of options, how they will be rendered and the description of each field:

![Dropdown button](http://i.imgur.com/rRfr9VI.png)

* dropdown list

```javascript
fontSize: {
    weight: 0,
    title: '',
    icon: '',
    command: '',
    options: {
        small: {
            weight: 0,
            text: '',
            args: '',
        },
        { ... }
    }
}
```

* dropdown buttons

```javascript
textAlign: {
    weight: 0,
    title: '',
    icon: '',
    options: {
        left: {
            weight: 0,
            title: '',
            icon: '',
            command: ''
        },
        { ... }
    }
}
```

* grouped buttons

```javascript
fontEffect: {
    weight: 0,
    options: {
        bold: {
            weight: 0,
            title: '',
            icon: '',
            command: ''
        },
        { ... }
    }
}
```

* single button

```javascript
image: {
    weight: 0,
    title: '',
    icon: '',
    command: ''
}
```
###### weight
This value of the `weight` key is used to sort the options in the toolbar. By default, the value of `weight` is a multiple of 10.
###### title
The value of the `title` key is the text that will be displayed when hovering the corresponding button/label in the toolbar.
###### icon
The value of the `icon` key is the CSS class(es) that will added to a `<i></i>` element in the corresponding option. By default, [Font Awesome icons (v3.2.1)][font_awesome] are used but this can be changed easily by overriding the value of the key.
###### text
When defining a dropdown of text, you do not need to specify an icon since it is not a button. Instead, the value of the `text` key is used as the label of the option.
###### command
The value of the `command` key is an [execCommand][exec_command]. To add a new option in the toolbar, add it to the `options` parameter using one of the three different structure depending if the new option should be a dropdown, a group of buttons or a single button.
###### args
The value of the `args` key will be used as an extra parameter of the [execCommand][exec_command]. In the default options, it is used to specify the size of the text in the `fontSize` option and to define the `macro` string.
###### options
The `options` object is used to list the different options inside a dropdown or group.
###### ante, post
When defining an option containing the `args` key, you can specify parameters before and after it. See the "Change color model to RGB" and "Add macro" examples.
##### Examples
* Remove some elements from the toolbar
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    overrideOptions = {
        fontSize: {
            options: {
                small: false
            }
        },
        fontEffect: {
            strikethrough: false
        },
        fontColor: false,
        list: false
        },
        horizontalRule: false
    };

monster.ui.wysiwyg(target, overrideOptions);
```
* Add macro
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    options = {
        macro: {
            options: {
                { weight: 1, text: "Title", args: "title" },
                { weight: 2, text: "Last name", args: "last_name" },
                { weight: 3, text: "Conference's date", args: "conference_date" },
                { weight: 4, text: "Conference's time", args: "conference_start_time" }
            }
        }
    };

monster.ui.wysiwyg(target, options);
```
By default, macros will be bold and inserted between a couple of pair of curly braces as shown in the following screenshot:

![Macro](http://i.imgur.com/jCgTEXk.png)

If you want to change the surrounding elements of the macro, you need to use the `ante` and `post` keys and specify it as their value like shown bellow:
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    options = {
        macro: {
            options: { ... },
            ante: "[",
            post: "]"
        }
    };

monster.ui.wysiwyg(target, options);
```
Now the macro will only be surrounded by a single pair of square brackets.

* Add new option to remove all formating from the current selection
```javascript
var target = $(document.getElementsByClassName('wysiwyg-container')),
    newOption = {
        removeFormat: {
            title: 'Remove format',
            icon: 'icon-eraser',
            command: 'removeFormat'
        }
    };

monster.ui.wysiwyg(target, newOptions);
```
* Change color model to RGB
```javascript
var target = $(document.getElementByClassName('wysiwyg-container')),
    overrideColorOption = {
        fontColor: {
            options: ['255,255,255', '0,0,0', '238,236,225'],
            ante: 'rgb(',
            post: ')'
        }
    }
```
By default, the colors are defined using the hexadecimal color model and the `ante` key has the value of #.

[jquery]: http://api.jquery.com/Types/#jQuery
[javascript_object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[prepend]: http://api.jquery.com/prepend/
[font_awesome]: http://fortawesome.github.io/Font-Awesome/3.2.1/icons/
[exec_command]: https://developer.mozilla.org/en-US/docs/Web/API/document.execCommand
[javascript_boolean_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Boolean_literals

## monster.util
The helpers located in the monster.util are used in the JavaScript to help you with common problems such as formatting phone numbers, transforming a gregorian date to a human date or creating a random string.

#### monster.util.toFriendlyDate
The Kazoo API use [Gregorian seconds](http://www.erlang.org/documentation/doc-5.4.13/lib/stdlib-1.13.12/doc/html/calendar.html) for most of the `created_at`, `updated_at` etc.. attributes, and we usually need to display those dates in the UI. In order to display these dates in a user-friendly way, we created this helper, it should be really easy to use, here's an example:

	monster.util.toFriendlyDate(63566552033); // Outputs: 05/05/2014 - 04:33 PM
	monster.util.toFriendlyDate(63566552033, 'short'); // Outputs: 05/05/2014

#### monster.util.gregorianToDate
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
The sort helper helps us ordering the different list of data we're showing in the UI. It is very specific to the Kazoo API since the first argument it takes is an array of objects, such as an array of devices, or users for example. By default it will sort the array alpabetically based on the 'name' attribute of the different objects. If you would like to sort alphabetically on another field, you can specify the name of the field in the second argument.

Here's an example:

	var listUsers = [
		{ name: 'Paulo', 'id': 'b12' },
		{ name: 'Cisfran' 'id', 'c14'},
		{ name: 'Walou', 'id': 'a52' }
	];

	monster.util.sort(listUsers); // returns  cisfran, paulo, walou
	monster.util.sort(listUsers, 'id'); //returns walou, paulo, cisfran

#### getBusinessDate
The getBusinessDate() method adds or removes business days to the current date or to a specific date.
###### Syntax
```javascript
monster.util.getBusinessDate(days[, from])
```
###### Parameters
* *days*

 A mandatory integer representing the number of business days to add or remove,

* *from*

 An optional JavaScript Date instance from witch to add or remove business days.

###### Return
The value returned by getBusinessDate() is a JavaScript Date instance.

###### Description
The getBusinessDate() method adds or removes a number of business days to the date of the day if the optional parameter is not specified. If the method is called with the optional *from* parameter, the number of business days will be added or removed to this specific date.

###### Examples
* Adding business days to current date
```javascript
// current date: Wed Jan 01 2014 00:00:00 GMT-0800

var date = monster.util.getBusinessDate(4);

console.log(date);
// output message: Tue Jan 07 2014 00:00:00 GMT-0800

```
* Removing business days to current date
```javascript
// current date: Wed Jan 01 2014 00:00:00 GMT-0800

var date = monster.util.getBusinessDate(-4);

console.log(date);
// output message: Thu Dec 26 2013 00:00:00 GMT-0800
```
* Adding business days to specific date
```javascript
var date = new Date(70, 1, 1); // Thu Jan 01 1970 00:00:00 GMT-0800

console.log(monster.util.getBusinessDate(4, date));
// output message: Wed Jan 07 1970 00:00:00 GMT-0800
```
