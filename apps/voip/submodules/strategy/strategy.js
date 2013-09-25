define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timepicker = require('timepicker'),
		timezone = require('monster-timezone'),
		toastr = require('toastr');

	var app = {

		requests: {
			'strategy.callflows.list': {
				url: 'accounts/{accountId}/callflows?filter_type=main',
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
				url: 'accounts/{accountId}/temporal_rules?has_key=type',
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
			},
			'strategy.temporalRules.delete': {
				url: 'accounts/{accountId}/temporal_rules/{ruleId}',
				verb: 'DELETE'
			},
			'strategy.menus.get': {
				url: 'accounts/{accountId}/menus/{menuId}',
				verb: 'GET'
			},
			'strategy.menus.add': {
				url: 'accounts/{accountId}/menus/',
				verb: 'PUT'
			},
			'strategy.menus.update': {
				url: 'accounts/{accountId}/menus/{menuId}',
				verb: 'POST'
			},
			'strategy.media.get': {
				url: 'accounts/{accountId}/media/{mediaId}',
				verb: 'GET'
			},
			'strategy.media.create': {
				url: 'accounts/{accountId}/media',
				verb: 'PUT'
			},
			'strategy.media.update': {
				url: 'accounts/{accountId}/media/{mediaId}',
				verb: 'POST'
			},
            'strategy.media.upload': {
                url: 'accounts/{accountId}/media/{mediaId}/raw',
                verb: 'POST',
                type: 'application/x-base64'
            },
			'strategy.users.list': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			},
			'strategy.groups.list': {
				url: 'accounts/{accountId}/groups',
				verb: 'GET'
			},
			'strategy.devices.list': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'strategy.devices.list': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'strategy.voicemails.list': {
				url: 'accounts/{accountId}/vmboxes',
				verb: 'GET'
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
				template = $(monster.template(self, 'strategy-layout', templateData));

			monster.parallel({
					temporalRules: function(callback) {
						self.getTemporalRules(function(temporalRules) {
							callback(null, temporalRules);
						});
					},
					callflows: function(callback) {
						self.getMainCallflows(function(callflows) {
							callback(null, callflows);
						});
					},
					callEntities: function(callback) {
						self.getCallEntities(function(callEntities) {
							callback(null, callEntities);
						});
					},
					voicemails: function(callback) {
						self.getVoicesmailBoxes(function(callEntities) {
							callback(null, callEntities);
						});
					}
				},
				function(err, results) {
					console.log(results);
					self.strategyBindEvents(template, results);
				}
			);

			parent.empty()
				  .append(template);
		},

		strategyBindEvents: function(template, strategyData) {
			var self = this,
				containers = template.find('.element-container'),
				strategyHoursContainer = template.find('.element-container.strategy-hours .element-content'),
				strategyHolidaysContainer = template.find('.element-container.strategy-holidays .element-content'),
				strategyCallsContainer = template.find('.element-container.strategy-calls .element-content');

			template.find('.element-header-inner').on('click', function(e) {
				var element = $(this).parents('.element-container');

				if(element.hasClass('open')) {
					element.removeClass('open');
					element.find('.element-content').hide();
				} else {
					containers.removeClass('open');
					containers.find('.element-content').hide();
					self.refreshTemplate(element, strategyData, function() {
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


			self.strategyHoursBindEvents(strategyHoursContainer, strategyData);
			self.strategyHolidaysBindEvents(strategyHolidaysContainer, strategyData);
			self.strategyCallsBindEvents(strategyCallsContainer, strategyData);
		},

		refreshTemplate: function(container, strategyData, callback) {
			var self = this,
				templateName = container.data('template');

				switch(templateName) {
					case "numbers":
						var callflow = strategyData.callflows["MainCallflow"],
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
							weekdaysRules = strategyData.temporalRules.weekdays,
							templateData = {
								alwaysOpen: true,
								companyTimezone: timezone.formatTimezone(strategyData.callflows["MainCallflow"].flow.data.timezone),
								days: [],
								lunchbreak: {
									enabled: (strategyData.temporalRules.lunchbreak.id in strategyData.callflows["MainCallflow"].flow.children),
									from: secondsToTime(parseInt(strategyData.temporalRules.lunchbreak.time_window_start, 10)),
									to: secondsToTime(parseInt(strategyData.temporalRules.lunchbreak.time_window_stop, 10))
								}
							},
							template;

						_.each(self.weekdayLabels, function(val) {
							var isOpen = (weekdaysRules[val].id in strategyData.callflows["MainCallflow"].flow.children);
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
						var templateData = {
								enabled: !$.isEmptyObject(strategyData.temporalRules.holidays)
							},
							template = $(monster.template(self, 'strategy-'+templateName, templateData)),
							holidayList = template.find('.holidays-list');

						container.find('.element-content').empty()
														  .append(template);

						holidayList.empty();

						_.each(strategyData.temporalRules.holidays, function(val, key) {
							if(val.id in strategyData.callflows["MainCallflow"].flow.children) {
								var holidayType,
									holidayData = {
										id: val.id,
										name: val.name,
										month: val.month
									};

								if("ordinal" in val) {
									holidayType = "advanced";
									holidayData.ordinal = val.ordinal;
									holidayData.wday = val.wdays[0];
								} else {
									holidayData.fromDay = val.days[0];
									if(val.days.length > 1) {
										holidayType = "range";
										holidayData.toDay = val.days[val.days.length-1];
									} else {
										holidayType = "single";
									}
								}

								self.renderHolidayLine(holidayList, holidayType, holidayData);
							}
						});

						monster.ui.prettyCheck.create(template);
						callback && callback();
						break;
					case "calls":
						var templateData = {
								lunchbreak: (strategyData.temporalRules.lunchbreak.id in strategyData.callflows["MainCallflow"].flow.children),
								holidays: !$.isEmptyObject(strategyData.temporalRules.holidays),
								afterhours: false
							},
							template;

							_.each(self.weekdayLabels, function(val) {
								if(strategyData.temporalRules.weekdays[val].id in strategyData.callflows["MainCallflow"].flow.children) {
									templateData.afterhours = true;
								}
							});

						template = $(monster.template(self, 'strategy-'+templateName, templateData));

						container.find('.element-content').empty()
														  .append(template);

						$.each(template.find('.callflow-tab'), function() {
							var $this = $(this),
								callflowName = $this.data('callflow'),
								menuName = callflowName+'Menu',
								tabData = {
									callOption: {
										type: "default"
									},
									callflow: callflowName,
									callEntities: self.getCallEntitiesDropdownData(strategyData.callEntities),
									voicemails: strategyData.voicemails
								};

							
							if(["user","device","ring_group"].indexOf(strategyData.callflows[callflowName].flow.module) >= 0) {
								tabData.callOption.callEntityId = strategyData.callflows[callflowName].flow.data.id;
								if(strategyData.callflows[callflowName].flow.children["_"].module === "voicemail") {
									tabData.callOption.type = "user-voicemail";
									tabData.callOption.voicemailId = strategyData.callflows[callflowName].flow.children["_"].data.id;
								} else {
									tabData.callOption.type = "user-menu";
								}
							}

							if(menuName in strategyData.callflows) {
								tabData.menu = menuName;
							}

							$(this).empty().append(monster.template(self, 'strategy-callsTab', tabData));
						});

						monster.ui.prettyCheck.create(container, 'radio');
						callback && callback();
						break;
					default:
						callback && callback();
						break;
				}
		},

		strategyHoursBindEvents: function(container, strategyData) {
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
					mainCallflow = strategyData.callflows["MainCallflow"],
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

				_.each(strategyData.temporalRules.weekdays, function(val, key) {
					delete mainCallflow.flow.children[val.id];
				});
				delete mainCallflow.flow.children[strategyData.temporalRules.lunchbreak.id];

				if(customHours.enabled === "false" || !customHours.opendays || customHours.opendays.length === 0) {
					mainCallflow.flow.children["_"] = formatChildModule(strategyData.callflows["MainOpenHours"].id);
				} else {
					var tmpRulesRequests = {};

					mainCallflow.flow.children["_"] = formatChildModule(strategyData.callflows["MainAfterHours"].id);

					if(customHours.lunchbreak.enabled) {
						var lunchbreakRule = strategyData.temporalRules.lunchbreak;
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

						mainCallflow.flow.children[lunchbreakRule.id] = formatChildModule(strategyData.callflows["MainLunchHours"].id);;
					}

					_.each(customHours.opendays, function(val) {
						var temporalRule = strategyData.temporalRules.weekdays[val];
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

						mainCallflow.flow.children[temporalRule.id] = formatChildModule(strategyData.callflows["MainOpenHours"].id);
					});

					monster.parallel(tmpRulesRequests, function(err, results) {});
				}

				self.rebuildMainCallflowRuleArray(strategyData);
				self.updateCallflow(mainCallflow, function(updatedCallflow) {
					strategyData.callflows["MainCallflow"] = updatedCallflow;
					parent.find('.element-content').hide();
					parent.removeClass('open');
				});
			});
		},

		strategyHolidaysBindEvents: function(container, strategyData) {
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
				var holidaysElement = $(this).parents('.holidays-element'),
					id = holidaysElement.data('id');

				if(id) {
					monster.ui.confirm('This holiday will be permanently deleted. Continue?', function() {
						var mainCallflow = strategyData.callflows["MainCallflow"];
						delete mainCallflow.flow.children[id];

						self.rebuildMainCallflowRuleArray(strategyData);
						self.updateCallflow(mainCallflow, function(updatedCallflow) {
							strategyData.callflows["MainCallflow"] = updatedCallflow;
							monster.request({
								resource: 'strategy.temporalRules.delete',
								data: {
									accountId: self.accountId,
									ruleId: id,
									data: {}
								},
								success: function(data, status) {
									delete strategyData.temporalRules.holidays[data.data.name];
									holidaysElement.remove();
								}
							});
						});
					})
				} else {
					holidaysElement.remove();
				}

			});

			container.on('click', '.save-button', function(e) {
				e.preventDefault();
				var parent = $(this).parents('.element-container'),
					mainCallflow = strategyData.callflows["MainCallflow"],
					holidaysEnabled = parent.find('.holidays-toggler input[type="checkbox"]')[0].checked,
					holidayRulesRequests = {},
					invalidData = false;

				if(holidaysEnabled) {
					$.each(container.find('.holidays-element'), function() {
						var $this = $(this),
							name = $this.find('.name').val().trim(),
							month = $this.find('.month :selected').val(),
							fromDay = $this.find('.day.from :selected').val(),
							toDay = $this.find('.day.to :selected').val(),
							ordinal = $this.find('.ordinal :selected').val(),
							wday = $this.find('.wday :selected').val(),
							id = $this.data('id'),
							holidayRule = {
								cycle: "yearly",
								interval: 1,
								start_date: monster.util.dateToGregorian(new Date()),
								month: parseInt(month),
								type: "main_holidays"
							};
						
						if(!name || Object.keys(holidayRulesRequests).indexOf(name) >= 0) {
							invalidData = true;
							return false;
						}

						holidayRule.name = name;
						if(fromDay) {
							var firstDay = parseInt(fromDay);
							holidayRule.days = [firstDay];
							if(toDay) {
								var lastDay = parseInt(toDay);
								for(var day = firstDay+1; day <= lastDay; day++) {
									holidayRule.days.push(day);
								}
							}
						} else {
							holidayRule.ordinal = ordinal
							holidayRule.wdays = [wday]
						}

						console.log(holidayRule);

						if(id) {
							holidayRulesRequests[name] = function(callback) {
								monster.request({
									resource: 'strategy.temporalRules.update',
									data: {
										accountId: self.accountId,
										ruleId: id,
										data: holidayRule
									},
									success: function(data, status) {
										callback(null, data.data);
									}
								});
							}
						} else {
							holidayRulesRequests[name] = function(callback) {
								monster.request({
									resource: 'strategy.temporalRules.add',
									data: {
										accountId: self.accountId,
										data: holidayRule
									},
									success: function(data, status) {
										callback(null, data.data);
									}
								});
							}
						}

					});

					if(invalidData) {
						monster.ui.alert('Every holiday must have a unique name.')
					} else {
						monster.parallel(holidayRulesRequests, function(err, results) {
							_.each(results, function(val, key) {
								mainCallflow.flow.children[val.id] = {
									children: {},
									data: {
										id: strategyData.callflows["MainHolidays"].id
									},
									module:"callflow"
								};
								strategyData.temporalRules.holidays[val.name] = val;
							});

							self.rebuildMainCallflowRuleArray(strategyData);
							self.updateCallflow(mainCallflow, function(updatedCallflow) {
								strategyData.callflows["MainCallflow"] = updatedCallflow;
								parent.find('.element-content').hide();
								parent.removeClass('open');
								toastr.success('Holidays sucessfully updated.');
							});
						});
					}
				} else {

					monster.ui.confirm('All existing holidays will be permanently deleted. Continue?', function() {
						_.each(strategyData.temporalRules.holidays, function(val, key) {
							holidayRulesRequests[key] = function(callback) {
								monster.request({
									resource: 'strategy.temporalRules.delete',
									data: {
										accountId: self.accountId,
										ruleId: val.id,
										data: {}
									},
									success: function(data, status) {
										delete mainCallflow.flow.children[val.id];
										callback(null, data.data);
									}
								});
							}
						});

						monster.parallel(holidayRulesRequests, function(err, results) {
							strategyData.temporalRules.holidays = {};
							self.rebuildMainCallflowRuleArray(strategyData);
							self.updateCallflow(mainCallflow, function(updatedCallflow) {
								strategyData.callflows["MainCallflow"] = updatedCallflow;
								parent.find('.element-content').hide();
								parent.removeClass('open');
								toastr.success('Holidays sucessfully updated.');
							});
						});
					});
				}
			});
		},

		strategyCallsBindEvents: function(container, strategyData) {
			var self = this;

			container.on('click', '.calls-tabs a', function(e) {
				e.preventDefault();
				$(this).tab('show');
			});

			container.on('click', '.call-option', function(e) {
				monster.ui.prettyCheck.action($(this).find('.radio-div input'), 'check');
			});

			container.on('click', '.menu-div a', function(e) {
				e.preventDefault();
				var parentTab = $(this).parents('.callflow-tab');
				self.showMenuPopup({ 
					strategyData: strategyData,
					name: parentTab.data('callflow') + 'Menu',
					label: container.find('a[href="#'+parentTab.prop('id')+'"]').text()
				});
			});

			container.on('ifChecked', 'input[type="radio"]', function(e) {
				var parentCallOption = $(this).parents('.call-option');

				parentCallOption.siblings().removeClass('active');
				parentCallOption.addClass('active');
			});

			container.on('click', '.save-button', function(e) {
				e.preventDefault();
				var invalidTab = null,
					flows = {};

				$.each(container.find('.callflow-tab'), function() {
					var $this = $(this),
						callflowName = $this.data('callflow'),
						callOption = $this.find('.call-option.active'),
						menu = callOption.find('.menu-div'),
						callEntity = callOption.find('.user-select'),
						voicemail = callOption.find('.voicemail-select')
						flow = {};
					
					if(callEntity.length) {
						var selectedEntity = callEntity.find('option:selected'),
							flowElement = { 
								children: {},
								module: selectedEntity.data('type'),
								data: {}
							}
						switch(flowElement.module) {
							case 'user':
							case 'device':
								flowElement.data.id = selectedEntity.val();
								break;
							case 'ring_group':
								flowElement.data.endpoints = [{
									endpoint_type: "group",
									id: selectedEntity.val()
								}];
								break;
						}

						flow = flowElement;
					}

					if(voicemail.length) {
						var selectedVoicemail = voicemail.find('option:selected'),
							flowElement = {
								children: {},
								module: 'voicemail',
								data: {
									id: selectedVoicemail.val()
								}
							};

						if('children' in flow) {
							flow.children["_"] = flowElement;
						} else {
							flow = flowElement;
						}
					}

					if(menu.length) {
						var menuCallflowName = menu.data('callflow');
						if(!menuCallflowName) {
							invalidTab = this.id;
							return false;
						} else {
							var flowElement = {
								children: {},
								module: 'callflow',
								data: {
									id: strategyData.callflows[menuCallflowName].id
								}
							};

							if('children' in flow) {
								flow.children["_"] = flowElement;
							} else {
								flow = flowElement;
							}
						}
					}

					flows[callflowName] = flow;
				});

				if(invalidTab) {
					monster.ui.alert('You selected a Virtual Receptionist without setting it up. Please set it up by clicking on the Virtual Receptionist link, or choose a different option.');
					container.find('a[href="#'+invalidTab+'"]').tab('show');
				} else {
					var parallelRequests = {};
					_.each(flows, function(val, key) {
						strategyData.callflows[key].flow = val;
						parallelRequests[key] = function(callback) {
							self.updatedCallflow(strategyData.callflows[key], function(updatedCallflow) {
								strategyData.callflows[key] = updatedCallflow;
								callback(null, updatedCallflow);
							});
						}
					});

					monster.parallel(parallelRequests, function(err, results) {
						container.hide();
						container.parents('.element-container').removeClass('open');
						toastr.success('Call strategy sucessfully updated.');
					});
				}
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

		showMenuPopup: function(params, callback) {
			var self = this,
				strategyData = params.strategyData,
				name = params.name,
				label = params.label,
				template, menu, greeting,
				showPopup = function() {
					console.log(menu);
					template = $(monster.template(self, 'strategy-menuPopup', { menu: menu, greeting: greeting }));

					popup = monster.ui.dialog(template, { title: "Virtual Receptionist - "+label});

					var menuLineContainer = template.find('.menu-block .left .content');
					_.each(strategyData.callflows[name].flow.children, function(val, key) {
						menuLineContainer.append(monster.template(self, 'strategy-menuLine', { 
							number: key, 
							callEntities: self.getCallEntitiesDropdownData(strategyData.callEntities),
							selectedId: val.data.id || val.data.endpoints[0].id
						}));
					});

					self.bindMenuPopupEvents(popup, $.extend({
						menu: menu,
						greeting: greeting
					}, params));
				};

			if(name in strategyData.callflows) {
				monster.request({
					resource: 'strategy.menus.get',
					data: {
						accountId: self.accountId,
						menuId: strategyData.callflows[name].flow.data.id
					},
					success: function(data, status) {
						menu = data.data;
						if(menu.media.greeting) {
							monster.request({
								resource: 'strategy.media.get',
								data: {
									accountId: self.accountId,
									mediaId: menu.media.greeting
								},
								success: function(data, status) {
									greeting = data.data;
									showPopup();
								}
							});
						} else {
							showPopup();
						}
					}
				});
			} else {
				monster.request({
					resource: 'strategy.menus.add',
					data: {
						accountId: self.accountId,
						data: {
							name: name,
							record_pin: monster.util.randomString(4, '1234567890'),
							media: {
								exit_media: true,
								invalid_media: true,
								transfer_media: true
							},
							retries: 3,
							max_extension_length: 4,
							type: "main"
						}
					},
					success: function(data, status) {
						menu = data.data;
						monster.request({
							resource: 'strategy.callflows.add',
							data: {
								accountId: self.accountId,
								data: {
									contact_list: {
										exclude: false
									},
									numbers: [name],
									type: "main",
									flow: {
										children: {},
										data: {
											id: menu.id
										},
										module: "menu"
									}
								}
							},
							success: function(data, status) {
								strategyData.callflows[name] = data.data;
								$('.callflow-tab.active .menu-div').data('callflow', name);
								showPopup();
							}
						});
					}
				});
			}
		},

		bindMenuPopupEvents: function(popup, params) {
			var self = this,
				strategyData = params.strategyData,
				callflowName = params.name,
				menu = params.menu,
				greeting = params.greeting,
				container = popup.find('#strategy_menu_popup'),
				ttsGreeting = container.find('#strategy_menu_popup_tts_greeting'),
				uploadGreeting = container.find('#strategy_menu_popup_upload_greeting');

			container.on('click', '.number-text', function(e) {
				var $this = $(this);
				$this.parents('.menu-line').addClass('editing');
				$this.siblings('.number-input').focus();
			});

			container.on('blur', '.number-input', function(e) {
				var $this = $(this);
				$this.parents('.menu-line').removeClass('editing');
				$this.siblings('.number-text').text($this.val() || "?");
			});

			container.on('keyup', '.number-input', function(e) {
				var $this = $(this);
				if(!/^[0-9#*]*$/.test($this.val())) {
					$this.val($this.val().replace(/[^0-9#*]/g, ""));
				}
			});

			container.on('click', '.remove-btn', function(e) {
				$(this).parents('.menu-line').remove();
			});

			container.find('.add-menu-line a').on('click', function(e) {
				e.preventDefault();
				var menuLine = $(monster.template(self, 'strategy-menuLine', { callEntities: self.getCallEntitiesDropdownData(strategyData.callEntities) }));
				container.find('.menu-block .left .content').append(menuLine);
				menuLine.find('.number-input').focus();
			});

			ttsGreeting.find('.update-greeting').on('click', function(e) {
				var text = ttsGreeting.find('textarea').val();
				if(text) {
					if(greeting && greeting.id) {
						greeting.description = "<Text to Speech>";
						greeting.media_source = "tts";
						greeting.tts = {
							voice: "female/en-US",
							text: text
						};
						monster.request({
							resource: 'strategy.media.update',
							data: {
								accountId: self.accountId,
								mediaId: greeting.id,
								data: greeting
							},
							success: function(data, status) {
								greeting = data.data;
								container.find('.greeting-option').removeClass('active');
								ttsGreeting.parents('.greeting-option').addClass('active');
								ttsGreeting.collapse('hide');
							}
						});
					} else {
						monster.request({
							resource: 'strategy.media.create',
							data: {
								accountId: self.accountId,
								data: {
									streamable: true,
									name: callflowName,
									media_source: "tts",
									description: "<Text to Speech>",
									tts: {
										voice: "female/en-US",
										text: text
									}
								}
							},
							success: function(data, status) {
								greeting = data.data;
								menu.media.greeting = data.data.id;
								monster.request({
									resource: 'strategy.menus.update',
									data: {
										accountId: self.accountId,
										menuId: menu.id,
										data: menu
									},
									success: function(data, status) {
										menu = data.data;
									}
								});

								container.find('.greeting-option').removeClass('active');
								ttsGreeting.parents('.greeting-option').addClass('active');
								ttsGreeting.collapse('hide');
							}
						});
					}
				} else {
					monster.ui.alert('You must type in your greeting message to enable Text to Speech functionality.');
				}
			});

			uploadGreeting.find('.update-greeting').on('click', function(e) {
				var fileReader = new FileReader(),
					file = uploadGreeting.find('input[type="file"]')[0].files[0],
					uploadFile = function(file, greetingId, callback) {
						monster.request({
							resource: 'strategy.media.upload',
							data: {
								accountId: self.accountId,
								mediaId: greetingId,
								data: file
							},
							success: function(data, status) {
								callback && callback();
							}
						});
					};

				fileReader.onloadend = function(evt) {
					if(greeting && greeting.id) {
						greeting.description = file.name;
						greeting.media_source = "upload";
						delete greeting.tts;

						monster.request({
							resource: 'strategy.media.update',
							data: {
								accountId: self.accountId,
								mediaId: greeting.id,
								data: greeting
							},
							success: function(data, status) {
								greeting = data.data;
								uploadFile(evt.target.result, data.data.id, function() {
									container.find('.greeting-option').removeClass('active');
									uploadGreeting.parents('.greeting-option').addClass('active');
									uploadGreeting.collapse('hide');
								});
							}
						});
					} else {
						monster.request({
							resource: 'strategy.media.create',
							data: {
								accountId: self.accountId,
								data: {
									streamable: true,
									name: callflowName,
									media_source: "upload",
									description: file.name
								}
							},
							success: function(data, status) {
								greeting = data.data;
								menu.media.greeting = data.data.id;
								monster.request({
									resource: 'strategy.menus.update',
									data: {
										accountId: self.accountId,
										menuId: menu.id,
										data: menu
									},
									success: function(data, status) {
										menu = data.data;
									}
								});

								uploadFile(evt.target.result, data.data.id, function() {
									container.find('.greeting-option').removeClass('active');
									uploadGreeting.parents('.greeting-option').addClass('active');
									uploadGreeting.collapse('hide');
								});
							}
						});
					}
				};

				if(file) {
					fileReader.readAsDataURL(file);
				} else {
					monster.ui.alert('Please select a file to upload');
				}
			});

			container.find('.cancel-link').on('click', function(e) {
				e.preventDefault();
				popup.dialog('close');
			});

			container.find('.save-button').on('click', function(e) {
				var menuElements = {},
					invalidData = false;

				$.each(container.find('.menu-line'), function() {
					var $this = $(this),
						selectedEntity = $this.find('.target-select option:selected'),
						number = $this.find('.number-input').val(),
						entityType = selectedEntity.data('type'),
						entityId = selectedEntity.val();

					if(!number || number in menuElements) {
						invalidData = true;
						return false;
					}

					menuElements[number] = {
						children: {},
						module: entityType,
						data: {}
					}

					switch(entityType) {
						case 'user':
						case 'device':
							menuElements[number].data.id = entityId;
							break;
						case 'ring_group':
							menuElements[number].data.endpoints = [{
								endpoint_type: "group",
								id: entityId
							}];
							break;
					}
				});

				if(invalidData) {
					monster.ui.alert('Numbers within the menu must be unique and non-empty.');
				} else {
					strategyData.callflows[callflowName].flow.children = menuElements;
					self.updateCallflow(strategyData.callflows[callflowName], function(updatedCallflow) {
						strategyData.callflows[callflowName] = updatedCallflow;
					});
					popup.dialog('close');
				}
			});
		},

		getCallEntitiesDropdownData: function(callEntities) {
			var self = this,
				results = [];
			_.each(callEntities, function(value, key) {
				var group = {
					groupName: self.i18n.active().strategy.callEntities[key],
					groupType: key,
					entities: $.map(value, function(entity) {
						return {
							id: entity.id,
							name: entity.name || (entity.first_name + ' ' + entity.last_name)
						};
					})
				};
				if(group.groupType === "user") {
					results.splice(0, 0, group);
				} else {
					results.push(group);
				}
			});

			return results;
		},

		getMainCallflows: function(callback) {
			var self = this;
			monster.request({
				resource: 'strategy.callflows.list',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					var parallelRequests = {};

					_.each(data.data, function(val, key) {
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
					var parallelRequests = {};

					_.each(data.data, function(val, key) {
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
						if(!(val in parallelRequests)) {
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
											start_date: monster.util.dateToGregorian(new Date()),
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

					if(!("MainLunchHours" in parallelRequests)) {
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
										start_date: monster.util.dateToGregorian(new Date()),
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
									temporalRules.holidays[key] = val;
									break;
							}
						});

						callback(temporalRules);
					});
				}
			});
		},

		getCallEntities: function(callback) {
			var self = this;
			monster.parallel(
				{
					user: function(_callback) {
						monster.request({
							resource: 'strategy.users.list',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								_callback(null, data.data);
							}
						});
					},
					ring_group: function(_callback) {
						monster.request({
							resource: 'strategy.groups.list',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								_callback(null, data.data);
							}
						});
					},
					device: function(_callback) {
						monster.request({
							resource: 'strategy.devices.list',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								_callback(null, data.data);
							}
						});
					}
				}, 
				function(err, results) {
					callback(results);
				}
			);
		},

		getVoicesmailBoxes: function(callback) {
			var self = this;
			monster.request({
				resource: 'strategy.voicemails.list',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},

		rebuildMainCallflowRuleArray: function(strategyData) {
			var self = this,
				mainCallflow = strategyData.callflows["MainCallflow"],
				rules = strategyData.temporalRules,
				ruleArray = [];

			_.each(rules.holidays, function(val, key) {
				if(val.id in mainCallflow.flow.children) {
					ruleArray.push(val.id);
				}
			});

			if(rules.lunchbreak.id in mainCallflow.flow.children) {
				ruleArray.push(rules.lunchbreak.id);
			}

			_.each(rules.weekdays, function(val, key) {
				if(val.id in mainCallflow.flow.children) {
					ruleArray.push(val.id);
				}
			});

			mainCallflow.flow.data.rules = ruleArray;
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
