# monster.ui.renderPDF()

## Syntax
```javascript
monster.ui.renderPDF(file, target[, options]);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`file` | File received by a fileUpload plugin. | `File` | | `true`
`target` | Target in which the iframe containing the PDF will be added. | `jQuery` | | `true`
`options` | | `Object`([#/options](#options)) | | `false`

#### options
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`width` | Width of the iframe. | `String` | `100%` | `false`
`height` | Height of the iframe. | `String` | `700px` | `false`

## Description
This helper will take a file and show it in a container, in a PDF viewer

## Example
### Preview an uploaded file
```javascript
template
  .find('#upload')
    .fileUpload({
      inputOnly: true,
      wrapperClass: 'file-upload input-append',
      btnClass: 'monster-button',
      success: function(results) {
        monster.ui.renderPDF(results[0].file, template.find('.pdf-container'));
      }
    });
```
