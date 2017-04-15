# [monster][monster].[ui][ui].generateAppLayout()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.ui.generateAppLayout(thisArg, args);
```

### Parameters
* `thisArg` (mandatory)

 Type: [Object][object_literal]

 The context of the app invoking the helper.

* `args` (mandatory)

 Type: [Object][object_literal]

### Description

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

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals