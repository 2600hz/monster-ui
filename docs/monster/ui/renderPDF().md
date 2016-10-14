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
* `file` (mandatory)

 Type: File

 File received by a fileUpload plugin.

* `target` (mandatory)

 Type: [jQuery object][jquery]

 Target in which the iframe containing the PDF will be added

### Description
This helper will take a file and show it in a container, in a PDF viewer

[monster]: ../../monster.md
[ui]: ../ui.md
[jquery]: http://api.jquery.com/Types/#jQuery
[PlainObject]: http://api.jquery.com/Types/#PlainObject
[Integer]: http://api.jquery.com/Types/#Integer
[Boolean]: http://api.jquery.com/Types/#Boolean
[String]: http://api.jquery.com/Types/#String
