# monster.request()

## Syntax
```javascript
monster.request(options);
```

### Parameters
`options` is a mandatory `Object` parameter with the following properties:

Key | Description | Type | Default | Require
:-: | --- | :-: | :-: | :-:
`resource` | Unique identifier corresponding to a request. | `Object` | | `true`
`data` | Parameters to pass to the request. | `Object` | | `false`
`success` | Callback on success. | `Function` | | `false`
`error` | Callback on error. | `Function` | | `false`

## Description
The `monster.request()` method allows you to make requests that are not defined in the [Kazoo JavaScript SDK][kazooSdk].

To specify the options of the request, add an entry in the `requests` object at the root level of the application. The key needs to be a unique identifier that will be used to call the API. By default, the `apiRoot` is `monster.config.api.default`.

## Examples
### Delete a device on the provisioner
```javascript
var monster = require('monster');

var app = {
  // Define API requests not included in the SDK
  requests: {
    'provisioner.devices.delete': {
      apiRoot: monster.config.api.provisioner,
      url: 'devices/{accountId}/{macAddress}',
      verb: 'DELETE'
    }
  }
};

function requestDeleteDevice(args) {
  monster.request({
    resource: 'provisioner.devices.delete',
    data: {
      accountId: args.accountId,
      macAddress: args.maccAddress
    },
    success: function() {
      args.hasOwnProperty('success') && args.success();
    },
    error: function() {
      args.hasOwnProperty('error') && args.error();
    }
  });
}

// Do something with `requestDeleteDevice`
```
### Use Google Maps Geocoding API to get information about a ZIP code:
```javascript
var app = {
  //Defines API requests not included in the SDK
  requests: {
    'google.geocode.zipCode': {
      apiRoot: 'https://maps.googleapis.com/',
      url: 'maps/api/geocode/json?components=country:{country}|postal_code:{zipCode}',
      verb: 'GET',
      generateError: false,
      removeHeaders: [
        'X-Kazoo-Cluster-ID',
        'X-Auth-Token',
        'Content-Type'
      ]
    }
  }
};

function requestGetAddressFromZipCode(args) {
  monster.request({
    resource: 'google.geocode.zipCode',
    data: {
      country: args.country,
      zipCode: args.zipCode
    },
    success: function(data, status) {
      args.hasOwnProperty('success') && args.success(data.results);
    },
    error: function(data, status) {
      args.hasOwnProperty('error') && args.error();
    }
  });
}

// Do something with `requestGetAddressFromZipCode`
```
In this example, we had to remove a set of headers using the `removeHeaders` key so the server would accept the request and also had to disable the automatic Monster Error Popup with `generateError`.

[kazooSdk]: ../kazooSdk.md
