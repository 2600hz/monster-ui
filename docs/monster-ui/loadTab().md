# monster.ui.loadTab()
The `monster.ui.loadTab()` method programmatically loads the `navbar` tab corresponding to the tab ID passed as argument.

## Syntax
```javascript
monster.ui.loadTab(thisArg, id);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`thisArg` | Context of the app invoking the helper. | `Object` | | `true`
`id` | Unique ID referencing a navbar tab of the app. | `String` | | `true`

## Description
This helper is used to virtually trigger a click on a navbar tab so that the callback related to that tab is called. It is powerful in a sense that all the navbar animations are performed accordingly and also take into account if that tab has a `onClick` bypass callback.

The utility of this helper can be found when a user performs an action that need to load content located in another tab.

## Examples
### Load the content of another tab
```javascript
function render() {
  monster.ui.generateLayout(app, {
    menus: [{
      tabs: [{
        id: 'devices',
        title: 'List Devices',
        callback: renderListDevices
      }, {
        id: 'users',
        title: 'List Users',
        callback: renderListUsers
      }]
    }]
  });
}

function renderListDevices() {
  monster.ui.loadTab(app, 'users');
}

function renderListUsers() {
  monster.ui.loadTab(app, 'devices');
}
```
Specify an `id` when declaring the tabs in `render()` function. This example is just an easy way to show how the helper works and does not have a real purpose.
