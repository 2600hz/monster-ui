# Using validation in Monster-UI

Validation in Monster-UI is done using the [jQuery Validation plugin][jquery_validation_plugin]. Their documentation is very complete, and it is strongly advised that you take look at it to have a better understanding of how it works.

In this document, we will go over the basics of validation in Monster-UI, and the different options it offers.

### How to use it

First, validation is done on html forms, so you need to make sure that all the fields that you want to validate are nested in a `<form>` tag.

Then, you need to set up validation on your form, by using the _monster.ui.validate(form, options)_ method. This will activate the validation on the provided form.  
Note: You should not call directly the _validate(options)_ method from the plugin, it will be called by the _monster.ui.validate(form, options)_ method.

```
	var formToValidate = template.find('#demoapp_form');
	monster.ui.validate(formToValidate);
```

Finally, you can use the _monster.ui.valid(form)_ to "run" the validation. This method will return _true_ if the validation succeeded, or _false_ if it failed.

```
	if(!monster.ui.valid(formToValidate)) {
		monster.ui.alert('error', 'There are errors in your form');
	} else {
		//Your code...
	}
```

In addition, the validation process will append a label element after each invalid field, with the class 'monster-invalid'. You can use this class to customize these labels within your application. If you do so, make sure to namespace it with a container id from your template so that you don't affect other apps.  
The content and position of these labels can be customized using the validate options, as detailed [below](#other-options).

### Standard validation rules

The validation plugin comes with a set of standard rules that should cover most of your validation needs. There are two ways to define them: with inline html or through the _monster.ui.validate_ method.

##### Inline rules

Some of the basic validation rules can be defined directly inside the html, using the HTML5 standards. Below are a few examples:

*	_required_: The element is required.
`<input type="text" required>`
*	_minlength_: The element requires a given minimum length.
`<input type="text" minlength="2">`
*	_maxlength_: The element requires a given maximum length.
`<input type="text" maxlength="10">`
*	_min_: The element requires a given minimum number.
`<input type="text" min=5>`
*	_max_: The element requires a given maximum number.
`<input type="text" max=15>`
*	_email_: The element should contain an email address.
`<input type="email">`

##### Through the _monster.ui.validate_ method

The _monster.ui.validate_ method has an option parameter that can contain a _rules_. This object should be a map with input names as keys and maps of rules as value.  
Let's say we want an required input that contains digits only, and an optional input that contains an URL. Here's what it would look like:
```
<form id="demoapp_form">
	<input type="text" name="digits_input">
	<input type="text" name="url_input">
</form>
```
```
monster.ui.validate(formToValidate, {
	rules: {
		digits_input: {
			required: true,
			digits: true
		},
		url_input: {
			//required is false by default, so it can be omitted
			url: true
		}
	}
});
```

For the full list of standard validation rules, see [here][validation_methods].

### Cutsom validation rules

We added the following custom rules to the set of usable validation rules:

*	_mac_: The element should contain a valid MAC address.
*	_ipv4_: The element should contain a valid IPv4 address.
*	_time12h_: The element should contain a time in 12-hour format (AM/PM).
*	_realm_: The element should contain a valid realm.
*	_greaterDate_: The element should contain a date greater than the on in the provided input.
*	_checkList_: The value of this element should not appear in the provided list (array or map).

We didn't make a simplified function to add custom rules directly within your app, but you can do it using the [_jQuery.validator.addMethod_][add_method] method.

### Other options

Several different options can be set in the _monster.ui.validate_ method, below is a quick overview of those options. See [here][validate] for the complete list.

*	The _messages_ option will allow you to customize the content of the appended error labels. This is only if you want to override the default messages.
*	The _errorPlacement_ option will allow you to choose where to append your error labels.
*	The _errorClass_ option will allow you to set a custom class for your error labels. This is not advised as it will replace the _monster-invalid_ class.

```
monster.ui.validate(formToValidate, {
	rules: {
		digits_input: {
			required: true,
			digits: true
		}
	},
	messages: {
		digits_input: {
			required: 'Required!',
			digits: 'Digits only!'
		}
	},
	errorPlacement: function(error, element) {
		error.appendTo(element.parent());
	},
	errorClass: "demoapp-invalid"
});
```

[jquery_validation_plugin]: http://jqueryvalidation.org/documentation/
[validation_methods]: http://jqueryvalidation.org/documentation/#list-of-built-in-validation-methods
[add_method]: http://jqueryvalidation.org/jQuery.validator.addMethod
[validate]: http://jqueryvalidation.org/validate