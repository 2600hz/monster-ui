# [monster][monster].[ui][ui].codecSelector()
The `monster.ui.codecSelector()` method generates a selector for audio/video codecs.

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Return](#return)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.ui.codecSelector([type, target, selectedItems]);
```

### Parameters
* `type` (mandatory)
Type: [String][string_literal]

* `target` (mandatory)
Type: [jQuery object][jquery]

* `selectedItems` (optional)
 Type: [Array][array_literal]


For `type`, you can set the value to either `audio` or `video`. 

Setting the codecSelector to `audio` will give the user a list of Audio Codecs to choose from: 
- 'OPUS'
- 'CELT@32000h'
- 'G7221@32000h'
- 'G7221@16000h'
- 'G722'
- 'speex@32000h'
- 'speex@16000h'
- 'PCMU'
- 'PCMA'
- 'G729'
- 'GSM'
- 'CELT@48000h'
- 'CELT@64000h'

Setting the codecSelector to `video` will give the user a list of Audio Codecs to choose from:
- 'VP8'
- 'H261'
- 'H263'
- 'H264'


For the `target`, you can set it to any jQuery container where the selector will be painted.

Finally for the `selectedItems`, you can set an Array of the items you would like to have selected by the defaults in the selector.
Example for an audio codecSelector, you could call it with : `monster.ui.codecSelector('audio', target, ['PCMU', 'G729']);`

### Return
This method returns the generated widget as a [jQuery object][jquery].

This item also has an additional method, named `getSelectedItems`, used to get the list of selected items in the selector.

Example:
````
var obj = monster.ui.codecSelector('audio', target, ['PCMU', 'G729']);
obj.getSelectedItems(); // Would return => ['PCMU', 'G729']
````

### Description
This helper generates two columns, a list on the left of available codecs to choose from, and a list of selected codecs on the right. We use this helper everywhere we need to select codecs. You can find it in the SmartPBX or the PBX Connector for examples!

### Examples
* Create a selector in a template, and get the list of selected codecs when clicking a button
```javascript
....

var template = $(monster.template(self, 'dialog-example')),
	codecSelector = monster.ui.codecSelector('audio', template, ['PCMU','PCMA','G7221@32000h','G722']);

template.find('.save').on('click', function() {
	var selectedCodecs = codecSelector.getSelectedItems();

	self.updateCodecsUser(selectedCodecs);
});

....
```

![Image showing a simple Monster-UI Codec Selector](http://i.imgur.com/WW8KnF4.png)

The method only generates the part inside the red rectangle in the picture above.

[monster]: ../../monster.md
[ui]: ../ui.md

[jquery]: http://api.jquery.com/Types/#jQuery
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[array_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Array_literals
[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals