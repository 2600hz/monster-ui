define(function(require){
	var $ = require('jquery'),
		monster = require('monster'),
		timepicker = require('timepicker');

	var app = {

		requests: {
			'strategy.callflows.list': {
				url: 'accounts/{accountId}/callflows',
				verb: 'GET'
			},
			'strategy.callflows.update': {
				url: 'accounts/{account_id}/callflows/{callflow_id}',
				verb: 'POST'
			}
		},

		subscribe: {
			'voip.strategy.render': 'strategyRender'
		},

		strategyRender: function(container){
			var self = this,
				parent = container || $('#ws_content'),
				templateData = {},
				template = $(monster.template(self, 'strategy-layout', templateData));

			self.strategyBindEvents(template);

			parent.empty()
				  .append(template);
		},

		strategyBindEvents: function(template) {
			var self = this,
				strategyHoursContainer = template.find('.element-container.strategy-hours .element-content'),
				strategyHolidaysContainer = template.find('.element-container.strategy-holidays .element-content');

			template.find('.element-header-inner').on('click', function(e) {
				var element = $(this).parents('.element-container');

				if(element.hasClass('open')) {
					element.removeClass('open');
					element.find('.element-content').hide();
				} else {
					self.refreshTemplate(element, function() {
						element.addClass('open');
						element.find('.element-content').show();
					});
				}
			})

			template.find('.element-container').on('click', '.cancel-link', function(e) {
				e.preventDefault();
				var parent = $(this).parents('.element-container');
				parent.find('.element-content').hide();
				parent.removeClass('open');
			});

			// Strategy Hours
			strategyHoursContainer.on('change', 'input[name="customHours"]', function(e) {
				var toggleDiv = strategyHoursContainer.find('.custom-hours-div');
				if($(this).val() == "true") {
					toggleDiv.slideDown();
				} else {
					toggleDiv.slideUp();
				}
			});

			strategyHoursContainer.on('ifToggled', '.custom-days input[type="checkbox"]', function(e) {
				var parent = $(this).parents('.custom-day'),
					timepickers = parent.find('.timepickers'),
					status = parent.find('.status');
				if(this.checked) {
					timepickers.fadeIn(200);
					status.fadeOut(100, function() {
						status.html(self.i18n.active().strategy.open);
						status.fadeIn(100);
					});
				} else {
					timepickers.fadeOut(200);
					status.fadeOut(100, function() {
						status.html(self.i18n.active().strategy.closed);
						status.fadeIn(100);
					});
				}
			});

			strategyHoursContainer.on('ifToggled', '.custom-hours-lunchbreak input[type="checkbox"]', function(e) {
				if(this.checked) {
					$(this).parents('.custom-hours-lunchbreak').find('.timepickers').fadeIn(200);
				} else {
					$(this).parents('.custom-hours-lunchbreak').find('.timepickers').fadeOut(200);
				}
			});

			// Strategy Holidays
			strategyHolidaysContainer.on('ifToggled', '.holidays-toggler input[type="checkbox"]', function(e) {
				if(this.checked) {
					strategyHolidaysContainer.find('.holidays-div').slideDown();
				} else {
					strategyHolidaysContainer.find('.holidays-div').slideUp();
				}
			});
		},

		refreshTemplate: function(container, callback) {
			var self = this,
				templateName = container.data('template');

				switch(templateName) {
					case "numbers":
						self.getMainCallflow(function(callflow) {
							console.log(callflow);
							var numbers = callflow ? callflow.numbers : [],
								templateData = { 
									numbers: $.map(numbers, function(val, key) {
										if(val.length > 8) { //TODO actually test the number
											return {
												number: val,
												city: "San Francisco"
											};
										}
									})
								},
								template = monster.template(self, 'strategy-'+templateName, templateData);

							container.find('.element-content').empty()
															  .append(template);
							callback && callback();
						});
						break;
					case "hours":
						var templateData = {
							days: [
								{
									name: "monday",
									open: true,
									from: "09:00 AM",
									to: "05:00 PM"
								},
								{
									name: "tuesday",
									open: true,
									from: "09:00 AM",
									to: "05:00 PM"
								},
								{
									name: "wednesday",
									open: true,
									from: "09:00 AM",
									to: "05:00 PM"
								},
								{
									name: "thursday",
									open: true,
									from: "09:00 AM",
									to: "05:00 PM"
								},
								{
									name: "friday",
									open: true,
									from: "09:00 AM",
									to: "05:00 PM"
								},
								{
									name: "saturday",
									open: false
								},
								{
									name: "sunday",
									open: false
								}
							]
						},
						template = $(monster.template(self, 'strategy-'+templateName, templateData));

						container.find('.element-content').empty()
														  .append(template);
						template.find('.timepicker').timepicker();
						monster.ui.prettyCheck.create(template);
						callback && callback();
						break;
					case "holidays":
						var templateData = {},
							template = $(monster.template(self, 'strategy-'+templateName, templateData)),
							holidayList = template.find('.holidays-list');

						container.find('.element-content').empty()
														  .append(template);

						holidayList.empty();
						self.renderHolidayLine(holidayList, false, {
							name: "Independence Day",
							fromDate: "07/04/2013"
						});
						self.renderHolidayLine(holidayList, false, {
							name: "Labor Day",
							fromDate: "09/02/2013"
						});
						self.renderHolidayLine(holidayList, true, {
							name: "Christmas Holidays",
							fromDate: "12/25/2013",
							toDate: "12/31/2013"
						});

						monster.ui.prettyCheck.create(template);
						callback && callback();
						break;
					default:
						callback && callback();
						break;
				}
		},

		renderHolidayLine: function(container, isDateRange, holiday, callback) {
			var self = this,
				templateData = $.extend(true, {}, holiday, {isDateRange: isDateRange}),
				template = $(monster.template(self, 'strategy-holidayLine', templateData));

			container.append(template);

			if(!isDateRange) {
				template.find('.date').datepicker();
			} else {
				var fromDate = template.find('.from.date'),
					toDate = template.find('.to.date');

				fromDate.datepicker({
					onClose: function( selectedDate ) {
						toDate.datepicker( "option", "minDate", selectedDate );
					}
				});
				toDate.datepicker({
					onClose: function( selectedDate ) {
						fromDate.datepicker( "option", "maxDate", selectedDate );
					}
				});
				if(fromDate.val()) {
					toDate.datepicker( "option", "minDate", fromDate.val() );
				}
				if(toDate.val()) {
					fromDate.datepicker( "option", "maxDate", toDate.val() );
				}
			}
		},

		getMainCallflow: function(callback) {
			var self = this;
			monster.request({
				resource: 'strategy.callflows.list',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					var callflows = $.grep(data.data, function(val, key) {
						return val.main === true;
					})
					callback(callflows[0]);
				}
			});
		}
	};

	return app;
});
