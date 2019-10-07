title: getTemplate()

# appContext.getTemplate()

## Syntax
```javascript
appContext.getTemplate(params);
```

### Parameters
`params` is a mandatory `Object` parameter with the following properties:

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`name` | Name of the template, without the extension. | `String` | | `true`
`data` | Data to pass to the template. | `Object` | `{}` | `false`
`submodule` | Module identifier, used to determine the location of the template load.  | `String` | `main`  | `false`
`raw` | Whether or not to return the template as-is, without it being compiled by Handlebars. | `Boolean` | `false` | `false`
`ignoreCache` | Whether or not to force request the template even if already cached. | `Boolean` | `false` | `false`
`ignoreSpaces` | Whether or not to trim carriage return, linefeed, tab and whitespace from the template. | `Boolean` | `false` | `false`

### Return value
A `String` representation of the template.

## Description

## Examples

### Load template with data
```javascript
var userData = {
  firstName: 'Clark',
  lastName: 'Kent'
};
var $template = $(app.getTemplate({
  name: 'my-template-layout',
  data: userData
}));

container
  .empty()
  .append($template);
```

### Load submodule template
```javascript
var $template = $(app.getTemplate({
  name: 'mySubmodule-template',
  submodule: 'mySubmodule'
}));

container
  .empty()
  .append($template);
```

### Load string template for toast notification or alert dialog
```javascript
requestCreateUser({
  data: {
    user: newUserData
  },
  success: function(user) {
    var message = app.getTemplate({
      name: '!' + app.i18n.active().myApp.messages.userCreate.success,
      data: {
        name: user.name
      }
    });

    monster.ui.toast({
      type: 'success',
      message: message
    });
  },
  error: function(error) {
    var message = app.getTemplate({
      name: '!' + app.i18n.active().myApp.messages.userCreate.error,
      data: {
        type: error.type
      }
    });

    monster.ui.alert('error', message);
  }
});
```
Notice string template results are not wrapped in jQuery objects.
