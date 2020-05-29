(function($) {
	function guid() {
		var result = '';

		for (var i = 0; i < 4; i++) {
			result += (Math.random().toString(16)).substr(2, 8);
		}

		return result;
	}

	$.widget('custom.disableAutoFill', {
		options: {
			validator: function() {
				return true;
			}
		},

		idToName: {},
		idToPassword: {},

		_create: function _create() {
			var widget = this;
			var $form = widget.element;

			[
				$form,
				$form.find('input[name]')
			].forEach(function(el) {
				$(el).prop('autocomplete', 'off');
			});

			$form
				.find('button[type="submit"]')
					.addClass('disableAutoFillSubmit')
					.prop('type', 'button');

			this._obfuscateInputNames();
			this._obfuscatePasswordInputs();

			$form
				.on('focus', '.disableAutoFillPassword', function() {
					$(this)
						.val(widget.idToPassword[this.disableAutoFillPasswordId])
						.select();
				})
				.on('blur', '.disableAutoFillPassword', function() {
					var $input = $(this);
					var value = $input.val();

					widget.idToPassword[this.disableAutoFillPasswordId] = value;

					$input.val(value.replace(/./g, '\u25CF'));
				})
				.on('click', '.disableAutoFillSubmit', function() {
					$form.find('input[name]').each(function() {
						$(this).prop('name', widget.idToName[this.disableAutofillNameId]);
					});
					$form.find('.disableAutoFillPassword').each(function() {
						$(this)
							.val(widget.idToPassword[this.disableAutoFillPasswordId])
							.prop('type', 'password');
					});

					if (widget.options.validator()) {
						$form.submit();
					}

					widget.idToName = {};
					widget._obfuscateInputNames();

					widget.idToPassword = {};
					widget._obfuscatePasswordInputs();
				});
		},

		_obfuscateInputNames: function _obfuscateInputNames() {
			var widget = this;

			widget.element.find('input[name]').each(function() {
				var $input = $(this);
				var name = $input.prop('name');

				this.disableAutofillNameId = this.disableAutofillNameId || guid();
				widget.idToName[this.disableAutofillNameId] = name;

				$input.prop('name', this.disableAutofillNameId);
			});
		},

		_obfuscatePasswordInputs: function _obfuscatePasswordInputs() {
			var widget = this;

			widget.element.find('input[type="password"]').each(function() {
				var $input = $(this);
				var value = $input.val();

				this.disableAutoFillPasswordId = this.disableAutoFillPasswordId || guid();
				widget.idToPassword[this.disableAutoFillPasswordId] = value;

				$input
					.val(value.replace(/./g, '\u25CF'))
					.prop('type', 'text')
					.addClass('disableAutoFillPassword');
			});
		}
	});
}(jQuery));
