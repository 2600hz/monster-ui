# [monster][monster].getTemplate()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.getTemplate(args);
```

### Arguments
* `app` (mandatory)

 Type: [Object][object_literal]

the app, used for finding the template to load

You can also use the same getTemplate method and bypass the app parameter by using this.getTemplate(args) within the right scope in an app.

* `name` (mandatory)

 Type: [String][string_literal]

 name of the template, without the file extension

* `data` (optional)

 Type: [Object][object_literal]

 Default: `{}`

 data to pass to the template

* `raw` (optional)

 Type: [Boolean][boolean_literal]

 Default: `false`

 when set to `true`, Handlebars will not compile the template and it will be sent as is

* `ignoreCache` (optional)

 Type: [Boolean][boolean_literal]

 Default: `false`

 when set to `true`, request the template even if it was already loaded

* `ignoreSpaces` (optional)

 Type: [Boolean][boolean_literal]

 Default: `false`

 when set to `true`, carriage return, linefeed, tab, whitespace will not be trimmed from the template

### Description
The `monster.template()` method allows you to request templates simply by specifying the name of the desired template. You can also pass data to the template with the `data` parameter.

### Examples
* Load template with no data into the DOM
```javascript
var app = {
    render: function(parent) {
        var self = this,
            template = $(monster.getTemplate({ app: self, name: 'app'}));

        parent
            .empty()
            .append(template);
    }
};
```
* Load template with data into the DOM
```javascript
var app = {
    render: function(parent) {
        var self = this;

        self.getUserData(self.userId, function(userData) {
            var dataToTemplate = {
                    userId: self.userId,
                    userData: userData
                },
                template = $(monster.getTemplate({ app: self, name: 'app', data: dataToTemplate}));

            parent
                .empty()
                .append(template);
        });
    }
};
```
* Load a string template in a Toastr Notification or Monster Alert
```javascript
var app = {
    renderUserCreate: function(args) {
        var self = this,
            userData = args.data.user;

        self.requestCreateUser({
            data: {
                user: userData
            },
            success: function(data) {
                var toastrTemplate = monster.getTemplate({app: self, name: '!' + self.i18n.active().toastr.success.userCreate, data: { name: data.name }});

                 toastr.success(toastrTemplate);
            },
            error: function(data) {
                var alertTemplate = monster.getTemplate({app: self, name: '!' + self.i18n.active().alert.error.createUser, data: { type: data.type }});

                monster.ui.alert('error', alertTemplate);
            }
        });
    }
};
```

[monster]: ../monster.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[boolean_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Boolean_literals