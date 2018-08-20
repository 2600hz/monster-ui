title: generateAppLayout()

# [monster][monster].[ui][ui].generateAppLayout()

![](images/generateAppLayout-preview.png)

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Customization](#customization)
* [Examples](#examples)

### Syntax
```javascript
monster.ui.generateAppLayout(thisArg, args);
```

### Parameters

###### `thisArgs`: [Object][object_literal] (mandatory)

The context of the app invoking the helper.

###### `args`: [Object][object_literal] (mandatory)

Customize application type and menus settings with the following object properties:

* `appType`: `default`|`fullscreen`|`docked` [String][string_literal] (optional, default: `default`) - define wrapper behavior
* `forceNavbar`: [Boolean][boolean_literal] (optional, default: `false`) - render navbar even when only one tab exists
* `menus`: [Array][array_literal] (mandatory) of [Objects][object_literal]
    - `pull`: `left`|`right` [String][string_literal] (optional, default: `left`) - floating direction
    - `tabs`: [Array][array_literal] (mandatory) of [Objects][object_literal]
        + `text`: [String][string_literal] (mandatory if more than on item in `tabs`) - tab menu label
        + `callback`: [Function][function] (mandatory if no `menus` property) - callback on click
        + `onClick`: [Function][function] (optional) - execute before `callback`
        + `menus`: [Array][array_literal] (optional) of [Objects][object_literal] - same structure as parent `menus`
        + `layout`: `fullscreen`|`docked` [String][string_literal] (optional) - define layout type for this tab

### Description

The `monster.ui.generateAppLayout()` method generates a consistent markup to wrap the content of your Monster app. It also generates the navbar menu of the app and handles tab clicks and animations. The goal of this method is to empower developers by giving them the basics (app navbar, tabs handling) so they can just an start coding the core of their app.

The markup generated will looks like this:

```html
<div id="{appName}_app_container" class="app-layout">
    <div class="app-header">
        <div class="app-navbar-bg">
            <div class="app-navbar-wrapper">
                <nav class="app-navbar monster-navbar">
                    /* app navbar */
                </nav>
            </div>
        </div>
        <div class="app-subnav-bg">
            <div class="app-subnav-wrapper">
                <nav class="app-subnav monster-navbar">
                    /* app subnav */
                </nav>
            </div>
        </div>
    </div>
    <div class="app-content-wrapper">
        /* app content */
    </div>
</div>
```

The `monster-navbar` contains the navbar and subnav of the application, depending on the options passed to the method.

### Customization

#### appType

An app can have three different types: `default`, `fullscreen` and `docked`. Those types will only impact the markup and styling of the generated layout.

##### `default`
Maximum width of 1280px with 20px of on each sides to keep it from hitting the sides on smaller screens.

![](images/generateAppLayout-content-default.png)

##### `fullscreen`
Takes the full width of the window minus the 20px of padding on each side.

![](images/generateAppLayout-content-fullscreen.png)

##### `docked`
No margin or padding around the wrapper, the content will be right next to the topbar and take full size of the window.

![](images/generateAppLayout-content-docked.png)

### Examples

* [Generate layout with `navbar` and menus](#generate-layout-with-navbar-and-menus)
* [Generate layout with `navbar` and sub-menus](#generate-layout-with-navbar-and-sub-menus)
* [Generate layout with `navbar` and menus pulled right](#generate-layout-with-navbar-and-menus-pulled-right)
* [Generate layout without `navbar`](#generate-layout-without-navbar)

##### Generate layout with `navbar` and menus

![Layout with navbar and multiple menus](images/generateAppLayout-navbar-menus.png)

```javascript
monster.ui.generateAppLayout(this, {
    menus: [
        {
            tabs: [
                {
                    text: 'Home',
                    callback: function() {}
                },
                {
                    text: 'List',
                    callback: function() {}
                }
            ]
        },
        {
            tabs: [
                {
                    text: 'Settings',
                    callback: function() {}
                }
            ]
        },
        {
            tabs: [
                {
                    text: 'Q&A',
                    callback: function() {}
                },
                {
                    text: 'Support',
                    callback: function() {}
                }
            ]
        }
    ]
});
```

The concept of multiple menus is simply used to group tabs together with a separator between them.

##### Generate layout with `navbar` and sub-menus

![Layout with navbar and sub-menus](images/generateAppLayout-navbar-menus-sub.png)

```javascript
monster.ui.generateAppLayout(this, {
    menus: [
        {
            tabs: [
                {
                    text: 'Settings',
                    menus: [
                        {
                            tabs: [
                                {
                                    text: 'Profile',
                                    callback: function() {}
                                },
                                {
                                    text: 'Account',
                                    callback: function() {}
                                },
                                {
                                    text: 'Emails',
                                    callback: function() {}
                                }
                            ]
                        },
                        {
                            tabs: [
                                {
                                    text: 'Billing',
                                    callback: function() {}
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            tabs: [
                {
                    text: 'Q&A',
                    callback: function() {}
                },
                {
                    text: 'Support',
                    callback: function() {}
                }
            ]
        }
    ]
});
```

When a menu has sub-menus, the callback of the first sub-menu will be used as its default `callback`.

##### Generate layout with `navbar` and menus pulled right

![Layout with navbar and menus pulled right](images/generateAppLayout-navbar-menus-pull.png)

```javascript
monster.ui.generateAppLayout(this, {
    menus: [
        {
            pull: 'right',
            tabs: [
                {
                    text: 'Q&A',
                    callback: function() {}
                },
                {
                    text: 'Support',
                    callback: function() {}
                }
            ]
        }
    ]
});
```

##### Generate layout without `navbar`

![Layout without navbar](images/generateAppLayout-navbar-none.png)

```javascript
monster.ui.generateAppLayout(this, {
    menus: [
        {
            tabs: [
                {
                    callback: function() {}
                }
            ]
        }
    ]
});
```

Since only one tab was defined, no `navbar` will be rendered.

[monster]: ../../monster.md
[ui]: ../ui.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[array_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Array_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[boolean_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Boolean_literals
