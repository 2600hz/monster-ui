# appContext.callApi()

## Syntax
```javascript
appContext.callApi(params);
```

### Parameters
`params` is a mandatory `Object` parameter with the following properties:

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`resource` | Kazoo SDK method name. | `String` | | `true`
`apiRoot` | Override the API URL set in `config.js` for this request only. | `String` | `monster.config.api.default` | `false`
`authToken` | Override the authentication token (JWT) generated during the authentication process for this request only. | `String` | `monster.util.getAuthToken()` | `false`
`bypassProgressIndicator` | Whether or not to hide the request progress indicator while this request is in progress. | `Boolean` | `false` | `false`
`data` | A plain JavaScript object that contains the list of parameters to be sent on the request. | `Object`([#data](#data)) | | `true`
`success` | A function to be called if the request succeeds (`200 OK`). The function gets passed two arguments: the response payload formatted according to the data type; a string describing the status. | `Function` | | `false`
`error` | A function to be called if the request fails (except for `402 Payment Required`, see `onChargesCancelled`). The function receives three arguments: the error parsed as JSON; the raw error from the ajax error handler; a function to throw a generic Monster UI request error. | `Function` | | `false`
`onChargesCancelled` | A function called when the error is specifically a `402 Payment Required`. It is executed if the user declines the charges associated with the request. | `Function` | | `false`

#### `data`
Here is a list of some common data properties. However, this object may contain other properties besides the ones listed here, depending on the requested resource.

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`acceptCharges` | Whether the UI bypasses the charges confirmation dialog for Kazoo requests triggering a service plan charge (this prop is overridden by `monster.config.whitelabel.acceptCharges.autoAccept` when set to `true`). | `Boolean` | `false` | `false`
`accountId` | Kazoo account ID. | `String` | | `false`
`data` | Payload to be sent in as request body. | `Object` | | `false`
`filters` | A map of filters to append to the API URL, where the key is the URL parameter name and the value is the parameter's value. | `Object` | | `false`
`generateError` | Whether or not to display the generic Monster UI error dialog when the request fails. | `Boolean` | `true` | `false`
`headers` | An object of additional header key/value pairs to send along with the request (e.g. `{ 'Accept': 'application/octet-stream' }`). | `Object` | | `false`

## Description
Every Monster app has a helper function `callApi(_params_)` that can be used to call any API endpoint supported by the Kazoo SDK.

It is automatically configured with our [Kazoo SDK][kazoo_sdk] and takes the same parameter structure as the [`monster.request(_params_)`][monster_request] function, as well as some additional arguments, to easily interact with the Kazoo API within the application context. The main difference, however, is that the `resource` value must be a valid [Kazoo SDK's method name][kazoo_sdk_methods], which means that you don't have to declare any resource in the app's `requests` object, compared to the `monster.request(_params_)` function.

## Examples
### Request all the devices for the current account, without displaying Monster UI progress indicator
```javascript
var self = this;

// ...

self.callApi(params: {
  resource: 'device.list',
  data: {
    accountId: self.accountId
  },
  bypassProgressIndicator: true,
  success: function(data, status) {
    var devices = data.data;

    // Do something with the device list
  },
  error: function(parsedError, error, globalHandler) {
    // Handle failure
  }
});
```

### Request the callflows that belong to the current user, and have not been last modified by Smart PBX nor Call Center apps
```javascript
var self = this;

// ...

self.callApi(params: {
  resource: 'callflow.list',
  data: {
    accountId: self.accountId,
    filters: {
      filter_owner_id: monster.apps.auth.currentUser.id,
      'filter_not_ui_metadata.origin': [
        'voip',
        'callqueues'
      ]
    }
  },
  success: function(data, status) {
    var callflows = data.data;

    // Do something with the callflow list
  }
});
```

### Request to create a voicemail box, but handle the charge declination case
```javascript
var self = this,
  newVMBox;

// ...

self.callApi(params: {
  resource: 'voicemail.create',
  data: {
    accountId: self.accountId,
    data: newVMBox
  },
  success: function(data) {
    var savedVMBox = data.data;

    // Do something with the newly created vmbox...
  },
  onChargesCancelled: function() {
    console.log('Charges not accepted by the user!');
  }
});
```

### Request to create a user, but do not display the default error alert in case of HTTP 400 status code
```javascript
var self = this,
  newUser;

// ...

self.callApi(params: {
  resource: 'user.create',
  data: {
    accountId: self.accountId,
    data: newUser
  },
  success: function(data) {
    var savedUser = data.data;

    // Do something with the newly created user...
  },
  error: function(parsedError, error, globalHandler) {
    if (error.status === 400) { // You could check also: parsedError.error === '400'
      // Handle error due to invalid data...
    } else {
      // Display default alert
      globalHandler(parsedError, { generateError: true });
    }
  }
});
```

[kazoo_sdk]: ../kazooSdk.md
[kazoo_sdk_methods]: ../kazooSdk.md#list-of-methods
[monster_request]: ../monster/request().md
