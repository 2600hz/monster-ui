# 2600hz Webapps Coding Standards

*In this document, we will go over all the code conventions used in Monster UI. Although they are by no means mandatory, we strongly advise to follow this conventions for readability and maintainability purposes.*


## Table of Contents

- [General Conventions](#general-conventions)
	+ [Indentation](#indentation)
	+ [Encoding](#encoding)
	+ [Line Ending](#line-ending)
- [JavaScript Conventions](#javascript-conventions)
- [JSON Conventions](#json-conventions)
- [HTML Conventions](#html-conventions)
	+ [Naming](#naming)
	+ [Miscellaneous](#miscellaneous)
- [CSS Conventions](#css-conventions)


## General Conventions

General conventions are used throughout Monster UI, regardless of the type of file.

##### Indentation

- Use hard tabs set to 4 spaces.

```javascript
// bad
function() {
∙∙var name;
}

// bad
function() {
∙∙∙∙var name;
}

// good
function() {
————var name;
}
```

##### Encoding

- Use UTF-8 as the default character encoding. This is especially important for internationalization files.

##### Line Ending

- Set your text editor/IDE to use Windows Line Endings (CRLF).
- End files with a single newline character.

```javascript
// bad
(function(global) {
	// ...stuff...
})(this);
```

```javascript
// good
(function(global) {
	// ...stuff...
})(this);
↵
```

**[▲ back to top](#table-of-contents)**


## JavaScript Conventions

See the dedicated [2600hz JavaScript Style Guide][javascript-style-guide].

**[▲ back to top](#table-of-contents)**


## JSON Conventions

JSON (JavaScript Object Notation) files are used for internationalization in Monster UI.

- Use camelCase writing style.
- Use double quotes `""`.
- Despite booleans and numbers being valid as JSON values, only strings, objects and arrays should be used in internationalization files.

```json
{
	"apploader": {
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

**[▲ back to top](#table-of-contents)**


## HTML Conventions

##### Naming

- HTML tags and attributes should be lowercased.
- Classes attributes should be lowercased, each word separated by a dash.
- Ids attributes should be lowercased, each word separated by an underscore.

```html
<!-- bad -->
<DIV ID="apploader-container">
	<UL CLASS="menuContainer">
		<LI CLASS="menuElement">Home</LI>
	</UL>
</DIV>

<!-- good -->
<div id="apploader_container">
	<ul class="menu-container">
		<li class="menu-element">Home</li>
	</ul>
</div>
```

- Data attributes should be lowercased, each word __after__ the `data-` separated by an underscore.
- The content of data attributes may follow any convention, depending on their usage. Most of the time they will be used directly in the `app.js` and should follow the JavaScript convention (camelCase).
- When using common terms as id attributes, make sure to prepend your application's name to ensure unity.

```html
<!-- bad -->
<div id="container">
	<div class="content" data-container-type="apploader-container">
		<!-- ...stuff... -->
	</div>
</div>

<!-- good -->
<div id="apploader_container">
	<div class="apploader-content" data-container_type="apploaderContainer">
		<!-- ...stuff... -->
	</div>
</div>
```

##### Miscellaneous

- Double quotes are preferred for attributes in HTML.
- Avoid inline CSS, use CSS classes and define them in the `app.css` file.
- Avoid inline JavaScript, do the JavaScript implementation in the `app.js` file instead.
- Use `div` tags for the layout, `table` tags should only be used for tabular data.

**[▲ back to top](#table-of-contents)**


## CSS Conventions

- Your CSS should be fully compatible with at least Chrome and Firefox, and preferably with the recent versions of Internet Explorer too.
- CSS rules declarations should start by a unique id or a class specific enough to avoid impacting CSS in other applications.

```css
/* bad */
.content { 
	border: solid 1px red;
}

/* good */
.apploader-container .content {
	border: solid 1px black;
}

/* good */
#apploader_container .content {
	border: solid 1px green;
}
```

**[▲ back to top](#table-of-contents)**

[javascript-style-guide]: javascriptStyleGuide.md
