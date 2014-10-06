define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		hotkeys = require('hotkeys'),
		icheck = require('icheck'),
		toastr = require('toastr'),
		validate = require('validate'),
		wysiwyg = require('wysiwyg');

	Handlebars.registerHelper('times', function(n, options) {
		var ret = '';
		for(var i = 1; i <= n; ++i)
			ret += options.fn(i);
		return ret;
	});

	Handlebars.registerHelper('debug', function(optionalValue) {
		console.log('Current Context');
		console.log('====================');
		console.log(this);

		if (optionalValue) {
			console.log('Value');
			console.log('====================');
			console.log(optionalValue);
		}
	});

	Handlebars.registerHelper('formatPhoneNumber', function(phoneNumber) {
		phoneNumber = (phoneNumber || '').toString();

		return monster.util.formatPhoneNumber(phoneNumber);
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

	Handlebars.registerHelper('formatTimestamp', function(timestamp, format) {
		if (/^6[0-9]{10}$/.test(timestamp)) {
			timestamp = monster.util.gregorianToDate(timestamp);
		}

		var timestamp = new Date(timestamp),
			fullYear = timestamp.getFullYear(),
			year = timestamp.getFullYear().toString().substr(2, 2),
			month = timestamp.getMonth() + 1,
			day = timestamp.getDate(),
			hours = timestamp.getHours(),
			minutes = timestamp.getMinutes() < 10 ? '0' + timestamp.getMinutes() : timestamp.getMinutes(),
			seconds = timestamp.getSeconds() < 10 ? '0' + timestamp.getSeconds() : timestamp.getSeconds(),
			format = _.isString(format) ? format : 'MM/DD/YY hh:mm:ss';

		format = format.replace(/YYYY/, fullYear);
		format = format.replace(/YY/, year);
		format = format.replace(/MM/, month);
		format = format.replace(/DD/, day);
		format = format.replace(/hh/, hours);
		format = format.replace(/mm/, minutes);
		format = format.replace(/ss/, seconds);

		return format;
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
		//3 types: info (blue), warning (yellow), error (red)
		alert: function(type, content, callback, options){
			if(typeof content === "undefined"){
				content = type;
				type = "info";
			}

			var coreApp = monster.apps['core'],
				template = monster.template(coreApp, 'dialog-' + type, { content: content, data: content.data || 'No extended information.' }),
				content = $(template),
				i18n = coreApp.i18n.active(),
				options = $.extend(
					true,
					{
						title: i18n[type],
						onClose: function(){
							callback && callback();
						}
					},
					options
				),
				dialog;

			dialog = this.dialog(content, options);

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
				template = monster.template(coreApp, 'dialog-confirm', { content: content, data: content.data || 'No extended information.' }),
				confirmBox = $(template),
				options = $.extend(
					true,
					{
						closeOnEscape: false,
						title: i18n.dialog.confirmTitle,
						onClose: function() {
							ok ? callbackOk && callbackOk() : callbackCancel && callbackCancel();
						}
					},
					options
				),
				ok = false;

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
					resizable: false
				};

			//Overwrite any defaults with settings passed in, and then overwrite any attributes with the unoverridable options.
			options = $.extend(defaults, options || {}, strictOptions);
			dialog.dialog(options);

			switch(dialogType) {
				case 'conference':
					closeBtnText = '<i class="icon-remove icon-small"></i>';
					break;
				default:
					closeBtnText = '<span class="icon-stack">'
								 + '<i class="icon-circle icon-stack-base icon-white"></i>'
								 + '<i class="icon-remove-sign"></i>'
								 + '</span>';
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
						if (categoryName != 'activation_charges' && categoryName != 'activation_charges_description') {
							$.each(category, function(itemName, item) {
								var discount = item.single_discount_rate + (item.cumulative_discount_rate * item.cumulative_discount),
									monthlyCharges = parseFloat(((item.rate * item.quantity) - discount) || 0).toFixed(2);
								if(monthlyCharges > 0) {
									renderData.push({
										service: i18n.services[itemName],
										rate: item.rate || 0,
										quantity: item.quantity || 0,
										discount: discount > 0 ? parseFloat(discount).toFixed(2) : '',
										monthlyCharges: monthlyCharges
									});

									totalAmount += parseFloat(monthlyCharges);
								}
							});
						}
					});

					return renderData;
				},
				template = $(monster.template(coreApp, 'dialog-charges', {
						activation_charges: data.hasOwnProperty('activation_charges') ? data.activation_charges : false,
						activation_charges_description: data.hasOwnProperty('activation_charges_description') ? data.activation_charges_description : false,
						charges: formatData(data)
					}
				)),
				options = $.extend(
					true,
					{
						closeOnEscape: false,
						width: 'auto',
						title: i18n.confirmCharges.title,
						onClose: function() {
							ok ? callbackOk && callbackOk() : callbackCancel && callbackCancel();
						}
					},
					options
				),
				ok = false;

			dialog = this.dialog(template, options);

			template.find('#confirm_button').on('click', function() {
				ok = true;
				dialog.dialog('close');
			});

			template.find('#cancel_button').on('click', function() {
				dialog.dialog('close');
			});

			return dialog;
		},

		// Fades an element, from blue to gray by default. We use it to highlight a recent change for example in SmartPBX
		fade: function(element, options) {
			var options = $.extend(true, {
				startColor: '#22CCFF',
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
						bScrollInfinite: true,
						bScrollCollapse: true,
						sScrollY: '300px',
						oLanguage: {
							sEmptyTable: i18n.table.empty,
							sProcessing: i18n.table.processing,
							sInfo: i18n.table.startEndTotal,
							sLengthMenu: i18n.table.showEntries,
							sZeroRecords: i18n.table.zeroRecords,
							sLoadingRecords: i18n.table.loading,
							sInfoEmpty: i18n.table.infoEmpty,
							sInfoFiltered: i18n.table.filtered,
							oPaginate: {
								sFirst: i18n.paging.first,
								sPrevious: i18n.paging.previous,
								sNext: i18n.paging.next,
								sLast: i18n.paging.last
							}
						}
					},
					options = $.extend(true, {}, defaultOptions, options);

				tableObj = element.dataTable(options);
				tableObj.name = name;;

				self.applyFunctions(tableObj);
				self.applyModifications(tableObj);

				self[name] = tableObj;
			},

			applyFunctions: function(table) {
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

			applyModifications: function(table) {
				var search_wrapper = table.parents('.dataTables_wrapper').find('.dataTables_filter');
					search = search_wrapper.find('input[type="text"]'),
					btn_search = '',//<input class="submit-search" type="image" src="img/search_left.png">';
					btn_cancel = '',//<input class="cancel-search" type="image" src="img/search_right.png">';
					i18n = monster.apps['core'].i18n.active();

				search.attr('placeholder', i18n.table.search);

				search_wrapper.contents().filter(function() {
					return this.nodeType == Node.TEXT_NODE;
				}).remove();

				// This is backwards because of the float right
				search.before(btn_cancel);
				search.after(btn_search);
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
				startDate.setDate(startDate.getDate() - range);
			}
			startDate.setDate(startDate.getDate() + 1);

			container.find('#startDate, #endDate').datepicker({
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

					inputEndDate.val(toStringDate(dateMaxRange));
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

			function toStringDate(date) {
				var day = date.getDate(),
					month = date.getMonth()+1,
					year = date.getFullYear();

				day < 10 ? day = '0' + day : true;
				month < 10 ? month = '0' + month : true;

				return month+'/'+day+'/'+year;
			}
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

		prettyCheck: {
			/**
			 * target: Either an element containing checkboxes/radio or the checkbox/radio itself
			 * inputType: The type of input to prettify, Allowed values are 'checkbox', 'radio' and 'all'
			**/
			create: function(target, inputType) {
				var self = this,
					type = inputType || 'checkbox',
					options = {
						checkboxClass: 'icheckbox_flat',
						radioClass: 'iradio_flat'
					};

				if(target.is("input:not(.not-pretty)")) {
					target.iCheck(options);
				} else {
					/* Only update fields without the not-pretty class (we added this class to checkboxes with alternates stylings, such as the ones impacted by the bootstrapSwitch library) */
					target.find('input'+(type !== "all" ? '[type="'+type+'"]' : '')+':not(.not-pretty)').iCheck(options);
				}
			},

			/**
			 * target: Either an element containing checkboxes/radio or the checkbox/radio itself
			 *
			 * action: The action to perform on target. Allowed actions are:
			 *	'check' (change input's state to 'checked')
			 *	'uncheck' (remove 'checked' state)
			 *	'toggle' (toggle 'checked' state)
			 *	'disable' (change input's state to 'disabled')
			 *	'enable' (remove 'disabled' state)
			 *	'indeterminate' (change input's state to 'indeterminate')
			 *	'determinate' (remove 'indeterminate' state)
			 *	'update' (apply input changes, which were done outside the plugin)
			 *	'destroy' (remove all traces of iCheck)
			 *
			 * callback: A callback function that will be executed after EACH time the action is performed on a checkbox/radio
			**/
			action: function(target, action, callback) {
				target.iCheck(action, callback);
			}


			/**
			 * The following events can be binded on the prettyfied inputs:
			 *	'ifClicked' (user clicked on a customized input or an assigned label)
			 *	'ifChanged' (input's "checked", "disabled" or "indeterminate" state is changed)
			 *	'ifChecked' (input's state is changed to "checked")
			 *	'ifUnchecked' ("checked" state is removed)
			 *	'ifToggled' (input's "checked" state is changed)
			 *	'ifDisabled' (input's state is changed to "disabled")
			 *	'ifEnabled' ("disabled" state is removed)
			 *	'ifIndeterminate' (input's state is changed to "indeterminate")
			 *	'ifDeterminate' ("indeterminate" state is removed)
			 *	'ifCreated' (input is just customized)
			 *	'ifDestroyed' (customization is just removed)
			 *
			 * For more info, please refer to https://github.com/fronteed/iCheck
			**/
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
		 * @param options - optional Javascript Object
		 *
		 * To remove elements from the toolbar, specify false as value
		 * for the corresponding key in the defaultOptions object.
		 * 
		 * The target should be a jQuery Object as follow:
		 * <div class="wysiwyg-container"></div>
		 * The optional class "filled" can be added to this container
		 * to change the style of the toolbar.
		 */
		wysiwyg: function(target, options) {
			var self = this,
				options = options || {},
				id = new Date().getTime(),
				coreApp = monster.apps.core,
				i18n = coreApp.i18n.active().wysiwyg,
				defaultOptions = {
					tools: {
						fontSize: {
							title: i18n.title.fontSize,
							icon: 'text-height',
							options: {
								small: {
									title: i18n.title.small,
									command: 'fontSize',
									args: '1'
								},
								normal: {
									title: i18n.title.normal,
									command: 'fontSize',
									args: '3'
								},
								huge: {
									title: i18n.title.huge,
									command: 'fontSize',
									args: '5'
								}
							}
						},
						fontEffect: {
							bold: {
								title: i18n.title.bold,
								icon: 'bold',
								command: 'bold'
							},
							italic: {
								title: i18n.title.italic,
								icon: 'italic',
								command: 'italic'
							},
							underline: {
								title: i18n.title.underline,
								icon: 'underline',
								command: 'underline'
							},
							strikethrough: {
								title: i18n.title.strikethrough,
								icon: 'strikethrough',
								command: 'strikethrough'
							}
						},
						fontColor: {
							title: i18n.title.fontColor,
							icon: 'font',
							command: 'foreColor',
							options: [
								'ffffff','000000','eeece1','1f497d','4f81bd','c0504d','9bbb59','8064a2','4bacc6','f79646','ffff00',
								'f2f2f2','7f7f7f','ddd9c3','c6d9f0','dbe5f1','f2dcdb','ebf1dd','e5e0ec','dbeef3','fdeada','fff2ca',
								'd8d8d8','595959','c4bd97','8db3e2','b8cce4','e5b9b7','d7e3bc','ccc1d9','b7dde8','fbd5b5','ffe694',
								'bfbfbf','3f3f3f','938953','548dd4','95b3d7','d99694','c3d69b','b2a2c7','b7dde8','fac08f','f2c314',
								'a5a5a5','262626','494429','17365d','366092','953734','76923c','5f497a','92cddc','e36c09','c09100',
								'7f7f7f','0c0c0c','1d1b10','0f243e','244061','632423','4f6128','3f3151','31859b','974806','7f6000'
							]
						},
						textAlign: {
							title: i18n.title.alignment,
							icon: 'file-text',
							options: {
								left: {
									title: i18n.title.alignLeft,
									icon: 'align-left',
									command: 'justifyLeft'
								},
								center: {
									title: i18n.title.center,
									icon: 'align-center',
									command: 'justifyCenter'
								},
								right: {
									title: i18n.title.alignRight,
									icon: 'align-right',
									command: 'justifyRight'
								},
								justify: {
									title: i18n.title.justify,
									icon: 'align-justify',
									command: 'justifyFull'
								}
							}
						},
						list: {
							title: i18n.title.list,
							icon: 'list',
							options: {
								unordered: {
									title: i18n.title.bulletList,
									icon: 'list-ul',
									command: 'insertUnorderedList'
								},
								ordered: {
									title: i18n.title.numberList,
									icon: 'list-ol',
									command: 'insertOrderedList'
								}
							}
						},
						indentation: {
							indent: {
								title: i18n.title.indent,
								icon: 'indent-right',
								command: 'indent'
							},
							outdent: {
								title: i18n.title.reduceIndent,
								icon: 'indent-left',
								command: 'outdent'
							}
						},
						link: {
							create: {
								title: i18n.title.hyperlink,
								icon: 'link',
								command: 'createLink'
							},
							delete: {
								title: i18n.title.removeHyperlink,
								icon: 'unlink',
								command: 'unlink'
							},
						},
						image: {
							title: i18n.title.upload,
							icon: 'picture',
							command: 'insertImage'
						},
						editing: {
							undo: {
								title: i18n.title.undo,
								icon: 'undo',
								command: 'undo'
							},
							redo: {
								title: i18n.title.redo,
								icon: 'repeat',
								command: 'redo'
							}
						},
						horizontalRule: {
							title: i18n.title.horizontalRule,
							icon: 'minus',
							command: 'insertHorizontalRule'
						},
						macro: {
							title: i18n.title.macro,
							command: 'insertHtml',
							options: {
								user_first_name: 'User\'s First Name',
								user_last_name: 'User\'s Last Name',
								user_pin: 'User\'s PIN',
								conference_name: 'Conference\'s Name',
								conference_date: 'Conference\'s Date',
								conference_time: 'Conference\'s Time',
								conference_record: 'Conference\'s Record'
							}
						}
					}
				},
				wysiwygTemplate;

			options = $.extend(true, {}, defaultOptions, options, { id: id });

			for (var category in options.tools) {
				if (!options.tools[category]) {
					delete options.tools[category];
				}
				else if (options.tools[category].hasOwnProperty('options') && _.isEmpty(options.tools[category].options)) {
					delete options.tools[category];
				}
				else if (!options.tools[category].hasOwnProperty('title')) {
					var show = false;

					for (var option in options.tools[category]) {
						if (options.tools[category][option]) {
							show = true;
							break;
						}
					}

					if (!show) {
						delete options.tools[category];
					}
				}
			}

			wysiwygTemplate = $(monster.template(coreApp, 'wysiwyg-template', options));

			wysiwygTemplate
				.find('a[title]')
				.tooltip({container: 'body'});

			/* Handle the behavior of the creatLink dropdown menu */
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

			target
				.prepend(wysiwygTemplate)
				.find('#wysiwyg_editor_' + id)
				.wysiwyg({
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
		}
	};

	return ui;
});
