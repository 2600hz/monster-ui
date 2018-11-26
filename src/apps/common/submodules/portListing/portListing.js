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

		appFlags: {
			portListing: {
				isMonsterApp: undefined,
				states: [
					{ value: 'unconfirmed', next: [1, 6] },
					{ value: 'submitted', next: [2, 4, 6] },
					{ value: 'pending', next: [3, 4, 5, 6] },
					{ value: 'scheduled', next: [4, 5, 6] },
					{ value: 'rejected', next: [1, 5, 6] },
					{ value: 'completed', next: [] },
					{ value: 'canceled', next: [] }
				]
			}
		},

		portListingRender: function(args) {
			var self = this,
				modal;

			self.appFlags.portListing.isMonsterApp = _.isBoolean(args.isMonsterApp)
				? args.isMonsterApp
				: false;

			if (self.appFlags.portListing.isMonsterApp) {
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
		},

		portListingRenderListing: function(args) {
			var self = this,
				container = args.container,
				initTemplate = function initTemplate(ports) {
					var template = $(self.getTemplate({
						name: 'listing',
						data: {
							hasPorts: !_.isEmpty(ports)
						},
						submodule: 'portListing'
					}));

					self.portListingRenderListingIncomplete(template, _.assign({}, args, {
						data: ports
					}));

					self.portListingRenderListingSubmitted(template, _.assign({}, args, {
						data: ports
					}));

					self.portListingBindListingEvents(template, _.merge({}, args, {
						data: {
							ports: _.keyBy(ports, 'id')
						}
					}));

					return template;
				};

			monster.ui.insertTemplate(container.find('.listing-section-wrapper'), function(insertTemplateCallback) {
				self.portListingHelperListPorts({
					success: function(ports) {
						insertTemplateCallback(initTemplate(ports));
					}
				});
			});
		},

		portListingRenderListingIncomplete: function(container, args) {
			var self = this,
				initTemplate = function(requests) {
					var template = $(self.getTemplate({
						name: 'listing-incomplete',
						data: {
							isMonsterApp: self.appFlags.portListing.isMonsterApp,
							requests: _
								.chain(requests)
								.filter(function(request) {
									return _.includes(['unconfirmed', 'rejected'], request.state);
								})
								.sortBy('state')
								.value()
						},
						submodule: 'portListing'
					}));

					monster.ui.footable(template.find('#incomplete_ports_listing'), {
						filtering: {
							enabled: false
						}
					});

					return template;
				};

			container
				.find('#incomplete_ports_wrapper')
				.empty()
				.append(initTemplate(args.data));
		},

		portListingRenderListingSubmitted: function(container, args) {
			var self = this,
				initTemplate = function(requests) {
					var template = $(self.getTemplate({
						name: 'listing-submitted',
						data: {
							isMonsterApp: self.appFlags.portListing.isMonsterApp,
							requests: _.filter(requests, function(request) {
								return !_.includes(['unconfirmed', 'rejected'], request.state);
							})
						},
						submodule: 'portListing'
					}));

					monster.ui.footable(template.find('#submitted_ports_listing'));

					template
						.find('#submitted_ports_listing .footable-filtering .form-inline')
							.prepend($(self.getTemplate({
								name: 'listing-customSelect',
								submodule: 'portListing'
							})));

					return template;
				};

			container
				.find('#submitted_ports_wrapper')
				.empty()
				.append(initTemplate(args.data));
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

					self.portListingBindDetailEvents(template, _.assign({}, args, {
						data: {
							portId: portId,
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
				};

			monster.ui.insertTemplate(container, function(insertTemplateCallback) {
				monster.parallel({
					port: function(callback) {
						self.portListingRequestGetPort({
							data: {
								portRequestId: portId
							},
							success: function(portData) {
								callback(null, portData);
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
				}, function(err, results) {
					insertTemplateCallback(initTemplate(results), function() {
						self.portListingScrollToBottomOfTimeline(args);
					});
				});
			}, {
				hasBackground: false
			});
		},

		portListingRenderUpdateStatus: function(args) {
			var self = this,
				states = self.appFlags.portListing.states,
				data = args.data,
				port = data.port,
				stateInfo = _.find(states, { value: port.port_state }),
				template = $(self.getTemplate({
					name: 'updateStatus',
					data: {
						currentState: self.i18n.active().portListing.misc.status[stateInfo.value],
						availableStates: _.map(stateInfo.next, function(index) {
							return {
								value: states[index].value,
								label: self.i18n.active().portListing.misc.status[states[index].value]
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

			monster.ui.chosen($timezoneSelect);

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
							filter = $(this).prop('href').split('#')[1],
							column = self.appFlags.portListing.isMonsterApp
								? [2]
								: [1];

						if (filter === 'all') {
							filtering.removeFilter('byState');
							filtering.removeFilter('byScheduleDate');
						} else if (filter === 'today') {
							filtering.removeFilter('byState');
							filtering.addFilter('byScheduleDate', 'scheduledtoday', column);
						} else {
							filtering.removeFilter('byScheduleDate');
							filtering.addFilter('byState', filter, column);
						}

						filtering.filter();
					});

			template
				.find('.footable')
					.on('click', '.listing-item', function(event) {
						event.preventDefault();
						var portId = $(this).data('id');

						if (args.data.ports[portId].state === 'unconfirmed') {
							monster.pub('common.portWizard.render', _.extend({}, args, {
								data: {
									request: args.data.ports[portId]
								},
								globalCallback: function() {
									self.portListingGlobalCallback(args);
								}
							}));
						} else {
							args.data.port = args.data.ports[portId];

							self.portListingRenderDetail(_.merge(true, {}, args, {
								data: {
									portId: portId
								}
							}));
						}
					});

			template
				.find('.footable')
					.on('click', '.account-ancestors', function(event) {
						event.preventDefault();
						event.stopPropagation();
						var id = $(this).data('id');

						monster.pub('common.accountAncestors.render', {
							accountId: id,
							isMasqueradable: false,
							entity: {
								type: 'account'
							}
						});
					});
		},

		portListingBindDetailEvents: function(template, args) {
			var self = this,
				portId = args.data.portId,
				port = args.data.port,
				textareaWrapper = template.find('.textarea-wrapper'),
				textarea = textareaWrapper.find('textarea[name="comment"]');

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

			textareaWrapper
				.find('#add_comment')
					.on('click', function(event) {
						self.portListingHelperPostComment(event, textarea, args, false);
					});

			if (!monster.util.isSuperDuper()) {
				this.return;
			}

			// Set event handlers for superduper options
			textareaWrapper
				.find('#add_private_comment')
					.on('click', function(event) {
						self.portListingHelperPostComment(event, textarea, args, true);
					});
		},

		portListingBindUpdateStatusEvents: function(dialog, args) {
			var self = this;

			dialog
				.find('#state')
					.on('change', function(event) {
						event.preventDefault();

						var state = event.target.value,
							additionalInfoStates = ['pending', 'scheduled'],
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

						dialog
							.find('.additional-info')
								.toggle(_.includes(additionalInfoStates, state));
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

						var $form = dialog.find('#form_update_status'),
							formData = monster.ui.getFormData('form_update_status'),
							state = formData.state,
							reason = formData.message,
							patchRequestData = {
								portRequestId: args.data.portId,
								state: state,
								data: {}
							};

						monster.ui.validate($form, {
							rules: {
								winning_carrier: {
									required: true
								},
								reference_number: {
									required: true
								}
							}
						});

						if (monster.ui.valid($form)) {
							if (state === 'scheduled') {
								var pickedDate = dialog.find('#scheduled_date').datepicker('getDate'),
									pickedSeconds = dialog.find('#scheduled_time').timepicker('getSecondsFromMidnight'),
									timezone = dialog.find('#scheduled_timezone').val();

								patchRequestData.data.schedule_on = {
									date_time: moment(pickedDate).add(pickedSeconds, 'seconds').format('YYYY-MM-DD HH:mm'),
									timezone: timezone
								};

								patchRequestData.data.winning_carrier = formData.winning_carrier;
								patchRequestData.data.reference_number = formData.reference_number;
							} else if (state === 'pending') {
								patchRequestData.data.winning_carrier = formData.winning_carrier;
								patchRequestData.data.reference_number = formData.reference_number;
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
						}
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

		portListingHelperPostComment: function(event, $textarea, args, isSuperDuperComment) {
			var self = this;

			event.preventDefault();

			var comment = $textarea.val();

			if (_.chain(comment).trim().isEmpty().value()) {
				return;
			}

			self.portListingHelperAddComment(_.merge({}, args, {
				data: {
					comment: comment,
					isSuperDuperComment: isSuperDuperComment
				}
			}));

			$textarea.val('');
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
								content: data.comment,
								superduper_comment: data.isSuperDuperComment
							}
						]
					}
				},
				success: function(comments) {
					var newComment = _.last(comments),
						$lastDay = container.find('.timeline .day:last-child'),
						formattedComment = {
							timestamp: moment(monster.util.gregorianToDate(newComment.timestamp)).valueOf(),
							title: newComment.author,
							content: newComment.content,
							isSuperDuperEntry: newComment.superduper_comment
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
					timestamp: moment(monster.util.gregorianToDate(comment.timestamp)).valueOf(),
					title: comment.author,
					content: comment.content,
					isSuperDuperEntry: comment.superduper_comment
				});
			});

			_.each(statuses, function(status, idx) {
				timeline.push({
					timestamp: moment(monster.util.gregorianToDate(status.timestamp)).valueOf(),
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
					return moment(entry.timestamp).startOf('day').valueOf();
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

		portListingHelperListPorts: function(args) {
			var self = this,
				listAccountPorts = function(callback) {
					self.portListingRequestListPort({
						success: function(ports) {
							callback(null, ports);
						}
					});
				},
				listDescendantsPorts = function(callback) {
					self.portListingRequestListDescendantsPorts({
						success: function(ports) {
							callback(null, ports);
						}
					});
				},
				parallelRequests = [listAccountPorts];

			if (self.appFlags.portListing.isMonsterApp) {
				parallelRequests.push(listDescendantsPorts);
			}

			monster.parallel(parallelRequests, function(err, results) {
				args.success(_
					.chain(results)
					.map(function(payload) {
						return _
							.chain(payload)
							.map(function(account) {
								return _.map(account.port_requests, function(request) {
									return {
										account: {
											id: account.account_id,
											name: account.account_name
										},
										amount: _.size(request.numbers),
										carrier: {
											winning: _.get(request, 'winning_carrier', self.i18n.active().portListing.misc.unknownCarrier),
											losing: _.get(request, 'carrier', self.i18n.active().portListing.misc.unknownCarrier)
										},
										id: request.id,
										name: request.name,
										reference: request.carrier_reference_number,
										state: request.port_state
									};
								});
							})
							.reduce(function(acc, item) {
								return acc.concat(item);
							}, [])
							.value();
					})
					.reduce(function(acc, item) {
						return acc.concat(item);
					}, [])
					.value()
				);
			});
		},

		/**************************************************
		 *              Requests declarations             *
		 **************************************************/

		portListingRequestListPort: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.list',
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

		portListingRequestListDescendantsPorts: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.listDescendants',
				data: _.merge({
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
		}
	};

	return portListing;
});
