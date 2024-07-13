# monster.ui.codecSelector()
The `monster.ui.codecSelector()` method generates a selector for audio/video codecs.

## Syntax
```javascript
monster.ui.codecSelector([type, target, selectedItems]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`type` | Type of codecs to manage. | `String('audio' | 'video')` | | `true`
`target` | Container to append the widget to. | `jQuery` | | `true`
`selectedItems` | List of codecs already selected | `Array` | | `false`
`selectedItems.[]` | Name of the codec | `String` | | `false`

### Return value
A `jQuery` object representing the codec selector.

This object exposes a `getSelectedItems` method to retrieve the list of selected items.

## Description
This helper generates two columns, a list on the left of available codecs to choose from, and a list of selected codecs on the right. We use this helper everywhere we need to select codecs. You can find it in the SmartPBX or the PBX Connector for examples!

### Available Codecs
Audio | Video
:-: | :-:
`OPUS` | `VP8`
`CELT@32000h` | `H261`
`G7221@32000h` | `H263`
`G7221@16000h` | `H264`
`G722` |
`speex@32000h` |
`speex@16000h` |
`PCMU` |
`PCMA` |
`G729` |
`GSM` |
`CELT@48000h` |
`CELT@64000h` |

## Examples
### Create a selector in a template, and get the list of selected codecs when clicking a button
```javascript
var preselectedCodecs = ['PCMU','PCMA','G7221@32000h','G722'];
var template = $(app.getTemplate({
  name: 'dialog-example'
}));
var codecSelector = monster.ui.codecSelector('audio', template, preselectedCodecs);
var selectedCodecs;

template
  .find('.save')
    .on('click', function() {
      selectedCodecs = codecSelector.getSelectedItems();

      // Do something with `selectedCodecs`
    });
```

![Image showing a simple Monster-UI Codec Selector](http://i.imgur.com/WW8KnF4.png)

The method only generates the part inside the red rectangle in the picture above.

