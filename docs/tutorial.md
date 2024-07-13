# Tutorial: Create your own Monster UI app
The goal of this tutorial is to help any developer who wants to build a Web application for the Monster UI framework.
At the end of this tutorial, you will have a functional Monster UI app accessible from your local version of Monster UI via the App Exchange.
The app we are going to build will be a simple phone number lookup, with ability to search phone numbers by area codes.

Required:

* A local copy of the Monster UI framework (you can clone from [here][monster_repo])
* A Kazoo install running with credentials for an account
* Access to CouchDB to provision the database with your application metadata

## Folder creation
First of all, you need to pick a unique name for your app. This is important because the framework will use this name to identify and load your app. In this example, we decided to name our app `demo`.
The next step it to copy the skeleton folder (this folder is always provided when cloning Monster UI) and name your new folder with the app name you picked earlier.

==/monster-ui/src/apps==
```shell
cp -R skeleton/ demo/
```

Now that we have our app folder created, we can start the fun part!

## App logic
All the JavaScript code for you app needs to be inside your app folder, in the `app.js` file. The file from the skeleton should already be there, so you can just dive into it while we explain all the different parts.

First, we need define the app following the AMD specification:

==/monster-ui/src/apps/demo/app.js===
```javascript
define(function(require) {
  /* You app logic */
});
```

The first lines inside this block are reserved for requiring the different libraries needed by your app (and build the dependency tree). `require` will always load them before executing the code of your app, so you do not have any asynchronous loading issues. A library will only be loaded once, with the first `require` call. Every subsequent call for this library will reuse the result of the initial call.

==/monster-ui/src/apps/demo/app.js===
```javascript
var monster = require('monster'),
  $ = require('jquery'),
  _ = require('lodash');
```

`monster`, `_` and `$` should already be loaded most of the time but this will allow you to access the variable.

Once the list of dependencies is declared, we create our `app` object that will contain the main logic of your app, as well as some properties and methods necessary for the framework to load it properly.

==/monster-ui/src/apps/demo/app.js===
```javascript
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

  load: function(callback) {
    var self = this;

    self.initAuth(function() {
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

  render: function(container) {
    /* Function executed once the app is initialized */
  }
};
```

Let's describe the purpose of each of those properties/methods!

### `name`
This string was used to identify your app but is not required anymore as the framework will check the name of your app folder directly.

### `i18n`
This object represents the languages supported by your app (you can learn more about internationalization [here][i18n]). Properties should follow the language localization tag format (e.g. `en-US` for American English, `fr-CA` for French Canadian...). The only option for each language is `customCss`, which allows you to define a language specific style sheet that will automatically be loaded by the framework when users switch their default language (the language specific style sheet file name should match the language tag).

==/monster-ui/src/apps/demo/app.js===
```javascript
  i18n: {
    'en-US': { customCss: false },
    'fr-FR': { customCss: true }
  }
```

!!! note
    The `en-US` key is mandatory as we require all Monster UI apps to be available in American English.

### `requests`
This object allows you to define external APIs to be consumed by your app. For example, if you need a way to call Google Geolocation APIs, you would define the endpoint here:

==/monster-ui/src/apps/demo/app.js===
```javascript
  requests: {
    'google.geocode.address': {
      apiRoot: '//maps.googleapis.com/',
      url: 'maps/api/geocode/json?address={zipCode}',
      verb: 'GET',
      removeHeaders: [
          'X-Kazoo-Cluster-ID',
          'X-Auth-Token',
          'Content-Type'
      ]
    }
  }
```

If you need to call Kazoo APIs or if you want to learn more on how to use the jQuery Kazoo SDK, head over [here][api].

### `subscribe`
This object represent a map of events that your app can expose to the framework and other apps, it allows other Monster UI apps to interact with your app. Usually, it will be empty as apps logic is self contained.

Adding an event is really simple, for example let's say we have a request handler returning a Kazoo user document:

```javascript
  getUserRequest: function(args) { /* retrieve user document */ }
```

Exposing this method would as simple as:

```javascript
  subscribe: {
    'demo.getUser': 'getUserRequest'
  }
```

Now you only need to publish that event from another app, like so:

```javascript
monster.pub('demo.getUser', { id: '<userId>', callback: function() {} });
```

!!! note
    As of now, this functionality is limited as those events will only be register once the subscribing app is loaded by framework.

### `initApp`, `load` & `render`
Those two methods are required by the Monster UI framework to load you app and render it properly. If they are missing, an error will be thrown.
The `initApp` and `load` methods can be copy-pasted without any changes.
The `initApp` method initializes your app and sets some propeties on your app object, such as the current account ID, user ID or API URL to use.
The `load` method allows you to execute code before the `render` method is called if you need to (but usually, this should not be needed).

Once your app is loaded by the framework, it will automatically call the `render` method of your application and render your app. You can then add your own methods to the app object and start adding custom logic to your app!

## Adding your app to the app store
This is more complicated than it should be for now, but you can find how to add your app to the database [here][appstore].

Once you added your app to the app store, and can see and load it on Monster UI, it is time to finish the example and change this app so it actually does something useful!

### Finishing the example by adding some code!
Now that we covered the most important parts, we are going to build this app to allow a user to search for phone numbers by area code!
In order to do so, we'll add this code:

==/monster-ui/src/apps/demo/app.js===
```javascript
  // Entry Point of the app
  render: function(container) {
    var self = this,
      $container = _.isEmpty(container) ? $('#monster_content') : container,
      $layout = $(self.getTemplate({
        name: 'layout'
      }));

    self.bindEvents({
      template: $layout
    });

    $container
      .empty()
      .append($layout);
  },

  bindEvents: function(args) {
    var self = this,
      $template = args.template;

    $template.find('#search').on('click', function(e) {
      self.searchNumbers(415, 30, function(listNumbers) {
        var $results = $(self.getTemplate({
          name: 'results',
          data: {
            numbers: listNumbers
          }
        }));

        $template
          .find('.results')
          .empty()
          .append($results);
      });
    });
  },

  searchNumbers: function(pattern, size, callback) {
    var self = this;

    self.callApi({
      resource: 'numbers.search',
      data: {
        accountId: self.accountId,
        pattern: pattern,
        limit: size,
        offset: 5
      },
      success: function(data) {
        callback(data.data);
      },
      error: function(parsedError) {
        callback([]);
      }
    });
  }
```

Let's explain what this code does quickly. First of all the `render` function: it gets the HTML template called layout.html, and adds it to the main div. It then binds some events. Once those events are bound, it clears the current view and show the view. The `app#getTemplate` method is provided with a `name` named parameter that corresponds to a file located in the `views` folder of the app.

!!! note
    It is very important that the template name matches the name of the file (without the extension), otherwise, it won't load the template!

The `bindEvents` method defines one event, a click on the Search Button. Once you click on it, it calls a function that will look for 15 numbers starting with 650, and once the API responds with 15 numbers, it adds them to a template, and display it in the `.results-wrapper` div.

The `searchNumbers` method is our function that will call the `phone_numbers?prefix={pattern}&quantity={limit}` endpoint.

Now that all your logic code is done, you will need to add the following HTML templates used by the `render` and the `bindEvents` methods:

==/monster-ui/src/apps/demo/views/layout.html===
```handlebars
<div id="demo_wrapper">
  <div class="hero-unit well">
    <h1>{{ i18n.demo.welcome }}</h1>
    <p>{{ i18n.demo.description }}</p>
    <button id="search" class="btn btn-primary">{{i18n.demo.searchNumbers}}</button>

    <div class="results"></div>
  </div>
</div>
```

==/monster-ui/src/apps/demo/views/results.html===
```handlebars
  <div class="results-wrapper">
    <ul>
    {{#each numbers}}
      <li>{{this.number}}</li>
    {{else}}
      <!-- In a loop, you need to use '@root' to come back to the global scope and use the i18n variable -->
      <li>{{ @root.i18n.skeleton.noNumber }}</li>
    {{/each}}
    </ul>
  </div>
```

You can see that templates do not use hardcoded string, but rather i18n references. It allows your application to be internationalizable in a very simple way. The only thing to enable this is to add `en-US.json` that should contain the different strings used by your templates:

en-US.json
==/monster-ui/src/apps/demo/i18n/en-US.html===
```json
{
  "demoApp": {
    "description": "Feel free to update the HTML template located in /demo/views/layout.html. The Javascript to manager this app is located in /demo/app.js.",
    "noNumber": "No number matching your search, but you should probably do something about the css... (hint: it belongs in /apps/demo/app.css!)",
    "searchNumbers": "Search San Francisco Numbers",
    "welcome": "Welcome in the Demo App"
  }
}
```

It's important to namespace this file by adding all your i18n keys inside an object named after your app (`demoApp` in this case), in order to avoid collisions with the global i18n.

The very last thing to add for this demo is the CSS. It will be super simple here, but you can obviously tweak it as much as you want. It needs to be inside `app.css`:

==/monster-ui/src/apps/demo/style/app.css===
```css
#demo_wrapper .results {
  background: red;
}
```

### DING DING DING
That's it, your app is done! You can go in the app store in Monster UI, select your app and add it to your account, and then start looking for numbers. You could also tweak this app to get familiar with Monster UI, a good first thing to do would be to ask for an area code instead of always looking for 650 numbers. Have fun with it, and please let us know if you have any recommendations on how we could make this tutorial better!

[monster_repo]: https://github.com/2600hz/monster-ui/
[i18n]: internationalization.md
[api]: api.md
[appstore]: appstore.md#manual-way-by-adding-a-document-to-the-database
