define(function(require){

	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var requestAmount = 0,
		homeIcon;

	monster.sub('monster.requestStart', function() {
		requestAmount++;

		homeIcon = homeIcon || $('#home_link > i');

		if(homeIcon.hasClass('icon-home')) {
			homeIcon .removeClass('icon-home')
					 .addClass('icon-spin icon-spinner');
		}
	});

	monster.sub('monster.requestEnd', function() {
		if(--requestAmount === 0) {
			homeIcon.removeClass('icon-spin icon-spinner')
					.addClass('icon-home');
		}
	});

	Handlebars.registerHelper('eachkeys', function(context, options) {
		var fn = options.fn,
			inverse = options.inverse,
			ret = '',
			empty = true;

		for (key in context) { empty = false; break; }

		if (!empty) {
			for (key in context) {
				ret = ret + fn({ 'key': key, 'value': context[key]});
			}
		}
		else {
			ret = inverse(this);
		}

		return ret;
	});

	Handlebars.registerHelper('formatPhoneNumber', function(phoneNumber) {
		phoneNumber = phoneNumber.toString();

		return monster.util.formatPhoneNumber(phoneNumber);
	});

	Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
		var operators, result;

		if (arguments.length < 3) {
			throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
		}

		if (options === undefined) {
			options = rvalue;
			rvalue = operator;
			operator = "===";
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

	var ui = {
		alert: function(type, content, callback){
			if(typeof content === "undefined"){
				content = type;
				type = "info";
			}

			var commonApp = monster.apps['common'],
				template = monster.template(commonApp, 'dialog-' + type, { content: content, data: content.data || 'No extended information.' }),
				content = $(template),
				i18n = commonApp.i18n.active(),
				options = {
					title: i18n[type],
					onClose: function(){
						callback && callback();
					}
				},
				dialog;

			dialog = this.dialog(content, options, i18n);

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

		confirm: function(content, callbackOk, callbackCancel) {
			var self = this,
				dialog,
				commonApp = monster.apps['common'],
				i18n = commonApp.i18n.active();
				template = monster.template(commonApp, 'dialog-confirm', { content: content, data: content.data || 'No extended information.' }),
				confirmBox = $(template),
				options = {
					closeOnEscape: false,
					title: i18n.dialog.confirmTitle,
					onClose: function() {
						ok ? callbackOk && callbackOk() : callbackCancel && callbackCancel();
					}
				},
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
				commonApp = monster.apps['common'],
				i18n = commonApp.i18n.active();

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

			dialog.siblings().find('.ui-dialog-titlebar-close').text(i18n['close'] || 'X');

			return dialog;	   // Return the new div as an object, so that the caller can destroy it when they're ready.'
		},

		table: {
			create: function(name, element, columns, data, options) {
				var self = this,
					tableObj,
					i18n = monster.apps['common'].i18n.active(),
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
					i18n = monster.apps['common'].i18n.active();

				search.attr('placeholder', i18n.table.search);

				search_wrapper.contents().filter(function() {
					return this.nodeType == Node.TEXT_NODE;
				}).remove();

				// This is backwards because of the float right
				search.before(btn_cancel);
				search.after(btn_search);
			}
		},

		initRangeDatepicker: function(range, parent) {
    		var self = this,
				container = parent,
				inputStartDate = container.find('#startDate'),
				inputEndDate = container.find('#endDate'),
				startDate = new Date(),
				endDate,
				tomorrow = new Date(),
				initRange = range;

			tomorrow.setDate(tomorrow.getDate() + 1);

			container.find('#startDate, #endDate').datepicker(
				{
					beforeShow: customRange,
					onSelect: customSelect
				}
			);

			endDate = tomorrow;
			startDate.setDate(new Date().getDate() - initRange + 1);

			inputStartDate.datepicker('setDate', startDate);
			inputEndDate.datepicker('setDate', endDate);

			function customSelect(dateText, input) {
				var dateMin,
					dateMax;

				if(input.id == 'startDate') {
					dateMin = inputStartDate.datepicker('getDate');
					if(inputEndDate.datepicker('getDate') == null) {
						dateMax = dateMin;
						dateMax.setDate(dateMin.getDate() + range);
						inputEndDate.val(toStringDate(dateMax));
					}
					else {
						dateMax = inputEndDate.datepicker('getDate');
						if((dateMax > (new Date(dateMin).setDate(dateMin.getDate() + range)) || (dateMax <= dateMin))) {
							dateMax = dateMin;
							dateMax.setDate(dateMax.getDate() + range);
							dateMax > tomorrow ? dateMax = tomorrow : true;
							inputEndDate.val(toStringDate(dateMax));
						}
					}
				}
				else if(input.id == 'endDate') {
					if(inputStartDate.datepicker('getDate') == null) {
						dateMin = inputEndDate.datepicker('getDate');
						dateMin.setDate(dateMin.getDate() - 1);
						inputStartDate.val(toStringDate(dateMin));
					}
				}
			};

			function customRange(input) {
				var dateMin = new Date(2011, 0, 0),
					dateMax;

				if (input.id == 'endDate') {
					dateMax = tomorrow;
					if (inputStartDate.datepicker('getDate') != null)
					{
						dateMin = inputStartDate.datepicker('getDate');
						/* Range of 1 day minimum */
						dateMin.setDate(dateMin.getDate() + 1);

						/* Range of 1 day minimum */
						dateMin.setDate(dateMin.getDate() + 1);
						dateMax = inputStartDate.datepicker('getDate');
						dateMax.setDate(dateMax.getDate() + range);

						if(dateMax > tomorrow) {
							dateMax = tomorrow;
						}
					}
				}
				else if (input.id == 'startDate') {
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
		}
	};

	return ui;
});
