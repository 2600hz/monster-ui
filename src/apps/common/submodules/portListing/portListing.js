define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		moment = require('moment'),
		timezone = require('monster-timezone'),
		monster = require('monster');

	var portListing = {

		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'common.portListing.render': 'portListingRender'
		},

		states: [
			{ value: 'unconfirmed', next: [1, 6] },
			{ value: 'submitted', next: [2, 4, 6] },
			{ value: 'pending', next: [3, 4, 5, 6] },
			{ value: 'scheduled', next: [4, 5, 6] },
			{ value: 'rejected', next: [1, 5, 6] },
			{ value: 'completed', next: [] },
			{ value: 'canceled', next: [] }
		],

		portListingRender: function(args) {
			var self = this,
				modal;

			if (args.isMonsterApp) {
				self.portListingRenderLayout(args);
			} else {
				if (args.parent && args.parent.getId()) {
					modal = args.parent;
				} else {
					modal = monster.ui.fullScreenModal(null, {
						inverseBg: true,
						cssContentId: 'port_app_container'
					});
				}

				self.portListingRenderLayout({
					parent: modal,
					container: $('.core-absolute').find('#' + modal.getId() + ' .modal-content'),
					data: args.data
				});
			}
		},

		/**************************************************
		 *               Templates rendering              *
		 **************************************************/

		portListingRenderLayout: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'layout',
					submodule: 'portListing'
				}));

			container
				.empty()
				.append(template);

			self.portListingRenderListing(args);

			if (monster.util.isSuperDuper()) {
				self.portListingRenderAccountFilter(args);
			}
		},

		portListingRenderListing: function(args) {
			var self = this,
				container = args.container,
				initTemplate = function initTemplate(results) {
					var template = $(self.getTemplate({
						name: 'listing',
						data: formatDataToTemplate(results),
						submodule: 'portListing'
					}));

					monster.ui.footable(template.find('#submitted_ports_listing'));

					template
						.find('#submitted_ports_listing .footable-filtering .form-inline')
							.prepend($(self.getTemplate({
								name: 'listing-customSelect',
								submodule: 'portListing'
							})));

					monster.ui.footable(template.find('#unconfirmed_ports_listing'), {
						filtering: {
							enabled: false
						}
					});

					self.portListingBindListingEvents(template, $.extend(true, {}, args, {
						data: {
							ports: _.reduce(results.ports, function(object, port) {
								object[port.id] = port;
								return object;
							}, {})
						}
					}));

					return template;
				},
				formatDataToTemplate = function formatDataToTemplate(results) {
					var undefinedPorts = [],
						allOtherPorts = [],
						transitions = self.portListingFormatLastSubmittedTransitions(results.transitions),
						lastSubmitted;

					_.each(results.ports, function(port) {
						port.extra = {
							numbersAmount: _.keys(port.numbers).length
						};

						// init comments if empty
						if (!port.hasOwnProperty('comments')) {
							port.comments = [];
						}

						// determine if scheduled today for filtering purposes
						if (port.hasOwnProperty('scheduled_at') && !moment(monster.util.gregorianToDate(port.scheduled_at)).startOf('day').diff(moment().startOf('day'))) {
							port.extra.isScheduledToday = true;
						}

						if (transitions.hasOwnProperty(port.id)) {
							lastSubmitted = transitions[port.id];

							port.extra.lastSubmitted = {
								timestamp: lastSubmitted.timestamp,
								submitter: lastSubmitted.authorization.user.first_name + ' ' + lastSubmitted.authorization.user.last_name
							};
						}

						if (port.port_state === 'unconfirmed') {
							undefinedPorts.push(port);
						} else {
							allOtherPorts.push(port);
						}
					});

					return {
						hasPorts: !_.isEmpty(undefinedPorts) || !_.isEmpty(allOtherPorts),
						undefinedPorts: undefinedPorts,
						allOtherPorts: allOtherPorts
					};
				};

			monster.ui.insertTemplate(container.find('.listing-section-wrapper'), function(insertTemplateCallback) {
				monster.parallel({
					ports: function(callback) {
						self.portListingRequestListPort({
							data: args.data,
							success: function(ports) {
								callback(null, ports);
							}
						});
					},
					transitions: function(callback) {
						self.portListingRequestListLastSubmitted({
							data: args.data,
							success: function(transitions) {
								callback(null, transitions);
							}
						});
					}
				}, function(err, results) {
					insertTemplateCallback(initTemplate(results), function() {
						if (monster.util.isSuperDuper()) {
							// Adjusting the layout divs height to always fit the window's size
							$(window).resize(function(e) {
								if ($('#port_app_container').find('.account-list-container').length) {
									var $content = $('#port_app_container'),
										$topbar = $('.core-topbar-wrapper'),
										$accountListContainer = $content.find('.account-list-container'),
										$accountInfo = $content.find('.account-info'),
										$mainContent = $content.find('.listing-section-wrapper'),
										listHeight = this.innerHeight - $accountListContainer.position().top;

									if (args.isMonsterApp) {
										listHeight -= $topbar.outerHeight();
									}

									$accountListContainer.css('height', listHeight + 'px');
									$mainContent.css('height', this.innerHeight - $accountInfo.outerHeight() - $mainContent.position().top + 'px');
								}
							});
							$(window).resize();
						}
					});
				});
			});
		},

		portListingRenderAccountFilter: function(args) {
			var self = this,
				container = args.container,
				requests = [];

			if (args.hasOwnProperty('data') && args.data.hasOwnProperty('accountId')) {
				requests.push(function(callback) {
					self.portListingRequestGetAccount({
						data: {
							accountId: args.data.accountId
						},
						success: function(accountData) {
							callback(null, accountData);
						}
					});
				});
			}

			monster.parallel(requests, function(err, results) {
				var accountName = _.isEmpty(results) ? monster.apps.auth.currentAccount.name : results[0].name;

				container
					.find('.filtering-section-wrapper')
						.append($(self.getTemplate({
							name: 'filtering',
							data: {
								accountName: accountName
							},
							submodule: 'portListing'
						})));

				monster.pub('common.accountBrowser.render', {
					container: container.find('.filtering-section'),
					parentId: args.hasOwnProperty('data') && args.data.hasOwnProperty('accountId') ? args.data.accountId : self.accountId,
					addBackButton: true,
					hideRealm: true,
					onAccountClick: function(accountId, accountName) {
						container
							.find('.account-info .name')
								.fadeOut(function() {
									$(this)
										.text(accountName)
										.fadeIn();
								});

						self.portListingRenderListing($.extend(true, {}, args, {
							data: {
								accountId: accountId
							}
						}));
					}
				});
			});
		},

		portListingRenderDetail: function(args) {
			var self = this,
				container = args.container,
				portId = args.data.portId,
				initTemplate = function initTemplate(results) {
					var template = $(self.getTemplate({
						name: 'detail',
						data: formatDataToTemplate(results),
						submodule: 'portListing'
					}));

					self.portListingBindDetailEvents(template, $.extend(true, {}, args, {
						data: {
							port: results.port
						}
					}));

					return template;
				},
				formatDataToTemplate = function formatDataToTemplate(results) {
					var port = results.port,
						transitions = self.portListingFormatLastSubmittedTransitions(results.transitions),
						lastSubmitted = transitions.hasOwnProperty(portId) ? transitions[portId] : undefined,
						unactionableStatuses = [ 'canceled', 'completed' ];

					port.extra = {
						canComment: unactionableStatuses.indexOf(port.port_state) < 0,
						numbersAmount: _.keys(port.numbers).length,
						timeline: self.portListingGenerateTimeline(results.timeline)
					};

					if (lastSubmitted) {
						port.extra.lastSubmitted = {
							timestamp: lastSubmitted.timestamp,
							submitter: lastSubmitted.authorization.user.first_name + ' ' + lastSubmitted.authorization.user.last_name
						};
					}

					return {
						isUpdatable: unactionableStatuses.indexOf(port.port_state) < 0,
						port: port
					};
				},
				parallelRequests = {
					transitions: function(callback) {
						self.portListingRequestListLastSubmitted({
							data: args.data,
							success: function(transitions) {
								callback(null, transitions);
							}
						});
					},
					timeline: function(callback) {
						self.portListingRequestGetTimeline({
							data: {
								portRequestId: portId
							},
							success: function(timelineData) {
								callback(null, timelineData);
							}
						});
					}
				};

			if (!args.data.hasOwnProperty('port')) {
				parallelRequests.port = function(callback) {
					self.portListingRequestGetPort({
						data: {
							portRequestId: portId
						},
						success: function(portData) {
							callback(null, portData);
						}
					});
				};
			}

			monster.ui.insertTemplate(container, function(insertTemplateCallback) {
				monster.parallel(parallelRequests, function(err, results) {
					insertTemplateCallback(initTemplate($.extend(true, results, {
						port: args.data.port
					})), function() {
						self.portListingScrollToBottomOfTimeline(args);
					});
				});
			}, {
				hasBackground: false
			});
		},

		portListingRenderUpdateStatus: function(args) {
			var self = this,
				data = args.data,
				port = data.port,
				stateInfo = _.find(self.states, function(state) { return state.value === port.port_state; }),
				template = $(self.getTemplate({
					name: 'updateStatus',
					data: {
						currentState: self.i18n.active().portListing.misc.status[stateInfo.value],
						availableStates: _.map(stateInfo.next, function(index) {
							return {
								value: self.states[index].value,
								label: self.i18n.active().portListing.misc.status[self.states[index].value]
							};
						}),
						request: port
					},
					submodule: 'portListing'
				})),
				dialog;

			template
				.find('.dynamic-content')
					.append($(self.getTemplate({
						name: 'updateStatus-default',
						submodule: 'portListing'
					})));

			dialog = monster.ui.dialog(template, {
				title: self.i18n.active().portListing.detail.dialog.title,
				dialogClass: 'port-app-dialog'
			});

			self.portListingBindUpdateStatusEvents(dialog, args);
		},

		portListingRenderUpdateStatusDefault: function(dialog) {
			var self = this;

			dialog
				.find('.dynamic-content')
					.empty()
					.append($(self.getTemplate({
						name: 'updateStatus-default',
						submodule: 'portListing'
					})));
		},

		portListingRenderUpdateStatusScheduled: function(dialog, args) {
			var self = this,
				data = args.data,
				portId = data.portId,
				port = data.ports[portId],
				template = $(self.getTemplate({
					name: 'updateStatus-scheduled',
					submodule: 'portListing'
				})),
				defaultDate = port.hasOwnProperty('scheduled_at') ? monster.util.gregorianToDate(port.scheduled_at) : moment().toDate(),
				$timezoneSelect = template.find('#scheduled_timezone');

			monster.ui.datepicker(template.find('#scheduled_date')).datepicker('setDate', defaultDate);
			monster.ui.timepicker(template.find('#scheduled_time')).timepicker('setTime', defaultDate);

			timezone.populateDropdown($timezoneSelect, monster.apps.auth.currentAccount.timezone);

			$timezoneSelect
				.chosen({
					search_contains: true,
					width: '220px'
				});

			dialog
				.find('.dynamic-content')
					.empty()
					.append(template);
		},

		portListingRenderUpdateStatusRejected: function(dialog) {
			var self = this;

			dialog
				.find('.dynamic-content')
					.empty()
					.append($(self.getTemplate({
						name: 'updateStatus-rejected',
						data: {
							reasons: self.i18n.active().portListing.detail.dialog.reason.list
						},
						submodule: 'portListing'
					})));
		},

		/**************************************************
		 *                 Events bindings                *
		 **************************************************/

		portListingGlobalCallback: function(args) {
			var self = this;

			if (args.isMonsterApp) {
				monster.pub('port.render');
			} else {
				self.portListingRender(args);
			}
		},

		portListingBindListingEvents: function(template, args) {
			var self = this;

			template
				.find('.port-wizard')
					.on('click', function(event) {
						event.preventDefault();

						monster.pub('common.portWizard.render', $.extend(true, args, {
							globalCallback: function() {
								self.portListingGlobalCallback(args);
							}
						}));
					});

			template
				.find('.custom-select li a')
					.on('click', function(event) {
						event.preventDefault();

						var filtering = FooTable.get('#submitted_ports_listing').use(FooTable.Filtering),
							filter = $(this).prop('href').split('#')[1];

						if (filter === 'all') {
							filtering.removeFilter('byState');
							filtering.removeFilter('byScheduleDate');
						} else if (filter === 'today') {
							filtering.removeFilter('byState');
							filtering.addFilter('byScheduleDate', 'scheduledtoday', [1]);
						} else {
							filtering.removeFilter('byScheduleDate');
							filtering.addFilter('byState', filter, [1]);
						}

						filtering.filter();
					});

			template
				.find('#submitted_ports_listing .listing-item')
					.on('click', function(event) {
						event.preventDefault();

						var portId = $(this).data('id');

						self.portListingRenderDetail($.extend(true, {}, args, {
							data: {
								portId: portId,
								port: args.data.ports[portId]
							}
						}));
					});

			template
				.find('#unconfirmed_ports_listing .listing-item')
					.on('click', function(event) {
						event.preventDefault();

						var portId = $(this).data('id');

						monster.pub('common.portWizard.render', _.extend({}, args, {
							data: {
								request: args.data.ports[portId]
							},
							globalCallback: function() {
								self.portListingGlobalCallback(args);
							}
						}));
					});
		},

		portListingBindDetailEvents: function(template, args) {
			var self = this,
				portId = args.data.portId,
				port = args.data.port;

			template
				.find('#back')
					.on('click', function(event) {
						event.preventDefault();

						self.portListingRenderLayout(args);
					});

			template
				.find('#load_wizard')
					.on('click', function(event) {
						event.preventDefault();

						monster.pub('common.portWizard.render', _.extend({}, args, {
							data: {
								request: port
							},
							globalCallback: function() {
								self.portListingGlobalCallback(args);
							}
						}));
					});

			template
				.find('#download_attachments')
					.on('click', function(event) {
						event.preventDefault();

						var serieRequests = [];

						_.each(port.uploads, function(value, key) {
							serieRequests.push(function(callback) {
								self.portListingRequestGetAttachment({
									data: {
										portRequestId: portId,
										documentName: key
									},
									success: function(base64) {
										callback(null, base64);
									}
								});
							});
						});

						monster.series(serieRequests, function(err, results) {
							results.forEach(function(pdfBase64) {
								var file_path = pdfBase64;
								var a = document.createElement('a');
								a.href = file_path;
								a.download = file_path.substr(file_path.lastIndexOf('/') + 1);
								document.body.appendChild(a);
								a.click();
								document.body.removeChild(a);
							});
						});
					});

			template
				.find('#update_status')
					.on('click', function(event) {
						event.preventDefault();

						self.portListingRenderUpdateStatus(args);
					});

			template
				.find('#numbers_search')
					.on('keyup', function(event) {
						event.preventDefault();

						var $numbers = template.find('.numbers-listing li');

						$numbers
							.show();

						if (event.target.value !== '') {
							$numbers
								.not('[data-value*="' + event.target.value + '"]')
									.hide();
						}
					});

			template
				.on('click', '.fix-port-request', function(event) {
					event.preventDefault();

					monster.pub('common.portWizard.render', _.extend({}, args, {
						data: {
							request: args.data.port
						},
						globalCallback: function() {
							self.portListingGlobalCallback(args);
						}
					}));
				});

			template
				.find('#add_comment')
					.on('click', function(event) {
						event.preventDefault();

						var textarea = template.find('textarea[name="comment"]'),
							comment = textarea.val();

						self.portListingHelperAddComment($.extend(true, {}, args, {
							data: {
								comment: comment
							}
						}));

						textarea.val('');
					});
		},

		portListingBindUpdateStatusEvents: function(dialog, args) {
			var self = this;

			dialog
				.find('#state')
					.on('change', function(event) {
						event.preventDefault();

						var state = event.target.value,
							okButton = dialog.find('.update');

						// remove placeholder option
						$(this)
							.find('option[value=""]')
								.remove();

						// handle 'ok' button state
						okButton
							.prop('disabled', false);

						if (dialog.find('.message-input').hasClass('show-input')) {
							dialog
								.find('.message-input')
									.toggleClass('show-link show-input');

							dialog
								.find('.message-input #message')
									.val('');
						}

						if (state === 'scheduled') {
							self.portListingRenderUpdateStatusScheduled(dialog, args);
						} else if (state === 'rejected') {
							okButton
								.prop('disabled', true);

							self.portListingRenderUpdateStatusRejected(dialog);
						} else if (state === 'submitted') {
							self.portListingPopulateReasonField(dialog, state);
						} else {
							self.portListingRenderUpdateStatusDefault(dialog);
						}
					});
			dialog
				.find('#add_message')
					.on('click', function(event) {
						event.preventDefault();

						if (dialog.find('.message-input').hasClass('show-link')) {
							dialog
								.find('.message-input')
									.toggleClass('show-link show-input');
						}
					});

			dialog
				.on('change', '#reason', function(event) {
					event.preventDefault();

					var reason = event.target.value,
						okButton = dialog.find('.update');

					// remove placeholder option
					$(this)
						.find('option[value=""]')
							.remove();

					self.portListingPopulateReasonField(dialog, reason);

					okButton
						.prop('disabled', false);
				});

			dialog
				.find('.update')
					.on('click', function(event) {
						event.preventDefault();

						var state = dialog.find('#state').val(),
							reason = dialog.find('#message').val(),
							patchRequestData = {
								portRequestId: args.data.portId,
								state: state,
								data: {}
							};

						if (state === 'scheduled') {
							var pickedDate = dialog.find('#scheduled_date').datepicker('getDate'),
								pickedSeconds = dialog.find('#scheduled_time').timepicker('getSecondsFromMidnight'),
								timezone = dialog.find('#scheduled_timezone').val();

							patchRequestData.data.schedule_on = {
								date_time: moment(pickedDate).add(pickedSeconds, 'seconds').format('YYYY-MM-DD HH:mm'),
								timezone: timezone
							};
						}

						patchRequestData.reason = reason ? encodeURIComponent(reason) : '';

						self.portListingRequestPatchPortState({
							data: patchRequestData,
							success: function() {
								dialog.dialog('close');

								delete args.data.port;

								self.portListingRenderDetail(args);
							}
						});
					});

			dialog
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						dialog.dialog('close');
					});
		},

		/**************************************************
		 *                   UI helpers                   *
		 **************************************************/

		portListingScrollToBottomOfTimeline: function(args) {
			setTimeout(function() {
				var timelinePanel = args.container.find('.timeline-panel'),
					scrollHeight = timelinePanel.prop('scrollHeight');

				timelinePanel.scrollTop(scrollHeight);
			}, 50);
		},

		portListingPopulateReasonField: function(dialog, message) {
			var self = this,
				reasons = self.i18n.active().portListing.detail.dialog.reason,
				text = reasons.hasOwnProperty(message) ? reasons[message] : reasons.list[message].text;

			dialog
				.find('#message')
					.val(reasons.hasOwnProperty(message) ? text : (reasons.list[message].label + ': ' + text));

			if (dialog.find('.message-input').hasClass('show-link')) {
				dialog
					.find('.message-input')
						.toggleClass('show-link show-input');
			}
		},

		/**************************************************
		 *              Data handling helpers             *
		 **************************************************/

		portListingHelperAddComment: function(args) {
			var self = this,
				data = args.data,
				container = args.container,
				user = monster.apps.auth.currentUser,
				now = moment().toDate(),
				timestampOfDay = moment().startOf('day').valueOf(),
				author = user.first_name + ' ' + user.last_name;

			self.portListingRequestCreateComment({
				data: {
					portRequestId: data.portId,
					data: {
						comments: [
							{
								timestamp: monster.util.dateToGregorian(now),
								author: author,
								content: data.comment
							}
						]
					}
				},
				success: function(comments) {
					var newComment = _.last(comments),
						$lastDay = container.find('.timeline .day:last-child'),
						formattedComment = {
							timestamp: monster.util.gregorianToDate(newComment.timestamp).getTime(),
							title: newComment.author,
							content: newComment.content
						};

					// check if the last entry was created the same day than today
					if ($lastDay.data('timestamp') === timestampOfDay) {
						container
							.find('.timeline .day:last-child .entries')
								.append($(self.getTemplate({
									name: 'timeline-entry',
									data: formattedComment,
									submodule: 'portListing'
								})));
					} else {
						container
							.find('.timeline')
								.append($(self.getTemplate({
									name: 'timeline-day',
									data: {
										timestamp: timestampOfDay,
										entries: [ formattedComment ]
									},
									submodule: 'portListing'
								})));
					}

					self.portListingScrollToBottomOfTimeline(args);
				}
			});
		},

		portListingFormatToTimeline: function(entries) {
			var self = this,
				comments = entries.filter(function(entry) { return entry.hasOwnProperty('author'); }),
				statuses = entries.filter(function(entry) { return entry.hasOwnProperty('transition') && entry.transition.new !== 'unconfirmed'; }),
				timeline = [];

			_.each(comments, function(comment) {
				timeline.push({
					timestamp: monster.util.gregorianToDate(comment.timestamp).getTime(),
					title: comment.author,
					content: comment.content
				});
			});

			_.each(statuses, function(status, idx) {
				timeline.push({
					timestamp: monster.util.gregorianToDate(status.timestamp).getTime(),
					// do not show the `Action Required` text if the status is rejected by not the most recent
					title: self.i18n.active().portListing.misc[(statuses.length - 1 !== idx) && status.transition.new === 'rejected' ? 'alternateStatus' : 'status'][status.transition.new],
					content: status.reason,
					status: status.transition.new,
					// show fix button if the last status is rejected, this is the cause of filter() & double each()
					needFix: (statuses.length - 1 === idx) && status.transition.new === 'rejected'
				});
			});

			return _.sortBy(timeline, 'timestamp');
		},

		portListingGenerateTimeline: function(entries) {
			var self = this,
				formattedEntries = self.portListingFormatToTimeline(entries),
				entriesByDays = _.groupBy(formattedEntries, function(entry) {
					// group entries by calendar days
					return moment(entry.timestampOfDay).startOf('day').valueOf();
				}),
				timeline = _.chain(entriesByDays).keys().map(function(timestamp) {
					// switch to array structure for sortability purposes
					return {
						timestamp: parseInt(timestamp),
						entries: _.sortBy(entriesByDays[timestamp], 'timestamp')
					};
				}).sortBy('timestamp').value();

			return timeline;
		},

		portListingFormatLastSubmittedTransitions: function(transitions) {
			var self = this;

			return transitions.reduce(function(object, port) {
				object[port.id] = port.transition;
				return object;
			}, {});
		},

		portListingFormat2Digits: function(number) {
			if (typeof number === 'string') {
				number = parseInt(number);
			}

			return number < 10 ? '0'.concat(number) : number;
		},

		/**************************************************
		 *              Requests declarations             *
		 **************************************************/

		portListingRequestListPort: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.list',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					var requests = _.isEmpty(data.data) ? [] : data.data[0].port_requests;

					args.hasOwnProperty('success') && args.success(requests);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		portListingRequestGetPort: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.get',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		portListingRequestPatchPortState: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.changeState',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		portListingRequestGetAttachment: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.getAttachment',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(pdfBase64, status) {
					args.hasOwnProperty('success') && args.success(pdfBase64);
				},
				error: function(parsedError, error, globalHandler) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		portListingRequestCreateComment: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.addComment',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data.comments);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		portListingRequestGetTimeline: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.getTimeline',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		portListingRequestListLastSubmitted: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.listLastSubmitted',
				data: $.extend(true, {
					accountId: self.accountId,
					filters: {
						paginate: false
					}
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		portListingRequestGetAccount: function(args) {
			var self = this;

			self.callApi({
				resource: 'account.get',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		}
	};

	return portListing;
});
