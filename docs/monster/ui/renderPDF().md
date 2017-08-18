# [monster][monster].[ui][ui].renderPDF()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)


### Syntax
```javascript
monster.ui.renderPDF(file, target[, args]);

// Example
template.find('#upload').fileUpload({
	inputOnly: true,
	wrapperClass: 'file-upload input-append',
	btnClass: 'monster-button',
	success: function(results) {
		monster.ui.renderPDF(results[0].file, template.find('.pdf-container'));
	}
});
```

### Parameters

###### `file`: [File][file] (mandatory)

File received by a fileUpload plugin.

###### `target`: [jQuery object][jquery] (mandatory)

Target in which the iframe containing the PDF will be added

### Description
This helper will take a file and show it in a container, in a PDF viewer

[monster]: ../../monster.md
[ui]: ../ui.md

[file]: https://developer.mozilla.org/en-US/docs/Web/API/File
[jquery]: http://api.jquery.com/Types/#jQuery
