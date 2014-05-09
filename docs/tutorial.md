# Tutorial: Create your own Monster-UI app
The goal of this tutorial is to help any developer who wants to build an application for the Monster-UI.
The only thing requried is to pull the Monster-UI repo at https://github.com/2600hz/monster_ui.

### Creating the folder
First of all, you need to give a name for your app, it's important because we'll use this name for the directory names and for different variables inside the code.
In this example we'll name our application 'demo'. The next thing to do, is to copy and paste the skeleton folder (monster-ui/apps/skeleton) under the apps folder, and name it "demo". Once this is done, we'll need to dive into the code and add few things to the js file.

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

        i18n: [ 'en-US' ],

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
