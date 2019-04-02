title: Configure your Monster UI install

# config.js
Monster UI is highly configurable through a single file located at `src/js/config.js`. This file lets you connect your different backend services to Monster UI and exposes other settings, like whitelabeling, that can be set for the entire UI.

## Example
This minimal, working example is designed to get you up and running in no time when Monster UI is installed on the same server running Kazoo and the APIs are accessible at the default location (`:8000/v2/`).

If that is not the case, you will need to hook up your Kazoo server with the [`api.'default'`](#api) property and you should be good to go.

```js
define({
  whitelabel: {
    companyName: '2600Hz',
    applicationTitle: 'Monster UI',
    callReportEmail: 'support@2600hz.com',
    nav: {
      help: 'http://wiki.2600hz.com'
    },
    port: {
      loa: 'http://ui.zswitch.net/Editable.LOA.Form.pdf',
      resporg: 'http://ui.zswitch.net/Editable.Resporg.Form.pdf'
    }
  }
});
```

## Settings

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`api` | Various API related settings | `Object`([#api](#api)) | | `false`
`advancedView` | Provide a global flag that enable advanced features in the UI | `String` | | `false`
`currencyCode` | The currency to use in currency formatting. Possible values are the ISO 4217 currency codes, such as `USD` for the US dollar, `EUR` for the euro, or `CNY` for the Chinese RMB (see the [Current currency & funds code][currency-codes]). | `String` | `USD` | `false`
`developerFlags` | Enable development functionalities | `Object`([#developerFlags](#developerflags)) | | `true`
`disableBraintree` | If you are not using Braintree in your environment, you should add the following flag to disable the UI components that are using it | `Boolean` | `false` | `false`
`hide_registration` | Setting this flag to `true` will hide registration  | `Boolean` | | `false`
`kazooClusterId` | The kazooClusterId is the cluster id generated when creating a cluster doc for provisioner | `String` | | `false`
`pbx_help_configuration_link` | Allow to define help link to configure PBX app | `String` | | `false`
`pbx_help_link` | Allow to define help link for PBX app | `String` | | `false`
`support_email` | Allow to define support email | Type | Default | Required
`resellerId` | The resellerId key is the accountId of your master account, and is needed for some reseller features. For example it won't prompt for a credit card the sub-accounts that have a different resellerId than this resellerId | `String` | | `false`
`whitelabel` | Contains all the flags that are whitelabel-able via the Branding app. Setting them in the config file will set the defaults if you don't use any whitelabel. If the domain used is defined in the whitelabel database, we'll override the following settings by what is set in the whitelabel document. | `Object`([#whitelabel](#whitelabel)) | | `true`


### `api`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`'default'` | The default API URL defines what API is used to log in to your back-end | `String` | `window.location.protocol` + `//` + `window.location.hostname` + `:8000/v2/` | `false`
`phonebook` | Set Project Phonebook URL if you want to use it to search phone numbers | `String` | | `false`
`provisioner` | If you have provisioner turned on in your install and can use the one provided by 2600Hz, set it up here | `String` | | `false`
`socket` | If you want to use WebSockets you need to turn Blackhole on in the back-end and then set it up here | `String` | | `false`

### `developerFlags`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`build` | Provide app build information | `Object`([#build](#build)) | | `false`
`showAllCallflows` | Setting this flag to `true` will show all restricted callflows in the Callflows app | `Boolean` | `false` | `false`
`showJsErrors` | Show JS error when they happen | `Boolean` | `false` | `false`
`kazooVersion` | Provide the backend (Kazoo) version | `String` | | `false`
`showAllCallflows` | Setting this flag to `true` will show all callflows | `Boolean` | | `false`


#### `build`
Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`preloadedApps` | Contain a track of loaded apps | `Object` | | `false`
`proApps` | Contain a list of pro applications that the logged in user have | `Object` | | `false`
`type` | Provide the build environment | `String` | | `false`
`version` | Provide the build version | `String` | | `false`


### `whitelabel`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`additionalCss` | Additional CSS files to load. Need to be in src/css folder | `Array` | | `false`
`additionalCss.[]` | Path to the CSS file | `String` | | `false`
`additionalLoggedInApps` | Additional apps to load once the user is logged in (will be loaded along the appstore, apploader, common controls etc..) | `Array` | | `false`
`additionalLoggedInApps.[]` | Name of the app to side load | `String` | | `false`
`allowAccessList` | If set to true, will allow the user to modify access_lists from the account settings page. | `Boolean` | `false` | `false`
`allowAnyOwnedNumberAsCallerID` | | `Boolean` | | `false`
`announcement` | | `String` | | `false`
`applicationTitle` | Application title, displayed in the browser tab | `String` | | `false`
`authentication` | Provide autentication mechanism info | `Object` | | `false`
`bookkeepers` | | `Object`([#bookkeepers](#bookkeepers)) | | `false`
`brandColor` | Allow to customize the UI color | `String` | | `false`
`callReportEmail` | E-mail address used to report calls in SmartPBX's Call Logs. "Report Call" link won't be displayed if no address is specified. This address can either be set here in the config file, or through the Branding app. | `String` | | `false`
`carrier` | | `Object`([#carrier](#carrier)) | | `false`
`companyName` | Company Name, used in many places in the UI | `String` | | `false`
`custom_welcome_message` | Allow to customize the login page message | `String` | `Your Unified Communications Platform.` | `false`
`disableNumbersFeatures` | Indicates whether or not number features (e.g. e911, cnam) are configurable through the UI. | `Boolean` | `false` |`false`
`domain` | | `String` | | `false`
`hasMetaflowsEnabled` | | `Boolean` | | `false`
`hideAppStore` | The appstore is exposed to admins by default. If set to false, it will be hidden for all users. | `Boolean` | `false` | `false`
`hideBuyNumbers` | Remove the ability to buy phone numbers throughout the entire UI | `Boolean` | `false` | `false`
`hideNewAccountCreation` | If set to true, will hide creation of new accounts | `Boolean` | `false` | `false`
`hide_port` | Whether or not to make porting actions available through the UI. | `Boolean` | `false` | `false`
`hidePasswordRecovery` | If set to `true`, the recovery link will be hidden on the login page | `Boolean` | `false` | `false`
`hide_powered` | If set to `true`, the `powered by` text that is shown in the page bottom will be hidden | Type | Default | Required
`jiraFeedback` | If you want to provide a "Provide Feedback" button tied with JIRA issue collector, you can set this object to enabled: true, and provide the URL of the JIRA Issue collector to the url property. If this item is removed or set to enabled: false, nothing will appear in the UI. | `Object` | | `false`
`jiraFeedback.enabled` | | `Boolean` | `false` | `false`
`jiraFeedback.url` | | `String` | | `false`
`language` | By default the language is set by the cookie, and once the user is log in it will take what's set in the account/user. If you want to force the language of the UI before a user is logged in, you can set it here. | `String` | | `true`
`logoPath` | Hardcoded logo to override default Kazoo Logo | `String` | | `false`
`logoutTimer` | Minutes before showing the logged in user that it will auto-disconnect him soon. Changing this value allows you to disable the auto-logout mechanism by setting it to 0. If you want to change the default duration (15), you can set this value with a number > 0 | `Number` | `15` | `false`
`nav` | | `Object` | | `false`
`nav.help` | Link used when user click on the top-right interrogation mark | `Object` | | `false`
`nav.logout` | Link used when clicking on logging out. By default the UI logs out the user after confirmation, but some people wanted to override that behavior | `Object` | | `false`
`port` | | `Object`([#/port](#port)) | | `false`
`preventDIDFormatting` | If set to true, the UI will stop trying to pretty print DIDs. Typically you want to leave this on if you handle US numbers, but if you handle different countries, it won't display numbers properly. While we're working on a better fix, this is a quick way to disable the pretty printing from the time being | `Boolean` | `false` | `false`
`realm_suffix` | | `String` | | `false`
`sso` | Authentication mechanism | `Object` | | `false`
`sso_providers` | | `Object` | | `false`
`showMediaUploadDisclosure` | Whether or not to display a message disclosing customer's responsibility when uploading a media file. | `Boolean` | `false` | `false`
`social` | Allow to define a set social networks | `Object` | | `false`
`useDropdownApploader` | If set to true, the apploader will render as a dropdown list instead of a page on top of the window. False by default. | `Boolean` | `false` | `false`

#### `bookkeepers`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`braintree` | Whether or not bookkeeping transactions can be performed through Braintree. | `Boolean` | `true` | `false`
`kazoo` | Whether or not bookkeeping transactions can be performed through Kazoo. | `Boolean` | `true` | `false`
`http` | Whether or not bookkeeping transactions can be performed through HTTP. | `Boolean` | `true` | `false`

#### `carrier`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`choices` | | `Object` | | `false`

#### `port`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`loa` | Link to LOA document downloaded by users on port request submission. | `String` | | `false`
`resporg` | Link to RespOrg document downloaded by users on port request submission. | `String` | | `false`
`carriers` | List of losing carriers to select from on port request submission. | `Array` | | `false`
`carriers.[]` | Name of losing carrier (should be unique). | `String` | | `false`

[currency-codes]: http://www.currency-iso.org/en/home/tables/table-a1.html
