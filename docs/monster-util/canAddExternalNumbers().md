# monster.util.canAddExternalNumbers()

## Syntax
```javascript
monster.util.canAddExternalNumbers([account]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`account` | Kazoo account document. | `Object` | | `false`

### Return value
A `Boolean` indicating whether or not the current account is allowed to add external numbers.

## Description
We only let accounts with the key `wnm_allow_additions` set to `true` add "external" numbers to the platform via API. So in order to expose the UI features that let users add external numbers we use this helper to check if the current account (or account provided in parameter) has the right to do it.

## Examples
### Check if external numbers can be added
```javascript
if(monster.util.canAddExternalNumbers()) {
	// do something if user are allowed to add external numbers
};
```
