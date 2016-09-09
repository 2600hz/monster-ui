# [monster][monster].[ui][ui].mask()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)

### Syntax
```javascript
monster.ui.mask(target, type);
```

### Parameters
* `target` (mandatory)

 Type: [jQuery object][jquery]

 Field on which the method will be applied.

* `type` (mandatory)

 Type: [String][String]

Type of mask to choose from. Available options: 'phoneNumber' (optional + followed by digits), 'macAddress' (12 hexa decimal characters), 'extension' (only digits).

### Description
This helper uses the mask jQuery plug-in that forces the users to input only the selected characters.
Documentation available: https://igorescobar.github.io/jQuery-Mask-Plugin/

[monster]: ../../monster.md
[ui]: ../ui.md
[jquery]: http://api.jquery.com/Types/#jQuery
[PlainObject]: http://api.jquery.com/Types/#PlainObject
[String]: http://api.jquery.com/Types/#String
