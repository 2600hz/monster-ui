# monster.ui.slider()

## Syntax
```javascript
monster.ui.slider(target, options);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`target` | A jQuery object inside which the slider will be inserted using the [append()][append] method. | `jQuery` | | `true`
`options` | | `Object`([#/options](#options)) | | `false`

#### options
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`i18n` | Define the text in the tooltips. | `String` | | `false`
`unit` | Unit of the value for the handles and limits. | `String` | | `false`
`friendlyPrint` | Takes the value returned by the slider and returns a different value, to make it look friendlier to the end-user. | `Function` | | `false`

### Return value
A `jQuery` object representing the slider widget.

## Description
The `monster.ui.slider()` method allows you to generate a jQuery Slider with the look and feel of Monster UI. All the original options of the slider are available.

## Examples
### Create a slider with a max and min handle
```javascript
var target = $('#slider');
var options = {
  range: true,
  min: 100,
  max: 50000,
  step: 100,
  value: 1500,
  unit: 'MB',
  i18n: {
    maxHandle: {
      text: 'Throttle Data at:'
    },
    minHandle: {
      text: 'Warn Administrators at:'
    }
  }
};

monster.ui.slider(target, options);
```

### Create a slider with defined steps
```javascript
var target = $('#slider');
var options = {
  range: 'max',
  steps: [30, 60, 300, 1800, 3600],
  value: 30,
  friendlyPrint: function(val) {
    return monster.util.friendlyTimer(val, 'shortVerbose');
  },
  i18n: {
    maxHandle: {
      text: "Abort After"
    }
  }
};

monster.ui.slider(target, options);
```
We show the use of the friendlyPrint function, which will take the value selected by the user and return a different value, that would be more meaningful to the end-user.

In this example, instead of displaying 3600 in the tooltip of the result, we would display "1 hour". In order to get the real value ("3600"), the developer needs to check the value stored in the data-real-value attribute of the slider ($('.slider-container [data-real-value]').attr('data-real-value') for example).

[append]: http://api.jquery.com/append/

