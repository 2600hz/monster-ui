title: insertTemplate()

# monster.ui.insertTemplate

The `insertTemplate()` method inserts content, specified by the `target` parameter, to the end of each element in the set of matched elements.

## Syntax
```javascript
monster.ui.insertTemplate(target, args);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | jQuery object to insert at the end of each element in the set of matched elements. | `jQuery` | | `true`
`args` | | `Object`([#/args](#args)) | | `true`

#### args
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`async` | Contains the asynchronous logic. It provides a callback the should take the computed template as first argument and any number of argument after that (those arguments will be passed to `done` and `after`).  | `Function` | | `false`
`template` | The computed template to insert into `target`. | `jQuery` | | `false`
`done` | Contains the logic to be executed after `template` is inserted in the DOM but before the animation to display `target` starts. | `Function` | | `false`
`after` | Containers the logic to be executed once the animation to display `target` ends. | `Function` | | `false`
`options` | | `Object`([#/options](options)) | | `false`

#### options
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`cssClass` | Custom CSS classes for the loading view. | `String` | `app-content` | `false`
`cssId` | Custom CSS id for the loading view. | `String` | | `false`
`duration` | Duration of the animation to show `target`. | `Number` | `250` | `false`
`hasBackground` | Whether or not the loading view has a background (overridden by `cssClass`). | `Boolean` | `true` | `false`
`text` | Text displayed in the loading view. | `String` | | `false`
`title` | Title displayed in the loading view. | `String` | | `false`

## Description

The `monster.ui.insertTemplate()` method is used to perform two different operations:

* simply insert a template in the DOM with an animation
* show a loading view when asynchronous code needs to be executed before the template is inserted in the DOM

The `monster.ui.insertTemplate()` method is a handy helper that gives developers the power to have the same animations when inserting a template in the DOM, but most of all, automatically detects if a request is in progress and add a loading template if it is the case.

## Examples

### Insert a template that does not need data from requests

```javascript
function initTempate() {
  var template = $(app.getTemplate({
    name: 'myTemplate'
  }));

  // bind events, initialize widget (tooltips, datepickers...)

  return template;
}

monster.ui.insertTemplate($target, {
  template: initTemplate()
});
```

### Insert a template that need data from requests

```javascript
function initTempate(results) {
  var template = $(app.getTemplate({
    name: 'myTemplate',
    data: results
  }));

  // bind events, initialize widget (tooltips, datepickers...)

  return template;
}

monster.ui.insertTemplate($target, {
  async: function(callback) {
    monster.parallel({
      getAccount: function() {
        // retrieve account
      },
      listUsers: function() {
        // retrieve users
      }
    }, function(err, results) {
      if (err) {
        return;
      }
      callback(initTemplate());
    });
  },
  done: function() {
    // this callback will execute once the template is in the DOM
  },
  after: function() {
    // this callback will execute once the insertion animation completes
  }
});
```

