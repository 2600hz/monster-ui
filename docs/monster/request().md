# [monster][monster].request()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.request(options);
```

### Parameters
* `options` (mandatory)

 Type: [Object][object_literal]

 Set of options:
    - `resource`: unique identifier corresponding to a request
    - `data`: parameters to pass to the request
    - `success`: callback on success
    - `error`: callback on error

### Description
The `monster.request()` method allows you to make requests that are not defined in the [Kazoo JavaScript SDK][kazooSdk].

To specify the options of the request, add an entry in the `requests` object at the root level of the application. The key needs to be a unique identifier that will be used to call the API. By default, the `apiRoot` is `monster.config.api.default`.

### Examples
* Delete a device on the provisioner
```javascript
var app = {
    // Defines API requests not included in the SDK
    requests: {
        'provisioner.devices.delete': {
            apiRoot: monster.config.api.provisioner,
            url: 'devices/{accountId}/{macAddress}',
            verb: 'DELETE'
        }
    },

    requestDeleteDevices: function(args) {
        monster.request({
            resource: 'provisioner.devices.delete',
            data: {
                accountId: args.data.accountId,
                macAddress: args.data.macAddress
            },
            success: function(data, status) {
                args.hasOwnProperty('success') && args.success();
            },
            error: function(data, status) {
                args.hasOwnProperty('error') && args.error();
            }
        });
    }
};
```
* Use Google Maps Geocoding API to get information about a ZIP code:
```javascript
var app = {
    //Defines API requests not included in the SDK
    requests: {
        'google.geocode.zipCode': {
            apiRoot: 'https://maps.googleapis.com/',
            url: 'maps/api/geocode/json?components=country:{country}|postal_code:}zipCode}',
            verb: 'GET',
            generateError: false,
            removeHeaders: [
                'X-Kazoo-Cluster-ID',
                'X-Auth-Token',
                'Content-Type'
            ]
        }
    },

    requestGetAddressFromZipCode: function(args) {
        monster.request({
            resource: 'google.geocode.zipCode',
            data: {
                country: args.data.country,
                zipCode: args.data.zipCode
            },
            success: function(data, status) {
                args.hasOwnProperty('success') && args.success(data.results);
            },
            error: function(data, status) {
                args.hasOwnProperty('error') && args.error();
            }
        });
    }
};
```
In this example, we had to remove a set of headers using the `removeHeaders` key so the server would accept the request and also had to disable the automatic Monster Error Popup with `generateError`.

[monster]: ../../monster.md

[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[kazooSdk]: ../kazooSdk.md