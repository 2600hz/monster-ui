title: parseQueryString()

# monster.util.parseQueryString()

## Syntax
```javascript
monster.util.parseQueryString(queryString);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`queryString` | Query string to be parsed as an object. | `String` | | `true`

### Return value
An `Object` representation of the query string parameters.

## Description
This method parses a query string into an object representation of its parameters.

All of the parameter values are converted to strings.

If the parameter key ends with a pair of square brackets, it is interpreted as an array. If an index is specified between the brackets, then the value is added in the specified position. If no index is specified, then the value is added at the end of the array.

Also, if a parameter key has no square braces, but it is repeated more than once in the query string, it is also interpreted as an array, whose values will be added in the same order as they appear in the string.

These are valid query string representations of the same array:

* `'colors=red&colors=blue&colors=yellow'`
* `'colors[]=red&colors[]=blue&colors[]=yellow'`
* `'colors[0]=red&colors[1]=blue&colors[2]=yellow'`

## Example
```javascript
monster.util.parseQueryString('param1=22&param2=false&param3=hello')
// output: { param1: "22", param2: "false", param3: "hello" }

monster.util.parseQueryString('palette=basic&colors[]=red&colors[]=blue&colors[]=yellow')
// output: { palette: "basic", colors: [ "red", "blue", "yellow" ] }
```
