# monster.util.getUrlVars()

## Syntax
```javascript
monster.util.getUrlVars([key]);
```
### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`key` | Specific query string parameter to return. | `String` | | `false`

### Return value
* an `Object` literal representing every URL parameters
* a `String` representation of the value corresponding to `key`
* an `Array` representation of the value corresponding to `key`
* `undefined` when `key` does not match a property

## Description
This method returns the different URL GET parameters of the window.

## Examples
```javascript
// url: http://mycompany.com/monster?page=documentation&date=142109383929
monster.util.getUrlVars();
// => { page: 'documentation', date: '142109383929' }
monster.util.getUrlVars('page');
// => 'documentation'
monster.util.getUrlVars('nope');
// => undefined

// url: http://mycompany.com/monster?page[]=documentation&page[]=about
monster.util.getUrlVars();
// => { page: ['documentation', 'about'] }
monster.util.getUrlVars('page');
// => ['documentation', 'about'']

// url: http://mycompany.com/monster?page[2]=documentation&page[4]=about
monster.util.getUrlVars();
// => { page: [null, null, 'documentation', null, 'about' ] }

// url: http://mycompany.com/monster?page[2]=documentation&page[4]=about
monster.util.getUrlVars();
// => { page: [null, null, 'documentation', null, 'about' ] }
```
