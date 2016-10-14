# Tutorial: Create your own Monster-UI app
The goal of this tutorial is to help any developer who wants to build an application for the Monster-UI.
At the end of this tutorial, you will have a Monster-UI app created, that you will be able to add to your UI via the app store, and that will allow you to search for phone numbers in a specific area code.

Required:
* A copy of the Monster-UI repo, that you can get [here][monster_repo]
* A Kazoo account and credentials to login to it
* Access to CouchDB to add your application to the app store

### Creating the folder
First of all, you need to give a name for your app, it's important because we'll use this name for the directory names and for different variables inside the code.
In this example we'll name our application 'demo'. The next thing to do, is to copy the skeleton folder (%MAIN_DIR%/monster-ui/apps/skeleton) and in this demo we'll copy it under %MAIN_DIR%/monster-modules/, and name it "demo". Once this is done, we'll need to dive into the code and add few things to the js file.

### JavaScript
All the JavaScript code for your app needs to be inside your app folder, in the app.js file (/apps/demo/app.js). The file from the skeleton should already be there, so you can just edit this one, and we'll try to explain all the different parts of this file.

First we need to "define" the app for require js:

	define(function(require){
		/* App code in JavaScript */
	});

The first lines inside this code block are usually reserved to require the different libraries needed by your applications. This is the list of dependencies of your application. Require will always load them before executing the code of your application, so you won't have any asynchronous loading issues for the required libraries. A library will only be loaded with the first require call. Every other require call for this library will re-use the result of the first require call.

Example:

	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

jQuery, _, monster and toastr should already be loaded most of the time, but this will allow you to access those variables.

Once the list of dependencies has been created, we create an "app" object, that will contain all the JS functions of your app, and also some attributes needed by monster.

	var app = {
		name: 'demo',

		i18n: {
			'en-US': { customCss: false }
		},

		requests: {
			/* List of APIs */
		},

		subscribe: {
			/* List of events */
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(container){
			/* Function executer once the app initialized properly */
		}
	};

This object contains all the required attributes for a Monster-UI app to work. Let's explain each one of them:

##### Name
The is is a string with the name of your app. It needs to match the name of the folder of this app.

##### i18n
This is a map representing the supported languages. You can learn more about i18n [here][i18n]. The formatting is always a combination of the language and the country, like "en-US", "fr-FR". Note that the "en-US" key is mandatory, since we require all the Monster-UI apps to be available in English. The only option for each language key is the `customCss` one, which allows the framework to automatically import CSSi18n files if the user's language has this option enabled. 

		```json
		i18n: {
			'en-US': { customCss: false },
			'fr-FR': { customCss: false }
		}
		```

##### Requests
This is a map representing all the external API calls you need in your application. For example, if your need a way to call a Google API and still use the monster wrapper, you'd define the API here, by setting it like this:

	requests: {
		'google.getUser': {
			apiRoot: 'http://api.google.com/'
			url: 'users',
			verb: 'PUT'
		}
	}

If you need to call a Kazoo API or if you want to learn more about using the Kazoo APIs [here][api].

##### Subscribe
This is a map representing the events that your app will listen to. It allows other Monster-UI apps to interact with your applications if you want to enable that. Most of the time, this should remain empty, since your app will not need to interact with any other Monster-UI apps.

Adding an event is really simple, for example let's say I have a function that gives me the information of a user: 

`getUser: function(args) { ... }`

If your app was named `demo`, you would add this to your subscribe map:

subscribe: {
	'demo.getUser': 'getUser'
}

Now you only need to call `monster.pub('demo.getUser', { id: 'xxx', callback: function() {} })` in any other application, and that would execute your getUser function.

##### Required methods
In the code representing the `app` object, you can notice 3 methods: `initApp`, `load`, and `render`. Those 3 functions are needed by the Monster-UI framework to load your application and render it properly. The initApp and load methods can be copy and pasted without any changes. The `initApp` method initializes your app, and set some attributes for your app object, such as the current accountId, userId or the apiUrl to use. The `load` method allows you to do things before the render method if you need to, most of the times you should not have to modify it.

Once your app is loaded by the framework, it will automatically call the `render` method of your application. And that's it. You can then add your own functions to the app object, and start adding some logic to your application!

### Adding your app to the app store
This is more complicated than it should be for now, but you can find how to add your app to the database [here][appstore].

Very important, in this example we added your demo folder to a %MAIN_DIR%/monster-modules folder. You need to have this path in the source_url key of your app document, to point to %MAIN_DIR%/monster-modules/demo/.

Once you added your app to the app store, and can see it in the Monster-UI, it's time to finish the example and change this app so it actually does something useful!

### Finishing the example by adding some code!
Now that we covered the most important parts, we'll build this app to allow a user to search for phone numbers with an area code!
In order to do so, we'll add this code:

	 render: function(container){
		var self = this,
			demoTemplate = $(monster.template(self, 'layout')),
			parent = _.isEmpty(container) ? $('#monster-content') : container;

		self.bindEvents(demoTemplate);

		(parent)
			.empty()
			.append(demoTemplate);
	},

	bindEvents: function(template) {
		var self = this;

		template.find('#search').on('click', function(e) {
			self.searchNumbers(415, 15, function(listNumbers) {
				var results = monster.template(self, 'results', listNumbers);

				template
					.find('.results')
					.empty()
					.append(results);
			});
		});
	},

	searchNumbers: function(pattern, size, callback) {
		var self = this;

		monster.request({
			resource: 'demo.listNumbers',
			data: {
				pattern: pattern,
				size: size
			},
			success: function(listNumbers) {
				callback && callback(listNumbers.data);
			}
		});
	}

Let's explain what this code does quickly. First of all the `render` function: it gets the HTML template called layout.html, and add it to the main div. It then bind some events. Once those events are bound, it clears the current view and show the view. The monster.template method has a string as its second argument, this string is a name of a file located in the `views` folder of the application, it's very important that it matches the name of the file (without the extension), otherwise, it won't load anything!

The `bindEvents` method defines one event, a click on the Search Button. Once you click on it, it calls a function that will look for 15 numbers starting by 415, and once the API responds with 15 numbers, it adds them to a template, and display it in the `.results` div.

The `searchNumbers` function is our function that will call the `phone_numbers?prefix={pattern}&quantity={size}` API. You will need to add the `demo.listNumbers` resource to the requests map at the top of the file so that it looks like

	requests: {
		'demo.listNumbers': {
			url: 'phone_numbers?prefix={pattern}&quantity={size}',
			verb: 'GET'
		}
	}

Now that all your JavaScript code is done, you will need to add those HTML templates you used in the render and the bindEvents functions.
You need to add the templates in the /demo/views folder.

layout.html

	<div id="demo_wrapper">
		<div class="hero-unit well">
			<h1>{{ i18n.demo.welcome }}</h1>
			<p>{{ i18n.demo.description }}</p>
			<button id="search" class="btn btn-primary">{{i18n.demo.searchNumbers}}</button>

			<div class="results"></div>
		</div>
	</div>

results.html

	<div class="results-wrapper">
		{{#each numbers}}
			<span>{{this}}</span>
		{{else}}
			<!-- In a loop, you need to use '@root' to come back to the global scope and use the i18n variable -->
			<span>{{ @root.i18n.demo.noNumber }}</span>
		{{/each}}
	</div>

You can see that those templates don't use hardcoded labels, but use i18n variables. It allows your application to be internationalizable in a very simple way. The only thing to do is to add a en-US.json file in the /demo/i18n folder. It should contain the different labels you used in your templates:

en-US.json

	{
		"demo": {
			"description": "Feel free to update the HTML template located in /demo/views/layout.html. The Javascript to manager this app is located in /demo/app.js.",
			"noNumber": "No number matching your search, but you should probably do something about the css... (hint: it belongs in /apps/demo/app.css!)",
			"searchNumbers": "Search San Francisco Numbers",
			"welcome": "Welcome in the Skeleton App"
		}
	}

It's important to namespace this file by adding all your i18n keys inside an object named after your app, in order to avoid collisions with the global i18n.

The very last thing to add for this demo is the CSS. It will be super simple here, but you can obviously tweak it as much as you want. It needs to be inside an app.css file at the root level of thei /demo folder.

app.css

	#demo_wrapper .results {
		background: red;
	}

### DING DING DING
That's it, your app is done! You can go in the app store of the Monster-UI, select your app and add it to your account, and then start looking for numbers. You could also tweak this app to get familiar with Monster-UI, a good first thing to do would be to ask for an area code instead of always looking for 415 numbers. Have fun with it, and please let us know if you have any recommandations on how we could make this tutorial better!

[monster_repo]: https://github.com/2600hz/monster-ui/
[i18n]: internationalization.md
[api]: api.md
[appstore]: appstore.md