title: mask()

# monster.ui.mask()

## Syntax
```javascript
monster.ui.mask(target, type[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | Field on which the method will be applied. | `jQuery` | | `true`
`type` | Type of mask to apply. Available presets: `'phoneNumber', 'macAddress' 'ipv4', 'extension'`. | `String('phoneNumber' | 'macAddress' | 'AAA 000-S0S'))` | | `true`
`options` | Options to be applied in case `type` parameter is not a preset. ([check available options][mask-plugin])| `Object` | | `false`

## Description
This helper is a wrapper over the [jQuery Mask plugin][mask-plugin].

[mask-plugin]: https://igorescobar.github.io/jQuery-Mask-Plugin/
