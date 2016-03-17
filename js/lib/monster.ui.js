define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		hotkeys = require('hotkeys'),
		toastr = require('toastr'),
		validate = require('validate'),
		wysiwyg = require('wysiwyg'),
		timepicker = require('timepicker'),
		introJs = require('introJs');

	Handlebars.registerHelper('times', function(n, options) {
		var ret = '';
		for(var i = 1; i <= n; ++i)
			ret += options.fn(i);
		return ret;
	});

	Handlebars.registerHelper('debug', function(optionalValue) {
		console.log('Current Context: ', this);

		if (optionalValue) {
			console.log('Value: ', optionalValue);
		}
	});

	Handlebars.registerHelper('tryI18n', function(mapI18n, key) {
		return mapI18n.hasOwnProperty(key) ? mapI18n[key] : key;
	});

	Handlebars.registerHelper('formatPhoneNumber', function(phoneNumber) {
		phoneNumber = (phoneNumber || '').toString();

		return monster.util.formatPhoneNumber(phoneNumber);
	});

	Handlebars.registerHelper('formatVariableToDisplay', function(variable) {
		return monster.util.formatVariableToDisplay(variable);
	});

	Handlebars.registerHelper('toUpperCase', function (stringValue) {
		return stringValue.toString().toUpperCase();
	});

	Handlebars.registerHelper('toLowerCase', function(stringValue) {
		return stringValue.toString().toLowerCase();
	});

	Handlebars.registerHelper('replaceVar', function(stringValue, variable) {
		return stringValue.replace('{{variable}}', variable);
	});

	Handlebars.registerHelper('select', function(value, options) {
		// Create a select element 
		var select = document.createElement('select');

		// Populate it with the option HTML
		$(select).html(options.fn(this));

		//below statement doesn't work in IE9 so used the above one
		//select.innerHTML = options.fn(this); 

		// Set the value
		select.value = value;

		// Find the selected node, if it exists, add the selected attribute to it
		if (select.children[select.selectedIndex]) {
			select.children[select.selectedIndex].setAttribute('selected', 'selected');
		} else { //select first option if that exists
			if (select.children[0]) {
				select.children[0].setAttribute('selected', 'selected');
			}
		}
		return select.innerHTML;
	});

	Handlebars.registerHelper('ifInArray', function(elem, list, options) {
		if(list.indexOf(elem) > -1) {
			return options.fn(this);
		}

		return options.inverse(this);
	});

	Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
		var operators, result;

		if (arguments.length < 3) {
			throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
		}

		if (options === undefined) {
			options = rvalue;
			rvalue = operator;
			operator = '===';
		}

		operators = {
			'==': function (l, r) { return l == r; },
			'===': function (l, r) { return l === r; },
			'!=': function (l, r) { return l != r; },
			'!==': function (l, r) { return l !== r; },
			'<': function (l, r) { return l < r; },
			'>': function (l, r) { return l > r; },
			'<=': function (l, r) { return l <= r; },
			'>=': function (l, r) { return l >= r; },
			'typeof': function (l, r) { return typeof l == r; }
		};

		if (!operators[operator]) {
			throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
		}

		result = operators[operator](lvalue, rvalue);

		if (result) {
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	});

	Handlebars.registerHelper('toFriendlyDate', function(timestamp, format, user, isGregorian) {
		return monster.util.toFriendlyDate(timestamp, format, user, isGregorian);
	});

	Handlebars.registerHelper('formatPrice', function(price, decimals) {
		return monster.util.formatPrice(price, decimals);
	});

	Handlebars.registerHelper('formatBytes', function (bytes, pDigits) {
		var digits = typeof pDigits === 'number' ? pDigits : undefined,
			data = monster.util.formatBytes(bytes, digits);

		return data.value + ' ' + data.unit.symbole;
	});

	Handlebars.registerHelper('monsterSwitch', function(options) {
		var checkboxHtml = options.fn(this).trim() || '<input type="checkbox">',
			checkbox = $(checkboxHtml),
			onLabel = checkbox.data('on') || monster.apps.core.i18n.active().on,
			offLabel = checkbox.data('off') || monster.apps.core.i18n.active().off;

		return monster.template(monster.apps.core, 'monster-switch-template', {
			checkbox: new Handlebars.SafeString(checkboxHtml),
			on: onLabel,
			off: offLabel
		});
	});

	Handlebars.registerHelper('monsterCheckbox', function() {
		var templateData = {
			cssClass: 'monster-checkbox',
			checkbox: new Handlebars.SafeString(arguments[arguments.length-1].fn(this))
		};

		for(var i=0; i<arguments.length-1; i++) {
			if(_.isString(arguments[i])) {
				switch(arguments[i]) {
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
	});

	Handlebars.registerHelper('monsterRadio', function() {
		var templateData = {
			cssClass: 'monster-radio',
			checkbox: new Handlebars.SafeString(arguments[arguments.length-1].fn(this))
		};

		for(var i=0; i<arguments.length-1; i++) {
			if(_.isString(arguments[i]) || _.isNumber(arguments[i])) {
				switch(arguments[i]) {
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
	});

	Handlebars.registerHelper('monsterText', function(type, className) {
		var htmlContent = arguments[arguments.length-1].fn(this),
			validTypes = ['info', 'question', 'error', 'warning'],
			type = typeof type === 'string' && validTypes.indexOf(type) >= 0 ? type : 'info',
			templateData = {
				className: className || '',
				content: new Handlebars.SafeString(htmlContent)
			},
			// We set the 6th argument to true so we don't remove white-spaces. Important to display API response with properly formatted JSON.
			template = monster.template(monster.apps.core, 'monster-text-' + type, templateData, false, false, true);

		return new Handlebars.SafeString(template);
	});

	Handlebars.registerHelper('monsterSlider', function (settings, options) {
		return new Handlebars.SafeString(monster.ui.slider(settings));
	});

	$.widget("ui.dialog", $.extend({}, $.ui.dialog.prototype, {
		_title: function(title) {
			if (!this.options.title ) {
				title.html("&#160;");
			} else {
				title.html(this.options.title);
			}
		}
	}));

	var ui = {

		slider: function (target, pOptions) {
			var id = Date.now(),
				defaultOptions = {
					slide: function (event, ui) {
						$(ui.handle)
							.find('.ui-slider-tooltip .tooltip-value')
								.text(ui.value);
					}
				},
				options = $.extend(true, {}, pOptions, defaultOptions),
				templateData = {
					id: id,
					min: options.min,
					max: options.max,
					unit: options.unit
				},
				sliderTemplate,
				handlePosition;

			if (options.range === 'min') {
				handlePosition = 'top';

				templateData.minHandle = {
					text: options.i18n.minHandle.text,
					value: options.value
				};
			}
			else if (options.range === 'max') {
				handlePosition = 'bottom';

				templateData.maxHandle = {
					text: options.i18n.maxHandle.text,
					value: options.value
				};
			}
			else if (options.range) {
				handlePosition = 'both';

				templateData.minHandle = {
					text: options.i18n.minHandle.text,
					value: options.value
				};

				templateData.maxHandle = {
					text: options.i18n.maxHandle.text,
					value: options.value
				};
			}

			templateData.handlePosition = handlePosition;

			sliderTemplate = $(monster.template(monster.apps.core, 'monster-slider', templateData));

			return $(target).append(sliderTemplate).find('#monster_slider_' + id).slider(options);
		},

		//3 types: info (blue), warning (yellow), error (red)
		alert: function(type, content, callback, options){
			if(typeof content === "undefined"){
				content = type;
				type = "info";
			}

			var coreApp = monster.apps['core'],
				i18n = coreApp.i18n.active(),
				alertOptions = options || {},
				templateData = {
					content: content,
					title: alertOptions.title || i18n.dialog[type+'Title'],
					data: content.data || 'No extended information.',
					closeButtonText: alertOptions.closeButtonText || i18n.close,
					closeButtonClass: alertOptions.closeButtonClass || 'monster-button'
				},
				alertBox = $(monster.template(coreApp, 'dialog-' + type, templateData)),
				options = $.extend(
					true,
					{
						onClose: function(){
							callback && callback();
						}
					},
					options
				),
				dialog;

			if(alertOptions.htmlContent) {
				alertBox.find('.dialog-text').html(content);
			}
			if(alertOptions.htmlTitle && alertOptions.title) {
				alertBox.find('.dialog-header').html(alertOptions.title);
			}

			switch(type) {
				case 'warning': {
					options.title = '<i class="fa fa-exclamation-triangle monster-yellow"></i>';
					break;
				}
				case 'error': {
					options.title = '<i class="fa fa-times-circle monster-red"></i>';
					break;
				}
				case 'confirm': {
					options.title = '<i class="fa fa-question-circle monster-blue"></i>';
					break;
				}
				case 'info':
				default: {
					options.title = '<i class="fa fa-info-circle monster-blue"></i>';
					break;
				}
			}

			options.dialogClass = 'monster-alert' + (options.dialogClass ? ' '+options.dialogClass : '');

			dialog = this.dialog(alertBox, options);

			alertBox.find('#close_button').on('click', function() {
				dialog.dialog('close');
			});

			dialog.find('.btn.alert_button').click(function() {
				dialog.dialog('close');
			});

			dialog.find('.json_error').css({ 'cursor': 'pointer' })

			dialog.find('.json')
				.css('min-width', 0)
				.click(function(event){
					event.preventDefault();
					dialog.find('.json_error').toggle();
				});

			return dialog;
		},

		confirm: function(content, callbackOk, callbackCancel, options) {
			var self = this,
				dialog,
				coreApp = monster.apps['core'],
				i18n = coreApp.i18n.active(),
				confirmOptions = options || {},
				type = confirmOptions.type || 'confirm',
				templateData = {
					content: content,
					title: confirmOptions.title || i18n.dialog.confirmTitle,
					data: content.data || 'No extended information.',
					cancelButtonText: confirmOptions.cancelButtonText || i18n.dialog.confirmCancel,
					confirmButtonText: confirmOptions.confirmButtonText || i18n.dialog.confirmOk,
					cancelButtonClass: confirmOptions.cancelButtonClass || 'monster-button',
					confirmButtonClass: confirmOptions.confirmButtonClass || 'monster-button-success'
				},
				confirmBox = $(monster.template(coreApp, 'dialog-confirm', templateData)),
				options = $.extend(
					true,
					{
						closeOnEscape: false,
						onClose: function() {
							ok ? callbackOk && callbackOk() : callbackCancel && callbackCancel();
						}
					},
					options
				),
				ok = false;

			if(confirmOptions.htmlContent) {
				confirmBox.find('.dialog-text').html(content);
			}
			if(confirmOptions.htmlTitle && confirmOptions.title) {
				confirmBox.find('.dialog-header').html(confirmOptions.title);
			}

			switch(type) {
				case 'warning': {
					options.title = '<i class="fa fa-exclamation-triangle monster-yellow"></i>';
					break;
				}
				case 'error': {
					options.title = '<i class="fa fa-times-circle monster-red"></i>';
					break;
				}
				case 'info': {
					options.title = '<i class="fa fa-info-circle monster-blue"></i>';
					break;
				}
				case 'confirm':
				default: {
					options.title = '<i class="fa fa-question-circle monster-blue"></i>';
					break;
				}
			}

			options.dialogClass = 'monster-confirm' + (options.dialogClass ? ' '+options.dialogClass : '');

			dialog = this.dialog(confirmBox, options);

			confirmBox.find('#confirm_button').on('click', function() {
				ok = true;
				dialog.dialog('close');
			});

			confirmBox.find('#cancel_button').on('click', function() {
				dialog.dialog('close');
			});

			return dialog;
		},

		dialog: function(content, options) {
			var dialog = $("<div />").append(content),
				coreApp = monster.apps['core'],
				i18n = coreApp.i18n.active(),
				dialogType = ( typeof options != 'undefined' && typeof options.dialogType != 'undefined' ) ? options.dialogType : 'classic',
				closeBtnText = i18n['close'] || 'X';

			if ( typeof options != 'undefined' && typeof options.dialogType != 'undefined' ) {
				delete options.dialogType;
			}

			// delete options.dialogType;
			$('input', content).keypress(function(e) {
				if(e.keyCode == 13) {
					e.preventDefault();
					return false;
				}
			});

			//Unoverridable options
			var strictOptions = {
					show: { effect : 'fade', duration : 200 },
					hide: { effect : 'fade', duration : 200 },
					zIndex: 20000,
					close: function() {
						$('div.popover').remove();
						dialog.dialog('destroy');
						dialog.remove();

						if(typeof options.onClose == 'function') {
							// jQuery FREAKS out and gets into an infinite loop if the following function kicks back an error. Hence the try/catch.
							try {
								options.onClose();
							}
							catch(err) {
								if(console && err.message && err.stack) {
									console.log(err.message);
									console.log(err.stack);
								}
							}
						}
					}
				},
				//Default values
				defaults = {
					width: 'auto',
					modal: true,
					resizable: false,
					open: function(event, ui) { if(options.hideClose) $(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); }
				};

			//Overwrite any defaults with settings passed in, and then overwrite any attributes with the unoverridable options.
			options = $.extend(defaults, options || {}, strictOptions);
			dialog.dialog(options);

			switch(dialogType) {
				case 'conference':
					closeBtnText = '<i class="fa fa-times icon-small"></i>';
					break;
				default:
					closeBtnText = '<i class="monster-dialog-titlebar-close"></i>';
					break;
			}
			dialog.siblings().find('.ui-dialog-titlebar-close').html(closeBtnText);

			return dialog;	   // Return the new div as an object, so that the caller can destroy it when they're ready.'
		},

		charges: function(data, callbackOk, callbackCancel) {
			var self = this,
				dialog,
				coreApp = monster.apps.core,
				i18n = coreApp.i18n.active(),
				formatData = function(data) {
					var totalAmount = 0,
						renderData = [];

					$.each(data, function(categoryName, category) {
						if (categoryName != 'activation_charges') {
							$.each(category, function(itemName, item) {
								var discount = item.single_discount_rate + (item.cumulative_discount_rate * item.cumulative_discount),
									monthlyCharges = parseFloat(((item.rate * item.quantity) - discount) || 0).toFixed(2);
								if(monthlyCharges > 0) {
									renderData.push({
										service: i18n.services.hasOwnProperty(itemName) ? i18n.services[itemName] : itemName.replace(/_/, ' '),
										rate: item.rate.toFixed(2) || 0,
										quantity: item.quantity || 0,
										discount: discount > 0 ? parseFloat(discount).toFixed(2) : 0,
										monthlyCharges: monthlyCharges
									});

									totalAmount += parseFloat(monthlyCharges);
								}
							});
						}
					});

					return renderData;
				},
				charges = data.activation_charges ? data.activation_charges.toFixed(2) : 0,
				template = $(monster.template(coreApp, 'dialog-charges', {
						activation_charges: charges,
						charges: formatData(data)
					}
				)),
				// options = $.extend(
				// 	true,
				// 	{
				// 		closeOnEscape: false,
				// 		width: 'auto',
				// 		title: i18n.confirmCharges.title,
				// 		onClose: function() {
				// 			ok ? callbackOk && callbackOk() : callbackCancel && callbackCancel();
				// 		}
				// 	},
				// 	options
				// ),
				ok = false;

			// options.dialogClass = 'monster-confirm' + (options.dialogClass ? ' '+options.dialogClass : '');

			// dialog = this.dialog(template, options);

			// template.find('#confirm_button').on('click', function() {
			// 	ok = true;
			// 	dialog.dialog('close');
			// });

			// template.find('#cancel_button').on('click', function() {
			// 	dialog.dialog('close');
			// });

			// return dialog;

			return self.confirm(template, callbackOk, callbackCancel, {
				htmlContent: true,
				title: i18n.confirmCharges.title,
				dialogClass: 'monster-charges'
			});
		},

		// New Popup to show advanced API errors via a "More" Link.
		requestErrorDialog: function(error) {
			var self = this,
				coreApp = monster.apps.core,
				i18n = coreApp.i18n.active(),
				dataTemplate = {
					message: error.data.message,
					requestId: error.data.requestId,
					url: error.data.url,
					apiResponse: error.data.response,
					verb: error.data.verb.toUpperCase()
				},
				alertOptions = {
					htmlContent: true,
					title: error.data.customTitle
				},
				// Since we have code in it, we don't want to trim spaces, so we set the 6th argument to true
				template = $(monster.template(coreApp, 'dialog-errorAPI', dataTemplate, false, false, true));

			template.find('.headline').on('click', function() {
				template.find('.error-details-wrapper').slideToggle();
				$(this).toggleClass('active');
			});

			return self.alert('error', template, null, alertOptions);
		},

		// New Popup to show advanced Javascript errors.
		jsErrorDialog: function(error) {
			var self = this,
				coreApp = monster.apps.core,
				i18n = coreApp.i18n.active();

			var dataTemplate = {
					title: error.data.title,
					file: error.data.file,
					line: error.data.line,
					column: error.data.column,
					stackTrace: error.data.stackTrace
				},
				// Since we have code in it, we don't want to trim spaces, so we set the 6th argument to true
				template = $(monster.template(coreApp, 'dialog-errorJavascript', dataTemplate, false, false, true));

			return self.alert('error', template, null, {
				htmlContent: true,
				title: i18n.javascriptErrorDialog.title
			});
		},

		// Highlight then fades an element, from blue to gray by default. We use it to highlight a recent change for example in SmartPBX
		highlight: function(element, options) {
			var options = $.extend(true, {
				startColor: '#22a5ff',
				endColor: '#F2F2F2',
				timer: 2000
			}, options);

			// Automatically scroll to the element to let the user see the "add" animation
			if(element.offset()) {
				$('html, body').animate({
					scrollTop: element.offset().top
				}, 300);
			}

			// If the background was a gradient, only changing the background-color wouldn't work, so we hide the image temporarirly
			element.css({
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
				}
			);
		},

		tabs: function(template) {
			template.find('.tabs-main-selector').first().addClass('active');
			template.find('.tabs-section').first().addClass('active');

			template.find('.tabs-selector').on('click', function() {
				var $this = $(this),
					section = $this.data('section');

				template.find('.tabs-main-selector').removeClass('active');
				template.find('.tabs-section').hide();

				template.find('.tabs-section[data-section="' + section + '"]').show();
				$this.parents('.tabs-main-selector').addClass('active');
			});
		},

		table: {
			create: function(name, element, columns, data, options) {
				var self = this,
					tableObj,
					i18n = monster.apps['core'].i18n.active(),
					defaultOptions = {
						sDom: '<f>t<ip>',
						sPaginationType: 'full_numbers',
						aaData: data || {},
						aoColumns: columns,
						oLanguage: {
							sEmptyTable: i18n.table.empty,
							sProcessing: i18n.table.processing,
							sInfo: i18n.table.startEndTotal,
							sLengthMenu: i18n.table.showEntries,
							sZeroRecords: i18n.table.zeroRecords,
							sLoadingRecords: i18n.table.loading,
							sInfoEmpty: i18n.table.infoEmpty,
							sInfoFiltered: i18n.table.filtered,
							sSearch: i18n.table.search,
							oPaginate: {
								sFirst: i18n.paging.first,
								sPrevious: i18n.paging.previous,
								sNext: i18n.paging.next,
								sLast: i18n.paging.last
							}
						}
					},
					options = $.extend(true, {}, defaultOptions, options),
					applyFunctions = function applyFunctions(table) {
						table.addData = function(data) {
							var self = this;

							self.fnAddData(data);
						};

						table.destroy = function() {
							var self = this;

							self.fnDestroy();

							monster.ui.table[self.name] = null;
						};
					},
					applyModifications = function applyModifications(table) {
						var search_wrapper = table.parents('.dataTables_wrapper').find('.dataTables_filter');
							search = search_wrapper.find('input[type="text"]'),
							i18n = monster.apps['core'].i18n.active();

						search_wrapper.contents().filter(function() {
							return this.nodeType == Node.TEXT_NODE;
						}).remove();
					};


				tableObj = element.dataTable(options);
				tableObj.name = name;;

				applyFunctions(tableObj);
				applyModifications(tableObj);

				self[name] = tableObj;
			}
		},

		// Options:
		// range: number. Maximum number of days between start and end dates, or 'monthly'
		// Set to 'monthly', it will always set the end date to be one month away from the start date (unless it's after "today")
		// container: jQuery Object. Container of the datepickers
		initRangeDatepicker: function(options) {
			var self = this,
				container = options.container,
				range = options.range || 7,
				initRange = options.initRange || options.range || 1,
				inputStartDate = container.find('#startDate'),
				inputEndDate = container.find('#endDate'),
				now = new Date(),
				today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
				startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
				endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

			if(range === 'monthly') {
				startDate.setMonth(startDate.getMonth() - 1);
			}
			else {
				startDate.setDate(startDate.getDate() - initRange);
			}
			startDate.setDate(startDate.getDate() + 1);

			monster.ui.datepicker(container.find('#startDate, #endDate'), {
				beforeShow: customRange,
				onSelect: customSelect
			});

			inputStartDate.datepicker('setDate', startDate);
			inputEndDate.datepicker('setDate', endDate);

			// customSelect runs every time the user selects a date in one of the date pickers.
			// Features:
			// If we select a day as the starting date, we want to automatically adjust the end day to be either startDay + range or today (the closest to the start date is chosen).
			// If the "monthly" mode is on, we want to automatically set the endDate to be exactly one month after the startDate, unless it's after "today". (we had to do that since the # of days in a month varies)
			function customSelect(dateText, input) {
				var dateMin = inputStartDate.datepicker('getDate'),
					dateMax = inputEndDate.datepicker('getDate');

				if(input.id === 'startDate') {
					var dateMaxRange = new Date(dateMin);

					if(range === 'monthly') {
						dateMaxRange.setMonth(dateMaxRange.getMonth() + 1);
					}
					else {
						dateMaxRange.setDate(dateMaxRange.getDate() + range);
					}
					dateMaxRange.setDate(dateMaxRange.getDate() - 1);

					if(dateMaxRange > today) {
						dateMaxRange = today;
					}

					inputEndDate.val(monster.util.toFriendlyDate(dateMaxRange, 'short'));
				}
			};

			// customRange runs every time the user clicks on a date picker, it will set which days are clickable in the datepicker.
			// Features:
			// If I click on the End Date, I shouldn't be able to select a day before the starting date, and I shouldn't be able to select anything after "today"
			// If I click on the Start date, I should be able to select any day between the 1/1/2011 and "Today"
			function customRange(input) {
				var dateMin,
					dateMax;

				if (input.id === 'endDate') {
					dateMin = inputStartDate.datepicker('getDate');

					var dateMaxRange = new Date(dateMin);

					// If monthly mode, just increment the month for the maxDate otherwise, add the number of days.
					if(range === 'monthly') {
						dateMaxRange.setMonth(dateMaxRange.getMonth() + 1);
					}
					else {
						dateMaxRange.setDate(dateMaxRange.getDate() + range);
					}
					dateMaxRange.setDate(dateMaxRange.getDate() - 1);

					// Set the max date to be as far as possible from the min date (We take the dateMaxRange unless it's after "today", we don't want users to search in the future)
					dateMax = dateMaxRange > today ? today : dateMaxRange;
				}
				else if (input.id === 'startDate') {
					dateMin = new Date(2011, 0, 0);
					dateMax = new Date();
				}

				return {
					minDate: dateMin,
					maxDate: dateMax
				};
			};
		},

		friendlyError: function(dataError) {
			var self = this,
				message = '',
				i18n = monster.apps['core'].i18n.active();

			if(dataError && dataError.data && 'api_error' in dataError.data && 'errors' in dataError.data.api_error) {
				var errors = dataError.data.api_error.errors;

				_.each(errors, function(error, k) {
					message += '<b>' + i18n.error + ' ' + error.code + ': </b>' + i18n.errors[error.code];

					if(k !== errors.length - 1)  {
						message += '<br/><br/>';
					}
				});
			}

			self.alert('error', message);
		},

		protectField: function(field, template) {
			var template = template || $('html'),
				fieldId = field.attr('id'),
				fieldName = field.attr('name'),
				value = field.val();

			$('<input data-protected="'+ fieldId +'" type="text" style="display: none;" value="'+ value +'"/>').insertBefore(field);

			field.on('focus', function() {
				var $this = $(this),
					value = $this.val();

				// Setting the val to an empty string before the focus is a nice hack to have the text selection starting at the end of the string instead of the first character
				template.find('[data-protected='+ fieldId + ']').val('')
																   .show()
																   .focus()
																   .val(value);

				$this.hide();
			});

			template.find('[data-protected='+ fieldId + ']').on('blur', function() {
				var $this = $(this),
					value = $this.val();

				field.val(value)
					 .show();

				$this.hide();
			});
		},

		accountArrayToTree: function(accountArray, rootAccountId) {
			var result = {};

			$.each(accountArray, function(k, v) {
				if(v.id === rootAccountId) {
					if(!result[v.id]) { result[v.id] = {}; }
					result[v.id].name = v.name;
					result[v.id].realm = v.realm;
				} else {
					var parents = v.tree.slice(v.tree.indexOf(rootAccountId)),
						currentAcc;
					for(var i=0; i<parents.length; i++) {
						if(!currentAcc) {
							if(!result[parents[i]]) { result[parents[i]] = {}; }
							currentAcc = result[parents[i]];
						} else {
							if(!currentAcc.children) { currentAcc.children = {}; }
							if(!currentAcc.children[parents[i]]) { currentAcc.children[parents[i]] = {}; }
							currentAcc = currentAcc.children[parents[i]];
						}
					}
					if(!currentAcc.children) { currentAcc.children = {}; }
					if(!currentAcc.children[v.id]) { currentAcc.children[v.id] = {}; }
					currentAcc.children[v.id].name = v.name;
					currentAcc.children[v.id].realm = v.realm;
				}
			});

			return result;
		},

		customValidationInitialized: false,

		initCustomValidation: function() {
			var localization = monster.apps['core'].i18n.active().validation,
				addSimpleRule = function(name, regex) {
					$.validator.addMethod(name, function(value, element, param) {
						return this.optional(element) || regex.test(value);
					}, localization.customRules[name]);
				},
				defaultMessages = {};

			// Initializing default messages
			_.each(localization.defaultRules, function(val, key) {
				defaultMessages[key] = $.validator.format(val);
			});
			$.extend($.validator.messages, defaultMessages);

			// Adding simple custom rules
			addSimpleRule('mac', /^(?:[0-9A-F]{2}(\:|\-))(?:[0-9A-F]{2}\1){4}[0-9A-F]{2}$/i);
			addSimpleRule('ipv4', /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i);
			addSimpleRule('time12h', /^((0?[1-9]|1[012])(:[0-5]\d){1,2}(\ ?[AP]M))$/i);
			addSimpleRule('time24h', /^(([01]?[0-9]|2[0-3])(:[0-5]\d){1,2})$/i);
			addSimpleRule('realm', /^[0-9A-Z\.\-]+$/i);

			// Adding advanced custom rules
			$.validator.addMethod('greaterDate', function(value, element, param) {
				var target = _.isString(param) ? $(param) : param;
				if ( this.settings.onfocusout ) {
					target.unbind(".validate-greaterDate").bind("blur.validate-greaterDate", function() {
						$(element).valid();
					});
				}
				return monster.util.timeToSeconds(value) > monster.util.timeToSeconds(target.val());
			}, localization.customRules['greaterDate']);

			// Adding advanced custom rules
			$.validator.addMethod('checkList', function(value, element, listToCheck) {
				if(_.isArray(listToCheck)) {
					return listToCheck.indexOf(value) < 0;
				}
				else if(_.isObject(listToCheck)) {
					return !(value in listToCheck);
				}
				else return true;
			}, localization.customRules['checkList']);

			// Adding advanced custom rules
			$.validator.addMethod('regex', function(value, element, regexpr) {
				return regexpr.test(value);
			});

			this.customValidationInitialized = true;
		},

		validate: function(form, options) {
			var defaultOptions = {
				errorClass: "monster-invalid",
				validClass: "monster-valid"
			};

			if(!this.customValidationInitialized) {
				this.initCustomValidation();
			}

			return form.validate($.extend(true, defaultOptions, options));
		},

		valid: function(form) {
			return form.valid();
		},

		/**
		 * @desc prepend a WYSIWYG in 'target'
		 * @param target - mandatory jQuery Object
		 * @param options - optional JavaScript Object or JavaScript Boolean
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
		wysiwyg: function(target, options) {
			var self = this,
				options = _.isBoolean(options) ? options : options || {},
				id = Date.now(),
				coreApp = monster.apps.core,
				dataTemplate = { id: id },
				wysiwygTemplate;

			if (options) {
				var i18n = coreApp.i18n.active().wysiwyg,
					colorList = [
						'ffffff','000000','eeece1','1f497d','4f81bd','c0504d','9bbb59','8064a2','4bacc6','f79646','ffff00',
						'f2f2f2','7f7f7f','ddd9c3','c6d9f0','dbe5f1','f2dcdb','ebf1dd','e5e0ec','dbeef3','fdeada','fff2ca',
						'd8d8d8','595959','c4bd97','8db3e2','b8cce4','e5b9b7','d7e3bc','ccc1d9','b7dde8','fbd5b5','ffe694',
						'bfbfbf','3f3f3f','938953','548dd4','95b3d7','d99694','c3d69b','b2a2c7','92cdcd','fac08f','f2c314',
						'a5a5a5','262626','494429','17365d','366092','953734','76923c','5f497a','31859b','e36c09','c09100',
						'7f7f7f','0c0c0c','1d1b10','0f243e','244061','632423','4f6128','3f3151','205867','974806','7f6000'
					],
					defaultOptions = {
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
								create: {
									weight: 10,
									title: i18n.title.createLink,
									icon: 'fa fa-link',
									command: 'createLink'
								},
								delete: {
									weight: 20,
									title: i18n.title.removeLink,
									icon: 'fa fa-chain-broken',
									command: 'unlink'
								}
							}
						},
						image: {
							weight: 80,
							title: i18n.title.upload,
							icon: 'fa fa-picture-o',
							command: 'insertImage'
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
						macro: {
							weight: 999,
							title: i18n.title.macro,
							command: 'insertHtml',
							options: false,
							ante: '<b>{{',
							post: '}}</b>'
						}
					},
					sortByWeight = function(node) { // Sort elements by weight and "arrayize"
						node = _.map(node, function(v, k) { return v; });

						node.sort(function(a, b){
							return a.weight > b.weight ? 1 : -1;
						});

						_.each(node, function(v, k) {
							if (v.hasOwnProperty('options')) {
								v.options = sortByWeight(v.options);
							}
						});

						return node;
					};

				colorList.forEach(function(hexColor, idx) {
					defaultOptions.fontColor.options.push({ weight: ++idx * 10, args: hexColor });
				})

				options = $.extend(true, {}, defaultOptions, options);

				// Remove options with value at false
				for (var c in options) {
					if (!options[c]) {
						delete options[c];
						continue;
					}
					else if (options[c].hasOwnProperty('options')) {
						if (_.isEmpty(options[c].options)) {
							delete options[c];
							continue;
						}
						else {
							_.each(options[c].options, function(v, k, l){
								if (!v) {
									delete l[k];
								}
							});

							if (_.isEmpty(options[c].options)) {
								delete options[c];
								continue;
							}
						}
					}
				}

				dataTemplate.tools = sortByWeight(options);
				wysiwygTemplate = $(monster.template(coreApp, 'wysiwyg-template', dataTemplate));

				monster.ui.tooltips(wysiwygTemplate, {
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
			}
			else {
				wysiwygTemplate = $(monster.template(coreApp, 'wysiwyg-template', dataTemplate));
			}

			return target.prepend(wysiwygTemplate).find('#wysiwyg_editor_' + id).wysiwyg({
						toolbarSelector: '#wysiwyg_toolbar_' + id,
						activeToolbarClass: 'selected',
						fileUploadError: function(reason, detail) {
							if (reason === 'unsupported-file-type') {
								toastr.error(detail + i18n.toastr.error.format);
							}
							else {
								toastr.error(i18n.toastr.error.upload);
								console.log('error uploading file', reason, detail);
							}
						}
					});
		},

		getFormData: function(rootNode, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName) {
			var formData = form2object(rootNode, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName);

			for (var key in formData) {
				if (key === '') {
					delete formData[key];
				}
			}

			return formData;
		},


		/**
		 * @desc Wrapper of the Jquery date picker that uses the date format settings from the logged-in user if it exists.
		 * @param target - mandatory jQuery Object
		 * @param options - optional list of settings. Get the full list in the doc of the jQuery Date Picker.
		 */
		datepicker: function(target, options) {
			var self = this,
				datePickerFormat = 'mm/dd/yy',
				userFormat = monster.hasOwnProperty('apps') && monster.apps.hasOwnProperty('auth') && monster.apps.auth.hasOwnProperty('currentUser') && 
							 monster.apps.auth.currentUser.hasOwnProperty('ui_flags') && monster.apps.auth.currentUser.ui_flags.hasOwnProperty('date_format') ?
							 monster.apps.auth.currentUser.ui_flags.date_format : 'mdy' ;

			if(userFormat === 'mdy') {
				datePickerFormat = 'mm/dd/yy';
			}
			else if(userFormat === 'dmy') {
				datePickerFormat = 'dd/mm/yy';
			}
			else if(userFormat === 'ymd') {
				datePickerFormat = 'yy/mm/dd';
			}

			var defaultOptions = {
					dateFormat: datePickerFormat,
					constraintInput: true
				},
				optionsDatePicker = $.extend(true, defaultOptions, options);

			return target.datepicker(optionsDatePicker);
		},

		/**
		 * Wrapper for the jQuery timepicker init function that automatically sets the time format
		 * to the currently logged-in user's preferences if it exists and defaults to the 24 hours
		 * format if it does not.
		 * @param  {jQuery Object} target   <input> or <select> element where the dropdown is appended
		 * @param  {Object} pOptions        optional listing of parameters used to build the dropdown
		 * @return {jQuery Object}          the instance of the timepicker is linked to this element
		 */
		timepicker: function(target, pOptions) {
			var self = this,
				is12hMode = monster.hasOwnProperty('apps') && monster.apps.hasOwnProperty('auth') && monster.apps.auth.hasOwnProperty('currentUser') && 
						    monster.apps.auth.currentUser.hasOwnProperty('ui_flags') && monster.apps.auth.currentUser.ui_flags.hasOwnProperty('twelve_hours_mode') ?
						    monster.apps.auth.currentUser.ui_flags.twelve_hours_mode : false,
				defaultOptions = {
					timeFormat: is12hMode ? 'g:ia' : 'G:i',
					lang: monster.apps.core.i18n.active().timepicker
				},
				options = $.extend(true, {}, defaultOptions, pOptions);

			return target.timepicker(options);
		},

		/**
		 * @desc Two columns UI element with sortable items
		 * @param target - mandatory jQuery Object
		 * @param data - mandatory object of items
		 * @param selectedData - mandatory object of selected items
		 * @param options - optional list of settings
		 */
		linkedColumns: function(target, items, selectedItems, options) {
			var self = this,
				coreApp = monster.apps.core,
				unselectedItems = (function findUnselectedItems(items, selectedItems) {
					var selectedKeys = selectedItems.map(function(item) { return item.key; }),
						unselectedItems = items.filter(function(item) { return selectedKeys.indexOf(item.id) < 0; });

					return unselectedItems;
				})(items, selectedItems),
				 defaultOptions = {
					insertionType: 'appendTo',
					columnsTitles: {
						available: coreApp.i18n.active().linkedColumns.available,
						selected: coreApp.i18n.active().linkedColumns.selected
					}
				},
				widgetTemplate,
				dataTemplate,
				widget;

			options = $.extend(true, defaultOptions, options || {});

			dataTemplate = {
				unselectedItems: unselectedItems,
				selectedItems: selectedItems,
				options: options
			};

			widgetTemplate = $(monster.template(coreApp, 'linkedColumns-template', dataTemplate));

			widgetTemplate.find('.available, .selected')
						  .sortable({ 
							connectWith: '.connected',
							tolerance: 'pointer'
						});

			widget = widgetTemplate[options.insertionType](target);

			widget.getSelectedItems = function getSelectedItems() {
				var results = [];

				widgetTemplate.find('ul.selected .item-selector').each(function(k, item) {
					results.push($(item).data('key'));
				});

				return results;
			};

			return widget;
		},

		/**
		 * @desc Helper that builds a 2 columns UI component using our linkedColumns helper, with preset dataset for video and audio codecs
		 * @param target - mandatory jQuery Object
		 * @param type - mandatory type of codec selector, either 'audio' or 'video', will set the dataset of available items
		 * @param selectedCodecs - array of codecs, ex : ['OPUS',' Speex']
		 * @param options - optional list of settings, same options as the linked columns helper
		 */
		codecSelector: function(type, target, selectedCodecs, options) {
			var self = this,
				codecsI18n = monster.apps.core.i18n.active().codecs,
				defaultAudioList = {
					'OPUS': codecsI18n.audio['OPUS'],
					'CELT@32000h': codecsI18n.audio['CELT@32000h'],
					'G7221@32000h': codecsI18n.audio['G7221@32000h'],
					'G7221@16000h': codecsI18n.audio['G7221@16000h'],
					'G722': codecsI18n.audio['G722'],
					'speex@32000h':codecsI18n.audio['speex@32000h'],
					'speex@16000h': codecsI18n.audio['speex@16000h'],
					'PCMU': codecsI18n.audio['PCMU'],
					'PCMA': codecsI18n.audio['PCMA'],
					'G729':codecsI18n.audio['G729'],
					'GSM': codecsI18n.audio['GSM'],
					'CELT@48000h': codecsI18n.audio['CELT@48000h'],
					'CELT@64000h': codecsI18n.audio['CELT@64000h']
				},
				defaultVideoList = {
					'VP8': codecsI18n.video['VP8'],
					'H264': codecsI18n.video['H264'],
					'H263': codecsI18n.video['H263'],
					'H261': codecsI18n.video['H261']
				},
				mapMigrateAudioCodec = {
					'Speex': 'speex@16000h',
					'G722_16': 'G7221@16000h',
					'G722_32': 'G7221@32000h',
					'CELT_48': 'CELT@48000h',
					'CELT_64': 'CELT@64000h'
				},
				mapMigrateVideoCodec = {},
				selectedItems = [],
				items = [],
				codecValue,
				mapSelected = {},
				getLinkedColumn = function(selectedCodecs, defaultList, mapMigrate) {
					_.each(selectedCodecs, function(codec) {
						// if codec is in the default List, get its i18n, if it's not, check if it's not an outdated modem from the migrate list, if it is, take the new value and its i18n, if not, just display the codec as it is stored in the db
						codecValue = defaultList.hasOwnProperty(codec) ? defaultList[codec] : (mapMigrate.hasOwnProperty(codec) ? defaultList[mapMigrate[codec]] : codec);

						mapSelected[codec] = true;
						selectedItems.push({ key: codec, value: codecValue });
					});

					_.each(defaultList, function(description, codec) {
						if(!mapSelected.hasOwnProperty(codec)) {
							items.push({ key: codec, value: description });
						}
						
					});

					return self.linkedColumns(target, items, selectedItems, options)
				};

			if(type === 'audio') {
				return getLinkedColumn(selectedCodecs, defaultAudioList, mapMigrateAudioCodec);
			}
			else if(type === 'video') {
				return getLinkedColumn(selectedCodecs, defaultVideoList, mapMigrateVideoCodec);
			}
			else {
				console.error('This is not a valid type for our codec selector: ', type);
			}
		},

		showPasswordStrength: function(input, options) {
			if(input) {
				var i18n = monster.apps.core.i18n.active(),
					options = options || {},
					display = options.display || "bar",
					tooltipPosition = options.tooltipPosition || "top",
					regexes = [
						{
							key: "strong",
							regex: new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\\W_]).*$"),
							color: "#18b309",
							size: 100
						},
						{
							key: "good",
							regex: new RegExp("^(?=.{8,})(((?=.*[A-Z])(?=.*[\\W_]))|((?=.*[A-Z])(?=.*[0-9]))|((?=.*[\\W_])(?=.*[0-9]))).*$"),
							color: "#33db24",
							size: 70
						},
						{
							key: "medium",
							regex: new RegExp("^(?=.{6,})((?=.*[\\W_])|(?=.*[A-Z])|(?=.*[0-9])).*$"),
							color: "#ffcc33",
							size: 50
						},
						{
							key: "weak",
							regex: new RegExp("^(?=.{6,}).*$"),
							color: "#ff6a57",
							size: 40
						},
						{
							key: "bad",
							regex: new RegExp("^.+$"),
							color: "#ff3d24",
							size: 20
						},
						{
							key: "empty",
							regex: new RegExp("^\\s*$"),
							color: "#c0c0c9",
							size: 0
						}
					],
					strengthDisplay;
				
				switch(display) {
					case 'icon': {
						strengthDisplay = $('<i class="fa fa-lock icon-small monster-password-strength" data-original-title="'+i18n.passwordStrength.empty+'" data-placement="'+tooltipPosition+'" data-toggle="tooltip"></i>');
						input.on('keyup keypress change', function(e) {
							$.each(regexes, function(key, val) {
								if(val.regex.test(input.val())) {
									strengthDisplay
										.css('color', val.color)
										.attr('data-original-title', i18n.passwordStrength[val.key])
										.tooltip('fixTitle');
									return false;
								}
							});
						});
						break;
					}
					case 'bar':
					default: {
						strengthDisplay = $('<div class="monster-password-strength"><div><span>'+i18n.passwordStrength.empty+'</span></div></div>');
						input.on('keyup keypress change', function(e) {
							$.each(regexes, function(key, val) {
								if(val.regex.test(input.val())) {
									strengthDisplay
										.children('div')
										.css({
											backgroundColor: val.color,
											width: val.size+'%'
										}).children('span')
										.html(i18n.passwordStrength[val.key]);
									return false;
								}
							});
						});
						break;
					}
				}
				
				if(options.container) {
					options.container.append(strengthDisplay);
				} else {
					input.after(strengthDisplay);
				}
			} else {
				throw 'You must provide at least one input field';
			}
		},

		results: function(data) {
			var self = this,
				i18n = monster.apps.core.i18n.active(),
				template = $(monster.template(monster.apps.core, 'monster-results', data));

			monster.ui.tooltips(template);

			return template;
		},

		/**
		 * @desc Helper that will load the tooltip of a template only when we mouseover them by default.
		 * @param target - mandatory jQuery Object
		 * @param args - optional object including options for this helper
		 * args.selector - optional, to change the default CSS selector that will find the tooltips, defaults to '[data-toggle="tooltip"]'
		 * args.options - optional, to add some options to the Bootstrap tooltips,
		 * args.trigger - optional, to change the default trigger of the tooltip, defaults to 'mouseover'
		 */
		tooltips: function(target, args) {
			var args = args || {},
				selector = args.selector || '[data-toggle="tooltip"]',
				options = args.options || {},
				trigger = args.trigger || 'mouseover';

			target.on(trigger, selector + ':not(.monster-tooltip-loaded)', function(e) {
				$(this).data('isTooltipLoaded', true).tooltip(options).addClass('monster-tooltip-loaded').trigger(trigger);
			});
		},

		/**
		 * @desc Helper that will load introJs if not existing and use the same set of options everytime we invoke it.
		 * @param stepList - mandatory Array containing every single step (see introJS for format of a step)
		 * @param callback - function to run after step by step is skipped or ended
		 */
		stepByStep: function(stepList, callback) {
			var self = this,
				coreI18n = monster.apps.core.i18n.active(),
				steps = _.filter(stepList, function(step) { return step.element }), //Filtering out steps where the element does not exist
				countSteps = steps.length,
				isLastStep = function() {
					// If next button is hidden, it's because we hide it when it's the last step, so it's our ghetto way to know that the step by step is at the last step...
					return $('.introjs-nextbutton').css('display') !== 'inline-block';
				};

			// If we don't already override it, add a last-step class.
			// We use it to style the skip button (float right)
			if(!steps[countSteps-1].hasOwnProperty('tooltipClass')) {
				steps[countSteps-1]['tooltipClass'] = 'monster-intro-tooltip last-step';
			}

			introJs().setOptions({
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

				if(isLastStep()) {
					$buttons.find('.introjs-skipbutton').addClass('monster-button-success');
				}
				else {
					$buttons.find('.introjs-skipbutton').removeClass('monster-button-success');
					$buttons.find('.introjs-nextbutton').addClass('monster-button-primary');
				}
				
			})
			.oncomplete(callback)
			.onexit(callback)
			.start();
		},

		/**
		 * Render app menu and bind corresponding 'click' events with related callbacks
		 * @param  {Object} thisArg Context used when calling the callback for each tab
		 * @param  {Object} menus   List of tabs per menu to display
		 */
		generateAppNavbar: function(thisArg, menus) {
			var self = this,
				parent = $('#monster-content'),
				appHeaderWrapper = parent.find('.app-header-wrapper'),
				navbarTemplate = monster.template(monster.apps.core, 'monster-app-navbar', { menus: menus }),
				hasDefaultTab = _.find($(navbarTemplate).find('.navbar-menu-item-link'), function(val, idx) { return $(val).hasClass('active'); });

			parent
				.find('.app-navbar')
					.empty()
					.append(navbarTemplate);

			if (!hasDefaultTab) {
				appHeaderWrapper
					.find('.navbar-menu-item-link')
						.first()
							.addClass('active');
			}

			appHeaderWrapper
				.find('.navbar-menu-item-link')
					.on('click', function() {
						var $this = $(this),
							menuId = $this.parents('.navbar-menu').data('menu_id'),
							tabId = $this.data('tab_id'),
							currentTab = menus[menuId].tabs[tabId],
							loadTabContent = function loadTabContent () {
								if (!$this.hasClass('active')) {
									appHeaderWrapper
										.find('.navbar-menu-item-link.active')
											.removeClass('active');

									$this.addClass('active');
								}

								parent
									.find('.app-content-wrapper')
										.fadeOut(function() {
											$(this).empty();

											currentTab.callback.call(thisArg, {
												parent: parent,
												container: parent.find('.app-content-wrapper')
											});
										});
							};

						if (currentTab.hasOwnProperty('onClick')) {
							currentTab.onClick.call(thisArg, {
								parent: parent,
								container: parent.find('.app-content-wrapper'),
								callback: loadTabContent
							});
						}
						else {
							loadTabContent();
						}
					});
		},

		/**
		 * Render a generique layout so each app has the same look
		 * @param  {Object} thisArg Context used when calling the callback for active tab
		 * @param  {Object} args    List of options to render the navbar and layout template
		 */
		generateAppLayout: function(thisArg, args) {
			var self = this,
				parent = $('#monster-content'),
				dataTemplate = {
					appName: args.appName,
					appId: thisArg.name
				},
				layoutTemplate = args.hasOwnProperty('template') ? args.template : monster.template(monster.apps.core, 'monster-app-layout', dataTemplate),
				callDefaultTabCallback = function callDefaultTabCallback () {
					var tabs = args.menus.reduce(function(prev, curr) { return prev.concat(curr.tabs); }, []),
						defaultTab = _.find(tabs, function(val, idx) { return val.hasOwnProperty('default') && val.default === true; });

					(defaultTab ? defaultTab : tabs[0]).callback.call(thisArg, {
						parent: parent,
						container: parent.find('.app-content-wrapper')
					});
				};

			parent
				.empty()
				.append(layoutTemplate);

			self.generateAppNavbar(thisArg, args.menus);

			callDefaultTabCallback();
		}
	};

	return ui;
});
