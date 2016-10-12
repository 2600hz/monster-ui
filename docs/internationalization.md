# Adding i18n to your application

Every single label or message in your application that may be read by an end-user should use the i18n system. You should never type in plain English directly in your html or js files, even if you're currently releasing your app in only one language.

In this document, you will learn how to properly use the i18n system in Monster-UI. 

### Create the i18n files

##### Where to create them?

First, you need to create your i18n files.
If you used the skeleton app as a starter, you should already have an i18n folder with two i18n files in it (English and French).
If not, you need to create this __i18n__ folder at the root of your application, and then add a new file in it with the name __en-US.json__. `apps/demoapp/i18n/en-US.json`

The French file is only provided as an example and may be discarded. The en-US.json file is however mandatory, "en-US" being the fallback language by default. This means that if the system can't find a specific key in a language file, or can't find the language file itself, it will automatically fallback to "en-US".

You can then add a new file for any language you want by using the same name format __xx-YY.json__ where __xx__ is the language code ([ISO 639-1](ISO 639-1)) and __YY__ is the country code ([ISO 3166](ISO 3166)).

##### What to put in them?

This is where you will put your actual labels, messages and others by using a simple key/value mapping in JSON.
The keys will be used in your javascript files or html templates in order to retrieve the attached values, the values being your actual text. 
Thanks to the JSON format, you can also bind an array or an object to a key, instead of a simple string, which will allow you to better organize your i18n file.

You can also add variables inside your strings by using two pairs of curly brackets: _{{myVariable}}_.

Here is an example of what an i18n file would look like for a very basic app:
```
{
	"title": "Hello {{variable}}! Welcome to the Demo App.",
	"description": "This is a demo app that does nothing, click on the button below to see a popup",
	"button": "Click here!",
	"popup": {
		"title": "Random Number Generator",
		"content": "We've generated the random number {{number}} for you."
	}
}
```

### Use the i18n files

##### In javascript files

At the top of your app.js file, you should declare the list of languages supported for your app. Again, if you started from the skeleton app, this should already be done.
```
var app = {
	name: 'demoapp',
	i18n: {
		'en-US': { customCss: false },
		'fr-FR': { customCss: false }
	},
	/* ... */
}
```

The language file for your selected language will then automatically be merged into the app during the app initialization. To access it, simply call the _i18n.active()_ function, this will return you the i18n file as a JSON object. The selected language is a setting on the account or user. If the user isn't logged in, it will take the browser language of what's defined in the config.js if set.

If you defined a variable, you will need to use the _monster.template()_ function to replace it by the value of your choice.  
The first argument for this function should be the app itself, by convention defined in a variable _self_ (see [Coding Standards][coding_standards_misc]).
The second argument should be your i18n string, prepended with a "!".  
The last argument should be an object containing your variables and their values. Obviously, the keys from this object must match the variables defined in your i18n string.

```
{
	/* ... */
	bindEvents: function(template) {
		var self = this;

		template.find('#demoapp_button').on('click', function(e) {
			var randomNumber = Math.floor(Math.random() * 100),
				popupContent = '<p>' + monster.template(self, '!' + self.i18n.active().popup.content, { number: randomNumber }) + '</p>'

			monster.ui.dialog(popupContent, {
				title: self.i18n.active().popup.title
			});
		});
	},
	/* ... */
}
```

##### Customize the CSS based on the language

Sometimes, a text that is really short in English will be super-long in French and it might look better if we tweaked the CSS a little bit for the French i18n. In order to do that, 3 steps:

	- we need to set the `customCss` key to true in the i18n map at the beginning of the app
		```json
		i18n: {
			'en-US': { customCss: false },
			'fr-FR': { customCss: true }
		}
		```
	- check if the cssI18n folder exists in apps/%appName%/style. If it doesn't create it.
	- Finally create a fr-FR.css file in this folder, and add your customizations in this file

This way the changes will only be loaded for the customers using the French version. If you're using the English version, it won't even load the file.

##### In html templates

When invoking a template with the _monster.template_ function, you always provide your app as a parameter, which then automatically passes down your i18n object to the template itself. You can then access it as any other parameters sent to the template, through the _i18n_ variable.

If you defined a variable, you need to user the handlebar helper _replaceVar_ to replace it with the value of your choice.  
___Note:___ for this to work, your variable __must__ be called __{{variable}}__, and there should not be more than one variable in your string. If you want to use more variables or variables with custom names, you should handle it on the javascript side and pass down your fully formated string to the template.

`monster.template(self, 'layout', { username: 'Al Cohol' });`
```
<div id="demoapp_container">
	<div class="demoapp-content">
		<h1>{{replaceVar i18n.title username}}</h1>
		<p>{{ i18n.description }}</p>
		<button id="demoapp_button" type="button">{{i18n.button}}</button>
	</div>
</div>
```

### How to change your language

The language is defined at both the Account and User level. By default, the user uses its Account language, which may only be changed by an account administrator. Each user can however change their own language in their user settings, by clicking on their name on the top-right corner of the page (when logged in Monster-UI), and then clicking on the "Timezone & Language" section under "User Settings".

![Timezone and Language settings](http://i.imgur.com/EkpuMDg.png)

If the language is not defined in neither the Account nor the User, the browser language will be used.

[coding_standards_misc]: codingStandards.md#miscellaneous