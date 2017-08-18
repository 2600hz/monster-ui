# [monster][monster].[ui][ui].mask()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)

### Syntax
```javascript
monster.ui.mask(target, type);
```

### Parameters

###### `target`: [jQuery object][jquery] (mandatory)

Field on which the method will be applied.

###### `type`: [String][string_literal] (mandatory)

Type of mask to choose from. Available options: 'phoneNumber' (optional + followed by digits), 'macAddress' (12 hexa decimal characters), 'extension' (only digits).

### Description
This helper uses the mask jQuery plug-in that forces the users to input only the selected characters.
Documentation available: https://igorescobar.github.io/jQuery-Mask-Plugin/

[monster]: ../../monster.md
[ui]: ../ui.md
[jquery]: http://api.jquery.com/Types/#jQuery
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
