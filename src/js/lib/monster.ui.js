define(function(require) {
	var $ = require('jquery');
	var _ = require('lodash');
	var monster = require('monster');
	var Handlebars = require('handlebars');
	var Toastr = require('toastr');
	var introJs = require('introJs');
	var renderJSON = require('renderjson');
	var footable = require('footable');
	var form2object = require('form2object');
	var Mousetrap = require('mousetrap');
	var Drop = require('drop');
	var Clipboard = require('clipboard');
	var moment = require('moment');
	var SimpleMDE = require('simplemde');
	var marked = require('marked');
	var Popup = require('popup-redirect');
	var JSONEditor = require('jsoneditor');

	// Import for side effects only
	require([
		'chosen',
		'disableAutoFill',
		'hotkeys',
		'image-select',
		'mask',
		'moment-timezone',
		'monthpicker',
		'timepicker',
		'validate',
		'wysiwyg'
	]);

	var customValidationInitialized = false;
	var isTabLoadingInProgress = false;
	var keyboardShortcuts = {};

	return {
		init: function() {
			initializeUIComponents();
			initializeHandlebarsHelper();

			return {
				accountArrayToTree: accountArrayToTree,
				addShortcut: addShortcut,
				alert: alert,
				charsRemaining: charsRemaining,
				chosen: chosen,
				cidNumberSelector: cidNumberSelector,
				charges: charges,
				clipboard: clipboardWrapper,
				codecSelector: codecSelector,
				confirm: confirm,
				countrySelector: countrySelector,
				datepicker: datepicker,
				dialog: dialog,
				dialpad: dialpad,
				disableAutoFill: disableAutoFill,
				fancyTabs: fancyTabs,
				footable: footableWrapper,
				friendlyError: friendlyError,
				fullScreenModal: fullScreenModal,
				fullScreenPicker: fullScreenPicker,
				generateAppLayout: generateAppLayout,
				generateAppNavbar: generateAppNavbar,
				getFormData: getFormData,
				getJsoneditor: getJsoneditor,
				getShortcuts: getShortcuts,
				getSvgIconTemplate: getSvgIconTemplate,
				getTemplatePhoneNumber: getTemplatePhoneNumber,
				handleDisplayFootable: handleDisplayFootable,
				highlight: highlight,
				initCustomValidation: initCustomValidation,
				initRangeDatepicker: initRangeDatepicker,
				insertTemplate: insertTemplate,
				jsErrorDialog: jsErrorDialog,
				jsoneditor: jsoneditor,
				keyValueEditor: keyValueEditor,
				keyValueSelector: keyValueSelector,
				linkedColumns: linkedColumns,
				loadTab: loadTab,
				markdownEditor: markdownEditor,
				markdownToHtml: markdownToHtml,
				mask: mask,
				monthpicker: monthpicker,
				numberPicker: numberPicker,
				onNavbarTabClick: onNavbarTabClick,
				overlay: getOverlayInstance(),
				paintNumberFeaturesIcon: paintNumberFeaturesIcon,
				popover: popover,
				popupRedirect: popupRedirect,
				protectField: protectField,
				removeShortcut: removeShortcut,
				renderPDF: renderPDF,
				renderJSON: renderJSONWrapper,
				requestErrorDialog: requestErrorDialog,
				results: results,
				showPasswordStrength: showPasswordStrength,
				slider: slider,
				stepByStep: stepByStep,
				tabs: tabs,
				timepicker: timepicker,
				timer: timer,
				toast: toast,
				tooltips: tooltips,
				valid: valid,
				validate: validate,
				wysiwyg: wysiwyg
			};
		}
	};

	/**
	 * @return {Object}
	 */
	function getOverlayInstance() {
		return {
			isActive: false,

			id: 'monster_overlay',

			show: function(pArgs) {
				var self = this;
				var args = pArgs || {};
				var cssToExclude = args.cssToExclude || [];
				var onClick = args.onClick;
				var template = $('<div id="' + self.id + '"></div>');

				self.hide();

				// We support unique selector or array of selector
				cssToExclude = _.isArray(cssToExclude) ? cssToExclude : [ cssToExclude ];

				self.isActive = true;

				template.on('click', function() {
					self.hide(args);

					onClick && onClick();
				});

				_.each(cssToExclude, function($selector) {
					$selector.addClass('over-monster-overlay');
				});

				$('body').append(template);

				args.afterShow && args.afterShow();
			},

			hide: function(pArgs) {
				var self = this;
				var args = pArgs || {};

				$('.over-monster-overlay').removeClass('over-monster-overlay');

				self.isActive = false;

				$('#' + self.id + '').remove();

				args.afterHide && args.afterHide();
			},

			toggle: function(args) {
				this.isActive ? this.hide(args) : this.show(args);
			}
		};
	}

	function initializeHandlebarsHelper() {
		Handlebars.registerHelper({
			coalesce: function() {
				var args = _.toArray(arguments);

				if (args.length < 2) {
					throw new Error('Handlebars Helper "coalesce" needs at least 2 parameters');
				}

				// Last argument is discarded because it is handlebars' options parameter
				for (var i = 0; i < args.length - 1; i++) {
					if (!_.isNil(args[i])) {
						return args[i];
					}
				}
				return null;
			},

			compare: function(lvalue, operator, rvalue, options) {
				var operators, result;

				if (arguments.length < 3) {
					throw new Error('Handlebars Helper "compare" needs 2 parameters');
				}

				if (options === undefined) {
					options = rvalue;
					rvalue = operator;
					operator = '===';
				}

				operators = {
					'==': function(a, b) { return a == b; }, // eslint-disable-line eqeqeq
					'===': function(a, b) { return a === b; },
					'!=': function(a, b) { return a != b; }, // eslint-disable-line eqeqeq
					'!==': function(a, b) { return a !== b; },
					'<': function(a, b) { return a < b; },
					'>': function(a, b) { return a > b; },
					'<=': function(a, b) { return a <= b; },
					'>=': function(a, b) { return a >= b; },
					'typeof': function(a, b) { return typeof a === b; } // eslint-disable-line valid-typeof
				};

				if (!operators[operator]) {
					throw new Error('Handlebars Helper "compare" doesn\'t know the operator ' + operator);
				}

				result = operators[operator](lvalue, rvalue);

				if (result) {
					return options.fn(this);
				} else {
					return options.inverse(this);
				}
			},

			debug: function(optionalValue) {
				console.log('Current Context: ', this);

				if (optionalValue) {
					console.log('Value: ', optionalValue);
				}
			},

			formatBytes: function(bytes, pDigits) {
				var digits = typeof pDigits === 'number' ? pDigits : undefined;
				var data = monster.util.formatBytes(bytes, digits);

				return data.value + ' ' + data.unit.symbol;
			},

			formatMacAddress: function(macAddress) {
				return monster.util.formatMacAddress(macAddress);
			},

			formatPhoneNumber: function(phoneNumber) {
				phoneNumber = (phoneNumber || '').toString();

				return monster.util.formatPhoneNumber(phoneNumber);
			},

			formatPrice: function() {
				var args = _.toArray(arguments);

				return monster.util.formatPrice({
					price: _.size(args) >= 2 ? args[0] : 0,
					digits: _.size(args) >= 3 ? args[1] : undefined,
					withCurrency: _.size(args) >= 4 ? args[2] : undefined
				});
			},

			formatVariableToDisplay: function(variable) {
				return monster.util.formatVariableToDisplay(variable);
			},

			friendlyTimer: function(seconds) {
				return monster.util.friendlyTimer(seconds);
			},

			getUserFullName: function(pUser) {
				var args = _.toArray(arguments);

				// Handlebars always adds an additional argument for context
				// If there is only one argument, it corresponds to this context object
				var user = (args.length === 1) ? undefined : pUser;

				return monster.util.getUserFullName(user);
			},

			ifInArray: function(elem, list, options) {
				if (list && list.indexOf(elem) > -1) {
					return options.fn(this);
				}

				return options.inverse(this);
			},

			isPrivLevelAdmin: function(pUser, pOptions) {
				var user = pUser.hasOwnProperty('priv_level') ? pUser : undefined;
				var options = !pOptions ? pUser : pOptions;

				return options[monster.util.isAdmin(user) ? 'fn' : 'inverse'](this);
			},

			isReseller: function(pAccount, pOptions) {
				var account = pAccount.hasOwnProperty('is_reseller') ? pAccount : undefined;
				var options = !pOptions ? pAccount : pOptions;

				return options[monster.util.isReseller(account) ? 'fn' : 'inverse'](this);
			},

			isSuperDuper: function(pAccount, pOptions) {
				var account = pAccount.hasOwnProperty('superduper_admin') ? pAccount : undefined;
				var options = !pOptions ? pAccount : pOptions;

				return options[monster.util.isSuperDuper(account) ? 'fn' : 'inverse'](this);
			},

			languageSelector: function(options) {
				var namedOptions = options.hash;
				var specialArgs = ['selectedLanguage', 'showDefault'];
				var args = _
					.chain(namedOptions)
					.pick(specialArgs)
					.merge({
						attributes: _.omit(namedOptions, specialArgs)
					})
					.value();
				return new Handlebars.SafeString(
					getLanguageSelectorTemplate(args)
				);
			},

			lookupPath: function(object, path, pDefaultValue) {
				// If there are more than 3 arguments, it means that pDefaultValue is not the
				// last argument (which corresponds to Handlebar's options parameter), so it
				// should be the default value.
				var defaultValue = (_.toArray(arguments).length > 3) ? pDefaultValue : undefined;

				return _.get(object, path, defaultValue);
			},

			monsterCheckbox: function() {
				var templateData = {
					cssClass: 'monster-checkbox',
					checkbox: new Handlebars.SafeString(arguments[arguments.length - 1].fn(this))
				};

				for (var i = 0; i < arguments.length - 1; i++) {
					if (_.isString(arguments[i])) {
						switch (arguments[i]) {
							case 'large-checkbox':
							case 'checkbox-large':
								templateData.cssClass = 'monster-checkbox-large';
								break;
							case 'prepend-label':
							case 'label-prepend':
								templateData.prepend = true;
								break;
							default:
								templateData.label = arguments[i];
								break;
						}
					}
				}

				return monster.template(monster.apps.core, 'monster-checkbox-template', templateData);
			},

			monsterNumberWrapper: function(number) {
				return getTemplatePhoneNumber(number.toString());
			},

			monsterPanelText: function(title, type, className) {
				var htmlContent = arguments[arguments.length - 1].fn(this);
				var validTypes = ['info', 'success', 'danger', 'warning'];
				var type = typeof type === 'string' && validTypes.indexOf(type) >= 0 ? type : 'info';
				var templateData = {
					className: typeof className === 'string' ? className : '',
					title: title,
					content: new Handlebars.SafeString(htmlContent)
				};
				// We set the 6th argument to true so we don't remove white-spaces. Important to display API response with properly formatted JSON.
				var template = monster.template(monster.apps.core, 'monster-panel-text-' + type, templateData, false, false, true);

				return new Handlebars.SafeString(template);
			},

			monsterRadio: function() {
				var templateData = {
					cssClass: 'monster-radio',
					checkbox: new Handlebars.SafeString(arguments[arguments.length - 1].fn(this))
				};

				for (var i = 0; i < arguments.length - 1; i++) {
					if (_.isString(arguments[i]) || _.isNumber(arguments[i])) {
						switch (arguments[i]) {
							case 'large-radio':
							case 'radio-large':
								templateData.cssClass = 'monster-radio-large';
								break;
							case 'prepend-label':
							case 'label-prepend':
								templateData.prepend = true;
								break;
							default:
								templateData.label = arguments[i];
								break;
						}
					}
				}

				return monster.template(monster.apps.core, 'monster-radio-template', templateData);
			},

			monsterSignalIndicator: function(strength) {
				var label = _.last(Array.prototype.slice.call(arguments)).fn(this);
				var dataToTemplate = {
					strength: strength,
					label: new Handlebars.SafeString(label)
				};
				var template = monster.template(monster.apps.core, 'monster-signal-indicator', dataToTemplate);

				return new Handlebars.SafeString(template);
			},

			monsterSlider: function(settings) {
				return new Handlebars.SafeString(slider(settings));
			},

			monsterSwitch: function(options) {
				var checkboxHtml = options.fn(this).trim() || '<input type="checkbox">';
				var checkbox = $(checkboxHtml);
				var onLabel = checkbox.data('on') || monster.apps.core.i18n.active().on;
				var offLabel = checkbox.data('off') || monster.apps.core.i18n.active().off;

				return monster.template(monster.apps.core, 'monster-switch-template', {
					checkbox: new Handlebars.SafeString(checkboxHtml),
					on: onLabel,
					off: offLabel
				});
			},

			monsterText: function(type, className) {
				var htmlContent = arguments[arguments.length - 1].fn(this);
				var validTypes = ['info', 'question', 'error', 'warning'];
				var type = typeof type === 'string' && validTypes.indexOf(type) >= 0 ? type : 'info';
				var templateData = {
					className: className || '',
					content: new Handlebars.SafeString(htmlContent)
				};
				// We set the 6th argument to true so we don't remove white-spaces. Important to display API response with properly formatted JSON.
				var template = monster.template(monster.apps.core, 'monster-text-' + type, templateData, false, false, true);

				return new Handlebars.SafeString(template);
			},

			numberFeatures: function(features) {
				return paintNumberFeaturesIcon(features);
			},

			replaceVar: function(stringValue, variable) {
				return stringValue.replace(/{{variable}}/g, variable);
			},

			select: function(value, options) {
				var $el = $('<select />').html(options.fn(this));
				if (!_.isArray(value)) {
					value = [ value ];
				}
				_.forEach(value, function(data) {
					$el.find('[value="' + data + '"]').attr({ 'selected': 'selected' });
				});
				return $el.html();
			},

			svgIcon: function(id, options) {
				return new Handlebars.SafeString(
					getSvgIconTemplate({
						id: id,
						attributes: options.hash
					})
				);
			},

			telicon: function(id, options) {
				return new Handlebars.SafeString(
					getSvgIconTemplate({
						id: _.startsWith(id, 'telicon2--') ? id : 'telicon2--' + id,
						attributes: options.hash
					})
				);
			},

			times: function(max, options) {
				var ret = '';

				for (var i = 1; i <= max; ++i) {
					ret += options.fn(i);
				}

				return ret;
			},

			toFriendlyDate: function(timestamp, format, user, isGregorian) {
				// Handlebars always adds an additional argument for context, so we make sure the argument we receive are the ones we expect
				var args = Array.prototype.slice.call(arguments).slice(0, -1);
				var timestamp = args[0];
				var format = _.isString(args[1]) ? args[1] : undefined;
				var user = _.isObject(args[2]) ? args[2] : undefined;
				var isGregorian = _.isBoolean(args[3]) ? args[3] : undefined;

				return monster.util.toFriendlyDate(timestamp, format, user, isGregorian);
			},

			toLowerCase: function(stringValue) {
				return stringValue.toString().toLowerCase();
			},

			toUpperCase: function(stringValue) {
				return stringValue.toString().toUpperCase();
			},

			tryI18n: function(mapI18n, key) {
				return monster.util.tryI18n(mapI18n, key);
			}
		});
	}

	function initializeUIComponents() {
		var $coreWrapper = $('.core-wrapper');

		/**
		 * We have a special component allowing checkbox in Bootstrap dropwdown
		 * By default Bootstrap expands the dropdown elements so we need to
		 * prevent that if the checkbox is selected
		 */
		$coreWrapper
			.on('click', '.monster-select-dropdown', function(event) {
				event.stopPropagation();

				var $this = $(this);

				if ($this.find('.monster-checkbox').has(event.target).length === 0) {
					$this
						.find('.dropdown')
							.toggleClass('open');
				}
			});

		/**
		 * Add 'splash effect' on click for every monster-button
		 */
		$coreWrapper
			.on('click', '*[class*="monster-button"]:not(.disabled)', function(event) {
				var $this = $(this);
				var $splash = $('<div>').addClass('monster-splash-effect');
				var offset = $this.offset();
				var xPos = event.pageX - offset.left;
				var yPos = event.pageY - offset.top;

				$splash
					.css({
						width: $this.height(),
						height: $this.height(),
						top: yPos - ($splash.height() / 2),
						left: xPos - ($splash.width() / 2)
					})
					.appendTo($this);

				window.setTimeout(function() {
					$splash.remove();
				}, 1500);
			});

		$.widget('ui.dialog', $.extend({}, $.ui.dialog.prototype, {
			_title: function(title) {
				if (!this.options.title) {
					title.html('&#160;');
				} else {
					title.html(this.options.title);
				}
			}
		}));
	}

	/**
	 * @param  {Object} args
	 * @param  {String} args.mainTitle
	 * @param  {String} args.subTitle
	 * @param  {String} args.buttonText
	 * @param  {Object[]} args.choices
	 * @param  {Boolean} [args.hasIcons=false]
	 * @param  {Function} [args.afterSelected]
	 */
	function fullScreenPicker(args) {
		var dataTemplate = {
			mainTitle: args.mainTitle,
			subTitle: args.subTitle,
			buttonText: args.buttonText,
			choices: args.choices,
			hasIcons: args.hasIcons || false
		};
		var template = $(monster.template(monster.apps.core, 'monster-full-screen-picker', dataTemplate));
		var modal = fullScreenModal(template);

		template.find('.choice').on('click', function() {
			var isSelected = $(this).hasClass('selected');

			template.find('.choice').removeClass('selected');

			if (!isSelected) {
				$(this).addClass('selected');
			}
		});

		template.find('#select_button').on('click', function() {
			var validId = template.find('.choice.selected').data('id');

			if (validId) {
				modal.close();

				args.afterSelected && args.afterSelected(validId);
			}
		});

		template.find('.cancel-link').on('click', function() {
			modal.close();
		});
	}

	/**
	 * @param  {jQuery} paramTemplate
	 * @param  {Object} pArgs
	 * @return {Object}
	 */
	function fullScreenModal(paramTemplate, pArgs) {
		return getInstance(pArgs);

		function getInstance(pArgs) {
			var privateIsVisible = false;
			var id = 'fullscreenmodal_' + (new Date()).getTime();
			var args = pArgs || {};
			var dataTemplate = {
				id: id,
				cssContentId: args.cssContentId,
				inverseBg: args.inverseBg,
				hideClose: args.hasOwnProperty('hideClose') ? args.hideClose : false
			};
			var destroyOnClose = args.hasOwnProperty('destroyOnClose') ? args.destroyOnClose : true;
			var modalTemplate = $(monster.template(monster.apps.core, 'monster-full-screen-modal', dataTemplate));
			var containerSelector = '.core-absolute';
			var modalSelector = '.modal-full-screen-wrapper[data-id="' + id + '"]';
			var obj = {
				destroy: function() {
					$('#' + this.getId()).empty().remove();
				},
				getId: function() {
					return id;
				},
				isVisible: function() {
					return privateIsVisible;
				},
				toggle: function() {
					privateIsVisible ? obj.close() : obj.open();
				},
				close: function() {
					if (privateIsVisible) {
						privateIsVisible = false;

						$('#monster_content').show();

						$(modalSelector).fadeOut(250, function() {
							if (destroyOnClose) {
								$(modalSelector).remove();
							} else {
								$(modalSelector).hide();
							}
						});
					}
				},
				/**
				 * @param  {Function} [pArgs.callback]
				 */
				open: function(pArgs) {
					if (privateIsVisible) {
						return;
					}
					var args = pArgs || {};

					privateIsVisible = true;

					$(modalSelector).fadeIn(250, function() {
						$('#monster_content').hide();
						args.callback && args.callback();
					});
				}
			};

			// TODO should probably have an unclosable mode
			$(document).on('keydown', function(e) {
				if (obj.isVisible() && e.keyCode === 27) {
					obj.close();
				}
			});

			modalTemplate.find('.close-modal').on('click', function() {
				obj.close();
			});

			modalTemplate.find('.modal-content')
						.append(paramTemplate);

			$(containerSelector).append(modalTemplate);

			obj.open();

			return obj;
		}
	}

	/**
	 * @param  {String} url
	 * @param  {String} redirectUrl
	 * @param  {Object} options
	 * @param  {Function} success
	 * @param  {Function} error
	 */
	function popupRedirect(url, redirectUrl, options, success, error) {
		require(['popup-redirect'], function() {
			var popup = new Popup();
			var defaultOptions = {
				width: 500,
				height: 500
			};

			popup.open(url, 'oauth', $.extend(true, {}, defaultOptions, options || {}), redirectUrl).then(function(oauthData) {
				success && success(oauthData);
			}, function(data) {
				error && error(data);
			});
		});
	}

	/**
	 * @param  {jQuery} pTarget
	 * @param  {Function?String} value
	 */
	function clipboardWrapper(pTarget, value) {
		// Have to do this so it works...
		$.ui.dialog.prototype._focusTabbable = $.noop;

		var target = pTarget[0];

		var cb = new Clipboard(target, {
			text: function() {
				return typeof value === 'function' ? value() : value;
			}
		});

		cb.on('success', function() {
			toast({
				type: 'success',
				message: monster.apps.core.i18n.active().clipboard.successCopy
			});
		});
	}

	/**
	 * @param  {String[]} features
	 * @param  {jQuery} target
	 * @return {jQuery}
	 */
	function paintNumberFeaturesIcon(features, target) {
		// Can't jQuery it as it's used by Handlebars with a helper, and it needs to return HTML
		var sortedFeatures = features && features.length ? features.sort() : [],
			template = monster.template(monster.apps.core, 'monster-number-features', { features: sortedFeatures });

		tooltips($(template));

		if (target) {
			target.empty();

			target.append(template);
		} else {
			return template;
		}
	}

	/**
	 * @param  {String} phoneNumber
	 * @param  {Object} pOptions
	 * @return {jQuery}
	 */
	function getTemplatePhoneNumber(phoneNumber, pOptions) {
		var formattedNumber = monster.util.getFormatPhoneNumber(phoneNumber);
		var options = pOptions || {};
		var formattedData = {
			numberData: {
				country: formattedNumber.country,
				originalNumber: formattedNumber.originalNumber,
				e164Number: formattedNumber.e164Number,
				formattedNumber: formattedNumber.userFormat
			},
			options: {
				hideFlag: !formattedNumber.isValid || _.get(options, 'hideFlag', false)
			}
		};
		var template = monster.template(monster.apps.core, 'monster-number-wrapper', formattedData);

		tooltips($(template));

		return template;
	}

	/**
	 * @param  {jQuery} target
	 * @param  {Number} pDuration
	 * @param  {Boolean} pShowOnlyWhenVisible
	 * @param  {Number} pCountdown
	 * @return {Timeout}
	 */
	function timer(target, pDuration, pShowOnlyWhenVisible, pCountdown) {
		var duration = pDuration || 0;
		var showOnlyWhenVisible = pShowOnlyWhenVisible === false ? false : true;
		var countdown = pCountdown || false;

		target.html(monster.util.friendlyTimer(duration));

		var interval = setInterval(function() {
			if (countdown) {
				--duration;
			} else {
				++duration;
			}

			target.html(monster.util.friendlyTimer(duration));

			if ((showOnlyWhenVisible && !target.is(':visible')) || duration === 0) {
				clearInterval(interval);
			}
		}, 1000);

		target.on('remove', function() {
			clearInterval(interval);
		});

		return interval;
	}

	/**
	 * @param  {Object} args
	 * @return {jQuery}
	 */
	function dialpad(args) {
		var dataToTemplate = {
			hideKeys: args.hasOwnProperty('hideKeys') ? args.hideKeys : false,
			dtmf: [
				{ value: '1' },
				{ value: '2', text: 'abc' },
				{ value: '3', text: 'def' },
				{ value: '4', text: 'ghi' },
				{ value: '5', text: 'jkl' },
				{ value: '6', text: 'mno' },
				{ value: '7', text: 'pqrs' },
				{ value: '8', text: 'tuv' },
				{ value: '9', text: 'wxyz' },
				{ value: '*' },
				{ value: '0' },
				{ value: '#' }
			]
		};

		if (args.hasOwnProperty('button')) {
			dataToTemplate.button = args.button;
		}

		if (args.hasOwnProperty('headline')) {
			dataToTemplate.headline = args.headline;
		}

		var template = $(monster.template(monster.apps.core, 'dialpad-template', dataToTemplate));

		template
			.find('.dialpad-item')
				.on('mouseup', function(event) {
					event.preventDefault();

					var dtmf = $(this).data('dtmf');
					var dialboxValue = template.find('.dialbox').val();
					var newDialboxValue = dialboxValue.concat(dtmf);

					template
						.find('.dialbox')
							.val(newDialboxValue)
							.focus();

					if (args.hasOwnProperty('onDtmfClick')) {
						args.onDtmfClick(dtmf, newDialboxValue);
					}
				});

		template
			.find('.backspace')
				.on('click', function(event) {
					event.preventDefault();

					var dialboxValue = template.find('.dialbox').val();
					var newDialboxValue = dialboxValue.slice(0, -1);

					template
						.find('.dialbox')
							.val(newDialboxValue)
							.focus();

					if (args.hasOwnProperty('onBackSpaceClick')) {
						args.onBackSpaceClick(newDialboxValue);
					}
				});

		template.find('.dialbox').on('keydown', function(e) {
			if (e.keyCode === 13) {
				template.find('.dialpad-action-button').click();
			}
		});

		if (args.hasOwnProperty('button')) {
			template.find('.dialpad-action-button').on('click', function(e) {
				e.preventDefault();

				if (args.button.hasOwnProperty('onClick')) {
					args.button.onClick && args.button.onClick(template.find('.dialbox').val());
				}
			});
		}

		return template;
	}

	/**
	 * @param  {Object} options
	 * @return {Object}
	 */
	function popover(options) {
		var template = $(monster.template(monster.apps.core, 'monster-popover', { title: options.title }));
		// In some cases, like when a drop is embedded in a drop, we need to specify manually the
		// parent element to watch to trigger the destroy method of the drop.
		// See operator console for example
		var removeTarget = options.removeTarget || options.target;

		template.find('.monster-popover-content')
				.append(options.content);

		var defaultDropOptions = {
			target: options.target[0],
			content: template[0],
			tetherOptions: {
				constraints: [{
					to: 'window',
					pin: true,
					attachment: 'both'
				}]
			},
			remove: true,
			openOn: 'click',
			classes: ''
		};
		var finalDropOptions = $.extend(true, {}, defaultDropOptions, options.dropOptions);

		finalDropOptions.classes += ' monster-popover drop-theme-arrows';

		if (options.mode === 'showOnceOnClick') {
			finalDropOptions.openOn = 'click';
			finalDropOptions.remove = false;
		}

		var dropInstance;

		if (options.mode === 'showOnceOnClick') {
			// if the drop is not already opened, we open it, if not we don't do anything as it will be automatically destroyed since the outside click will close the popover and that's what we want
			if (!options.target.hasClass('drop-enabled')) {
				dropInstance = new Drop(finalDropOptions);

				dropInstance.open();

				dropInstance.on('close', function() {
					$('.tooltip').hide();
					dropInstance.destroy();
				});
			}
		} else {
			dropInstance = new Drop(finalDropOptions);

			removeTarget.on('remove', function() {
				dropInstance.destroy();
			});
		}

		return dropInstance;
	}

	/**
	 * Takes a file in parameter, and then outputs the PDF preview of that file in an iframe that's
	 * added to the container.
	 * @param  {String} file
	 * @param  {jQuery} container
	 * @param  {Object} pOptions
	 */
	function renderPDF(file, container, pOptions) {
		var castFileToPDFString = function(file) {
			var base64ToUint8Array = function(base64) {
				var raw = atob(base64);
				var uint8Array = new Uint8Array(raw.length);

				for (var i = 0; i < raw.length; i++) {
					uint8Array[i] = raw.charCodeAt(i);
				}

				return uint8Array;
			};
			var base64Data = file.split(',')[1];
			var pdfData = base64ToUint8Array(base64Data);

			return pdfData;
		};
		var pdfData = castFileToPDFString(file);

		// Get PDFJS library if not already initialized
		require(['pdfjs-dist/build/pdf'], function() {
			var defaultOptions = {
				width: '100%',
				height: '700px'
			};
			var options = $.extend(true, defaultOptions, pOptions);
			var hasIframe = container.find('.monster-pdf-viewer-iframe').length;
			var iframe;

			if (hasIframe) {
				iframe = container.find('.monster-pdf-viewer-iframe')[0];
				iframe.contentWindow.PDFViewerApplication.open(pdfData);
			} else {
				iframe = $('<iframe class="monster-pdf-viewer-iframe" src="js/vendor/pdfjs/web/viewer.html" style="width: ' + options.width + '; height: ' + options.height + ';" allowfullscreen="" webkitallowfullscreen=""></iframe>')[0];
				iframe.onload = function() {
					iframe.contentWindow.PDFViewerApplication.open(pdfData);
				};
				container.append(iframe);
			}
		});
	}

	/**
	 * Layer above footable to use the default options everywhere.
	 * @param  {jQuery} container
	 * @param  {Object} options
	 */
	function footableWrapper(container, options) {
		var defaults = {
			filtering: {
				enabled: true,
				placeholder: monster.apps.core.i18n.active().footable.search,
				delay: 20,
				connectors: false,
				min: 1,
				ignoreCase: true
			},
			sorting: {
				enabled: true
			},
			paging: {
				enabled: true,
				size: 10,
				limit: 0,
				availablePageSizes: [ 10, 25, 50, 100 ],
				countFormat: monster.apps.core.i18n.active().footable.format
			}
		};
		var finalOptions = $.extend(true, defaults, options || {});

		handleDisplayFootable(container, finalOptions);
	}

	/**
	 * @param  {jQuery} container
	 * @param  {Object} finalOptions
	 */
	function handleDisplayFootable(container, finalOptions) {
		var addRowsToBody = function(pages) {
			container.find('tbody').empty();
			_.each(pages, function(rows) {
				container.find('tbody').append(rows);
			});
		};
		var addPageSizeComponent = function(container, table, pPageSize, pAvailablePageSizes) {
			var pageSize = pPageSize || finalOptions.paging.size || 10;
			var availablePageSizes = pAvailablePageSizes || finalOptions.paging.availablePageSizes;
			var footableInstance;

			if (availablePageSizes.indexOf(parseInt(pageSize)) < 0) {
				availablePageSizes.push(parseInt(pageSize));
				availablePageSizes.sort(function(a, b) {
					return a > b ? 1 : -1;
				});
			}

			// If we gave a selector with many table, we need to add the component to each table, so we need to loop thru each table included in the jquery selector
			$.each(table, function(k, singleTable) {
				var $singleTable = $(singleTable);
				var $tablePaging = $singleTable.find('.footable-paging td');

				if ($tablePaging.length === 0) {
					$singleTable.find('tfoot').append(
						$(monster.template(
							monster.apps.core, 'monster-table-paging',
							{
								cols: $singleTable.find('tbody > tr:first > td').length,
								rowCount: footable.get($singleTable).rows.all.length
							}
						))
					);
					$tablePaging = $singleTable.find('.footable-paging td');
				}

				$tablePaging.append($(monster.template(monster.apps.core, 'monster-table-pageSize', { pageSize: pageSize, availablePageSizes: availablePageSizes })));

				$singleTable.find('.footable-paging td .table-page-size select').on('change', function() {
					pageSize = parseInt($(this).val());
					footableInstance = footable.get('#' + $singleTable.attr('id'));

					$singleTable.find('tfoot').empty();
					footableInstance.pageSize(pageSize);
					addPageSizeComponent(container, $singleTable, pageSize, availablePageSizes);

					// This is useful so when we use the "load more" button, it uses the right page size we just set
					finalOptions.paging.size = pageSize;
				});
			});
		};
		var filters = {
			paginate: false
		};

		if (finalOptions.hasOwnProperty('backendPagination') && finalOptions.backendPagination.enabled) {
			var paginateFilters = {
				page_size: finalOptions.backendPagination.pageSize || 50
			};
			var loadedPages = [];
			var isAllDataLoaded = false;
			var allDataLoaded = function() {
				// toast({
				// 	type: 'success',
				// 	message: monster.apps.core.i18n.active().backendPagination.allDataLoaded
				// });
				finalOptions.empty = monster.apps.core.i18n.active().backendPagination.emptyForSure;

				isAllDataLoaded = true;
			};
			var loadPaginatedRows = function(filters, callback) {
				finalOptions.getData(filters, function(rows, data) {
					loadedPages.push(rows);

					filters.start_key = data.next_start_key;
					if (!data.hasOwnProperty('next_start_key') || data.next_start_key === data.start_key) {
						allDataLoaded();
					}

					addRowsToBody(loadedPages);

					paintPaginatedFootable();

					callback && callback();
				});
			};
			var paintPaginatedFootable = function() {
				// If we don't re-render the backendTemplate every time, the tooltips don't show up for some reason.
				var newTable = container.footable(finalOptions);
				var allowLoadAll = finalOptions.backendPagination.hasOwnProperty('allowLoadAll') ? finalOptions.backendPagination.allowLoadAll : true;
				var backendTemplate = $(monster.template(monster.apps.core, 'monster-table-backendPagination', { isFull: isAllDataLoaded, allowLoadAll: allowLoadAll }));

				backendTemplate.find('.load-more:not(.disabled)').on('click', function(e) {
					e.preventDefault();

					loadPaginatedRows(paginateFilters, function() {
						finalOptions.backendPagination.afterLoad && finalOptions.backendPagination.afterLoad();
					});
				});

				backendTemplate.find('.load-all:not(.disabled)').on('click', function(e) {
					e.preventDefault();

					paginateFilters.paginate = false;
					delete paginateFilters.page_size;
					delete paginateFilters.start_key;

					finalOptions.getData(paginateFilters, function(rows, data) {
						loadedPages = [ rows ];
						allDataLoaded();

						addRowsToBody(loadedPages);

						paintPaginatedFootable();

						finalOptions.backendPagination.afterLoad && finalOptions.backendPagination.afterLoad();
					});
				});

				addPageSizeComponent(container, newTable);

				tooltips(backendTemplate);

				container.find('.footable-filtering th form').prepend(backendTemplate);
			};

			finalOptions.empty = monster.apps.core.i18n.active().backendPagination.empty;

			// Finally, once everything is initialized properly, we load the first set of data.
			loadPaginatedRows(paginateFilters, function(data) {
				finalOptions.afterInitialized && finalOptions.afterInitialized(data);
			});
		} else if (finalOptions.hasOwnProperty('getData')) {
			finalOptions.getData(filters, function(rows, data, formattedData) {
				addRowsToBody([ rows ]);

				var table = container.footable(finalOptions);

				addPageSizeComponent(container, table);

				finalOptions.afterInitialized && finalOptions.afterInitialized(formattedData);
			});
		} else {
			var table = container.footable(finalOptions);

			addPageSizeComponent(container, table);

			finalOptions.afterInitialized && finalOptions.afterInitialized();
		}
	}

	/**
	 * @param  {Object} data
	 * @param  {jQuery} container
	 * @param  {Object} pOptions
	 */
	function renderJSONWrapper(data, container, pOptions) {
		var options = pOptions || {};
		var validThemes = ['dark', 'light'];
		var finalOptions = {
			sort: options.hasOwnProperty('sort') ? options.sort : true,
			level: options.hasOwnProperty('level') ? options.level : 4,
			theme: options.hasOwnProperty('theme') && validThemes.indexOf(options.theme) >= 0 ? options.theme : 'light'
		};
		var html = renderJSON.set_show_to_level(finalOptions.level).set_sort_objects(finalOptions.sort)(data);

		$(html).addClass('theme-' + finalOptions.theme);

		$(container).append(html);
	}

	/**
	 * @return {Object[]}
	 */
	function getShortcuts() {
		return keyboardShortcuts;
	}

	/**
	 * @param  {String} category
	 * @param  {String} key
	 */
	function removeShortcut(category, key) {
		var shortcuts = keyboardShortcuts;

		if (typeof key === 'undefined') {
			if (shortcuts.hasOwnProperty(category)) {
				_.each(shortcuts[category].keys, function(shortcut, key) {
					Mousetrap.unbind(key);
				});

				delete shortcuts[category];
			}
		} else {
			if (keyboardShortcuts.hasOwnProperty(category) && keyboardShortcuts[category].keys.hasOwnProperty(key)) {
				delete keyboardShortcuts[category].keys[key];

				if (_.isEmpty(keyboardShortcuts[category].keys)) {
					delete keyboardShortcuts[category];
				}
			}

			Mousetrap.unbind(key);
		}
	}

	/**
	 * @param {Object} shortcut
	 */
	function addShortcut(shortcut) {
		var i18nShortcuts = monster.apps.core.i18n.active().globalShortcuts;
		var category = shortcut.category;
		var key = shortcut.key;
		var title = shortcut.title;
		var callback = shortcut.callback;
		var adminOnly = shortcut.hasOwnProperty('adminOnly') ? shortcut.adminOnly : false;

		if (!keyboardShortcuts.hasOwnProperty(category)) {
			keyboardShortcuts[category] = {
				title: i18nShortcuts.categories.hasOwnProperty(category) ? i18nShortcuts.categories[category] : category,
				keys: {}
			};
		}

		if (!keyboardShortcuts[category].keys.hasOwnProperty(key)) {
			if (!adminOnly || monster.util.isAdmin()) {
				keyboardShortcuts[category].keys[key] = {
					key: key,
					title: title,
					callback: callback
				};

				Mousetrap.bind(key, callback, 'keyup');
			}
		} else {
			console.warn('a shortcut is already defined for key "' + key + '" in category "' + category + '"');
		}
	}

	/**
	 * @param  {jQuery} target
	 * @param  {phoneNumber|macAddress|ipv4|extension} type
	 * @param  {Object} options
	 */
	function mask(target, type, options) {
		var config = _.get({
			phoneNumber: {
				mask: 'AZZZZZZZZZZZZZZZZ',
				options: {
					translation: {
						'Z': {
							pattern: /[0-9]/,
							optional: true
						},
						'A': {
							pattern: /\+/,
							optional: true
						}
					}
				}
			},
			macAddress: {
				mask: 'FF:FF:FF:FF:FF:FF',
				options: {
					translation: {
						'F': {
							pattern: /[A-Fa-f0-9]/
						}
					}
				}
			},
			ipv4: {
				mask: '0ZZ.0ZZ.0ZZ.0ZZ',
				options: {
					translation: {
						'Z': {
							pattern: /[0-9]/,
							optional: true
						}
					}
				}
			},
			extension: {
				mask: 'ZZZZZZZZZZZZZZZZ',
				options: {
					translation: {
						'Z': {
							pattern: /[0-9]/,
							optional: true
						}
					}
				}
			}
		}, type, {
			mask: type,
			options: options
		});

		target.mask(config.mask, config.options);
	}

	/**
	 * Programmatically loads the navbar tab corresponding to the tab ID passed as argument
	 * @param  {Object} thisArg Context of the app
	 * @param  {String} id      Unique ID to identify the tab
	 * @param  {Object} oArgs Optional Arguments
	 */
	function loadTab(thisArg, id, oArgs) {
		var $tab = $('.navbar-menu-item-link[data-id="' + id + '"]');

		onNavbarTabClick(thisArg, $tab, oArgs);
	}

	/**
	 * Render a generique layout so each app has the same look
	 * @param  {Object} thisArg Context used when calling the callback for active tab
	 * @param  {Object} args    List of options to render the navbar and layout template
	 */
	function generateAppLayout(thisArg, args) {
		var parent = args.parent || $('#monster_content');
		var tabs = args.menus.reduce(function(prev, curr) { return prev.concat(curr.tabs); }, []);
		var context = (function(args, tabs) {
			return tabs[0].hasOwnProperty('menus') ? tabs[0].menus[0].tabs[0] : tabs[0];
		})(args, tabs);
		var forceNavbar = _.get(args, 'forceNavbar', false);
		var hideNavbar = _.get(args, 'hideNavbar', false);
		var hasNavbar = !(_.size(tabs) <= 1);
		var dataTemplate = {
			hasNavbar: forceNavbar ? true : hideNavbar ? false : hasNavbar,
			layout: (function(args, context) {
				if (context.hasOwnProperty('layout')) {
					return context.layout;
				} else if (args.hasOwnProperty('appType')) {
					return args.appType;
				} else {
					return 'default';
				}
			})(args, context),
			appId: thisArg.name.split('-').join('_')
		};
		var layoutTemplate = args.hasOwnProperty('template')
			? args.template
			: monster.template(monster.apps.core, 'monster-app-layout', dataTemplate);
		var callDefaultTabCallback = function callDefaultTabCallback() {
			var callArgs = {
				parent: parent,
				container: parent.find('.app-content-wrapper')
			};

			if (context.hasOwnProperty('data')) {
				callArgs.data = context.data;
			}

			context.callback.call(thisArg, callArgs);
		};

		parent
			.empty()
			.append(layoutTemplate);

		// Changed the code here to remove the $.extend, as it doesn't override arrays properly
		if (args.hasOwnProperty('menus')) {
			thisArg.appFlags = thisArg.appFlags || {};
			thisArg.appFlags._layout = args;
		}

		generateAppNavbar(thisArg);

		callDefaultTabCallback();
	}

	/**
	 * Render app menu and bind corresponding 'click' events with related callbacks
	 * @param  {Object} thisArg Context used when calling the callback for each tab
	 */
	function generateAppNavbar(thisArg) {
		var parent = thisArg.appFlags._layout.parent || $('#monster_content');
		var appHeader = parent.find('.app-header');
		var menus = thisArg.appFlags._layout.menus;
		var navbarTemplate = monster.template(monster.apps.core, 'monster-app-navbar', {
			menus: menus
		});
		var subnavTemplate = monster.template(monster.apps.core, 'monster-app-subnav', {
			menus: menus
		});
		var hasSubnav = $.trim($(subnavTemplate).find('.app-subnav-wrapper').html());
		var initNavbar = function initNavbar() {
			appHeader
				.find('.app-navbar')
					.empty()
					.append(navbarTemplate);

			appHeader
				.find('.app-navbar .navbar-menu-item-link')
					.first()
						.addClass('active');
		};
		var initSubnav = function initSubnav() {
			if (hasSubnav) {
				appHeader
					.append(subnavTemplate);

				$.each(appHeader.find('.app-subnav'), function(idx, el) {
					$(el)
						.find('.navbar-menu-item-link')
							.first()
								.addClass('active');
				});

				var firstSubnav = appHeader.find('.app-subnav').first(),
					menuId = firstSubnav.data('menu_id'),
					tabId = firstSubnav.data('tab_id');

				if (menuId === 0 && tabId === 0) {
					appHeader
						.find('.app-subnav-bg')
							.show();

					appHeader
						.find('.app-subnav[data-menu_id="' + menuId + '"][data-tab_id="' + tabId + '"]')
							.addClass('active');
				}
			}
		};

		initNavbar();
		initSubnav();

		appHeader
			.find('.navbar-menu-item-link')
				.on('click', function() {
					onNavbarTabClick(thisArg, $(this));
				});
	}

	/**
	 * Handles navbar animations and calls callback on tab click
	 * @param  {Object}        thisArg Context of the app
	 * @param  {jQuery} $tab    Tab that was clicked
	 * @param  {jQuery} pArgs   Optional arguments to pass to the loader
	 */
	function onNavbarTabClick(thisArg, $tab, pArgs) {
		var args = pArgs || {};
		var menus = thisArg.appFlags._layout.menus;
		var parent = thisArg.appFlags._layout.parent || $('#monster_content');
		var appHeader = parent.find('.app-header');
		var appContent = parent.find('.app-content-wrapper');
		var menuId = $tab.parents('.navbar-menu').data('menu_id');
		var tabId = $tab.data('tab_id');
		var isSubnav = $tab.parents('nav').hasClass('app-subnav');
		var currentTab;
		var loadTabContent = function loadTabContent() {
			var currentSubnav = appHeader.find('.app-subnav[data-menu_id="' + menuId + '"][data-tab_id="' + tabId + '"]');
			var finalArgs = {
				parent: parent,
				container: parent.find('.app-content-wrapper')
			};
			var appLayoutClass = ['app-layout'];
			var subTab;

			// Add 'active' class to menu element
			if (!$tab.hasClass('active')) {
				$tab
					.parents('nav')
						.find('.navbar-menu-item-link.active')
							.removeClass('active');
				$tab
					.addClass('active');
			}

			// Subnav container handling
			if (!isSubnav) {
				// Display correct subnav element
				if (currentTab.hasOwnProperty('menus')) {
					if (currentSubnav.hasClass('active')) {
						currentSubnav
							.find('.navbar-menu-item-link.active')
								.removeClass('active');

						currentSubnav
							.find('.navbar-menu-item-link')
								.first()
									.addClass('active');
					} else {
						if (appHeader.find('.app-subnav-bg').is(':visible')) {
							appHeader
								.find('.app-subnav.active')
									.fadeOut(200, function() {
										$(this).removeClass('active');

										currentSubnav
											.find('.navbar-menu-item-link.active')
												.removeClass('active');

										currentSubnav
											.find('.navbar-menu-item-link')
												.first()
													.addClass('active');

										currentSubnav
											.fadeIn(200, function() {
												$(this).addClass('active');
											});
									});
						} else {
							appHeader
								.find('.app-subnav.active')
									.hide()
									.removeClass('active');

							currentSubnav
								.show()
								.addClass('active');
						}
					}
				}

				// Show/hide subnav container
				if (currentTab.hasOwnProperty('menus')) {
					appContent.addClass('subnav-enabled');

					if (appHeader.find('.app-subnav-bg').is(':hidden')) {
						appHeader
							.find('.app-subnav-bg')
								.slideDown();
					}
				} else {
					appContent.removeClass('subnav-enabled');
					if (appHeader.find('.app-subnav-bg').is(':visible')) {
						appHeader
							.find('.app-subnav-bg')
								.slideUp();
					}
				}
			}

			parent
				.find('.app-content-wrapper')
					.empty();

			isTabLoadingInProgress = false;

			if (args && args.hasOwnProperty('subTab')) {
				subTab = args.subTab;
				delete args.subTab;
				loadTab(thisArg, subTab, args);
			} else {
				// Optional data coming form loadTab()
				if (args && !_.isEmpty(args)) {
					finalArgs.data = args;
				}

				// Optional data coming from generateAppLayout() init in the app
				if (currentTab.hasOwnProperty('data')) {
					// Cannot be overriden as it is assumed the tab need this data to load
					finalArgs.data = _.merge({}, finalArgs.data, currentTab.data);
				}

				// Override layout type if specified at the tab level
				if (currentTab.hasOwnProperty('layout')) {
					appLayoutClass.push(currentTab.layout);
				} else if (thisArg.appFlags._layout.hasOwnProperty('appType')) {
					appLayoutClass.push(thisArg.appFlags._layout.appType);
				}

				if (parent.find('header.app-header').is(':visible')) {
					appLayoutClass.push('with-navbar');
				}

				parent
					.find('.app-layout')
						.prop('class', appLayoutClass.join(' '));

				(currentTab.hasOwnProperty('menus') ? currentTab.menus[0].tabs[0] : currentTab).callback.call(thisArg, finalArgs);
			}
		};

		if (isSubnav) {
			var subnavMenuId = $tab.parents('ul').data('menu_id');
			var subnavTabId = $tab.data('tab_id');

			menuId = $tab.parents('nav').data('menu_id');
			tabId = $tab.parents('nav').data('tab_id');

			currentTab = menus[menuId].tabs[tabId].menus[subnavMenuId].tabs[subnavTabId];
		} else {
			currentTab = menus[menuId].tabs[tabId];
		}

		if (!isTabLoadingInProgress) {
			isTabLoadingInProgress = true;

			if (currentTab.hasOwnProperty('onClick')) {
				currentTab.onClick.call(thisArg, {
					parent: parent,
					container: parent.find('.app-content-wrapper'),
					callback: loadTabContent
				});
			} else {
				loadTabContent();
			}
		}
	}

	/**
	 * Load IntroJs if not existing and use the same set of options everytime we invoke it.
	 * @param  {Object[]}   stepList Contains every single step (see introJS for format).
	 * @param  {Function} callback Run after step by step is skipped/ended
	 */
	function stepByStep(stepList, callback) {
		var coreI18n = monster.apps.core.i18n.active();
		// Filtering out steps where the element does not exist
		var steps = _.filter(stepList, function(step) { return step.element; });
		var countSteps = steps.length;
		var isLastStep = function() {
			// If next button is hidden, it's because we hide it when it's the last step, so it's
			// our ghetto way to know that the step by step is at the last step...
			return $('.introjs-nextbutton').css('display') !== 'inline-block';
		};

		// If we don't already override it, add a last-step class.
		// We use it to style the skip button (float right)
		if (!steps[countSteps - 1].hasOwnProperty('tooltipClass')) {
			steps[countSteps - 1].tooltipClass = 'monster-intro-tooltip last-step';
		}

		introJs()
			.setOptions({
				steps: steps,
				exitOnOverlayClick: false,
				exitOnEsc: false,
				keyboardNavigation: false,
				tooltipClass: 'monster-intro-tooltip',
				highlightClass: 'monster-intro-highlight',
				nextLabel: coreI18n.stepByStep.nextLabel,
				prevLabel: coreI18n.stepByStep.prevLabel,
				skipLabel: coreI18n.stepByStep.skipLabel,
				doneLabel: coreI18n.stepByStep.doneLabel,
				showStepNumbers: false
			})
			.onafterchange(function() {
				var $buttons = $('.introjs-tooltipbuttons');

				$buttons.find('.introjs-button').addClass('monster-button non-fixed');

				if (isLastStep()) {
					$buttons.find('.introjs-skipbutton').addClass('monster-button-success');
				} else {
					$buttons.find('.introjs-skipbutton').removeClass('monster-button-success');
					$buttons.find('.introjs-nextbutton').addClass('monster-button-primary');
				}
			})
			.oncomplete(callback)
			.onexit(callback)
			.start();
	}

	/**
	 * Load the tooltips of a template only when we mouseover them by default.
	 * @param  {jQuery} target
	 * @param  {Object} [args]
	 * @param  {String} [args.selector="[data-toggle="tooltip"]"]
	 *         To override default CSS selector.
	 * @param  {Object} [args.options]
	 * @param  {String} [args.trigger="mouseover"] To override default trigger event.
	 */
	function tooltips(target, args) {
		var args = args || {};
		var selector = args.selector || '[data-toggle="tooltip"]';
		var options = args.options || {};
		var trigger = args.trigger || 'mouseover';

		target.on(trigger, selector + ':not(.monster-tooltip-loaded)', function(e) {
			$(this)
				.data('isTooltipLoaded', true)
				.tooltip(options)
				.addClass('monster-tooltip-loaded')
				.trigger(trigger);
		});
	}

	/**
	 * @param  {Object} data
	 * @return {jQuery}
	 */
	function results(data) {
		var template = $(monster.template(monster.apps.core, 'monster-results', data));

		tooltips(template);

		return template;
	}

	/**
	 * Adds a password strength indicator for a specific input, in the form of either a bar, an
	 * emoji or a color-changing lock icon.
	 * @param  {jQuery} input  Input on which the method will be applied. Best suited for an input
	 *                         of the `password` type.
	 * @param  {Object} [options]  Indicator options
	 * @param  {jQuery} [options.container]  Where to append the password strength display
	 *                                       (by default, it will be appended after the `input`).
	 * @param  {('bar'|'emoji'|'icon')} [options.display='bar']  Type of indicator to display: a
	 *                                                           bar, an emoji or a color-changing
	 *                                                           lock icon.
	 * @param  {('top'|'bottom'|'left'|'right')} [options.tooltipPosition='top']
	 *         When the display is set to 'icon', you can choose the position of the tooltip on the
	 *         icon.
	 */
	function showPasswordStrength(input, pOptions) {
		if (!(input instanceof $)) {
			throw new TypeError('"input" is not a jQuery object');
		}
		if (!_.isUndefined(pOptions) && !_.isPlainObject(pOptions)) {
			throw TypeError('"options" is not a plain object');
		}

		var i18n = monster.apps.core.i18n.active();
		var options = pOptions || {};
		var display = _.get(options, 'display', 'bar');
		if (!_.includes(['bar', 'emoji', 'icon'], display)) {
			throw new Error('`' + display + '`' + ' is not a valid display option. It should be `bar`, `emoji` or `icon`.');
		}
		if (display !== 'icon' && _.has(options, 'tooltipPosition')) {
			console.warn('"options.tooltipPosition" is only supported for `icon` display, so it will be ignored');
		}

		var tooltipPosition = _.get(options, 'tooltipPosition', 'top');
		if (!_.includes(['top', 'bottom', 'left', 'right'], tooltipPosition)) {
			throw new Error('`' + tooltipPosition + '`' + ' is not a valid tooltip position option. It should be one of `top`, `bottom`, `left` or `right`.');
		}

		var $container = _.get(options, 'container');
		if (!_.isUndefined($container) && !($container instanceof $)) {
			throw new TypeError('"options.container" is not a jQuery object');
		}

		var strengthLevels = _.map([
			{
				key: 'strong',
				regex: new RegExp('^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\\W_]).*$'),
				color: '#18b309',
				size: 100,
				emojiChar: '&#x1F60E;'
			},
			{
				key: 'good',
				regex: new RegExp('^(?=.{8,})(((?=.*[A-Z])(?=.*[\\W_]))|((?=.*[A-Z])(?=.*[0-9]))|((?=.*[\\W_])(?=.*[0-9]))).*$'),
				color: '#33db24',
				size: 70,
				emojiChar: '&#x1F603;'
			},
			{
				key: 'medium',
				regex: new RegExp('^(?=.{6,})((?=.*[\\W_])|(?=.*[A-Z])|(?=.*[0-9])).*$'),
				color: '#ffcc33',
				size: 50,
				emojiChar: '&#x1F610;'
			},
			{
				key: 'weak',
				regex: new RegExp('^(?=.{6,}).*$'),
				color: '#ff6a57',
				size: 40,
				emojiChar: '&#x1F61E;'
			},
			{
				key: 'bad',
				regex: new RegExp('^.+$'),
				color: '#ff3d24',
				size: 20,
				emojiChar: '&#x1F621;'
			},
			{
				key: 'empty',
				regex: new RegExp('^\\s*$'),
				color: '#c0c0c9',
				size: 0,
				emojiChar: '&nbsp;'
			}
		], function(val) {
			return _.merge({
				label: monster.util.tryI18n(i18n.passwordStrength, val.key)
			}, val);
		});
		var templateName = 'monster-password-strength-' + display;
		var $template = $(monster.template(
			monster.apps.core,
			templateName,
			{
				tooltipPosition: tooltipPosition
			}));
		var updateIndicator = _.get({
			bar: function(strengthLevel) {
				$template
					.find('.monster-password-strength-bar')
					.css({
						backgroundColor: strengthLevel.color,
						width: strengthLevel.size + '%'
					});
				$template
					.find('.monster-password-strength-label')
					.html(strengthLevel.label);
			},
			emoji: function(strengthLevel) {
				$template
					.find('.monster-password-strength-icon')
					.css('color', strengthLevel.color)
					.html(strengthLevel.emojiChar);
				$template
					.find('.monster-password-strength-label')
					.html(strengthLevel.label);
			},
			icon: function(strengthLevel) {
				$template
					.find('.monster-password-strength-icon')
					.css('color', strengthLevel.color)
					.attr('data-original-title', strengthLevel.label)
					.tooltip('fixTitle');
			}
		}, display);
		var checkStrength = function() {
			var strengthLevel = _.find(strengthLevels, function(level) {
				return level.regex.test(input.val());
			});

			!_.isUndefined(strengthLevel) && updateIndicator(strengthLevel);
		};

		input.on('keyup keypress change', checkStrength);

		if ($container) {
			$container.append($template);
		} else {
			input.after($template);
		}

		checkStrength();
	}

	/**
	 * Builds a 2 columns UI componenent using linkedColumns, with a preset dataset for video and
	 * audio codecs.
	 * @param  {audio|video} type
	 * @param  {jQuery} target
	 * @param  {Object[]} selectedCodecs
	 * @param  {Object} options
	 * @return {jQuery}
	 */
	function codecSelector(type, target, selectedCodecs, options) {
		var codecsI18n = monster.apps.core.i18n.active().codecs;
		var defaultAudioList = {
			'CELT@32000h': codecsI18n.audio['CELT@32000h'],
			'CELT@48000h': codecsI18n.audio['CELT@48000h'],
			'CELT@64000h': codecsI18n.audio['CELT@64000h'],
			'G722': codecsI18n.audio.G722,
			'G729': codecsI18n.audio.G729,
			'G7221@16000h': codecsI18n.audio['G7221@16000h'],
			'G7221@32000h': codecsI18n.audio['G7221@32000h'],
			'GSM': codecsI18n.audio.GSM,
			'OPUS': codecsI18n.audio.OPUS,
			'PCMA': codecsI18n.audio.PCMA,
			'PCMU': codecsI18n.audio.PCMU,
			'speex@16000h': codecsI18n.audio['speex@16000h'],
			'speex@32000h': codecsI18n.audio['speex@32000h']
		};
		var defaultVideoList = {
			'H261': codecsI18n.video.H261,
			'H263': codecsI18n.video.H263,
			'H264': codecsI18n.video.H264,
			'VP8': codecsI18n.video.VP8
		};
		var mapMigrateAudioCodec = {
			'CELT_48': 'CELT@48000h',
			'CELT_64': 'CELT@64000h',
			'G722_16': 'G7221@16000h',
			'G722_32': 'G7221@32000h',
			'Speex': 'speex@16000h'
		};
		var mapMigrateVideoCodec = {};
		var selectedItems = [];
		var items = [];
		var getLinkedColumn = function(selectedCodecs, defaultList, mapMigrate) {
			selectedItems = _.map(selectedCodecs, function(codec) {
				return {
					key: codec,
					// if codec is in the default List, get its i18n, if it's not, check if it's not an outdated modem from the migrate list, if it is, take the new value and its i18n, if not, just display the codec as it is stored in the db
					value: defaultList.hasOwnProperty(codec) ? defaultList[codec] : (mapMigrate.hasOwnProperty(codec) ? defaultList[mapMigrate[codec]] : codec)
				};
			});

			items = _.map(defaultList, function(description, codec) {
				return {
					key: codec,
					value: description
				};
			}).sort(function(a, b) {
				return a.value > b.value ? 1 : -1;
			});

			return linkedColumns(target, items, selectedItems, options);
		};

		if (type === 'audio') {
			return getLinkedColumn(selectedCodecs, defaultAudioList, mapMigrateAudioCodec);
		} else if (type === 'video') {
			return getLinkedColumn(selectedCodecs, defaultVideoList, mapMigrateVideoCodec);
		} else {
			console.error('This is not a valid type for our codec selector: ', type);
		}
	}

	/**
	 * Tow columns UI element with sortable items.
	 * @param  {jQuery} target
	 * @param  {Object[]} items
	 * @param  {Object[]} selectedItems
	 * @param  {Object} pOptions
	 * @return {jQuery}
	 */
	function linkedColumns(target, items, selectedItems, pOptions) {
		var coreApp = monster.apps.core;
		var defaultOptions = {
			insertionType: 'appendTo',
			searchable: true,
			i18n: {
				search: coreApp.i18n.active().search,
				columnsTitles: {
					available: coreApp.i18n.active().linkedColumns.available,
					selected: coreApp.i18n.active().linkedColumns.selected
				}
			}
		};
		var unselectedItems = (function findUnselectedItems(items, selectedItems) {
			var selectedKeys = selectedItems.map(function(item) { return item.key; }),
				unselectedItems = items.filter(function(item) { return selectedKeys.indexOf(item.key) < 0; });

			return unselectedItems;
		})(items, selectedItems);
		var options = $.extend(true, defaultOptions, pOptions || {});
		var dataTemplate = {
			unselectedItems: unselectedItems,
			selectedItems: selectedItems,
			options: options
		};
		var widgetTemplate = $(monster.template(coreApp, 'linkedColumns-template', dataTemplate));
		var widget;

		widgetTemplate
			.find('.available, .selected')
				.sortable({
					items: '.item-selector',
					connectWith: '.connected',
					tolerance: 'pointer'
				});

		widgetTemplate.find('.available, .selected').on('dblclick', '.item-selector', function() {
			var newColumnClass = $(this).parent().hasClass('available') ? '.selected' : '.available';

			$(this).appendTo(widgetTemplate.find(newColumnClass));
		});

		if (options.searchable) {
			widgetTemplate
				.find('.search-wrapper')
					.on('keyup', function(event) {
						event.preventDefault();

						var $this = $(this),
							$input = $this.find('input'),
							searchString = $input.val().toLowerCase(),
							items = $(this).siblings('ul').find('.item-selector');

						_.each(items, function(item) {
							var $item = $(item),
								value = $item.find('.item-value').html().toLowerCase();

							value.indexOf(searchString) < 0 ? $item.hide() : $item.show();
						});
					});
		}

		widget = widgetTemplate[options.insertionType](target);

		widget.getSelectedItems = function getSelectedItems() {
			var results = [];

			widgetTemplate.find('ul.selected .item-selector').each(function(k, item) {
				results.push($(item).data('key'));
			});

			return results;
		};

		return widget;
	}

	/**
	 * Wrapper for the jQuery timepicker init function that automatically sets the time format
	 * to the currently logged-in user's preferences if it exists and defaults to the 24 hours
	 * format if it does not.
	 * @param  {jQuery Object} target   <input> or <select> element where the dropdown is appended
	 * @param  {Object} pOptions        optional listing of parameters used to build the dropdown
	 * @return {jQuery Object}          the instance of the timepicker is linked to this element
	 */
	function timepicker(target, pOptions) {
		var is12hMode = _.get(monster, 'apps.auth.currentUser.ui_flags.twelve_hours_mode', false);
		var defaultOptions = {
			timeFormat: is12hMode ? 'g:i A' : 'G:i',
			lang: monster.apps.core.i18n.active().timepicker
		};
		var options = $.extend(true, {}, defaultOptions, pOptions);

		return target.timepicker(options);
	}

	/**
	 * Wrapper of the Jquery date picker that uses the date format settings from the logged-in user
	 * if it exists.
	 * @param {jQuery} target
	 * @param {Object} options Get the full list in the doc of the jQuery Date Picker.
	 * @return {jQuery}
	 */
	function datepicker(target, options) {
		var datePickerFormat = 'mm/dd/yy';
		var userFormat = _.get(monster, 'apps.auth.currentUser.ui_flags.date_format', 'mdy');

		if (userFormat === 'mdy') {
			datePickerFormat = 'mm/dd/yy';
		} else if (userFormat === 'dmy') {
			datePickerFormat = 'dd/mm/yy';
		} else if (userFormat === 'ymd') {
			datePickerFormat = 'yy/mm/dd';
		}

		var defaultOptions = {
			dateFormat: datePickerFormat,
			constraintInput: true
		};

		if (target.parents('.modal-content')) {
			defaultOptions.beforeShow = function(target, instance) {
				$(target)
					.parents('.modal-content')
						.append(instance.dpDiv);
			};
		}

		return target.datepicker(_.merge(defaultOptions, options));
	}

	/**
	 * @desc prepend a WYSIWYG in 'target'
	 * @param target - mandatory jQuery Object
	 * @param options - optional JavaScript Object or JavaScript Boolean
	 * @param data - optional Content to display into the editor
	 *
	 * To remove some elements from the toolbar, specify false as value
	 * for the corresponding key in the defaultOptions object. To remove
	 * all elements, set the options parameter to false.
	 *
	 * The target should be a jQuery Object as follow:
	 * <div class="wysiwyg-container"></div>
	 * The optional class "transparent" can be added to this container
	 * to change the background of the toolbar.
	 */
	function wysiwyg(target, options, data) {
		var options = _.isBoolean(options) ? options : options || {};
		var id = Date.now();
		var cssId = '#wysiwyg_editor_' + id;
		var coreApp = monster.apps.core;
		var dataTemplate = { id: id };
		var wysiwygTemplate;
		/**
		 * Replace global CSS selectors to limit their scope to the wysiwyg editor only.
		 * Selectors handled:
		 * 	`html,body`
		 * 	`*`
		 * @param  {String} data Content to be sanitized
		 * @return {String}      Sanitized content
		 */
		var sanitizeData = function sanitizeData(data) {
			if (data.indexOf(cssId) > -1) {
				// unobfuscate the universal selector
				data = data.replace(new RegExp(cssId + ' \\*', 'g'), '*');
				// unobfuscate `html,body` selector specificly
				data = data.replace(new RegExp(cssId, 'g'), 'html,body');
			} else {
				// obfuscate the universal selector
				data = data.replace(/html,body/g, cssId);
				// obfuscate `html,body` selector
				data = data.replace(/\*\n?{/g, cssId + ' *{');
			}

			return data;
		};

		if (options) {
			var i18n = coreApp.i18n.active().wysiwyg;
			var colorList = [
				'ffffff', '000000', 'eeece1', '1f497d', '4f81bd', 'c0504d', '9bbb59', '8064a2', '4bacc6', 'f79646', 'ffff00',
				'f2f2f2', '7f7f7f', 'ddd9c3', 'c6d9f0', 'dbe5f1', 'f2dcdb', 'ebf1dd', 'e5e0ec', 'dbeef3', 'fdeada', 'fff2ca',
				'd8d8d8', '595959', 'c4bd97', '8db3e2', 'b8cce4', 'e5b9b7', 'd7e3bc', 'ccc1d9', 'b7dde8', 'fbd5b5', 'ffe694',
				'bfbfbf', '3f3f3f', '938953', '548dd4', '95b3d7', 'd99694', 'c3d69b', 'b2a2c7', '92cdcd', 'fac08f', 'f2c314',
				'a5a5a5', '262626', '494429', '17365d', '366092', '953734', '76923c', '5f497a', '31859b', 'e36c09', 'c09100',
				'7f7f7f', '0c0c0c', '1d1b10', '0f243e', '244061', '632423', '4f6128', '3f3151', '205867', '974806', '7f6000'
			];
			var defaultOptions = {
				fontSize: {
					weight: 10,
					title: i18n.title.fontSize,
					icon: 'fa fa-text-height',
					command: 'fontSize',
					options: {
						small: {
							weight: 10,
							text: i18n.text.small,
							args: '1'
						},
						normal: {
							weight: 20,
							text: i18n.text.normal,
							args: '3'
						},
						big: {
							weight: 30,
							text: i18n.text.big,
							args: '5'
						}
					}
				},
				fontEffect: {
					weight: 20,
					options: {
						bold: {
							weight: 10,
							title: i18n.title.bold,
							icon: 'fa fa-bold',
							command: 'bold'
						},
						italic: {
							weight: 20,
							title: i18n.title.italic,
							icon: 'fa fa-italic',
							command: 'italic'
						},
						underline: {
							weight: 30,
							title: i18n.title.underline,
							icon: 'fa fa-underline',
							command: 'underline'
						},
						strikethrough: {
							weight: 40,
							title: i18n.title.strikethrough,
							icon: 'fa fa-strikethrough',
							command: 'strikethrough'
						}
					}
				},
				fontColor: {
					weight: 30,
					title: i18n.title.fontColor,
					icon: 'fa fa-font',
					command: 'foreColor',
					options: [],
					ante: '#'
				},
				textAlign: {
					weight: 40,
					title: i18n.title.alignment,
					icon: 'fa fa-file-text',
					options: {
						left: {
							weight: 10,
							title: i18n.title.alignLeft,
							icon: 'fa fa-align-left',
							command: 'justifyLeft'
						},
						center: {
							weight: 20,
							title: i18n.title.center,
							icon: 'fa fa-align-center',
							command: 'justifyCenter'
						},
						right: {
							weight: 30,
							title: i18n.title.alignRight,
							icon: 'fa fa-align-right',
							command: 'justifyRight'
						},
						justify: {
							weight: 40,
							title: i18n.title.justify,
							icon: 'fa fa-align-justify',
							command: 'justifyFull'
						}
					}
				},
				list: {
					weight: 50,
					title: i18n.title.list,
					icon: 'fa fa-list',
					options: {
						unordered: {
							weight: 10,
							title: i18n.title.bulletList,
							icon: 'fa fa-list-ul',
							command: 'insertUnorderedList'
						},
						ordered: {
							weight: 20,
							title: i18n.title.numberList,
							icon: 'fa fa-list-ol',
							command: 'insertOrderedList'
						}
					}
				},
				textIndent: {
					weight: 60,
					options: {
						indent: {
							weight: 10,
							title: i18n.title.indent,
							icon: 'fa fa-indent',
							command: 'indent'
						},
						outdent: {
							weight: 20,
							title: i18n.title.reduceIndent,
							icon: 'fa fa-outdent',
							command: 'outdent'
						}
					}
				},
				link: {
					weight: 70,
					options: {
						add: {
							weight: 10,
							title: i18n.title.createLink,
							icon: 'fa fa-link',
							command: 'createLink',
							inputType: 'text'
						},
						remove: {
							weight: 20,
							title: i18n.title.removeLink,
							icon: 'fa fa-chain-broken',
							command: 'unlink'
						}
					}
				},
				image: {
					weight: 80,
					options: {
						link: {
							weight: 10,
							title: 'Link image',
							icon: 'fa fa-picture-o',
							'command': 'insertImage',
							inputType: 'text'
						},
						upload: {
							weight: 20,
							title: 'Upload image',
							icon: 'fa fa-file-image-o',
							'command': 'insertImage',
							inputType: 'file'
						}
					}
				},
				editing: {
					weight: 90,
					options: {
						undo: {
							weight: 10,
							title: i18n.title.undo,
							icon: 'fa fa-undo',
							command: 'undo'
						},
						redo: {
							weight: 20,
							title: i18n.title.redo,
							icon: 'fa fa-repeat',
							command: 'redo'
						}
					}
				},
				horizontalRule: {
					weight: 100,
					title: i18n.title.horizontalRule,
					icon: 'fa fa-minus',
					command: 'insertHorizontalRule'
				},
				toggleView: {
					weight: 200,
					title: i18n.title.toggleViewMode,
					icon: 'fa fa-code',
					command: 'html'
				},
				macro: {
					weight: 999,
					title: i18n.title.macro,
					command: 'insertHtml',
					options: false,
					ante: '{{',
					post: '}}'
				}
			};
			var sortByWeight = function(node) { // Sort elements by weight and "arrayize"
				node = _.map(node, function(v) { return v; });

				node.sort(function(a, b) {
					return a.weight > b.weight ? 1 : -1;
				});

				_.each(node, function(v) {
					if (v.hasOwnProperty('options')) {
						v.options = sortByWeight(v.options);
					}
				});

				return node;
			};

			colorList.forEach(function(hexColor, idx) {
				defaultOptions.fontColor.options.push({ weight: ++idx * 10, args: hexColor });
			});

			options = $.extend(true, {}, defaultOptions, options);

			// Remove options with value at false
			for (var opt in options) {
				if (!options[opt]) {
					delete options[opt];
					continue;
				} else if (options[opt].hasOwnProperty('options')) {
					if (_.isEmpty(options[opt].options)) {
						delete options[opt];
						continue;
					} else {
						_.each(options[opt].options, function(v, k, list) {
							if (!v) {
								delete list[k];
							}
						});

						if (_.isEmpty(options[opt].options)) {
							delete options[opt];
							continue;
						}
					}
				}
			}

			dataTemplate.tools = sortByWeight(options);
			wysiwygTemplate = $(monster.template(coreApp, 'wysiwyg-template', dataTemplate));

			tooltips(wysiwygTemplate, {
				selector: 'a[title]',
				options: {
					container: 'body'
				}
			});

			if (options.hasOwnProperty('fontColor')) {
				wysiwygTemplate.find('.color-menu a').each(function(idx, el) {
					$(el).css('background-color', $(el).data('edit').split(' ').pop());
				});
			}

			wysiwygTemplate.find('a.btn[data-edit="html"]')
				.on('click', function(event) {
					event.preventDefault();

					var content = wysiwygTemplate.find(cssId).html();

					wysiwygTemplate
						.find(cssId)
							.html(sanitizeData(content));
				});

			// Handle the behavior of the creatLink dropdown menu
			wysiwygTemplate.find('.dropdown-menu input')
				.on('click', function() {
					return false;
				})
				.on('change', function() {
					$(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle');
				})
				.keydown('esc', function() {
					this.value = '';
					$(this).change();
				});
		} else {
			wysiwygTemplate = $(monster.template(coreApp, 'wysiwyg-template', dataTemplate));
		}

		target
			.prepend(wysiwygTemplate)
			.find(cssId)
				.wysiwyg({
					toolbarSelector: '#wysiwyg_toolbar_' + id,
					activeToolbarClass: 'selected',
					fileUploadError: function(reason, detail) {
						if (reason === 'unsupported-file-type') {
							toast({
								type: 'error',
								message: detail + i18n.toastr.error.format
							});
						} else {
							toast({
								type: 'error',
								message: i18n.toastr.error.upload
							});
							console.log('error uploading file', reason, detail);
						}
					}
				});

		if (data) {
			target.find(cssId).html(sanitizeData(data));
		} else {
			return target.find(cssId);
		}
	}

	/**
	 * Render markdown as HTML
	 * @param {String} content Content to be converted from markdown to HTML
	 */
	function markdownToHtml(content) {
		return marked(content);
	}

	/**
	 * Convert the 'target' in to Markdown editor
	 * @param {jQuery} $target
	 * @param {Object} options - optional object to overwrite the default configs
	 * @return {Object}
	 */
	function markdownEditor($target, options) {
		if (!($target instanceof $)) {
			throw TypeError('"$target" is not a jQuery object');
		}

		if (!_.isUndefined(options) && !_.isPlainObject(options)) {
			throw TypeError('"options" is not a plain object');
		}

		return new SimpleMDE(_.merge({
			element: $target[0],
			status: false,
			autosave: false,
			spellChecker: false
		}, options));
	}

	/**
	 * @param  {jQuery} form
	 * @return {Boolean}
	 */
	function valid(form) {
		return form.valid();
	}

	/**
	 * @param  {jQuery} form
	 * @param  {Object} options
	 * @return {Validator}
	 */
	function validate(form, options) {
		var defaultValidatorHighlightHandler = $.validator.defaults.highlight;
		var defaultValidatorUnhighlightHandler = $.validator.defaults.unhighlight;
		var autoScrollOnInvalid = _.get(options, 'autoScrollOnInvalid', false);
		var isElementInstanceOf = function($element, key) {
			return !!$element.data(key);
		};
		var defaultOptions = {
			errorClass: 'monster-invalid',
			validClass: 'monster-valid',
			invalidHandler: function(event, validator) {
				if (!autoScrollOnInvalid) {
					return;
				}

				var $form = $(event.target);
				var errorItem = _.head(validator.errorList);
				var $invalidElement = $(errorItem.element);
				var scrollTo = $invalidElement.offset().top;
				var invalidElementId = $invalidElement.attr('id');
				var $label;

				// Try to find element's label, if there's any
				if (!_.isEmpty(invalidElementId)) {
					$label = $form.find('label[for="' + invalidElementId + '"]');
				}
				if (_.isEmpty($label)) {
					$label = $invalidElement.closest('label', validator.target);
				}

				// Get scroll position
				if (!_.isEmpty($label)) {
					scrollTo = Math.min(scrollTo, $label.offset().top);
				}
				if (scrollTo >= 8) {
					scrollTo -= 8;	// 0.5rem=8px, to add an extra margin at the top
				}

				// Animate scroll and focus
				$([document.documentElement, document.body]).animate(
					{
						scrollTop: scrollTo
					},
					250,
					'swing',
					function() {
						$invalidElement.focus();
					}
				);
			},
			errorPlacement: function(error, element) {
				var $element = $(element);
				if (isElementInstanceOf($element, 'uiSpinner')) {
					error.insertAfter($element.closest('.ui-spinner'));
				} else if (isElementInstanceOf($element, 'chosen')) {
					error.insertAfter($element.next());
				} else {
					error.insertAfter(element);
				}
			},
			highlight: function(element, errorClass, validClass) {
				var $element = $(element);
				if (isElementInstanceOf($element, 'uiSpinner')) {
					element = $element.closest('.ui-spinner').get(0);
				} else if (isElementInstanceOf($element, 'chosen')) {
					element = $element.next().get(0);
				}
				defaultValidatorHighlightHandler.call(this, element, errorClass, validClass);
			},
			unhighlight: function(element, errorClass, validClass) {
				var $element = $(element);
				if (isElementInstanceOf($element, 'uiSpinner')) {
					element = $element.closest('.ui-spinner').get(0);
				} else if (isElementInstanceOf($element, 'chosen')) {
					element = $element.next().get(0);
				}
				defaultValidatorUnhighlightHandler.call(this, element, errorClass, validClass);
			}
		};

		if (!customValidationInitialized) {
			initCustomValidation();
		}

		return form.validate(_.merge({}, defaultOptions, _.omit(options, 'autoScrollOnInvalid')));
	}

	function initCustomValidation() {
		var validationI18n = monster.apps.core.i18n.active().validation;
		var defaultRulesI18n = _.get(validationI18n, 'defaultRules');
		var getRuleI18n = _.partial(function(i18n, ruleId) {
			return _
				.chain([
					'customRules',
					'defaultRules'
				])
				.map(_.flow(
					_.partial(_.ary(_.concat, 2), _, ruleId),
					_.partial(_.get, i18n)
				))
				.find(_.negate(_.isUndefined))
				.value();
		}, validationI18n);
		var getRuleMessageForPlural = function(plural, ruleId) {
			return _
				.chain(ruleId)
				.thru(getRuleI18n)
				.get(plural)
				.value();
		};
		var getRuleMessageForOne = _.flow(
			_.over([
				_.partial(getRuleMessageForPlural, 'one'),
				getRuleI18n
			]),
			_.partial(_.find, _, _.isString)
		);
		var regexBasedRules = {
			mac: /^(?:[0-9A-F]{2}(:|-))(?:[0-9A-F]{2}\1){4}[0-9A-F]{2}$/i,
			ipv4: /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i,
			time12h: /^((0?[1-9]|1[012])(:[0-5]\d){1,2}(\s?[AP]M))$/i,
			time24h: /^(([01]?[0-9]|2[0-3])(:[0-5]\d){1,2})$/i,
			realm: /^[0-9a-z.-]+$/,
			hexadecimal: /^[0-9A-F]+$/i,
			protocol: /:\/\//i
		};
		var complexRules = {
			checkList: function(value, element, listToCheck) {
				if (_.isArray(listToCheck)) {
					return listToCheck.indexOf(value) < 0;
				} else if (_.isObject(listToCheck)) {
					return !(value in listToCheck);
				} else {
					return true;
				}
			},
			greaterDate: function(value, element, param) {
				var target = _.isString(param) ? $(param) : param;
				if (this.settings.onfocusout) {
					target.unbind('.validate-greaterDate').bind('blur.validate-greaterDate', function() {
						$(element).valid();
					});
				}

				return parseInt(monster.util.timeToSeconds(value)) > parseInt(monster.util.timeToSeconds(target.val()));
			},
			greaterThan: function(value, element, param) {
				var $compElement = param instanceof jQuery ? param : $(param);
				var compValue = $compElement.val();
				var isLinkedFieldEmptyOrHidden = _.isEmpty(compValue) || !$compElement.is(':visible');
				var isValid = _.toNumber(value) >= _.toNumber(compValue);

				return this.optional(element) || isLinkedFieldEmptyOrHidden || isValid;
			},
			listOf: {
				method: function(value, element, ruleId) {
					var separator = ' ';
					var ruleValidator = _.get($.validator.methods, ruleId, _.stubFalse);
					var isValid = _.bind(ruleValidator, this, _, element);

					return _
						.chain(value)
						.trim()
						.split(separator)
						.every(isValid)
						.value();
				},
				message: _.flow(
					_.partial(getRuleMessageForPlural, 'other'),
					_.partial(_.defaultTo, _, getRuleMessageForOne('listOf'))
				)
			},
			lowerThan: function(value, element, param) {
				var $compElement = param instanceof jQuery ? param : $(param);
				var compValue = $compElement.val();
				var isLinkedFieldEmptyOrHidden = _.isEmpty(compValue) || !$compElement.is(':visible');
				var isValid = _.toNumber(value) <= _.toNumber(compValue);

				return this.optional(element) || isLinkedFieldEmptyOrHidden || isValid;
			},
			notEqualTo: function(value, element, param) {
				var $compElements = param instanceof jQuery ? param : $(param);
				var $compElementsToCheck = $compElements.filter(':visible').not(element);
				var $equalElements = $compElementsToCheck.filter(function() {
					return $(this).val() === value;
				});
				var isValid = $equalElements.length === 0;

				return this.optional(element) || isValid;
			},
			phoneNumber: function(value, element) {
				return this.optional(element) || _
					.chain([value])
					.flatten()
					.map(monster.util.getFormatPhoneNumber)
					.every('isValid')
					.value();
			},
			protocols: {
				method: function(value, element, protocols) {
					var pattern = '^(' + _.join(protocols, '|') + ')://';
					var regex = new RegExp(pattern, 'i');
					var method = _.bind(getRegexBasedRuleMethod(regex), this);

					return method(value, element);
				},
				message: function(protocols) {
					return monster.apps.core.getTemplate({
						name: '!' + getRuleMessageForOne('protocols'),
						data: {
							suite: _
								.chain(protocols)
								.map(_.toUpper)
								.join(', ')
								.value()
						}
					});
				}
			},
			regex: function(value, element, regexpr) {
				var method = _.bind(getRegexBasedRuleMethod(regexpr), this);

				return method(value, element);
			}
		};
		var getRegexBasedRuleMethod = function(regex) {
			return function(value, element) {
				return this.optional(element) || regex.test(value);
			};
		};
		var getComplexRuleMethod = function(rule) {
			return _.find([
				rule,
				_.get(rule, 'method')
			], _.isFunction);
		};
		var rules = _
			.chain({})
			.merge(regexBasedRules, complexRules)
			.mapValues(function(rule, name) {
				return {
					name: name,
					method: _.isRegExp(rule) ? getRegexBasedRuleMethod(rule) : getComplexRuleMethod(rule),
					message: _.find([
						_.get(rule, 'message'),
						getRuleMessageForOne(name)
					], _.negate(_.isUndefined))
				};
			})
			.value();

		$.extend($.validator.messages, _.mapKeys(defaultRulesI18n, _.flow(
			getRuleMessageForOne,
			$.validator.format
		)));

		_.forEach(rules, function(rule) {
			$.validator.addMethod(rule.name, rule.method, rule.message);
		});

		customValidationInitialized = true;
	}

	/**
	 * @param  {Objet} accountArray
	 * @param  {Object} rootAccountId
	 * @return {Object}
	 */
	function accountArrayToTree(accountArray, rootAccountId) {
		var result = {};

		$.each(accountArray, function(k, v) {
			if (v.id === rootAccountId) {
				if (!result[v.id]) { result[v.id] = {}; }
				result[v.id].name = v.name;
				result[v.id].realm = v.realm;
			} else {
				var parents = v.tree.slice(v.tree.indexOf(rootAccountId));
				var currentAcc;
				for (var i = 0; i < parents.length; i++) {
					if (!currentAcc) {
						if (!result[parents[i]]) { result[parents[i]] = {}; }
						currentAcc = result[parents[i]];
					} else {
						if (!currentAcc.children) { currentAcc.children = {}; }
						if (!currentAcc.children[parents[i]]) { currentAcc.children[parents[i]] = {}; }
						currentAcc = currentAcc.children[parents[i]];
					}
				}
				if (!currentAcc.children) { currentAcc.children = {}; }
				if (!currentAcc.children[v.id]) { currentAcc.children[v.id] = {}; }
				currentAcc.children[v.id].name = v.name;
				currentAcc.children[v.id].realm = v.realm;
			}
		});

		return result;
	}

	/**
	 * @param  {jQuery} field
	 * @param  {jQuery} template
	 */
	function protectField(field, template) {
		var template = template || $('html');
		var fieldId = field.attr('id');
		var value = field.val();

		$('<input data-protected="' + fieldId + '" type="text" style="display: none;" value="' + value + '"/>').insertBefore(field);

		field.on('focus', function() {
			var $this = $(this);
			var value = $this.val();

			// Setting the val to an empty string before the focus is a nice hack to have the text selection starting at the end of the string instead of the first character
			template.find('[data-protected=' + fieldId + ']')
				.val('')
				.show()
				.focus()
				.val(value);

			$this.hide();
		});

		template.find('[data-protected=' + fieldId + ']').on('blur', function() {
			var $this = $(this);
			var value = $this.val();

			field
				.val(value)
				.show();

			$this.hide();
		});
	}

	/**
	 * @param  {Object} dataError
	 */
	function friendlyError(dataError) {
		var message = '';
		var i18n = monster.apps.core.i18n.active();

		if (_.has(dataError, 'data.api_error.errors')) {
			var errors = dataError.data.api_error.errors;

			_.each(errors, function(error, k) {
				message += '<b>' + i18n.error + ' ' + error.code + ': </b>' + i18n.errors[error.code];

				if (k !== errors.length - 1) {
					message += '<br/><br/>';
				}
			});
		}

		alert('error', message);
	}

	/**
	 * @param  {Object} options
	 * @param  {Number} options.range Maximum number of days between start and end dates,
	 *                                or `monthly` to always set the end date to be one month away
	 *                                from the start date (unless it's after today).
	 * @param  {jQuery} options.container Container of the datepickers.
	 */
	function initRangeDatepicker(options) {
		var timezone;

		if (_.has(monster, 'apps.auth.currentUser.timezone')) {
			timezone = monster.apps.auth.currentUser.timezone;
		} else if (_.has(monster, 'apps.auth.currentAccount.timezone')) {
			timezone = monster.apps.auth.currentAccount.timezone;
		} else {
			timezone = moment.tz.guess();
		}

		var container = options.container;
		var range = options.range || 7;
		var initRange = options.initRange || options.range || 1;
		var inputStartDate = container.find('#startDate');
		var inputEndDate = container.find('#endDate');
		var initDate = moment().tz(timezone);
		var today = moment(initDate).tz(timezone).startOf('day');
		var startDate = _.get(
			options,
			'startDate',
			today
		);
		var endDate = moment(initDate).tz(timezone).endOf('day');

		if (options.startDate) {
			startDate = moment(startDate).tz(timezone);
		} else if (range === 'monthly') {
			startDate = initDate.subtract(1, 'months');
		} else {
			startDate = initDate.subtract(initRange, 'days');
		}

		datepicker(container.find('#startDate, #endDate'), {
			beforeShow: customRange,
			onSelect: customSelect
		});

		inputStartDate.datepicker('setDate', startDate.toDate());
		inputEndDate.datepicker('setDate', endDate.toDate());

		/**
		 * Runs every time the user selects a date in on of the date pickers.
		 * If we selecte a day as the starting date, we want to automatically adjust the end day to
		 * be either satartDay + rage or today (the closest to the start date is chosen).
		 * If the "monthly" mode is on, we want to automatically set the endDate to be exactly one
		 * monthly after the startDate, unless it's after "today" (we had to deo that since # of
		 * days in a month varies).
		 * @param  {String} dateText
		 * @param  {Object} input
		 */
		function customSelect(dateText, input) {
			if (input.id !== 'startDate') {
				return;
			}

			var dateMin = inputStartDate.datepicker('getDate');
			var dateMaxRange;

			dateMaxRange = moment(dateMin).tz(timezone);

			if (range === 'monthly') {
				dateMaxRange.add(1, 'months').subtract(1, 'days');
			} else {
				dateMaxRange.add((range - 1), 'days');
			}

			if (dateMaxRange.isAfter(today)) {
				dateMaxRange = today;
			}

			inputEndDate.val(monster.util.toFriendlyDate(dateMaxRange.toDate(), 'date'));
		}

		/**
		 * Runs every time the user clicks on a date picker, it will set which days are clickable in
		 * the datepicker.
		 * If we click on the End Date, we shouldn't be able to select a day before the starting
		 * date, and we shouldn't be able to select anuthing after "today".
		 * If we click on the Start Date, we should be able to select any day between the 1/1/2011
		 * and "Today".
		 * @param  {Object} input
		 * @return {Object}
		 */
		function customRange(input) {
			var dateMin = inputStartDate.datepicker('getDate');
			var dateMax;

			if (input.id === 'endDate') {
				var minMoment = moment(dateMin);

				// If monthly mode, just increment the month for the maxDate otherwise, add the
				// number of days.
				if (range === 'monthly') {
					minMoment.add(1, 'months').subtract(1, 'days');
				} else {
					minMoment.add((range - 1), 'days');
				}

				// Set the max date to be as far as possible from the min date (We take the
				// dateMaxRange unless it's after "today", we don't want users to search in the
				// future)
				dateMax = minMoment.isAfter(today) ? today.toDate() : minMoment.toDate();
			} else if (input.id === 'startDate') {
				dateMin = moment({ years: 2011 }).startOf('year').toDate();
				dateMax = moment().toDate();
			}

			return {
				minDate: dateMin,
				maxDate: dateMax
			};
		};
	}

	/**
	 * Takes a properly formatted HTML div and automatically display the first tab and selects it.
	 * Clicking on the nav-item will bring the correct tab content and hide the others.
	 * @param  {jQuery} template
	 */
	function fancyTabs(template) {
		template.find('.navbar-menu .navbar-menu-item-link').first().addClass('active');
		template.find('.monster-tab-content').first().addClass('active');

		template.find('.navbar-menu-item-link').on('click', function(event) {
			event.preventDefault();

			var $this = $(this);
			var tabAnimationInProgress = false;
			var renderTabContent = function() {
				if (!tabAnimationInProgress) {
					tabAnimationInProgress = true;

					template.find('.navbar-menu-item-link').removeClass('active');
					template.find('.monster-tab-content').removeClass('active').hide();
					$this.addClass('active');

					template.find('.monster-tab-content[data-tab="' + $this.data('tab') + '"]').fadeIn(function() {
						$(this).addClass('active');

						tabAnimationInProgress = false;
					});
				}
			};

			// I put it in a function as we might want to do things later where we prevent it from happening etc...
			renderTabContent();
		});
	}

	/**
	 * @param  {jQuery} template
	 */
	function tabs(template) {
		template.find('.tabs-main-selector').first().addClass('active');
		template.find('.tabs-section').first().addClass('active');

		template.find('.tabs-selector').on('click', function() {
			var $this = $(this);
			var section = $this.data('section');

			template.find('.tabs-main-selector').removeClass('active');
			template.find('.tabs-section').hide();

			template.find('.tabs-section[data-section="' + section + '"]').show();
			$this.parents('.tabs-main-selector').addClass('active');
		});
	}

	/**
	 * Highlight then fades an element, from blue to gray by default. We use it to highlight a
	 * recent change for example in SmartPBX.
	 * @param  {jQuery} element
	 * @param  {Object} options
	 */
	function highlight(element, options) {
		var options = $.extend(true, {
			startColor: '#2297FF',
			endColor: '#F2F2F2',
			timer: 2000
		}, options);

		// Automatically scroll to the element to let the user see the "add" animation
		if (element.offset()) {
			$('html, body').animate({
				scrollTop: element.offset().top
			}, 300);
		}

		// If the background was a gradient, only changing the background-color wouldn't work, so we hide the image temporarirly
		element
			.css({
				'background-image': 'none',
				'background-color': options.startColor
			})
			.animate({
				backgroundColor: options.endColor
			}, options.timer, function() {
				element.css({
					'background-image': '',
					'background-color': ''
				});

				options.callback && options.callback();
			});
	}

	/**
	 * New Popup to show advanced JavaScript errors.
	 * @param  {Object} error
	 * @return {jQuery}
	 */
	function jsErrorDialog(error) {
		var coreApp = monster.apps.core;
		var i18n = coreApp.i18n.active();
		var dataTemplate = {
			title: error.data.title,
			file: error.data.file,
			line: error.data.line,
			column: error.data.column,
			stackTrace: error.data.stackTrace
		};
		// Since we have code in it, we don't want to trim spaces, so we set the 6th argument to true
		var template = $(monster.template(coreApp, 'dialog-errorJavascript', dataTemplate, false, false, true));

		return alert('error', template, null, {
			htmlContent: true,
			title: i18n.javascriptErrorDialog.title
		});
	}

	/**
	 * New Popup to show advanced API errors via a "More" link.
	 * @param  {Object} error
	 * @return {jQuery}
	 */
	function requestErrorDialog(error) {
		var coreApp = monster.apps.core;
		var dataTemplate = {
			message: error.data.message,
			requestId: error.data.requestId,
			url: error.data.url,
			apiResponse: error.data.response,
			verb: error.data.verb.toUpperCase(),
			showReport: monster.config.whitelabel.hasOwnProperty('callReportEmail'),
			mailToLink: 'mailto:' + monster.config.whitelabel.callReportEmail
				+ '?subject=UI Error Report '
				+ '&body=I encountered an error in the UI. Here are the technical details:'
				+ '%0D%0A____________________________________________________________%0D%0A'
				+ '%0D%0A'
				+ '%0D%0AURL: ' + error.data.verb.toUpperCase() + ' ' + encodeURIComponent(error.data.url)
				+ '%0D%0A'
				+ '%0D%0AMessage: ' + error.data.message
				+ '%0D%0A'
				+ '%0D%0ARequest ID: ' + error.data.requestId + '%0D%0A'
				+ '%0D%0A'
				+ '%0D%0AAPI Response: ' + error.data.response
		};
		var copyTextError = 'Date: ' + new Date()
			+ ' | URL: '
			+ error.data.verb.toUpperCase()
			+ ' '
			+ error.data.url
			+ ' | Message: '
			+ error.data.message
			+ ' | API Response '
			+ error.data.response;
		var alertOptions = {
			htmlContent: true,
			title: error.data.customTitle,
			position: ['center', 20],
			dialogClass: 'api-error-dialog'
		};
		// Since we have code in it, we don't want to trim spaces, so we set the 6th argument to true
		var template = $(monster.template(coreApp, 'dialog-errorAPI', dataTemplate, false, false, true));

		renderJSON(error.data.jsonResponse, template.find('.json-viewer'));

		clipboardWrapper(template.find('.copy-clipboard'), copyTextError);

		template.find('.headline').on('click', function() {
			template.find('.error-details-wrapper').slideToggle();
			$(this).toggleClass('active');
		});

		return alert('error', template, null, alertOptions);
	}

	/**
	 * @param  {Object} data
	 * @param  {Function} callbackOk
	 * @param  {Function} callbackCancel
	 * @return {jQuery}
	 */
	function charges(data, callbackOk, callbackCancel) {
		var coreApp = monster.apps.core;
		var i18n = coreApp.i18n.active();
		var formatData = function(invoices) {
			return {
				showBookkeeper: _.size(invoices) > 1,
				invoices: _.map(invoices, function(invoice) {
					return {
						bookkeeper: _.capitalize(invoice.bookkeeper.type),
						items: _
							.chain(invoice.items)
							.filter(function(item) {
								return item.quantity > 0;
							})
							.map(function(item) {
								return {
									service: _.has(i18n.services, item.item)
										? i18n.services[item.item]
										: monster.util.formatVariableToDisplay(item.item),
									quantity: item.quantity || 0,
									rate: item.rate || 0,
									discount: item.discount > 0
										? item.discount
										: 0,
									monthlyCharges: item.total
								};
							})
							.orderBy('monthlyCharges', 'desc')
							.value()
					};
				})
			};
		};
		var template = $(coreApp.getTemplate({
			name: 'dialog-charges',
			data: formatData(data)
		}));
		var showInvoiceSummary = monster.config.whitelabel.acceptCharges.showInvoiceSummary;
		var content = showInvoiceSummary
			? template
			: _.get(
				monster.config.whitelabel.acceptCharges.message,
				monster.config.whitelabel.language,
				coreApp.i18n.active().acceptCharges.message
			);
		var options = _.merge({
			title: i18n.confirmCharges.title
		}, showInvoiceSummary ? {
			htmlContent: true,
			dialogClass: 'monster-charges'
		} : {});

		return confirm(content, callbackOk, callbackCancel, options);
	}

	/**
	 * Determine the container of jQuery dialogs in the following order:
	 * - visible fullScreenModal
	 * - open myaccount submodule
	 * - absolute container if isPersistent
	 * - current app
	 * @param  {Boolean} pIsPersistent Indicates whether or not to persist the
	 *                                 dialog when switching app contexts
	 * @return {jQuery}               Container of the dialog
	 */
	function getDialogAppendTo(pIsPersistent) {
		var isPersistent = _.isBoolean(pIsPersistent)
			? pIsPersistent
			: false;
		var $coreWrapper = $('.core-wrapper'),
			$coreContent = $coreWrapper.find('.core-content'),
			$coreAbsolute = $coreWrapper.find('.core-absolute'),
			$myAccount = $coreAbsolute.find('#myaccount');

		if ($coreAbsolute.find('.modal-full-screen-wrapper').is(':visible')) {
			return $coreAbsolute.find('.modal-full-screen-wrapper:visible');
		} else if ($myAccount.hasClass('myaccount-open')) {
			return $myAccount.find('.myaccount-dialog-container');
		} else if (isPersistent) {
			return $coreAbsolute;
		} else {
			return $coreContent;
		}
	}

	/**
	 * @param  {String} content
	 * @param  {Object} options
	 * @return {jQuery}
	 */
	function dialog(content, options) {
		// Get options
		var autoScroll = _.get(options, 'autoScroll', true);
		var dialogType = _.get(options, 'dialogType', 'classic');
		var hideClose = _.get(options, 'hideClose', false);
		var isPersistent = _.get(options, 'isPersistent', false);
		var onClose = _.get(options, 'onClose');
		var open = _.get(options, 'open');
		// Other variables/functions for internal use
		var $dialogBody = $('<div />').append(content);
		var $scrollableContainer = $dialogBody;
		var $window = $(window);
		var $body = $('body');
		var coreApp = monster.apps.core;
		var i18n = coreApp.i18n.active();
		var closeBtnText = i18n.close || 'X';
		var dialogPosition = [ 'center', 24 ];
		var windowLastWidth = $window.width();
		var getFullDialog = _.once(function() {
			return $dialogBody.closest('.ui-dialog');
		});
		var setDialogSizes = function() {
			var $dialog = getFullDialog();
			var dialogMaxHeight = $window.height() - 48;	// 100% - 3rem
			var dialogMaxWidth = $window.width() - 48;	// 100% - 3rem
			var dialogHeight = $dialog.height();
			var dialogHeightDiff = dialogMaxHeight - dialogHeight;

			// Set max sizes
			$scrollableContainer.css({
				maxHeight: $scrollableContainer.height() + dialogHeightDiff
			});
			$dialog.css({
				maxWidth: dialogMaxWidth
			});
			$dialogBody.css({
				maxWidth: dialogMaxWidth
			});

			// Center
			if (dialogLastWidth !== $dialog.width() || windowLastWidth !== $window.width() || $dialog.offset().top === 24) {
				$dialogBody.dialog('option', 'position', dialogPosition);

				dialogLastWidth = $dialog.width();
				windowLastWidth = $window.width();
			}
		};
		var windowResizeHandler = _.debounce(setDialogSizes, 100);
		// Unset variables
		var dialogLastWidth;

		//Unoverridable options
		var strictOptions = {
			// Values
			appendTo: getDialogAppendTo(isPersistent),
			draggable: false,
			hide: {
				effect: 'fade',
				duration: 200
			},
			position: dialogPosition,
			resizable: false,
			show: {
				effect: 'fade',
				duration: 200
			},
			zIndex: 20000,
			// Event handlers
			close: function() {
				var hasOtherDialogsOpen = _.some($body.find('.ui-dialog .ui-dialog-content'), function(element) {
					return _.isFunction($(element).dialog) && $(element).dialog('isOpen');
				});

				// Clear events
				$window.off('resize', windowResizeHandler);

				// Remove elements
				$('div.popover').remove();
				$dialogBody.dialog('destroy');
				$dialogBody.remove();

				if (!hasOtherDialogsOpen) {
					$body.removeClass('monster-dialog-active');
				}

				// Execute close callback, if possible
				if (_.isFunction(onClose)) {
					// jQuery FREAKS out and gets into an infinite loop if the
					// following function kicks back an error. Hence the try/catch.
					try {
						onClose();
					} catch (err) {
						if (console && err.message && err.stack) {
							console.log(err.message);
							console.log(err.stack);
						}
					}
				}
			},
			open: function() {
				$body.addClass('monster-dialog-active');
				if (hideClose) {
					getFullDialog().find('.ui-dialog-titlebar-close').hide();
				}
				if (_.isFunction(open)) {
					open();
				}
			}
		};
		//Default options
		var defaults = {
			// Values
			modal: true,
			width: 'auto'
		};

		// Overwrite any defaults with settings passed in,omitting the custom ones, or the
		// ones that will be handled in a custom way. Then overwrite any attributes with the
		// unoverridable options
		options = _
			.merge(defaults,
				_.omit(options, [
					'dialogType',
					'hideClose',
					'minHeight',
					'minWidth',
					'autoScroll'
				]),
				strictOptions);

		$dialogBody.dialog(options);
		dialogLastWidth = getFullDialog().width();

		// Set dialog close button
		switch (dialogType) {
			case 'conference':
				closeBtnText = '<i class="fa fa-times icon-small"></i>';
				break;
			default:
				closeBtnText = getSvgIconTemplate({
					id: 'telicon2--x--circle'
				});
				break;
		}
		$dialogBody.siblings().find('.ui-dialog-titlebar-close').html(closeBtnText);

		// Container is scrollable by default, so disable if required
		if (!autoScroll) {
			$scrollableContainer.css({
				overflow: 'visible'
			});
		}

		// Set initial sizes
		setDialogSizes();

		// Update position, in case size changed
		$dialogBody.dialog('option', 'position', dialogPosition);

		// Set event handlers
		$('input', content).keypress(function(e) {
			if (e.keyCode === 13) {
				e.preventDefault();
				return false;
			}
		});
		$window.on('resize', windowResizeHandler);

		return $dialogBody;	// Return the new div as an object, so that the caller can destroy it when they're ready.
	}

	/**
	 * @param  {String} content
	 * @param  {Function} callbackOk
	 * @param  {Function} callbackCancel
	 * @param  {Object} options
	 * @return {jQuery}
	 */
	function confirm(content, callbackOk, callbackCancel, options) {
		var dialog;
		var coreApp = monster.apps.core;
		var i18n = coreApp.i18n.active();
		var confirmOptions = options || {};
		var type = confirmOptions.type || 'confirm';
		var templateData = {
			content: content,
			title: confirmOptions.title || i18n.dialog.confirmTitle,
			data: content.data || 'No extended information.',
			cancelButtonText: confirmOptions.cancelButtonText || i18n.dialog.confirmCancel,
			confirmButtonText: confirmOptions.confirmButtonText || i18n.dialog.confirmOk,
			cancelButtonClass: confirmOptions.cancelButtonClass || 'monster-button',
			confirmButtonClass: confirmOptions.confirmButtonClass || 'monster-button-success'
		};
		var confirmBox = $(monster.template(coreApp, 'dialog-confirm', templateData));
		var options = $.extend(
			true,
			{
				closeOnEscape: false,
				onClose: function() {
					ok ? callbackOk && callbackOk() : callbackCancel && callbackCancel();
				}
			},
			options
		);
		var ok = false;

		if (confirmOptions.htmlContent) {
			confirmBox.find('.dialog-text').html(content);
		}
		if (confirmOptions.htmlTitle && confirmOptions.title) {
			confirmBox.find('.dialog-header').html(confirmOptions.title);
		}

		switch (type) {
			case 'warning': {
				options.title = '<i class="fa fa-exclamation-triangle monster-yellow"></i>';
				break;
			}
			case 'error': {
				options.title = '<i class="fa fa-times-circle monster-red"></i>';
				break;
			}
			case 'info': {
				options.title = '<i class="fa fa-info-circle monster-primary-color"></i>';
				break;
			}
			case 'confirm':
			default: {
				options.title = '<i class="fa fa-question-circle monster-primary-color"></i>';
				break;
			}
		}

		options.dialogClass = 'monster-confirm' + (options.dialogClass ? ' ' + options.dialogClass : '');

		dialog = this.dialog(confirmBox, options);

		confirmBox.find('#confirm_button').on('click', function() {
			ok = true;
			dialog.dialog('close');
		});

		confirmBox.find('#cancel_button').on('click', function() {
			dialog.dialog('close');
		});

		return dialog;
	}

	/**
	 * @param  {info|warning|yellow}   type
	 * @param  {String}   content
	 * @param  {Function} callback
	 * @param  {Object}   options
	 * @return {jQuery}
	 */
	function alert(type, content, callback, options) {
		if (typeof content === 'undefined') {
			content = type;
			type = 'info';
		}

		var coreApp = monster.apps.core;
		var i18n = coreApp.i18n.active();
		var alertOptions = options || {};
		var templateData = {
			content: content,
			title: alertOptions.title || i18n.dialog[type + 'Title'],
			data: content.data || 'No extended information.',
			closeButtonText: alertOptions.closeButtonText || i18n.close,
			closeButtonClass: alertOptions.closeButtonClass || 'monster-button'
		};
		var alertBox = $(monster.template(coreApp, 'dialog-' + type, templateData));
		var options = $.extend(
			true,
			{
				onClose: function() {
					callback && callback();
				}
			},
			options
		);
		var dialog;

		if (alertOptions.htmlContent) {
			alertBox.find('.dialog-text').html(content);
		}
		if (alertOptions.htmlTitle && alertOptions.title) {
			alertBox.find('.dialog-header').html(alertOptions.title);
		}

		switch (type) {
			case 'warning': {
				options.title = '<i class="fa fa-exclamation-triangle monster-yellow"></i>';
				break;
			}
			case 'error': {
				options.title = '<i class="fa fa-times-circle monster-red"></i>';
				break;
			}
			case 'confirm': {
				options.title = '<i class="fa fa-question-circle monster-primary-color"></i>';
				break;
			}
			case 'info':
			default: {
				options.title = '<i class="fa fa-info-circle monster-primary-color"></i>';
				break;
			}
		}

		options.dialogClass = 'monster-alert' + (options.dialogClass ? ' ' + options.dialogClass : '');

		dialog = this.dialog(alertBox, options);

		alertBox.find('#close_button').on('click', function() {
			dialog.dialog('close');
		});

		dialog.find('.btn.alert_button').click(function() {
			dialog.dialog('close');
		});

		dialog.find('.json_error').css({ 'cursor': 'pointer' });

		dialog.find('.json')
			.css('min-width', 0)
			.click(function(event) {
				event.preventDefault();
				dialog.find('.json_error').toggle();
			});

		return dialog;
	}

	/**
	 * Whwn the developer wants to use steps, they can just send an object like
	 * { range: 'max', steps: [30, 3600, 18880], value: 30 }
	 * for the options, and this helper will take care of the standard configuration, with no need
	 * to provide the "step", "min" or "max" options.
	 * @param  {jQuery} target
	 * @param  {Object} pOptions
	 * @return {jQuery}
	 */
	function slider(target, pOptions) {
		var id = Date.now();
		var friendlyPrint = function(val) {
			var realValue = val;

			// If the user uses a set of steps for its sliders, we need to get the "real" value instead of the step number.
			if (pOptions.hasOwnProperty('steps')) {
				realValue = pOptions.steps[val];
			}

			var friendlyValue = realValue;

			// If the user has defined a way to print the value in a customized way, we execute his pretty printer and return the value
			// This is useful for example if the developer uses a slider in seconds but wants to display a value in hours,
			// Then for example the "real" slider value would be 3600 but the user would see "1 Hour" if the pretty printer was using util.friendlyTimer for example
			if (pOptions.hasOwnProperty('friendlyPrint')) {
				friendlyValue = pOptions.friendlyPrint(realValue);
			}

			return friendlyValue;
		};
		var defaultOptions = {
			slide: function(event, ui) {
				// If the developer uses a set of steps, then we need to get the value corresponding to the step number
				var realValue = pOptions.hasOwnProperty('steps') ? pOptions.steps[ui.value] : ui.value;

				$(ui.handle)
						.find('.ui-slider-tooltip .tooltip-value')
							// We keep the "real" value in the DOM so the developer can get the real value to save in DB for example
							.attr('data-real-value', realValue)
							// And we present the friendlyPrinter value to the end-user
							.text(friendlyPrint(ui.value));
			}
		};
		var options = $.extend(true, {}, pOptions, defaultOptions);
		var sliderTemplate;
		var handlePosition;

		// If the developer wants to use steps, we need to override min, max and step values to work accordingly to the steps provided.
		if (pOptions.hasOwnProperty('steps')) {
			options.step = 1;
			options.min = 0;
			options.max = pOptions.steps.length - 1;
			options.value = pOptions.steps.indexOf(options.value);
		}

		var templateData = {
			id: id,
			min: friendlyPrint(options.min),
			max: friendlyPrint(options.max),
			unit: options.unit
		};

		if (options.range === 'min') {
			handlePosition = 'top';

			templateData.minHandle = {
				text: options.i18n.minHandle.text,
				value: friendlyPrint(options.value)
			};
		} else if (options.range === 'max') {
			handlePosition = 'bottom';

			templateData.maxHandle = {
				text: options.i18n.maxHandle.text,
				value: friendlyPrint(options.value)
			};
		} else if (options.range) {
			handlePosition = 'both';

			templateData.minHandle = {
				text: options.i18n.minHandle.text,
				value: friendlyPrint(options.value)
			};

			templateData.maxHandle = {
				text: options.i18n.maxHandle.text,
				value: friendlyPrint(options.value)
			};
		}

		templateData.handlePosition = handlePosition;

		sliderTemplate = $(monster.template(monster.apps.core, 'monster-slider', templateData));

		return $(target).append(sliderTemplate).find('#monster_slider_' + id).slider(options);
	}

	/**
	 * @param  {jQuery} $target
	 * @param  {Object} args
	 * @param  {Object[]} args.cidNumbers
	 * @param  {Object[]} [args.phoneNumbers]
	 * @param  {String} [args.accountId]
	 * @param  {Function} [args.onAdded]
	 * @param  {Boolean} [args.allowVerifyLater=false]
	 * @param  {Boolean} [args.allowNone=true]
	 * @param  {Boolean} [args.allowAdd=true]
	 * @param  {String} [args.noneLabel]
	 * @param  {String} [args.selectName]
	 * @param  {String} [args.selected]
	 * @param  {String} [args.chosen]
	 */
	function cidNumberSelector($target, args) {
		var self = monster.apps.core;
		var getOptionData = _.flow(
			_.partial(_.get, _, 'number'),
			function(number) {
				return {
					value: number,
					text: monster.util.formatPhoneNumber(number)
				};
			}
		);
		var cidNumbers = _
			.chain(args)
			.get('cidNumbers', [])
			.filter('verified')
			.map(getOptionData)
			.value();
		var phoneNumbers = _
			.chain(args)
			.get('phoneNumbers', [])
			.map(getOptionData)
			.value();
		var numberOptions = _
			.chain([
				cidNumbers,
				phoneNumbers
			])
			.flatten()
			.sortBy('text')
			.value();
		var allowNone = _.get(args, 'allowNone', true);
		var allowAdd = _.get(args, 'allowAdd', true);
		var forceNone = allowNone || _.isEmpty(numberOptions);
		var defaultOptions = _.flatten([
			forceNone ? [{
				value: '',
				text: _.get(args, 'noneLabel', self.i18n.active().cidNumberSelector.none)
			}] : [],
			allowAdd ? [{
				value: 'add_new',
				text: self.i18n.active().cidNumberSelector.addNew
			}] : []
		]);
		var options = _.flatten([
			defaultOptions,
			numberOptions
		]);
		var selectedPhoneNumber = _.find([
			args.selected
		], _.overEvery(
			_.isString,
			_.partial(_.includes, _.map(numberOptions, 'value'))
		));
		var firstPhoneNumber = _
			.chain(numberOptions)
			.head()
			.get('value')
			.value();
		var $template = $(self.getTemplate({
			name: 'monster-cidNumberSelector',
			data: _.merge({
				selected: _.find([
					selectedPhoneNumber,
					allowNone && '',
					firstPhoneNumber,
					''
				], _.isString),
				options: options
			}, _.pick(args, [
				'selectName'
			]))
		}));
		var $selector = $template.find('select');
		var onAdded = _.find([
			args.onAdded,
			function() {}
		], _.isFunction);

		chosen($selector, _.get(args, 'chosen'));

		$selector.on('change', function onAddNewSelect(event) {
			event.preventDefault();

			var value = $(this).val();

			if (value !== 'add_new') {
				return;
			}
			var $noneOption = $selector.find('option[value=""]');
			var defaultOptionValues = _.map(defaultOptions, 'value');
			var $firstNumberOption = $selector
				.find('option')
				.filter(function() {
					return !_.includes(defaultOptionValues, $(this).val());
				})
				.first();
			var $defaultOption = forceNone && $noneOption.length ? $noneOption
				: $firstNumberOption.length ? $firstNumberOption
				: $noneOption;

			$selector
				.val($defaultOption.val())
				.trigger('chosen:updated');

			monster.pub('common.cidNumber.renderAdd', _.merge({
				allowVerifyLater: false,
				accountId: monster.apps.auth.currentAccount.id,
				onVerified: function(numberMetadata) {
					var optionData = getOptionData(numberMetadata);

					if (!allowNone) {
						$selector.find('option[value=""]').remove();
					}

					$selector
						.append($('<option>', optionData))
						.val(optionData.value)
						.trigger('chosen:updated change');

					onAdded(numberMetadata);
				}
			}, _.pick(args, [
				'accountId',
				'allowVerifyLater'
			])));
		});

		$target.append($template);
	}

	/**
	 * @param  {Object} args
	 * @param  {Object[]} [args.choices]
	 * @param  {Object} [args.existing]
	 * @param  {Boolean} [args.isEditable=false]
	 * @param  {Object} [args.i18n]
	 * @param  {Function} [args.normalizer]
	 * @param  {Function} [args.onSelect]
	 */
	function keyValueSelector(pArgs) {
		var self = monster.apps.core;
		var args = _.merge({
			choices: [],
			existing: {},
			isEditable: false,
			i18n: {
				title: self.i18n.active().keyValueSelector.title
			},
			normalizer: _.snakeCase
		}, pArgs);
		var choices = args.choices;
		var existing = args.existing;
		var isEditable = _.isEmpty(choices) ? true : args.isEditable;
		var i18n = args.i18n;
		var normalizer = args.normalizer;
		var onSelect = args.onSelect;
		var $template = $(self.getTemplate({
			name: 'monster-keyValueSelector',
			data: {
				i18nCustom: _.get(args, 'i18n', {}),
				choices: choices,
				isEditable: isEditable
			}
		}));
		var $container = dialog($template, _.merge({
			autoScroll: false
		}, _.pick(i18n, [
			'title'
		])));
		var $form = $container.find('#key_value_selector_form');
		var itemsPerCategory = _.mergeWith(
			_
				.chain(existing)
				.mapKeys(function(v, category) {
					return normalizer(category);
				})
				.mapValues(_.partial(_.map, _, normalizer))
				.value(),
			_
				.chain(choices)
				.keyBy(_.flow(
					_.partial(_.get, _, 'id'),
					normalizer
				))
				.mapValues(_.flow(
					_.partial(_.get, _, 'items'),
					_.partial(_.map, _, _.flow(
						_.partial(_.get, _, 'id'),
						normalizer
					))
				))
				.value(),
			function(obj, src) {
				return _.every([obj, src], _.isArray) ? _
					.chain(obj)
					.concat(src)
					.uniq()
					.value() : undefined;
			}
		);
		var categories = _.keys(itemsPerCategory);
		var $newCategoryInput = $container.find('input[name="newCategoryId"]');
		var $newItemInput = $container.find('input[name^="newItemId."]');
		var $selectButton = $container.find('.js-select');
		var ruleCommon = {
			normalizer: _.unary(normalizer)
		};

		validate($form, {
			rules: _.merge({
				newCategoryId: _.merge({
					checkList: categories
				}, ruleCommon)
			}, _.transform(itemsPerCategory, function(obj, items, category) {
				obj['newItemId.' + category] = _.merge({
					checkList: items
				}, ruleCommon);
			}, {}))
		});

		$container
			.find('input[name="categoryId"]')
				.on('change', function(event) {
					event.preventDefault();

					var selectedCategoryId = $(this).val();

					$container.find('.sub-category-wrapper').hide();
					$newItemInput.hide();
					$selectButton.prop('disabled', 'disabled');
					$container.find('input[name="itemId"]').prop('checked', false);

					if (_.isEmpty(selectedCategoryId)) {
						$newCategoryInput.slideDown(100, function() {
							$(this).focus();
						});
					} else {
						$newCategoryInput
							.slideUp(100)
							.val('');
						$newItemInput.val('');
						$container
							.find('.sub-category-wrapper[data-category="' + selectedCategoryId + '"]')
								.slideDown(100);
					}
				});

		$container
			.find('input[name="newCategoryId"]')
				.on('keyup input', _.debounce(function(event) {
					event.preventDefault();

					var newCategoryId = _
						.chain(getFormData('key_value_selector_form'))
						.get('newCategoryId')
						.thru(normalizer)
						.value();
					var $emptyCategoryWrapper = $container.find('.sub-category-wrapper[data-category=""]');

					if (_.isEmpty(newCategoryId) || _.includes(categories, newCategoryId)) {
						$container.find('.sub-category-wrapper').hide();
						$newItemInput.val('');
					} else if (!$emptyCategoryWrapper.is(':visible')) {
						$emptyCategoryWrapper.slideDown(100, function() {
							$emptyCategoryWrapper.find('input[name="itemId"]').click();
						});
					}
					valid($form);
				}, 250));

		$container
			.find('input[name="itemId"]')
				.on('change', function(event) {
					event.preventDefault();

					var selectedItemId = $(this).val();

					$selectButton.prop('disabled', _.isEmpty(selectedItemId) ? 'disabled' : false);

					if (_.isEmpty(selectedItemId)) {
						$newItemInput.slideDown(100, function() {
							$(this).focus();
						});
					} else {
						$newItemInput
							.slideUp(100)
							.val('');
					}
				});

		$container
			.find('input[name^="newItemId."]')
				.on('keyup input', function(event) {
					event.preventDefault();

					var formData = getFormData('key_value_selector_form');
					var newCategoryId = normalizer(
						_.isEmpty(formData.categoryId) ? $newCategoryInput.val() : formData.categoryId
					);
					var newItemId = normalizer($(this).val());
					var alreadyExists = _.includes(categories, newCategoryId) && _
						.chain(itemsPerCategory)
						.get(newCategoryId)
						.includes(newItemId)
						.value();

					if (_.isEmpty(newItemId) || alreadyExists) {
						$selectButton.prop('disabled', 'disabled');
					} else if (!_.isEmpty(newItemId) && !alreadyExists) {
						$selectButton.prop('disabled', false);
					}
					valid($form);
				});

		$container
			.find('.js-cancel')
				.on('click', function(event) {
					event.preventDefault();

					$container.dialog('close');
				});

		$container
			.find('#key_value_selector_form')
				.on('submit', function(event) {
					event.preventDefault();

					var formData = getFormData('key_value_selector_form');
					var category = _.isEmpty(formData.newCategoryId) ? formData.categoryId : normalizer(formData.newCategoryId);
					var isCategoryNew = !_.includes(categories, category);
					var newItemInputValue = _.get(formData, [
						'newItemId',
						isCategoryNew ? '' : category
					]);
					var item = _.isEmpty(formData.itemId) ? normalizer(newItemInputValue) : formData.itemId;

					onSelect && onSelect(category, item);

					$container.dialog('close');
				});
	}

	/**
	 * Chosen plugin wrapper used to apply the same default options
	 * @param  {jQuery} $target  <select> element to invoke chosen on
	 * @param  {Object} pOptions Options for widget
	 * @returns  {Object}  Chosen instance
	 */
	function chosen($target, pOptions) {
		var i18n = monster.apps.core.i18n.active().chosen;
		var defaultChosenOptions = {
			search_contains: true,
			width: '220px'
		};
		var defaultCustomOptions = {
			tags: false
		};
		var options = _.merge(
			{},
			defaultCustomOptions,
			defaultChosenOptions,
			pOptions
		);
		var instance;

		if (
			options.tags
			&& !_.has(options, 'no_results_text')
		) {
			options.no_results_text = i18n.addNewTag;
		}

		$target.chosen(options);

		instance = $target.data('chosen');

		if (!options.tags) {
			return instance;
		}

		// Bind the keyup event to the search box input
		instance.search_field.on('keyup', function(event) {
			// If we hit Enter and the results list is empty (no matches) add the option
			if (
				event.which !== 13
				|| instance.dropdown.is('.no-results:visible')
			) {
				return;
			}

			var newOptionValue = $(this).val();
			var $newOption = $('<option>')
				.val(newOptionValue)
				.text(newOptionValue)
				.prop('selected', true);

			// Add the new option
			$target
				.append($newOption)
				.trigger('chosen:updated');
		});

		return instance;
	}

	/**
	 * Transforms a select field into a searchable list of countries.
	 * @param  {jQuery} $target  <select> element on which the list will be built
	 * @param  {Object} [args]  Additional arguments for the widget
	 * @param  {String|String[]} [args.selectedValues]  List of selected values
	 * @param  {Object} [args.options]  Options for widget
	 * @returns  {Object}  Chosen instance
	 */
	function countrySelector($target, args) {
		if (!($target instanceof jQuery)) {
			throw TypeError('"$target" is not a jQuery object');
		}
		if (!$target.is('select')) {
			throw TypeError('"$target" is not a select input');
		}
		if (!_.isUndefined(args) && !_.isPlainObject(args)) {
			throw TypeError('"args" is not a plain object');
		}
		if (
			_.has(args, 'selectedValues')
			&& !(_.isString(args.selectedValues) || _.isArray(args.selectedValues))
		) {
			throw TypeError('"args.selectedValues" is not a string nor an array');
		}
		if (_.has(args, 'options') && !_.isPlainObject(args.options)) {
			throw TypeError('"args.options" is not a plain object');
		}
		var selectedValues = _.get(args, 'selectedValues', []);
		var options = _.get(args, 'options', {});
		var showEmptyOption = _.get(options, 'showEmptyOption', false);
		var itemsTemplate = getCountrySelectorTemplate({
			selectedValues: selectedValues,
			showEmptyOption: showEmptyOption
		});
		var itemTemplate = monster.template(monster.apps.core, 'monster-country-selector-item');
		var chosenOptions = _.merge({
			html_template: itemTemplate
		}, options);
		var chosenInstance;

		// Append items to select element
		$target.append(itemsTemplate);

		// Initialize chosen
		chosenInstance = chosen($target, chosenOptions);
		chosenInstance.container.addClass('monster-country-selector');

		return chosenInstance;
	}

	/**
	 * Temporarily obfuscates form fields `name` attributes to disable browsers/password managers
	 * auto filling of username/password `input` elements.
	 * @param  {jQuery} $target Form to obfuscate fields of
	 * @param  {Object} [options] Plugin options
	 */
	function disableAutoFill($target, options) {
		if (!($target instanceof $)) {
			throw TypeError('"$target" is not a jQuery object');
		}
		if (!_.isUndefined(options) && !_.isPlainObject(options)) {
			throw TypeError('"options" is not a plain object');
		}
		$target.disableAutoFill(options);
	}

	/**
	 * Gets a template to render the option items for a `select` list of the countries
	 *
	 * @private
	 * @param {Object} args
	 * @param {String|String[]} args.selectedValues  The value or values to be selected
	 * @param {Boolean} args.showEmptyOption  Whether or not to add an empty option to the list
	 * @returns  {String}  Country selector template
	 */
	function getCountrySelectorTemplate(args) {
		var selectedValues = args.selectedValues,
			showEmptyOption = args.showEmptyOption,
			countries = _
				.chain(monster.timezone.getCountries())
				.map(function(label, code) {
					return {
						code: code,
						label: label
					};
				})
				.sortBy('label')
				.value();
		return monster.template(monster.apps.core, 'monster-country-selector', {
			countries: countries,
			selectedCountries: selectedValues,
			showEmptyOption: showEmptyOption
		});
	}

	/**
	 * Collect strucutred form data into a plain object
	 * @param  {String} rootNode
	 * @param  {String} [delimiter='.']
	 * @param  {Boolean} [skipEmpty=false]
	 * @param  {Function} [nodeCallback]
	 * @return {Object}
	 */
	function getFormData(rootNode, delimiter, skipEmpty, nodeCallback) {
		var formData;

		try {
			formData = form2object(rootNode, delimiter, skipEmpty, nodeCallback);
		} catch (error) {
			formData = {};
		}

		for (var key in formData) {
			if (key === '') {
				delete formData[key];
			}
		}

		return formData;
	}

	/**
	 * Gets a template to render `select` list of the languages that are supported by Monster UI
	 *
	 * @private
	 * @param  {Object} args
	 * @param  {String} [args.selectedLanguage]  IETF language tag
	 * @param  {Boolean} [args.showDefault=false]  Whether or not to include a default option in the language list
	 * @param  {Object} [args.attributes]  Collection of key/value corresponding to HTML attributes set on the `select` tag
	 * @returns {String}  Language select list template
	 */
	function getLanguageSelectorTemplate(args) {
		if (!_.isPlainObject(args)) {
			throw TypeError('"args" is not a plain object');
		}
		var selectedLanguage = _.get(args, 'selectedLanguage'),
			showDefault = _.get(args, 'showDefault', false),
			attributes = _.get(args, 'attributes', {}),
			languages;
		if (!_.isUndefined(selectedLanguage) && !_.isString(selectedLanguage)) {
			throw TypeError('"selectedLanguage" is not a string');
		}
		if (!_.isBoolean(showDefault)) {
			throw TypeError('"showDefault" is not a boolean');
		}
		if (!_.isPlainObject(attributes)) {
			throw TypeError('"attributes" is not a plain object');
		}
		// Delay language iteration until we know that all the parameters are valid, to avoid
		// unnecessary processing
		languages = _
			.chain(monster.supportedLanguages)
			.map(function(code) {
				return {
					value: code,
					label: monster.util.tryI18n(monster.apps.core.i18n.active().monsterLanguages, code)
				};
			})
			.sortBy('label')
			.value();
		if (showDefault) {
			languages.unshift({
				value: 'auto',
				label: monster.util.tryI18n(monster.apps.core.i18n.active().monsterLanguages, 'auto')
			});
		}
		return monster.template(monster.apps.core, 'monster-language-selector', {
			attributes: attributes,
			languages: languages,
			selectedLanguage: selectedLanguage
		});
	};

	/**
	 * Get handlebars template to render an SVG icon
	 * @param   {Object} args
	 * @param   {String} args.id            Icon ID
	 * @param   {String} [args.attributes]  Attributes to be added to the SVG tag
	 * @return  {String}                    SVG icon template
	 */
	function getSvgIconTemplate(args) {
		if (!_.isPlainObject(args)) {
			throw TypeError('"args" is not a plain object');
		}
		if (!_.isString(args.id)) {
			throw TypeError('"id" is not a string');
		}
		if (_.has(args, 'attributes') && !_.isPlainObject(args.attributes)) {
			throw TypeError('"attributes" is not a plain object');
		}
		var iconId = args.id;
		var iconPrefix = iconId.substring(0, iconId.indexOf('--'));
		var attributes = _.get(args, 'attributes', {});
		attributes = mergeHtmlAttributes(attributes, {
			'class': 'svg-icon ' + iconPrefix
		});

		return monster.template(monster.apps.core, 'monster-svg-icon', {
			iconId: iconId,
			attributes: attributes
		});
	}

	/**
	 * Get the jsoneditor instance from the container as long as exists
	 * @param {jQuery} $target jsoneditor container
	 * @return {JSONEditor | null}
	 */
	function getJsoneditor($target) {
		if (!($target instanceof $)) {
			throw TypeError('"$target" is not a jQuery object');
		}

		var container = $target[0];

		return _.get(container, 'jsoneditor', null);
	}

	/**
	 * Cleanly insert a template in a container by animating it and showing a
	 * loading view until the callback is called.
	 * @param  {jQuey Object}   $container target where to insert the template
	 * @param  {jQuery|Function} template   template or callback providing the template
	 * @param  {Object}   pOptions   loading view options
	 */
	function insertTemplate($container, template, pOptions) {
		var coreApp = monster.apps.core,
			options = _.merge({
				hasBackground: true,
				title: coreApp.i18n.active().insertTemplate.title,
				text: coreApp.i18n.active().insertTemplate.text,
				duration: 250
			}, pOptions),
			loadingTemplate = monster.template(coreApp, 'monster-insertTemplate', _.pick(options, [
				'hasBackground',
				'cssClass',
				'cssId',
				'title',
				'text'
			])),
			appendTemplate = function(template, insertTemplateCallback, fadeInCallback) {
				$container
					.stop()
					.empty()
					.hide()
					.append(template)
					.fadeIn(options.duration, function() {
						fadeInCallback && fadeInCallback();
					});

				insertTemplateCallback && insertTemplateCallback();
			};

		appendTemplate(template instanceof $ ? template : loadingTemplate);

		if (_.isFunction(template)) {
			template(appendTemplate);
		}
	}

	/**
	 * Create a new instance of jsoneditor
	 * @param {jQuery} $target Contatiner to append the editor to
	 * @param {Object} [options] Editor options
	 * @param {Object} [options.json] JSON object to set in the editor as initial data
	 * @return {JSONEditor} editor
	 */
	function jsoneditor($target, options) {
		if (!($target instanceof $)) {
			throw TypeError('"$target" is not a jQuery object');
		}

		var container = $target[0],
			jsonObject = _.get(options, 'json', {}),
			formattedOptions = _.merge({ mode: 'code' }, _.omit(options, ['json'])),
			editor = new JSONEditor(container, formattedOptions);

		editor.set(jsonObject);
		// Attach the instance to the container
		container.jsoneditor = editor;

		return editor;
	}

	/**
	 * Generates a key-value pair editor
	 * @param  {jQuery} $target  Container to append the widget to.
	 * @param  {Object} [options]  Editor options
	 * @param  {Object} [options.data]  Key-value data, as a plain object
	 * @param  {String} [options.inputName]  Input name prefix
	 * @param  {Object} [options.i18n]  Custom label translations
	 * @param  {Object} [options.i18n.addLink]  Add row link label
	 * @param  {String} [options.i18n.keyPlaceholder]  Key input placeholder
	 * @param  {String} [options.i18n.valuePlaceholder]  Value input placeholder
	 */
	function keyValueEditor($target, options) {
		if (!($target instanceof $)) {
			throw TypeError('"$target" is not a jQuery object');
		}
		var data = _.get(options, 'data', {});
		var inputName = _.get(options, 'inputName', 'data');
		var addLink = _.get(options, 'i18n.addLink');
		var keyPlaceholder = _.get(options, 'i18n.keyPlaceholder');
		var valuePlaceholder = _.get(options, 'i18n.valuePlaceholder');
		if (!_.isPlainObject(data)) {
			throw new TypeError('"options.data" is not a plain object');
		}
		if (!_.isNil(inputName) && !_.isString(inputName)) {
			throw new TypeError('"options.inputName" is not a string');
		}
		if (!_.isNil(addLink) && !_.isString(addLink)) {
			throw new TypeError('"options.i18n.addLink" is not a string');
		}
		if (!_.isNil(keyPlaceholder) && !_.isString(keyPlaceholder)) {
			throw new TypeError('"options.i18n.keyPlaceholder" is not a string');
		}
		if (!_.isNil(valuePlaceholder) && !_.isString(valuePlaceholder)) {
			throw new TypeError('"options.i18n.valuePlaceholder" is not a string');
		}
		var $editorTemplate = $(monster.template(monster.apps.core, 'monster-key-value-editor', {
			addLink: addLink
		}));
		var $rowContainer = $editorTemplate.find('.monster-key-value-data-container');
		var addRow = function(value, key, index) {
			$rowContainer.append(monster.template(monster.apps.core, 'monster-key-value-editor-row', {
				key: key,
				value: value,
				inputName: inputName + '[' + index + ']',
				keyPlaceholder: keyPlaceholder,
				valuePlaceholder: valuePlaceholder
			}));
		};
		// Add initial rows
		var counter = 0;
		_.each(data, function(value, key, index) {
			addRow(value, key, counter);
			counter += 1;
		});
		// Bind events
		$editorTemplate.find('.key-value-add').on('click', function(e) {
			e.preventDefault();
			addRow('', '', counter);
			counter += 1;
		});
		$rowContainer.on('click', '.key-value-remove', function(e) {
			e.preventDefault();
			$(this).closest('.monster-key-value-editor-row').remove();
			// Notice that the counter is not decremented on row remove. This is because its sole
			// purpose is to guarantee a unique and ordered index of the rows, to allow the
			// key-value pairs to be sorted in the same way as they are displayed in the editor
			// when the values are retrieved as an array via monster.ui.getFormData()
		});
		// Append editor
		$target.append($editorTemplate);
		return $editorTemplate;
	}

	/**
	 * Merges HTML attributes, mapped as JSON objects
	 *
	 * @private
	 * @param   {Object} object  Destination object
	 * @param   {Object} source  Source object
	 * @returns {Object}         Returns `object` after merge
	 */
	function mergeHtmlAttributes(object, source) {
		if (!_.isPlainObject(object)) {
			throw new TypeError('"object" is not a plain object');
		}
		if (!_.isPlainObject(source)) {
			throw new TypeError('"source" is not a plain object');
		}

		return _.mergeWith(object, source, function(objValue, srcValue, key) {
			objValue = _.isNil(objValue) ? '' : objValue;
			srcValue = _.isNil(srcValue) ? '' : srcValue;
			if (key !== 'class') {
				return _.toString(objValue) + _.toString(srcValue);
			}
			var srcClasses = _
				.chain(srcValue)
				.toString()
				.split(/\s+/g) // Split by one or more whitespaces
				.value();
			return _
				.chain(objValue)
				.toString()
				.split(/\s+/g) // Split by one or more whitespaces
				.union(srcClasses)
				.reject(_.isEmpty) // Reject empty strings that appear due to leading or trailing whitespaces, or empty string
				.join(' ')
				.value();
		});
	}

	/**
	 * Transforms a field into a jQuery MonthPicker element
	 * @param  {jQuery} $target Input to transform
	 * @param  {Object} options List of options
	 * @return {jQuery}         MonthPicker instance
	 */
	function monthpicker($target, options) {
		var selectedMonth = _.get(options, 'selectedMonth', null);
		var minMonth = _.get(options, 'minMonth', null);
		var maxMonth = _.get(options, 'maxMonth', null);

		return $target.MonthPicker({
			ShowIcon: false,
			SelectedMonth: selectedMonth,
			Duration: 250,
			MinMonth: minMonth,
			MaxMonth: maxMonth,
			i18n: _.merge({
				months: _
					.chain(monster.apps.core.i18n.active().calendar.month)
					.toArray()
					.map(function(month) {
						return month.substring(0, 3) + '.';
					})
					.value()
			}, monster.apps.core.i18n.active().monthPicker)
		});
	}

	/**
	 * Transforms a field into a number picker, using the jQuery UI Spinner widget
	 * @param  {jQuery} $target  Input to transform
	 * @param  {Object} [options]  List of options
	 * @return {jQuery}          jQuery UI Spinner instance
	 */
	function numberPicker($target, pOptions) {
		if (!($target instanceof $)) {
			throw TypeError('"$target" is not a jQuery object');
		}
		if (!_.isUndefined(pOptions) && !_.isPlainObject(pOptions)) {
			throw TypeError('"options" is not a plain object');
		}
		$target.each(function() {
			var $this = $(this);
			$this.data('value', $this.val());
		});
		var options = _.merge({}, pOptions, {
			change: function(e, ui) {
				var $input = $(e.target),
					value = _.trim($input.val()),
					numericValue = _.toNumber(value),
					valueHasChanged = false;
				if (_.isEmpty(value) || _.isNaN(numericValue)) {
					value = $input.data('value');
					valueHasChanged = true;
				} else {
					if (_.has(pOptions, 'min') && numericValue < pOptions.min) {
						value = pOptions.min;
						valueHasChanged = true;
					}
					if (_.has(pOptions, 'max') && numericValue > pOptions.max) {
						value = pOptions.max;
						valueHasChanged = true;
					}
					$input.data('value', value);
				}
				if (valueHasChanged) {
					$input.val(value);
				}
				if (_.isFunction(pOptions.change)) {
					pOptions.change(e, ui);
				}
			}
		});
		return $target.spinner(options);
	}

	/**
	 * Wrapper for toast notification library
	 * @param  {Object} args
	 * @param  {String} args.type     Toast type, one of (success|error|warning|info)
	 * @param  {String} args.message  Message to display in toast
	 * @param  {Object} args.options  Toast notification library options
	 * @return {jQuery}               Toast element
	 */
	function toast(pArgs) {
		var args = _.isObject(pArgs)
			? pArgs
			: {};
		var type = args.hasOwnProperty('type')
			? args.type
			: 'info';
		try {
			return Toastr[type](args.message, args.title, args.options);
		} catch (error) {
			throw new Error('`' + type + '`' + ' is not a toast type, should be one of `success`, `error`, `warning` or `info`.');
		}
	}

	/**
	 * Helper to display characters remaining inline
	 * @param {jQuery}  $target Field to be checked
	 * @param {Object}  [args]
	 * @param {Number} [args.size] The maxlength to be validated
	 * @param {String}  [args.customClass] Custom class for the label if needed
	 */
	function charsRemaining($target, args) {
		if (!($target instanceof $)) {
			throw TypeError('"$target" is not a jQuery object');
		}

		if (!_.isUndefined(args) && !_.isPlainObject(args)) {
			throw TypeError('"options" is not a plain object');
		}

		var size = _.get(args, 'size', 0),
			customClass = args.customClass || '',
			allowedCharsLabel = $('<span>'),
			label = $('<span class="' + customClass + '">').text(monster.apps.core.i18n.active().charsRemaining.label).prepend(allowedCharsLabel),
			checkCurrentLength = function() {
				return $target.prop('tagName') === 'DIV' ? $target[0].textContent.length : $target.val().length;
			},
			checkLength = function(event) {
				var currentLength = checkCurrentLength(),
					isGreaterThanMaxSize = currentLength > size,
					allowedChars = Math.max(0, size - currentLength);

				allowedCharsLabel.text(allowedChars);

				if (isGreaterThanMaxSize) {
					label.addClass('chars-remaining-error');

					event && event.preventDefault();
					return false;
				} else {
					label.removeClass('chars-remaining-error');
				}
			};

		checkLength();

		$target.after(label);

		$target.on('keypress keyup', function(event) {
			checkLength(event);
		});
	}
});
