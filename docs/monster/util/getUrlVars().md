title: getUrlVars()

# monster.util.getUrlVars()

## Syntax
```javascript
monster.util.getUrlVars([key]);
```
### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`key` | If specified, will return the value of a specific parameter (`key`). | `String` | | `false`

### Return value
An `Object` literal of all the URL parameters or a `String` representation of the value corresponding to the URL parameter `key`.

## Description
This method returns the different URL GET parameters of the window.

## Example
```javascript
// page url:
// http://mycompany.com/monster?test=documentation&date=142109383929

monster.util.getUrlVars();
// output
{
  test: 'documentation',
  date: '142109383929'
}

monster.util.getUrlVars('test');
// output
'documentation'

monster.util.getUrlVars('nope');
// ouput
undefined
```
