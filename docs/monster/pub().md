# monster.pub()

## Syntax
```javascript
monster.pub(topic[, data]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`topic` | Alias for the method to publish. | `String` | | `true`
`data` | Parameters passed to the method published. | `Object`, `Array`, `String`, `Number`, `Function` | `{}` | `false`

## Description
The `monster.pub()` method let you publish all the methods that were exposed by other developers of Monster applications or let you access the Monster Core Apps and Monster Common Controls methods to perform common actions (see examples).

To see how to make a method publishable, go to the related [documentation][events].

## Examples
### Hide `myaccount` by publishing the related method exposed by the `myaccount` core app
```javascript
monster.pub('myaccount.hide');
```
### Invoke the `buyNumbers` common control
```javascript
monster.pub('common.buyNumbers');
```

[events]: ../events.md
