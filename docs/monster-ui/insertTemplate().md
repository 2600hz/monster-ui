# monster.ui.insertTemplate()

## Syntax
```javascript
monster.ui.insertTemplate(target, template[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | Insert the template at the end of the target element | `jQuery` | | `true`
`template` | Either a jQuery object representing a template or a function providing a callback that will receive the template to insert in the target. | `jQuery`|`Function` | | `true`
`options` | List of options to customize the loading view. | `Object`([#/options](#options)) | | `false`

#### options
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`title` | Title displayed in the loading view. | `String` | | `false`
`text` | Text displayed in the loading view. | `String` | | `false`
`duration` | Duration of the fadeIn animation for the inserted template. | `Number` | `250` | `false`
`cssClass` | Custom CSS classes for the loading view. | `String` | `app-content` | `false`
`cssId` | Custom CSS id for the loading view. | `String` | | `false`
`hasBackground` | Show the loading spinner/text/title without any background if set to `false` (overridden by `cssClass`). | `Boolean` | `true` | `false`

## Description

The `monster.ui.insertTemplate()` method is a handy helper giving you the power to have the same animations when inserting a template in the DOM.

When `template` is a function, a loading template will be rendered until the callback is invoked.

## Examples
### Insert a template that does not need data from requests:
```javascript
function initTempate() {
  var template = $(app.getTemplate({
    name: 'myTemplate'
  }));

  // bind events, initialize widget (tooltips, datepickers...)

  return template;
}

monster.ui.insertTemplate($target, initTemplate());
```
### Insert a template that need data from requests:
```javascript
function initTempate(results) {
  var template = $(app.getTemplate({
    name: 'myTemplate',
    data: results
  }));

  // bind events, initialize widget (tooltips, datepickers...)

  return template;
}

monster.ui.insertTemplate($target, function(callback) {
  monster.parallel({
    listUsers: function() {
      // retrieve users
    },
    getAccount: function() {
      // retrieve account
    }
  }, function(err, results) {
    //feed the data to your template and insert it
    callback(initTemplate(results), function() {
      // this callback will executed once the template is in the DOM
    }, function() {
      // this callback will executed once the insertion animation is done
    })
  });
});
```
