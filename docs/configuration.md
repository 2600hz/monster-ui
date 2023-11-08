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
`advancedView` | Whether or not to toggle the Callflows app's "Advanced" tab by default. | `Boolean` | | `false`
`currencyCode` | The currency to use in price formatting. Possible values are ISO 4217 currency codes, such as `USD` for the US dollar, `EUR` for the euro, or `CNY` for the Chinese RMB (see the [Current currency & funds code][currency-codes]). | `String` | `USD` | `false`
`developerFlags` | Enable development functionalities | `Object`([#developerFlags](#developerflags)) | | `true`
`disableBraintree` | If you are not using Braintree in your environment, you should add the following flag to disable the UI components that are using it | `Boolean` | `false` | `false`
`hide_registration` | Whether or not to hide the login page's "Register" button.  | `Boolean` | | `false`
`kazooClusterId` | The kazooClusterId is the cluster id generated when creating a cluster doc for provisioner | `String` | | `false`
`pbx_help_configuration_link` | Allow to define help link to configure PBX app | `String` | | `false`
`pbx_help_link` | Allow to define help link for PBX app | `String` | | `false`
`support_email` | Allow to define support email | Type | Default | Required
`resellerId` | The resellerId key is the accountId of your master account, and is needed for some reseller features. For example it won't prompt for a credit card the sub-accounts that have a different resellerId than this resellerId | `String` | | `false`
`whitelabel` | Contains all the flags that are whitelabel-able via the Branding app. Setting them in the config file will set the defaults if you don't use any whitelabel. If the domain used is defined in the whitelabel database, we'll override the following settings by what is set in the whitelabel document. | `Object`([#whitelabel](#whitelabel)) | | `true`
`allowedExtraDeviceTypes` | Contains types of additional devices corresponding to integrations. | `Array` | | `false`
`allowCrossSiteUsage` | Whether Monster UI supports being embedded into a third-party context (e.g. iframe with different domain). | `Boolean` | `false` | `false`
`bypassAppStorePermissions` | Whether app store access restrictions should be bypassed when loading an app. When set to `true`, end-users are allowed to access any app installed on the cluster where Monster UI is running.  | `Boolean` | `false` | `false`
`crossSiteMessaging` | Configures whether the application permits messages from external domains and specifies acceptable message topics. | `Object`([#crossSiteMessaging](#crossSiteMessaging)) | | `false`

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
`build` | Information about the build. | `Object`([#build](#build)) | | `readonly`
`showAllCallflows` | Whether or not to show all restricted callflows in the Callflows app | `Boolean` | `false` | `false`
`showJsErrors` | Whether or not to show JavaScript errors when they happen. | `Boolean` | `false` | `false`
`kazooVersion` | Backend version number (set during authentication). | `String` | | `readonly`


#### `build`
Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`preloadedApps` | A list of applications loaded during the build. | `Array` | | `readonly`
`proApps` | A list of applications built in `pro` mode. | `Array` | | `readonly`
`type` | Build environment. | `String('development' | 'production')` | | `readonly`
`version` | Build version of Monster UI. | `String` | | `readonly`


### `whitelabel`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`acceptCharges` | | `Object`([#acceptCharges](#acceptCharges)) | | `false`
`additionalCss` | Additional CSS files to load. Need to be in src/css folder | `Array` | | `false`
`additionalCss.[]` | Path to the CSS file | `String` | | `false`
`additionalLoggedInApps` | Additional apps to load once the user is logged in (will be loaded along the appstore, apploader, common controls etc..) | `Array` | | `false`
`additionalLoggedInApps.[]` | Name of the app to side load | `String` | | `false`
`appLinks` | Links accessible alongside apps in apploader (will open in a new tab). | `Object`([#appLinks](#appLinks)) | | `false`
`allowAccessList` | If set to true, will allow the user to modify access_lists from the account settings page. | `Boolean` | `false` | `false`
`allowAnyOwnedNumberAsCallerID` | Whether or not to allow any phone number on the account to be used as caller ID. | `Boolean` | | `false`
`announcement` | Message to show every time a user logs in. | `String` | | `false`
`applicationTitle` | Application title, displayed in the browser tab | `String` | | `false`
`authentication` | Third party application to handle authentication in place of `auth`. | `Object` | | `false`
`bookkeepers` | | `Object`([#bookkeepers](#bookkeepers)) | | `false`
`brandColor` | Hexadecimal color code used as primary color on the login page. | `String` | | `false`
`callReportEmail` | E-mail address used to report calls in SmartPBX's Call Logs. "Report Call" link won't be displayed if no address is specified. This address can either be set here in the config file, or through the Branding app. | `String` | | `false`
`carrier` | | `Object`([#carrier](#carrier)) | | `false`
`companyName` | Company Name, used in many places in the UI | `String` | | `false`
`custom_welcome_message` | Welcome message displayed on login page. | `String` | `Your Unified Communications Platform.` | `false`
`countryCode` | The country code to use in phone number pretty print. Possible values are ISO-3166 alpha-2 codes, such as `US` for the USA or `FR` for France (see the [ISO Online Browsing Platform][country-codes]). | `String` | `US` | `false`
`disableNumbersFeatures` | Indicates whether or not number features (e.g. e911, cnam) are configurable through the UI. | `Boolean` | `false` |`false`
`domain` | Domain used to whitelabel the UI. | `String` | | `false`
`hasMetaflowsEnabled` | Whether or not to expose the "On-demand (In-Call) Recording" feature in the Call Recording app. | `Boolean` | | `false`
`hideAppStore` | The appstore is exposed to admins by default. If set to false, it will be hidden for all users. | `Boolean` | `false` | `false`
`hideBuyNumbers` | Remove the ability to buy phone numbers throughout the entire UI | `Boolean` | `false` | `false`
`hideNewAccountCreation` | If set to true, will hide creation of new accounts | `Boolean` | `false` | `false`
`hide_port` | Whether or not to make porting actions available through the UI. | `Boolean` | `false` | `false`
`hidePasswordRecovery` | Whether or not to hide the "Forgot your info?" feature from the login page. | `Boolean` | `false` | `false`
`hide_powered` | Whether or not to hide the "powered by" info shown in the bottom of the page. | `Boolean` | | `false`
`includes` | Scripts to download before authentication step (pulling happens sequentially). | `URL[]` | | `false`
`jiraFeedback` | If you want to provide a "Provide Feedback" button tied with JIRA issue collector, you can set this object to enabled: true, and provide the URL of the JIRA Issue collector to the url property. If this item is removed or set to enabled: false, nothing will appear in the UI. | `Object` | | `false`
`jiraFeedback.enabled` | | `Boolean` | `false` | `false`
`jiraFeedback.url` | | `String` | | `false`
`language` | By default the language is set by the cookie, and once the user is log in it will take what's set in the account/user. If you want to force the language of the UI before a user is logged in, you can set it here. | `String` | `en-US` | `false`
`logoPath` | Hardcoded logo to override default Kazoo Logo | `String` | | `false`
`logoutTimer` | Minutes before showing the logged in user that it will auto-disconnect him soon. Changing this value allows you to disable the auto-logout mechanism by setting it to 0. If you want to change the default duration (15), you can set this value with a number > 0 | `Number` | `15` | `false`
`nav` | | `Object` | | `false`
`nav.help` | Link used when user click on the top-right interrogation mark | `Object` | | `false`
`nav.logout` | Link used when clicking on logging out. By default the UI logs out the user after confirmation, but some people wanted to override that behavior | `Object` | | `false`
`port` | | `Object`([#/port](#port)) | | `false`
`preventDIDFormatting` | If set to true, the UI will stop trying to pretty print DIDs. Typically you want to leave this on if you handle US numbers, but if you handle different countries, it won't display numbers properly. While we're working on a better fix, this is a quick way to disable the pretty printing from the time being | `Boolean` | `false` | `false`
`provisioner` | | `Object`([#/provisioner](#provisioner)) | | `false`
`sso` | Cookie information to force a specific SSO provider to be used. | `Object` | | `false`
`sso_providers` | List of SSO providers available on login. | `Array` | | `false`
`showMediaUploadDisclosure` | Whether or not to display a message disclosing customer's responsibility when uploading a media file. | `Boolean` | `false` | `false`
`showPAssertedIdentity` | Whether or not to render the P-Asserted-Identity section under Callflows app > Account Settings > Caller-ID. | `Boolean` | `false` | `false`
`social` | List of social network to expose on the login page. | `Array` | | `false`
`useDropdownApploader` | If set to true, the apploader will render as a dropdown list instead of a page on top of the window. False by default. | `Boolean` | `false` | `false`
`disableFirstUseWalkthrough` | If set to true, the new user walkthrough will not be displayed. False by default. | `Boolean` | `false` | `false`
`invoiceRangeConfig` | The range of months one can navigate back to for the invoices in the Invoice Generator. Its default value is 6 months from the current month, but it is not required to have a value assigned to it | `Number` | `6` | `false`

#### `acceptCharges`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`autoAccept` | Whether the UI bypasses the charges confirmation dialog for Kazoo requests triggering a service plan charge. When set to `false`, this prop can be overridden individually for each request.  | `Boolean` | `false` | `false`
`showInvoiceSummary` | Whether the charges confirmation dialog should render the invoice summary or a custom message (this prop only takes effect when `autoAccept: false`). | `Boolean` | `true` | `false`
`message` | Maps IETF language codes (`en-US`, `fr-FR` ...) to custom messages to render in place of the invoice summary (this prop only takes effect when `showInoiceSummary: false` and `autoAccept: false`). | `Object` |  | `false`
`message[]` | Custom message to render in place of the invoice summary. | `String` |  | `false`

#### `appLinks`

Each object key corresponds to a unique URL while its value is:
Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`icon` | URL to icon asset. | `String` | | `true`
`i18n` | Internationalization information, requires at least one entry. | `Object` |  | `true`
`i18n[]` | Each object key corresponds to a unique language identifier (`en-US`, `fr-FR`...). | `Object` |  | `true`
`i18n[].label` | Name for the link. | `String` |  | `true`
`i18n[].description` | Description for the link. | `String` |  | `false`

#### `bookkeepers`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`braintree` | Whether or not bookkeeping transactions can be performed through Braintree. | `Boolean` | `true` | `false`
`iou` | Whether or not bookkeeping transactions can be performed through Kazoo. | `Boolean` | `true` | `false`
`payphone` | Whether or not bookkeeping transactions can be performed through HTTP. | `Boolean` | `true` | `false`

#### `carrier`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`choices` | List of carrier strategies available system-wide. | `Array` | | `false`

#### `port`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`loa` | Link to LOA document downloaded by users on port request submission. | `String` | | `false`
`resporg` | Link to RespOrg document downloaded by users on port request submission. | `String` | | `false`
`carriers` | List of losing carriers to select from on port request submission. | `Array` | | `false`
`carriers.[]` | Name of losing carrier (should be unique). | `String` | | `false`

#### `provisioner`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`brands` | Map custom settings individually by device brand. | `Object` | | `false`
`brands.[]` | Each object key correspont to the device brand name (`yealink`, `avaya`...). | `Object` | | `false`
`brands.[].keyFunctions` | List key functions available per brand ([schema][combo-keys-schema]). | `Array` | | `false`
`brands.[].lineKeys` | List of keys to be used as default line keys per brand. | `Array` | | `false`

#### `crossSiteMessaging`

Key | Description | Type | Default | Required
--- | --- | :---: | :---: | :---:
`origin` | The remote source that the framework would be configured to accept cross-site messages from. | `String` | | `false`
`topics` | Specific messages accepted from the configured remote source. | `Array`  | | `false`

[currency-codes]: http://www.currency-iso.org/en/home/tables/table-a1.html
[country-codes]: https://www.iso.org/obp/ui/#search
[combo-keys-schema]: https://github.com/2600hz/kazoo/blob/master/applications/crossbar/priv/couchdb/schemas/devices.combo_key.json

