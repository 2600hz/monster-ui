# Using a Common Control
**Common Controls** are functionalities that are included natively into **Monster UI** and can be accessed through all applications independently of which of them are already installed.
**Common Controls** are pieces of code that usually have one purpose (for example, display the account's hierarchy in a drop-down) and could be used in several applications.

### Folder Structure
The **Common Controls** are located in the `monster-ui/apps/common/submodules` folder. Each one of them contains a JavaScript file and a CSS file specific to this **Common Control**.For the [internationalization][i18n], the files are in the `monster-ui/apps/common/i18n` and are common to all **Common Controls**. The views are in the `monster-ui/apps/common/views` folder and follow this naming convention: `{COMMON_CONTROL}-{VIEW}` in [CamelCase][camelcase] (example: accountDowpdown-listLayout). The `app.js` and `app.css` located in the `monster-ui/apps/common` folder 'enable' the **Common Controls**. The first file list all active controls in the `submodules` array contained in the `app` object. The second file import the CSS file relative to each **Common Controls**.

### Subscribe to a **Common Control**
To make it possible to an application to subscribe to a **Common Control**, follow the steps described in the [sub/pub documentation][sub].

### Publish a **Common Control**
To publish a **Common Control** in an application, follow the steps described in the [sub/pub documentation][pub].

[i18n]: internationalization.md "Adding i18n to your application"
[sub]: events.md#subscribe "Subscribe Documentation"
[pub]: events.md#publish "Publish Documentation"
[camelcase]: http://en.wikipedia.org/wiki/CamelCase "CamelCase Wikipedia"