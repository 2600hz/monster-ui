define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timepicker = require('timepicker');

	var app = {

		requests: {
			'strategy.callflows.list': {
				url: 'accounts/{accountId}/callflows',
				verb: 'GET'
			},
			'strategy.callflows.get': {
				url: 'accounts/{accountId}/callflows/{callflowId}',
				verb: 'GET'
			},
			'strategy.callflows.add': {
				url: 'accounts/{accountId}/callflows',
				verb: 'PUT'
			},
			'strategy.callflows.update': {
				url: 'accounts/{accountId}/callflows/{callflowId}',
				verb: 'POST'
			},
			'strategy.temporalRules.list': {
				url: 'accounts/{accountId}/temporal_rules',
				verb: 'GET'
			},
			'strategy.temporalRules.get': {
				url: 'accounts/{accountId}/temporal_rules/{ruleId}',
				verb: 'GET'
			},
			'strategy.temporalRules.add': {
				url: 'accounts/{accountId}/temporal_rules',
				verb: 'PUT'
			},
			'strategy.temporalRules.update': {
				url: 'accounts/{accountId}/temporal_rules/{ruleId}',
				verb: 'POST'
			}
		},

		subscribe: {
			'voip.strategy.render': 'strategyRender'
		},

		weekdayLabels: [
			"MainMonday",
			"MainTuesday",
			"MainWednesday",
			"MainThursday",
			"MainFriday",
			"MainSaturday",
			"MainSunday"
		],

		subCallflowsLabel: [
			"MainOpenHours",
			"MainAfterHours",
			"MainLunchHours",
			"MainHolidays"
		],

		strategyRender: function(container){
			var self = this,
				parent = container || $('#ws_content'),
				templateData = {},
				template = $(monster.template(self, 'strategy-layout', templateData)),
				callflowData = {};

			self.getTemporalRules(function(temporalRules) {
				callflowData.temporalRules = temporalRules;
				self.getMainCallflows(function(callflows) {
					callflowData.callflows = callflows;
					console.log(callflowData);
					self.strategyBindEvents(template, callflowData);
				});
			});

			parent.empty()
				  .append(template);
		},

		strategyBindEvents: function(template, callflowData) {
			var self = this,
				strategyHoursContainer = template.find('.element-container.strategy-hours .element-content'),
				strategyHolidaysContainer = template.find('.element-container.strategy-holidays .element-content'),
				strategyCallsContainer = template.find('.element-container.strategy-calls .element-content');

			template.find('.element-header-inner').on('click', function(e) {
				var element = $(this).parents('.element-container');

				if(element.hasClass('open')) {
					element.removeClass('open');
					element.find('.element-content').hide();
				} else {
					self.refreshTemplate(element, callflowData, function() {
						element.addClass('open');
						element.find('.element-content').show();
					});
				}
			});

			template.find('.element-container').on('click', '.cancel-link', function(e) {
				e.preventDefault();
				var parent = $(this).parents('.element-container');
				parent.find('.element-content').hide();
				parent.removeClass('open');
			});


			self.strategyHoursBindEvents(strategyHoursContainer, callflowData);
			self.strategyHolidaysBindEvents(strategyHolidaysContainer, callflowData);
			self.strategyCallsBindEvents(strategyCallsContainer, callflowData);
		},

		refreshTemplate: function(container, callflowData, callback) {
			var self = this,
				templateName = container.data('template');

				switch(templateName) {
					case "numbers":
						var callflow = callflowData.callflows["MainCallflow"],
							numbers = callflow ? callflow.numbers : [],
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
						break;
					case "hours":
						var secondsToTime = function(seconds) {
								var h = parseInt(seconds/3600) % 24,
									m = (parseInt(seconds/60) % 60).toString(),
									suffix = h >= 12 ? 'PM' : 'AM';
								h = (h > 12 ? h-12 : (h === 0 ? 12 : h)).toString();
								return h + ":" + (m.length < 2 ? "0"+m : m) + suffix;
							},
							weekdaysRules = callflowData.temporalRules.weekdays,
							templateData = {
								alwaysOpen: true,
								days: [],
								lunchbreak: {
									enabled: (callflowData.temporalRules.lunchbreak.id in callflowData.callflows["MainCallflow"].flow.children),
									from: secondsToTime(parseInt(callflowData.temporalRules.lunchbreak.time_window_start, 10)),
									to: secondsToTime(parseInt(callflowData.temporalRules.lunchbreak.time_window_stop, 10))
								}
							},
							template;

						_.each(self.weekdayLabels, function(val) {
							var isOpen = (weekdaysRules[val].id in callflowData.callflows["MainCallflow"].flow.children);
							templateData.days.push({
								name: val,
								label: self.i18n.active().strategy.weekdays[val.substring(4).toLowerCase()],
								open: isOpen,
								from: secondsToTime(parseInt(weekdaysRules[val].time_window_start, 10)),
								to: secondsToTime(parseInt(weekdaysRules[val].time_window_stop, 10))
							});
							if(isOpen) {
								templateData.alwaysOpen = false;
							}
						});
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
						self.renderHolidayLine(holidayList, "single", {
							id: "a1a1a1a1a1a1a1",
							name: "Independence Day",
							month: 7,
							fromDay: 4
						});
						self.renderHolidayLine(holidayList, "single", {
							id: "b2b2b2b2b2b2b2",
							name: "Labor Day",
							month: 9,
							fromDay: 2
						});
						self.renderHolidayLine(holidayList, "advanced", {
							id: "c3c3c3c3c3c3c3",
							name: "Thanksgiving Day",
							month: 11,
							ordinal: "fourth",
							wday: "thursday"
						});
						self.renderHolidayLine(holidayList, "range", {
							id: "d4d4d4d4d4d4d4",
							name: "Christmas Holidays",
							month: 12,
							fromDay: 25,
							toDay: 31
						});

						monster.ui.prettyCheck.create(template);
						callback && callback();
						break;
					case "calls":
						monster.ui.prettyCheck.create(container, 'radio');
						callback && callback();
						break;
					default:
						callback && callback();
						break;
				}
		},

		strategyHoursBindEvents: function(container, callflowData) {
			var self = this;

			container.on('change', '.custom-hours-toggler input[type="radio"]', function(e) {
				var toggleDiv = container.find('.custom-hours-div');
				if($(this).val() == "true") {
					toggleDiv.slideDown();
				} else {
					toggleDiv.slideUp();
				}
			});

			container.on('ifToggled', '.custom-days input[type="checkbox"]', function(e) {
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

			container.on('ifToggled', '.custom-hours-lunchbreak input[type="checkbox"]', function(e) {
				if(this.checked) {
					$(this).parents('.custom-hours-lunchbreak').find('.timepickers').fadeIn(200);
				} else {
					$(this).parents('.custom-hours-lunchbreak').find('.timepickers').fadeOut(200);
				}
			});

			container.on('click', '.save-button', function(e) {
				e.preventDefault();
				var parent = $(this).parents('.element-container'),
					customHours = form2object('strategy_custom_hours_form'),
					mainCallflow = callflowData.callflows["MainCallflow"],
					formatChildModule = function(callflowId) {
						return {
							children: {},
							data: {
								id: callflowId
							},
							module:"callflow"
						};
					},
					timeToSeconds = function(time) {
						var suffix = time.substring(time.length-2),
							timeArr = time.split(':'),
							h = parseInt(timeArr[0],10),
							m = parseInt(timeArr[1],10);

						if(suffix === 'pm' && h < 12) {
							h += 12;
						} else if(suffix === "am" && h === 12) {
							h = 0;
						}

						return (h*3600 + m*60).toString();
					};

				console.log(customHours);

				_.each(callflowData.temporalRules.weekdays, function(val, key) {
					delete mainCallflow.flow.children[val.id];
				});

				if(customHours.enabled === "false" || !customHours.opendays || customHours.opendays.length === 0) {
					mainCallflow.flow.children["_"] = formatChildModule(callflowData.callflows["MainOpenHours"].id);
				} else {
					var tmpRulesRequests = {};

					mainCallflow.flow.children["_"] = formatChildModule(callflowData.callflows["MainAfterHours"].id);

					if(customHours.lunchbreak.enabled) {
						var lunchbreakRule = callflowData.temporalRules.lunchbreak;
						lunchbreakRule.time_window_start = timeToSeconds(customHours.lunchbreak.from);
						lunchbreakRule.time_window_stop = timeToSeconds(customHours.lunchbreak.to);
						tmpRulesRequests["lunchbreak"] = function(callback) {
							monster.request({
								resource: 'strategy.temporalRules.update',
								data: {
									accountId: self.accountId,
									ruleId: lunchbreakRule.id,
									data: lunchbreakRule
								},
								success: function(data, status) {
									callback(null, data.data);
								}
							});
						};

						mainCallflow.flow.children[lunchbreakRule.id] = formatChildModule(callflowData.callflows["MainLunchHours"].id);;
					} else {
						delete mainCallflow.flow.children[callflowData.temporalRules.lunchbreak.id];
					}

					_.each(customHours.opendays, function(val) {
						var temporalRule = callflowData.temporalRules.weekdays[val];
						temporalRule.time_window_start = timeToSeconds(customHours.weekdays[val].from);
						temporalRule.time_window_stop = timeToSeconds(customHours.weekdays[val].to);
						tmpRulesRequests[val] = function(callback) {
							monster.request({
								resource: 'strategy.temporalRules.update',
								data: {
									accountId: self.accountId,
									ruleId: temporalRule.id,
									data: temporalRule
								},
								success: function(data, status) {
									callback(null, data.data);
								}
							});
						}

						mainCallflow.flow.children[temporalRule.id] = formatChildModule(callflowData.callflows["MainOpenHours"].id);
					});

					monster.parallel(tmpRulesRequests, function(err, results) {});
				}

				self.updateCallflow(mainCallflow, function(updatedCallflow) {
					callflowData.callflows["MainCallflow"] = updatedCallflow;
					parent.find('.element-content').hide();
					parent.removeClass('open');
				});
			});
		},

		strategyHolidaysBindEvents: function(container, callflowData) {
			var self = this;

			container.on('ifToggled', '.holidays-toggler input[type="checkbox"]', function(e) {
				if(this.checked) {
					container.find('.holidays-div').slideDown();
				} else {
					container.find('.holidays-div').slideUp();
				}
			});

			container.on('click', '.add-holidays-link', function(e) {
				e.preventDefault();
				self.renderHolidayLine(container.find('.holidays-list'), $(this).data('type'));
			});

			container.on('click', '.delete-holiday', function(e) {
				$(this).parents('.holidays-element').remove();
			});

			container.on('click', '.save-button', function(e) {
				e.preventDefault();
				var holidayRulesRequests = {},
					invalidData = false;

				$.each(container.find('.holidays-element'), function() {
					var $this = $(this),
						name = $this.find('.name').val().trim(),
						month = $this.find('.month :selected').val(),
						fromDay = $this.find('.day.from :selected').val(),
						toDay = $this.find('.day.to :selected').val(),
						ordinal = $this.find('.ordinal :selected').val(),
						wday = $this.find('.wday :selected').val(),
						id = $this.data('id');
					
					if(!name || Object.keys(holidayRulesRequests).indexOf(name) >= 0) {
						invalidData = true;
						return false;
					}

					holidayRulesRequests[name] = {};
					if(month) { holidayRulesRequests[name].month = month }
					if(fromDay) { holidayRulesRequests[name].fromDay = fromDay }
					if(toDay) { holidayRulesRequests[name].toDay = toDay }
					if(ordinal) { holidayRulesRequests[name].ordinal = ordinal }
					if(wday) { holidayRulesRequests[name].wday = wday }
					if(id) { holidayRulesRequests[name].id = id }
					// holidayRulesRequests[name] = function(callback) {
					// 	monster.request({
					// 		resource: 'strategy.temporalRules.update',
					// 		data: {
					// 			accountId: self.accountId,
					// 			ruleId: temporalRule.id,
					// 			data: temporalRule
					// 		},
					// 		success: function(data, status) {
					// 			callback(null, data.data);
					// 		}
					// 	});
					// }

				});

				if(invalidData) {
					monster.ui.alert('Every holiday must have a unique name.')
				} else {
					console.log(holidayRulesRequests);
				}
			});
		},

		strategyCallsBindEvents: function(container, callflowData) {
			var self = this;

			container.on('click', '.calls-tabs a', function(e) {
				e.preventDefault();
				$(this).tab('show');
			});

			container.on('ifChecked', 'input[type="radio"]', function(e) {
				var parentCallOption = $(this).parents('.call-option');

				parentCallOption.siblings().removeClass('active');
				parentCallOption.addClass('active');
			});
		},

		renderHolidayLine: function(container, holidayType, holiday, callback) {
			var self = this,
				templateData = $.extend(true, {
					resources: {
						months: [
							{ value:1, label:"JAN" }, { value:2, label:"FEB" }, { value:3, label:"MAR" },
							{ value:4, label:"APR" }, { value:5, label:"MAY" }, { value:6, label:"JUN" },
							{ value:7, label:"JUL" }, { value:8, label:"AUG" }, { value:9, label:"SEP" },
							{ value:10, label:"OCT" }, { value:11, label:"NOV" }, { value:12, label:"DEC" }
						],
						days: [],
						wdays: [
							{ value:"monday", label:"Mon" }, { value:"tuesday", label:"Tue" },
							{ value:"wednesday", label:"Wed" }, { value:"thursday", label:"Thu" },
							{ value:"friday", label:"Fri" }, { value:"saturday", label:"Sat" },
							{ value:"sunday", label:"Sun" }
						],
						ordinals: [
							{ value:"first", label:"First" }, { value:"second", label:"Second" },
							{ value:"third", label:"Third" }, { value:"fourth", label:"Fourth" },
							{ value:"fifth", label:"Fifth" }, { value:"last", label:"Last" }
						]
					}
				}, holiday, {holidayType: holidayType});

			for(var i=1; i<=31; i++) {
				templateData.resources.days.push(i);
			}

			container.append(monster.template(self, 'strategy-holidayLine', templateData));
		},

		getMainCallflows: function(callback) {
			var self = this;
			monster.request({
				resource: 'strategy.callflows.list',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					var callflows = $.grep(data.data, function(val, key) {
						return val.type === "main";
					}),
					parallelRequests = {};

					_.each(callflows, function(val, key) {
						var name = val.name || val.numbers[0];
						parallelRequests[name] = function(callback) {
							monster.request({
								resource: 'strategy.callflows.get',
								data: {
									accountId: self.accountId,
									callflowId: val.id
								},
								success: function(data, status) {
									callback(null, data.data);
								}
							});
						}
					});

					_.each(self.subCallflowsLabel, function(val) {
						if(!parallelRequests[val]) {
							parallelRequests[val] = function(callback) {
								monster.request({
									resource: 'strategy.callflows.add',
									data: {
										accountId: self.accountId,
										data: {
											contact_list: {
												exclude: false
											},
											numbers: [val],
											type: "main",
											flow: {
												children: {},
												data: {},
												module: "temporal_route"
											}
										}
									},
									success: function(data, status) {
										callback(null, data.data);
									}
								});
							}
						}
					})

					monster.parallel(parallelRequests, function(err, results) {
						callback(results);
					});
				}
			});
		},

		getTemporalRules: function(callback) {
			var self = this;
			monster.request({
				resource: 'strategy.temporalRules.list',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					var temporalRuleList = $.grep(data.data, function(val, key) {
							return (val.type && val.type.length > 0);
						}),
						parallelRequests = {};

					_.each(temporalRuleList, function(val, key) {
						parallelRequests[val.name] = function(callback) {
							monster.request({
								resource: 'strategy.temporalRules.get',
								data: {
									accountId: self.accountId,
									ruleId: val.id
								},
								success: function(data, status) {
									callback(null, data.data);
								}
							});
						}
					});

					_.each(self.weekdayLabels, function(val) {
						if(!parallelRequests[val]) {
							parallelRequests[val] = function(callback) {
								monster.request({
									resource: 'strategy.temporalRules.add',
									data: {
										accountId: self.accountId,
										data: {
											cycle: "weekly",
											interval: 1,
											name: val,
											type: "main_weekdays",
											start_date: 63524246400,
											time_window_start: "32400",
											time_window_stop: "61200",
											wdays: [val.substring(4).toLowerCase()]
										}
									},
									success: function(data, status) {
										callback(null, data.data);
									}
								});
							}
						}
					});

					if(!parallelRequests["MainLunchHours"]) {
						parallelRequests["MainLunchHours"] = function(callback) {
							monster.request({
								resource: 'strategy.temporalRules.add',
								data: {
									accountId: self.accountId,
									data: {
										cycle: "weekly",
										interval: 1,
										name: "MainLunchHours",
										type: "main_lunchbreak",
										start_date: 63524246400,
										time_window_start: "43200",
										time_window_stop: "46800",
										wdays: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
									}
								},
								success: function(data, status) {
									callback(null, data.data);
								}
							});
						}
					}

					monster.parallel(parallelRequests, function(err, results) {
						var temporalRules = {
							weekdays: {},
							lunchbreak: {},
							holidays: {}
						};

						_.each(results, function(val, key) {
							switch(val.type) {
								case "main_weekdays":
									temporalRules.weekdays[key] = val
									break;
								case "main_lunchbreak":
									temporalRules.lunchbreak = val;
									break;
								case "main_holidays":
									temporalRules.holiday[key];
									break;
							}
						});

						callback(temporalRules);
					});
				}
			});
		},

		updateCallflow: function(callflow, callback) {
			var self = this,
				callflowId = callflow.id;
			delete callflow.metadata;
			delete callflow.id;
			monster.request({
				resource: 'strategy.callflows.update',
				data: {
					accountId: self.accountId,
					callflowId: callflowId,
					data: callflow
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		}
	};

	return app;
});
