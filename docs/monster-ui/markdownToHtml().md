title: markdownToHtml()

# monster.ui.markdownToHtml()
The `monster.ui.markdownToHtml` render markdown content back to HTML.

## Syntax
```javascript
monster.ui.markdownToHtml(content);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`content` | Markdown content that needs to be rendered to HTML | `String` | | `true`

## Description
This helper will allows yo to render markdown content to HTML

## Example
```javascript
var markdownContent = '**Hello world**',
  description = monster.ui.markdownToHtml(markdownContent);

  template.find('.description').html(description);
```
