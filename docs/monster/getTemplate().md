title: getTemplate()

# monster.getTemplate()

## Syntax
```javascript
monster.getTemplate(args);
```

### Parameters
You can use the same getTemplate method and bypass the app property by using `this.getTemplate(args)` within the right scope in an app.

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`args` | | `Object` | | `true`
`args.app` | The context of the app, used for finding the template to load. | `Object` | `true` | `true`
`args.name` | Name of the template, without the file extension. | `String` | | `true`
`args.data` | Data to pass to the template. | `Object` | `{}` | `false`
`args.submodule` | Name of the submodule, used to find the template to load | `String` | `undefined` | `false`
`args.raw` | When set to `true`, Handlebars will not compile the template and it will be sent as is. | `Boolean` | `false` | `false`
`args.ignoreCache` | When set to `true`, request the template even if it was already loaded. | `Boolean` | `false` | `false`
`args.ignoreSpaces` | When set to `true`, request the template even if it was already loaded. | `Boolean` | `false` | `false`

### Return value
A `String` representation of the template.

## Description
The `monster.template()` method allows you to request templates simply by specifying the name of the desired template. You can also pass data to the template with the `data` parameter.

## Examples
### Load template with no data into the DOM
```javascript
function renderApp(container) {
  var template = $(monster.getTemplate({
    app: app,
    name: 'app'
  }));

  container
    .empty()
    .append(template);
}

// Do something with `renderApp`
```
### Load template with data into the DOM
```javascript
function renderApp(container) {
  getUserData(app.userId, function(userData) {
    var dataToTemplate = {
      userId: app.userId,
      userData: userData
    };
    var template = $(monster.getTemplate({
      app: app,
      name: 'app',
      data: dataToTemplate
    }));

    container
      .empty()
      .append(template);
  });
}

// Do something with `renderApp`
```
### Load a string template in a Toastr Notification or Monster Alert
```javascript
function renderUserCreate(newUserData) {
  requestCreateUser({
    data: {
      user: newUserData
    },
    success: function(data) {
      var message = monster.getTemplate({
        app: app,
        name: '!' + app.i18n.active().toastr.success.userCreate,
        data: {
          name: data.name
        }
      });

      monster.ui.toast({
        type: 'success',
        message: message
      });
    },
    error: function(data) {
      var message = monster.getTemplate({
        app: app,
        name: '!' + app.i18n.active().alert.error.userCreate,
        data: {
          type: data.type
        }
      });

      monster.ui.alert('error', message);
    }
  });
}

// Do something with `renderUserCreate`
```
