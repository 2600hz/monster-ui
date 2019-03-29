title: callApi()

# callApi()
The `callApi()` is a helper function that is available within a Monster app. It is automatically configured with our [Kazoo SDK][kazoo_sdk], and allows to request resources that are supported by it.

## Syntax
```javascript
var self = this;

// ...

self.callApi(params: {
  resource[,
  authToken,
  apiRoot,
  data: {
    accountId,
    filters,
    data,
    headers,
    ...
  },
  bypassProgressIndicator,
  success,
  error,
  onChargesCancelled]
});
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`params` | A plain JavaScript object that wraps the arguments for the function. | `Object`([#params](#params)) | | `true`

### `params`
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`resource` | [Supported resource name.][kazoo_sdk_methods] | `String` | | `true`
`data` | A plain JavaScript object that contains the list of parameters to be sent on the request. | `Object`([#data](#data)) | | `true`
`bypassProgressIndicator` | Flag to indicate to the core app that the progress indicator should not be displayed for the current API call. | `Boolean` | | `false`
`success` | Function executed if the API responded successfully (i.e. Success HTTP code is received). | `Function` | | `false`
`error` | Function executed if the API request fails. | `Function` | | `false`
`onChargesCancelled` | Function executed if the operation applies charges, but they are declined by the user. | `Function` | | `false`

### `data`
This object may contain other properties besides the listed here, depending on the requested resource.

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`accountId` | Kazoo account ID. | `String` | | `false`
`filters` | A map of filters to append to the API URL, where the key is the URL parameter and the value is the parameter's value. | `Object` | | `false`
`data` | Data payload to be sent in the request body. | `Object` | | `false`
`headers` | An object of additional header key/value pairs to send along with request (e.g. `{ 'Accept': 'application/octet-stream' }`).

## Description
Every Monster app has a helper function `callApi(_params_)` that can be used to call any API supported by the Kazoo SDK. This function takes the same parameter structure as the [`monster.request(_params_)`][monster_request] function, as well as some additional ones, to easily interact with the Kazoo API within the application context. The main difference, however, is that the `resource` value should be the [Kazoo SDK's method name][kazoo_sdk_methods], which means that you don't have to declare any resource in the `requests` object, compared to the `monster.request(_params_)` function.

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
  success: function(data) { // TODO: Add missing parameters to success function
    var devices = data;

    // Do something with the devices list
  },
  error: function() {
    // TODO: Add missing parameters to error function
  }
});
```

### Request the callflows that belong to the current user, and have not been last modified by Smart PBX nor Callqueues app
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
  success: function(data) {
    var callflows = data.data;

    // Do something with the callflows list
  }
});
```

### Request to create a voicemail box, but handle the charge declination case
```javascript
var self = this;

// ...

self.callApi(params: {
  resource: 'voicemail.create',
  data: {
    accountId: self.accountId,
    data: {
      // TODO
    }
  },
  success: function(data) {
    // TODO
  },
  onChargesCancelled: function() {
    // TODO
  }
});
```

[kazoo_sdk]: ../kazooSdk.md
[kazoo_sdk_methods]: ../kazooSdk.md#list-of-methods
[monster_request]: ../monster/request().md
