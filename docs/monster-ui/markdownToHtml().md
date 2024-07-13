# monster.ui.markdownToHtml()
The `monster.ui.markdownToHtml` renders markdown content as HTML.

## Syntax
```javascript
monster.ui.markdownToHtml(content);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`content` | Markdown content to be rendered as HTML | `String` | | `true`

## Description
This helper allows you to render markdown content as HTML

## Example
```javascript
var markdownContent = '**Hello world**',
    description = monster.ui.markdownToHtml(markdownContent);

template.find('.description').html(description);
```
