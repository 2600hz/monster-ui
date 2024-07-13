# monster.util.getCapability()

## Syntax
```javascript
monster.util.getCapability(path);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`path` | Path to a resource/feature to access. | `String|String[]` | | `true`

### Return value

- An `Object` literal describing the capability of a feature

Key | Description | Type
:-: | --- | :-:
`isEnabled` | Whether the feature at `path` is available. | `Boolean`
`defaultValue` | Default value for capability at `path`. | `Boolean`

- An `Array` listing features when `path` only contains a resource
- `undefined` when `path` cannot be resolved into a valid feature

## Description
The `monster.util.getCapability` method returns data informing on the capability of a feature for a resource.

The data returned is cluster specific, meaning the user/account logged in does not impact the state of capabilities returned.

That said, when no user is logged-in, valid resource/feature will return `undefined` as the capabilities information is only shared by Kazoo on successful authentication.

## Examples

### Access a resource/feature
```js
console.log(monster.util.getCapability('voicemail.transcription'));
// -> { "isEnabled": true, "defaultValue": false }
```

### List features for a resource
```js
console.log(monster.util.getCapability('voicemail'));
// -> ["transcription"]
```

### Access an invalid resource/feature path
```js
console.log(monster.util.getCapability('voicemail.transcription.default'));
// -> undefined

console.log(monster.util.getCapability('voicemail.superman'));
// -> undefined

console.log(monster.util.getCapability('user'));
// -> undefined

console.log(monster.util.getCapability('user.superman'));
// -> undefined
```

