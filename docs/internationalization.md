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

Here is an example of what an i18n file would look like for a very basic app:
```
{
	"title": "Welcome to the Demo App",
	"description": "This is a demo app that does nothing, click on the button below to see a popup",
	"button": "Click here!",
	"popup": {
		"title": "Hello World",
		"content": "Really? \"Hello World\"? How original..."
	}
}
```

### Use the i18n files

_Work in progress_