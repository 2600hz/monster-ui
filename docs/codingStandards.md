## Coding standards for Monster-UI webapps

In this document, we will go over all the code conventions used in Monster-UI. Although they are in no way mandatory, we strongly advise to follow this conventions for readability and maintenability purposes.

### General Conventions

General conventions are used throughout Monster-UI, regardless of the type of file.

##### Indentation

All indentation in Monster-UI should be done using tabs instead of raw spaces. It is advised to set your tabs settings to display as 4 spaces in your development environement, since some legacy code may still use 4 raw spaces instead of tabs.

##### Encoding

All your files should be encoded in UTF-8. This is especially important for i18n files.

### Javascript Conventions

##### Naming

We use the camel case naming convention for our variables and functions in javascript.

Example:
```
{
	myFunction: function(myParameter) {
		var myVariable = myParameter;
		// Some code...
	}
}
```

There are however a few exceptions to this rule:

1.  Subscribed functions will start with an underscrore.
2.  When we need to use _$(this)_ mutiple times within the same scope (inside a _$.each_ for example), we reference it to a variable _$this_.
3.  The data from our database, manipulated through our set of APIs, does not follow the same conventions. Most elements will be lowercase, each word separated by an underscore. For obvious reason, these elements must __not__ be renamed to follow our conventions.

Example:
```
{
	/* ... */
	// (1)
	subscribe: {
		'demo.someAction': '_someSubscribedFunction'
	},

	_someSubscribedFunction: function() {
		// Some code...
	},

	// (2)
	someOtherFunction: function() {
		$.each($('.some-class'), function() {
			var $this = $(this);
			// Some code...
		})
	},

	// (3)
	getUserName: function(accountId, userId) {
		monster.request({
			resource: 'demo.getUser',
			data: {
				accountId: accountId,
				userId: userId
			},
			success: function(dataUser) {
				return dataUser.data.first_name + ' ' + dataUser.data.first_name
			}
		});
	}
	/* ... */
}
```

##### Miscellaneous

*	Although not mandatory in javascript, every instruction should be terminated by a semicolon.
*	Single quotes are preferred for strings in javascript (while double quotes are preferred in html).
*   All our apps are defined as a JSON object. By convention, every function defined at the root of the app should declare a variable _self_ to reference the scope of the app (_this_).
```
	{
		myFunction: function() {
			var self = this;
			// Some code...
		}
	}
```
*   All the variables should be declared in a single "var" declaration block, separated by a comma and line break, at the beggining of the function.
```
	function() {
		var someString = 'someString',
			someNumber = 0,
			someObject = {};
		// Some code...
	}
```
*	When accessing the DOM with JQuery, use the find function whenever possible.
```
	myElement = template.find('#my_element'); // Good
	myElement = $('#my_element', template); // Bad
```
*	When manipulating javascript objects (non-DOM elements), prefer using Underscore functions over JQuery.
```
	var obj = {
		a: 1,
		b: 2,
		c: 3
	};
	_.each(obj, function(val, key) { /* Some code */ }); // Good
	$.each(obj, function(key, val) { /* Some code */ }); // Bad
```

### JSON Conventions

JSON (JavaScript Object Notation) files are used for internationalization in Monster-UI.

*	All keys should use the camel case notation.
*	All strings should be double-quoted.
*	Despite booleans and numbers being valid JSON values, only strings, objects and arrays should be used in i18n files.

```
{
	"skeleton": {
		"description": "Some description",
		"errorMessages": {
			"someError": "Some error message",
			"anotherError": "Another error message"
		},
		"multilineMessage": [
			"first line of the multiline message",
			"second line of the multiline message",
			"note that arrays such as this one are rarely used"
		]
	}
}
```

### HTML Conventions

##### Naming

*	All html tags should be lowercase.
*	All id attributes should be lowercase, each word separated by an underscore ( _ ).
*	All class attributes should be lowercase, each word separated by a dash ( - ).
*	All data attributes should be lowercase, each word __after the data-__ separated by an underscore. The content of data attributes may follow any convention, depending on their usage. Most of the time they will be used directly in the app.js and should follow the javascript convention (camel case).
*	When using common terms as id attributes, make sure to prepend your app name to ensure unicity.

```
<div id="skeleton_container">
	<div class="skeleton-content" data-container_type="skeletonContainer"></div>
</div>
```

##### Miscellaneous

*	Double quotes are preferred for attributes in html (while single quotes are preferred in javascript).
*	Avoid inline css, use css classes and define them in the app.css file.
*	Avoid inline javascript, do the javascript implementation in the app.js file instead.
*	Use div tags for the layout, table tags should only be used for tabular data.

### CSS Conventions

All css declaration should start by a unique id or a specific enough class to avoid impacting css in other apps.
```
#skeleton_container .content { /* Good */
	border: solid 1px green;
}
.skeleton-container .content { /* Ok */
	border: solid 1px black;
}
.content { /* Bad */
	border: solid 1px red;
}
```
