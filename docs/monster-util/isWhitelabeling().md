# monster.util.isWhitelabeling()

## Syntax
```javascript
monster.util.isWhitelabeling();
```

### Return value
A `Boolean` indicating whether or not the current session is using a branding profile.

## Description
This method checks if the UI is currently using a branding profile or not

## Example
```javascript
if(monster.util.isWhitelabeling()) {
	self.loadNewSkin();
	// do something if user is using a branded UI
};
```
