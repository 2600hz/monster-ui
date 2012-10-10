# amplify.store

`amplify.store` is a wrapper for various persistent client-side storage systems.
`amplify.store` supports IE 5+, Firefox 2+, Safari 4+, Chrome, Opera 10.5+, iPhone 2+, Android 2+
and provides a consistent API to handle storage cross-browser.

`amplify.store` is meant to allow you to utilize all the latest storage
technologies for those browsers that have them, while gracefully
degrading for those without support. `amplify.store` allows you to be
passive or explicit in the storage technologies used. With no storage
type explicitly specified, `amplify.store` will go through a series of
technologies and pick an appropriate storage technology through feature
detection. `amplify.store` also handles serializing to and from a JavaScript object
using JSON serialization where necessary.

## Usage

	amplify.store( string key, mixed value [, hash options ] )

Stores a value for a given key using the default storage type.

* `key`: Identifier for the value being stored.
* `value`: The value to store. The value can be anything that can be serialized as JSON.
* [`options`]: A set of key/value pairs that relate to settings for storing the value.

 

	amplify.store( string key )

Gets a stored value based on the key.

	amplify.store()

Gets a hash of all stored values.

	amplify.store.storageType( string key, mixed value [, hash options ] )

Stores a value for a given key using an explicit storage type, where `storageType` 
is one of the available storage types through amplify.store. The storage 
types available by default are listed below.

	amplify.store.storageType( string key )

Gets a stored value based upon key for the explicit storage type.

	amplify.store.storageType()

Gets a hash of all stored values which were stored through `amplify.store`.

### Options

* `expires`: Duration in milliseconds that the value should be cached.

## Storage Types

Support for the following storage types are built into `amplify.store` and are
detected in the order listed. The first available storage type will become the
default storage type when using `amplify.store()`.

### localStorage

* IE 8+
* Firefox 3.5+
* Safari 4+
* Chrome
* Opera 10.5+
* iPhone 2+
* Android 2+

### sessionStorage

* IE 8+
* Firefox 2+
* Safari 4+
* Chrome
* Opera 10.5+
* iPhone 2+
* Android 2+

### globalStorage

* Firefox 2+

### userData

* IE 5+

### memory

An in-memory store is provided as a fallback if none of the other storage types are available.

### cookie

Support for cookies is available as a convenience.
Cookies will never automatically become the default storage type because of the
bandwidth and performance overhead incurred for all requests.

## Examples

### Store data with amplify storage picking the default storage technology:

	amplify.store( "storeExample1", { foo: "bar" } );
	amplify.store( "storeExample2", "baz" )
	// retrieve the data later via the key
	var myStoredValue = amplify.store( "storeExample1" ),
		myStoredValue2 = amplify.store( "storeExample2" ),
		myStoredValues = amplify.store();
	myStoredValue.foo; // bar
	myStoredValue2; // baz
	myStoredValues.storeExample1.foo; // bar
	myStoredValues.storeExample2; // baz

### Store data explicitly with local storage

	amplify.store.localStorage( "explicitExample", { foo2: "baz" } );
	// retrieve the data later via the key
	var myStoredValue2 = amplify.store.localStorage( "explicitExample" );
	myStoredValue2.foo2; // baz

### Store data to a cookie

	amplify.store.cookie( "cookieExample", { foo3: "qux" } );
	// retrieve the data later via the key
	var myCookieValue = amplify.store.cookie( "cookieExample" );
	myCookieValue.foo3; // qux
