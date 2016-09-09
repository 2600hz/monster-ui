(function ($) {
	var id = 0;
		defaultOptions = {
			bigBtnText: 'Select a file',
			btnText: 'Select a file',
			inputOnly: false,
			multiple: false,
			resultType: '[]',
			dataFormat: 'dataURL'
		};

	$.fn.fileUpload = function(args) {
		var callbackSuccess = args && args.hasOwnProperty('success') ? args.success : undefined,
			callbackError = args && args.hasOwnProperty('error') ? args.error : undefined,
			options = $.extend({}, defaultOptions, args),
			fileInput = $(this).css('display', 'none').prop('multiple', options.multiple),
			wrapper = $('<div id="file_upload_wrapper_' + ++id + '">'),
			input = $('<input type="text" id="file_upload_input_' + id + '">'),
			button = $('<button type="button" id="file_upload_button_' + id + '">' + options.btnText + '</button>'),
			bigButton = $('<button type="button" id="file_upload_bigButton_' + id + '">' + options.bigBtnText + '</button>');

		options.hasOwnProperty('btnClass') && button.addClass(options.btnClass);
		options.hasOwnProperty('inputClass') && input.addClass(options.inputClass);
		options.hasOwnProperty('bigBtnClass') && bigButton.addClass(options.bigBtnClass);
		options.hasOwnProperty('wrapperClass') && wrapper.addClass(options.wrapperClass);

		if ( options.inputOnly || (options.hasOwnProperty('filesList') && options.filesList.length > 0) ) {
			if ( options.hasOwnProperty('filesList') && options.filesList.length > 0 ) {
				input.val(options.filesList.join(', '));
			}

			wrapper.insertAfter(fileInput).append(fileInput, input, button);
		}
		else {
			wrapper.insertAfter(fileInput).append(fileInput, input, button);
			bigButton.insertBefore(wrapper);

			wrapper.hide();

			$('body').delegate('#file_upload_bigButton_' + id, 'click', function() {
				fileInput.focus().trigger('click');
			});
		}

		wrapper.delegate('#file_upload_button_' + id, 'click', function() {
			fileInput.focus().trigger('click');
		});

		wrapper.delegate('input[type="file"]', 'change', function(event) {
			var filesList = Array.prototype.slice.call(event.target.files),
				namesList = [],
				successList = [],
				error = false,
				errorsList = {
					mimeTypes: [],
					size: []
				},
				results,
				names;

			if ( options.resultType === '[]' ) {
				results = [];
			}
			else if ( options.resultType === '{}' ) {
				results = {};
			}

			filesList.forEach(function(el) {
				var pass = true;

				if ( options.hasOwnProperty('mimeTypes') && options.mimeTypes.indexOf(el.type) === -1 ) {
					errorsList.mimeTypes.push(el.name);
					error = true;
					pass = false;
				}

				if ( options.hasOwnProperty('maxSize') && el.size > options.maxSize * 1000000 ) {
					errorsList.size.push(el.name);
					error = true;
					pass = false;
				}

				if ( pass ) {
					successList.push(el);
					namesList.push(el.name);
				}
			});

			if ( successList.length > 0 ) {
				var i = successList.length;

				successList.forEach(function(el) {
					var reader = new FileReader();

					reader['readAs'.concat(options.dataFormat.charAt(0).toUpperCase(), options.dataFormat.slice(1))](el);

					reader.onloadend = function() {
						if ( options.resultType === '[]' ) {
							results.push({ name: el.name, file: reader.result });
						}
						else if ( options.resultType === '{}' ) {
							results[el.name] = reader.result;
						}

						if ( --i === 0 ) {
							callbackSuccess && callbackSuccess(results);
							button.trigger('blur');
						}
					};
				});

				if ( !options.inputOnly && bigButton.is(':visible') ) {
					bigButton.fadeOut(function() {
						wrapper.fadeIn();
					});
				}

				names = namesList.join(', ');

				if ( names !== '') {
					if ( input.val() !== '' ) {
						var color = input.css('color'),
							bgColor = input.css('backgroundColor');

						input.animate({'color': bgColor},300, function() {
							input.val(names);
							input.animate({'color': color},300);
						});
					}
					else {
						input.val(names);
					}
				}
			}

			if ( error ) {
				callbackError && callbackError(errorsList);

				if ( bigButton.is(':visible') ) {
					bigButton.trigger('blur');
				}
				else {
					button.trigger('blur')
				}
			}
		});

		wrapper.delegate('#file_upload_input_'.concat(id), 'blur', function() {
			fileInput.trigger('blur');
		});

		wrapper.delegate('#file_upload_input_'.concat(id), 'keydown', function(event) {
			switch ( event.which ) {
				case 8:
				case 46:
					fileInput.replaceWith(fileInput = fileInput.clone(true));
					fileInput.trigger('change');
					input.val('');
					break;
				case 9:
					return;
				case 13:
					fileInput.trigger('click');
					break;
				default:
					return false;
			}
		});
	};
})(jQuery);