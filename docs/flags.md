### What will I learn in this documentation?
A Monster Application is a folder containing JavaScript, HTML, and CSS to represent an application in our Monster Framework. In order to get more help on how to create the application, check [here][tutorial].

This article is written to cover what's available once you're done with the tutorial; which flags and helpers are available to developers but also how they can add external files such as JS libraries or custom CSS.

### Get access to application flags from a function
Once you're in the code of your application (everything contained in the `app` object), you'll be in the scope of all the flags and helpers by using the `this` keyword. Usually we create a `self` variable at the beginning of the function that we can then use to reference the global scope everywhere inside our function.

	// Example of use of the self variable
	function() {
		var self = this;

		console.log(self.accountId); // Would Prints the Account ID of the current account in use.
	}

### Available flags & helpers
##### apiUrl

The `apiUrl` flag is most often used in conjunction with the `self.callApi` helper. It contains the API URL defined by the application document for this application. For more information about this document, check [this document][appstore].

##### appPath

This flag contains the actual path to the file on the Web Server. It can be relative or absolute, based on the configuration of the `source_url` flag in the application document.

##### authToken

The `authToken` flag contains the auth_token of the logged in session, that allow the client to use the Kazoo APIs. Every authenticated API requires the authToken to be transmitted as part of the HTTP request, so the application use it automatically for every API. Most developers should never have to use this.

##### name

This flag simply contains the internal name of the application. This, again, is mostly used internally for different purposes but developers shouldn't need to use it.

##### accountId

The `accountId` flag contains the ID of the user that is currently being used (if you're masquerading, then it contains the account ID of the account being masqueraded). This is used by almost every API request as they use the `accountId` to select which database to update. So for most API calls, you'll need to use this `accountId`.

##### userId

The `userId` flag contains the ID of the user that logged in. This is is often used when calling API updating information for the current user. For example, the My Account module can update different settings of a user, and it uses this `userId` flag to know which user to use when calling the API.

##### i18n

The `i18n` flag is actually a JavaScript object that contains all the loaded i18n Strings (to know more about i18n, check [this document][i18n]).
To get the list of i18n Strings of the language to use for the current session, you can use `self.i18n.active()` which will return the entire list of String for the active language of your application. The active language is determined by Monster automatically after log-in. Basically it checks: the user first, then the account, then the browser language. If any of this 3 has a default `language` set, it will use it, otherwise it will fall back to `en-US` automatically.

##### uiFlags

One of our latest addition, the uiFlags is also a JavaScript object that contains function to manipulate flags that you want to set for your application on the current user. For example, if you wanted to create a flag `isBetaUser` for this user, you would do : `self.uiFlags.user.set('isBetaUser', true);` and it would return the Object representing this user that you could then use to update in database via `callApi`. If you want to know if a user has a flag set up, you can use `self.uiFlags.user.get('isBetaUser')` and that would return the value attached to that user. If you wanted to set or get a flag for a different user than the one logged in, you'd need to provide the User to those helpers as another parameter (`self.uiFlags.user.get('isBetaUser', user)`).

If you want to add specific settings for users, you HAVE to use this method, otherwise it will lead to a mess with different standards in the main user document!

##### isMasqueradable

Used internally to let admins masquerade an app or not. If it's set to false, an admin wouldn't be able to see that app from another account perspective.


##### callApi

Probably the most used helper by developers! Every time you want to call a Kazoo API, you'll want to use `self.callApi`. This is automatically configured with our KazooSDK so the only things you need to provide are the `resource`, the `data` and the `success` callback for it to work.

	Example: Get information about the logged in user
	self.callApi({
		resource: 'user.get',
		data: {
			accountId: self.accountId,
			userId: self.userId
		},
		success: function(user) {
			console.log(user.data.first_name);
		}
	});

##### isActive

This new helper lets you know if your app is the one being currently in use in Monster. There's only one app that can be rendered at a certain time (except internal core apps that run simultaneously such as core, auth, myaccount...). This can be used if you want to execute some code only if your app is being displayed and bypass some code if it's not. For example you could want to display a popup when a user click on the "Close" button of "My Account", a way to do that would be to subscribe to the event "myaccount.close", and in the function check `self.isActive()` and if it's `true` then run some code.

##### shortcuts

This is an object at the top of your application where you'll reference special shortcuts to use within the application

	Example: Shortcut to render New Account in the Account Manager
	shortcuts: {
		'a': 'accountsManager.renderNewAccount'
	}

`shortcuts` is a Javascript Object. Each key of this object is a keyboard shortcut to be used to trigger the event set as the value. The value needs to be set to an event that Monster is subscribed to (for example any event set in the `subscribe` attribute of your application ([For more details on events, check this document][events])

In order for your users to see what the shortcut does, it's important to set the `shortcuts` key in the [i18n][i18n] files.

	Example: Setting title for our event
	"shortcuts": {
		"a": "Render New Account"
	}

[appstore]: appstore.md
[i18n]: internationalization.md
[tutorial]: tutorial.md
[events]: events.md
