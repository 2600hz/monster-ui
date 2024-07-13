# monster.template()

This method is used internally to load core templates and should not be used by regular apps.

## Syntax
```javascript
monster.template(thisArg, name[, data, raw, ignoreCache, ignoreSpaces]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`thisArg` | `this` of the app, used for finding the template to load. | `Object` | | `true`
`name` | Name of the template, without the file extension. | `String` | | `true`
`data` | Data to pass to the template. | `Object` | `{}` | `false`
`raw` | When set to `true`, Handlebars will not compile the template and it will be sent as is. | `Boolean` | `false` | `false`
`ignoreCache` | When set to `true`, request the template even if it was already loaded. | `Boolean` | `false` | `false`
`ignoreSpaces` | When set to `true`, carriage return, linefeed, tab, whitespace will not be trimmed from the template. | `Boolean` | `false` | `false`

## Description
The `monster.template()` method allows you to request templates simply by specifying the name of the desired template. You can also pass data to the template with the `data` parameter.

## Examples
### Load template with no data into the DOM
```javascript
function renderApp(container) {
  var template = $(monster.template(app, 'app'));

  container
    .empty
    .append(template);
}
```
### Load template with data into the DOM
```javascript
function renderApp(container) {
  var userId = app.userId;

  getUserData(userId, function(userData) {
    var dataToTemplate = {
      userId: userId,
      userData: userData
    };
    var template = $(monster.template(app, 'app', dataToTemplate));

    container
        .empty()
        .append(template);
  });
}
```
### Load a string template in a Toastr Notification or Monster Alert
```javascript
function renderUserCreate(userData) {
  requestCreateUser({
    data: {
      user: userData
    },
    success: function(data) {
      var message = monster.template(app, '!' + app.i18n.active().toastr.success.userCreate, {
        name: data.name
      });

      monster.ui.toast({
        type: 'success',
        message: message
      });
    },
    error: function(data) {
      var message = monster.template(app, '!' + app.i18n.active().alert.error.createUser, {
        type: data.type
      });

      monster.ui.alert('error', message);
    }
  });
}
```
