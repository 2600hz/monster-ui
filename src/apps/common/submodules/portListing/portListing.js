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
				parent: undefined,
				container: undefined,
				isMonsterApp: undefined,
				accountNames: {},
				portRequest: {},
				portRequests: [],
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

		/**
		 * @param  {Boolean} args.isMonsterApp
		 * @param  {jQuery} args.parent
		 * @param  {jQuery} [args.container]
		 */
		portListingRender: function(args) {
			var self = this;

			self.appFlags.portListing.isMonsterApp = _.isBoolean(args.isMonsterApp)
				? args.isMonsterApp
				: false;

			if (self.appFlags.portListing.isMonsterApp) {
				self.appFlags.portListing.parent = args.parent;
				self.appFlags.portListing.container = args.container;
			} else {
				self.appFlags.portListing.parent = _.has(args, 'parent.getId')
					? args.parent
					: monster.ui.fullScreenModal(null, {
						inverseBg: true,
						cssContentId: 'port_app_container'
					});
				self.appFlags.portListing.container = $('.core-absolute').find(
					'#'
					+ self.appFlags.portListing.parent.getId()
					+ ' .modal-content'
				);
			}

			self.portListingRenderLayout();
		},

		/**************************************************
		 *               Templates rendering              *
		 **************************************************/

		portListingRenderLayout: function() {
			var self = this,
				container = self.appFlags.portListing.container,
				template = $(self.getTemplate({
					name: 'layout',
					submodule: 'portListing'
				}));

			container
				.empty()
				.append(template);

			self.portListingRenderListing();
		},

		portListingRenderListing: function() {
			var self = this,
				container = self.appFlags.portListing.container.find('.listing-section-wrapper'),
				initTemplate = function initTemplate(portRequests) {
					var formatedPortRequests = formatDataToTemplate(portRequests),
						template = $(self.getTemplate({
							name: 'listing',
							data: {
								hasPorts: !_.isEmpty(formatedPortRequests)
							},
							submodule: 'portListing'
						}));

					self.portListingRenderListingIncomplete({
						template: template,
						portRequests: formatedPortRequests
					});
					self.portListingRenderListingSubmitted({
						template: template,
						portRequests: formatedPortRequests
					});
					self.portListingBindListingEvents({
						template: template
					});

					return template;
				},
				formatDataToTemplate = function formatDataToTemplate(portRequests) {
					return _.map(portRequests, function(request) {
						return {
							account: {
								id: request.account_id,
								name: self.appFlags.portListing.accountNames[request.account_id]
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
				};

			monster.ui.insertTemplate(container, function(insertTemplateCallback) {
				self.portListingHelperListPorts({
					success: function(portRequests) {
						insertTemplateCallback(initTemplate(portRequests));
					}
				});
			});
		},

		/**
		 * @param  {jQuery} args.template
		 * @param  {Array} args.portRequests
		 */
		portListingRenderListingIncomplete: function(args) {
			var self = this,
				container = args.template,
				portRequests = args.portRequests,
				initTemplate = function(portRequests) {
					var template = $(self.getTemplate({
						name: 'listing-incomplete',
						data: {
							isMonsterApp: self.appFlags.portListing.isMonsterApp,
							requests: _
								.chain(portRequests)
								.filter(function(portRequest) {
									return _.includes(['unconfirmed', 'rejected'], portRequest.state);
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
				.append(initTemplate(portRequests));
		},

		/**
		 * @param  {jQuery} args.template
		 * @param  {Array} args.portRequests
		 */
		portListingRenderListingSubmitted: function(args) {
			var self = this,
				container = args.template,
				portRequests = args.portRequests,
				initTemplate = function(portRequests) {
					var template = $(self.getTemplate({
						name: 'listing-submitted',
						data: {
							isMonsterApp: self.appFlags.portListing.isMonsterApp,
							requests: _.filter(portRequests, function(portRequest) {
								return !_.includes(['unconfirmed', 'rejected'], portRequest.state);
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
				.append(initTemplate(portRequests));
		},

		/**
		 * @param  {String} args.portRequestId
		 */
		portListingRenderDetail: function(args) {
			var self = this,
				container = self.appFlags.portListing.container,
				portRequestId = args.portRequestId,
				initTemplate = function initTemplate(results) {
					var template = $(self.getTemplate({
						name: 'detail',
						data: formatDataToTemplate(results),
						submodule: 'portListing'
					}));

					self.portListingBindDetailEvents({
						template: template
					});

					return template;
				},
				formatDataToTemplate = function formatDataToTemplate(results) {
					var portRequest = results.portRequest,
						lastSubmitted = _
							.chain(results.transitions)
							.find({ id: portRequestId })
							.get('transition', undefined)
							.value(),
						unactionableStatuses = [ 'canceled', 'completed' ];

					return {
						isUpdatable: !_.includes(unactionableStatuses, portRequest.port_state),
						port: _.merge({}, portRequest, {
							extra: {
								canComment: !_.includes(unactionableStatuses, portRequest.port_state),
								numbersAmount: _.size(portRequest.numbers),
								timeline: self.portListingFormatEntriesToTimeline(results.timeline),
								lastSubmitted: _.isUndefined(lastSubmitted)
									? undefined
									: {
										timestamp: lastSubmitted.timestamp,
										submitter: lastSubmitted.authorization.user.first_name
											+ ' '
											+ lastSubmitted.authorization.user.last_name
									}
							}
						})
					};
				};

			self.appFlags.portListing.accountId = self.appFlags.portListing.portRequests[portRequestId].accountId;
			self.appFlags.portListing.portRequest = {};

			monster.ui.insertTemplate(container, function(insertTemplateCallback) {
				monster.parallel({
					portRequest: function(callback) {
						self.portListingRequestGetPort({
							data: {
								accountId: self.appFlags.portListing.accountId,
								portRequestId: portRequestId
							},
							success: function(portData) {
								callback(null, portData);
							}
						});
					},
					transitions: function(callback) {
						self.portListingRequestListLastSubmitted({
							data: {
								accountId: self.appFlags.portListing.accountId
							},
							success: function(transitions) {
								callback(null, transitions);
							}
						});
					},
					timeline: function(callback) {
						self.portListingRequestGetTimeline({
							data: {
								accountId: self.appFlags.portListing.accountId,
								portRequestId: portRequestId
							},
							success: function(timelineData) {
								callback(null, timelineData);
							}
						});
					}
				}, function(err, results) {
					self.appFlags.portListing.portRequest = results.portRequest;

					insertTemplateCallback(initTemplate(results), undefined, function() {
						self.portListingScrollToBottomOfTimeline();
					});
				});
			}, {
				hasBackground: false
			});
		},

		portListingRenderUpdateStatus: function() {
			var self = this,
				portRequest = self.appFlags.portListing.portRequest,
				states = self.appFlags.portListing.states,
				stateInfo = _.find(states, { value: portRequest.port_state }),
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
						request: portRequest
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

			self.portListingBindUpdateStatusEvents({
				dialog: dialog
			});
		},

		/**
		 * @param  {jQuery} args.dialog
		 */
		portListingRenderUpdateStatusDefault: function(args) {
			var self = this,
				dialog = args.dialog;

			dialog
				.find('.dynamic-content')
					.empty()
					.append($(self.getTemplate({
						name: 'updateStatus-default',
						submodule: 'portListing'
					})));
		},

		/**
		 * @param  {jQuery} args.dialog
		 */
		portListingRenderUpdateStatusScheduled: function(args) {
			var self = this,
				dialog = args.dialog,
				portRequest = self.appFlags.portListing.portRequest,
				template = $(self.getTemplate({
					name: 'updateStatus-scheduled',
					submodule: 'portListing'
				})),
				defaultDate = portRequest.hasOwnProperty('scheduled_at')
					? monster.util.gregorianToDate(portRequest.scheduled_at)
					: moment().toDate(),
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

		/**
		 * @param  {jQuery} args.dialog
		 */
		portListingRenderUpdateStatusRejected: function(args) {
			var self = this,
				dialog = args.dialog;

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

		portListingGlobalCallback: function() {
			var self = this;

			if (self.appFlags.portListing.isMonsterApp) {
				monster.pub('port.render');
			} else {
				self.portListingRenderLayout();
			}
		},

		/**
		 * @param  {jQuery} args.template
		 */
		portListingBindListingEvents: function(args) {
			var self = this,
				template = args.template;

			template
				.find('.port-wizard')
					.on('click', function(event) {
						event.preventDefault();

						monster.pub('common.portWizard.render', {
							container: self.appFlags.portListing.container,
							data: {
								accountId: self.accountId
							},
							globalCallback: function() {
								self.portListingGlobalCallback();
							}
						});
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
						var portRequestId = $(this).data('id'),
							portRequest = self.appFlags.portListing.portRequests[portRequestId];

						if (portRequest.port_state === 'unconfirmed') {
							monster.pub('common.portWizard.render', {
								container: self.appFlags.portListing.container,
								data: {
									accountId: portRequest.account_id,
									request: portRequest
								},
								globalCallback: function() {
									self.portListingGlobalCallback();
								}
							});
						} else {
							self.portListingRenderDetail({
								portRequestId: portRequestId
							});
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

		/**
		 * @param  {jQuery} args.template
		 */
		portListingBindDetailEvents: function(args) {
			var self = this,
				template = args.template,
				accountId = self.appFlags.portListing.accountId,
				portRequest = self.appFlags.portListing.portRequest,
				portRequestId = portRequest.id,
				textareaWrapper = template.find('.textarea-wrapper'),
				textarea = textareaWrapper.find('textarea[name="comment"]');

			template
				.find('#back')
					.on('click', function(event) {
						event.preventDefault();

						self.portListingRenderLayout();
					});

			template
				.find('#load_wizard')
					.on('click', function(event) {
						event.preventDefault();

						monster.pub('common.portWizard.render', {
							container: self.appFlags.portListing.container,
							data: {
								accountId: accountId,
								request: portRequest
							},
							globalCallback: function() {
								self.portListingGlobalCallback();
							}
						});
					});

			template
				.find('#download_attachments')
					.on('click', function(event) {
						event.preventDefault();

						monster.series(_.map(portRequest.uploads, function(value, key) {
							return function(callback) {
								self.portListingRequestGetAttachment({
									data: {
										portRequestId: portRequestId,
										documentName: key
									},
									success: function(base64) {
										callback(null, base64);
									}
								});
							};
						}), function(err, results) {
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

						self.portListingRenderUpdateStatus();
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

					monster.pub('common.portWizard.render', {
						container: self.appFlags.portListing.container,
						data: {
							accountId: accountId,
							request: portRequest
						},
						globalCallback: function() {
							self.portListingGlobalCallback();
						}
					});
				});

			textareaWrapper
				.find('#add_comment')
					.on('click', function(event) {
						event.preventDefault();
						self.portListingHelperPostComment({
							portRequestId: portRequestId,
							commentInput: textarea
						});
					});

			if (monster.util.isSuperDuper()) {
				// Set event handlers for superduper options
				textareaWrapper
					.find('#add_private_comment')
						.on('click', function(event) {
							event.preventDefault();
							self.portListingHelperPostComment({
								portRequestId: portRequestId,
								commentInput: textarea,
								isSuperDuperComment: true
							});
						});
			}
		},

		/**
		 * @param  {jQuery} args.dialog
		 */
		portListingBindUpdateStatusEvents: function(args) {
			var self = this,
				dialog = args.dialog,
				portRequest = self.appFlags.portListing.portRequest,
				portRequestId = portRequest.id;

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
							self.portListingRenderUpdateStatusScheduled({
								dialog: dialog
							});
						} else if (state === 'rejected') {
							okButton
								.prop('disabled', true);

							self.portListingRenderUpdateStatusRejected({
								dialog: dialog
							});
						} else if (state === 'submitted') {
							self.portListingPopulateReasonField({
								dialog: dialog,
								reason: state
							});
						} else {
							self.portListingRenderUpdateStatusDefault({
								dialog: dialog
							});
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

					self.portListingPopulateReasonField({
						dialog: dialog,
						reason: reason
					});

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
								portRequestId: portRequestId,
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

									self.portListingRenderDetail({
										portRequestId: portRequestId
									});
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

		portListingScrollToBottomOfTimeline: function() {
			var self = this,
				container = self.appFlags.portListing.container,
				timelinePanel = container.find('.timeline-panel'),
				scrollHeight = timelinePanel.prop('scrollHeight');

			timelinePanel.animate({
				scrollTop: scrollHeight
			}, 150);
		},

		/**
		 * @param  {jQuery} args.dialog
		 * @param  {String} args.reason
		 */
		portListingPopulateReasonField: function(args) {
			var self = this,
				dialog = args.dialog,
				reason = args.reason,
				i18nReasons = self.i18n.active().portListing.detail.dialog.reason,
				i18nReason = _.get(i18nReasons, reason, i18nReasons.list[reason]),
				message = _.isObject(i18nReason)
					? i18nReason.label + ': ' + i18nReason.text
					: i18nReason;

			dialog
				.find('#message')
					.val(message);

			if (dialog.find('.message-input').hasClass('show-link')) {
				dialog
					.find('.message-input')
						.toggleClass('show-link show-input');
			}
		},

		/**
		 * @param  {jQuery}  args.commentInput
		 * @param  {Boolean} [args.isSuperDuperComment]
		 */
		portListingHelperPostComment: function(args) {
			var self = this,
				commentInput = args.commentInput,
				comment = commentInput.val(),
				isSuperDuperComment = _.get(args, 'isSuperDuperComment', false);

			if (_.chain(comment).trim().isEmpty().value()) {
				return;
			}
			commentInput.val('');

			self.portListingHelperAddComment({
				comment: comment,
				isSuperDuperComment: isSuperDuperComment
			});
		},

		/**************************************************
		 *              Data handling helpers             *
		 **************************************************/

		/**
		 * @param  {String} args.comment
		 * @param  {Boolean} args.isSuperDuperComment
		 */
		portListingHelperAddComment: function(args) {
			var self = this,
				comment = args.comment,
				isSuperDuperComment = args.isSuperDuperComment,
				container = self.appFlags.portListing.container,
				user = monster.apps.auth.currentUser,
				now = moment().toDate(),
				timestampOfDay = moment(now).startOf('day').valueOf(),
				author = user.first_name + ' ' + user.last_name;

			self.portListingRequestCreateComment({
				data: {
					portRequestId: self.appFlags.portListing.portRequest.id,
					data: {
						comments: [
							{
								timestamp: monster.util.dateToGregorian(now),
								author: author,
								content: comment,
								superduper_comment: isSuperDuperComment
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

					// check if the last entry was created on the same day than today
					if ($lastDay.data('timestamp') !== timestampOfDay) {
						container
							.find('.timeline')
								.append($(self.getTemplate({
									name: 'timeline-day',
									data: {
										timestamp: timestampOfDay
									},
									submodule: 'portListing'
								})));
					}

					container
						.find('.timeline .day:last-child .entries')
							.append($(self.getTemplate({
								name: 'timeline-entry',
								data: formattedComment,
								submodule: 'portListing'
							})));

					self.portListingScrollToBottomOfTimeline();
				}
			});
		},

		/**
		 * @param  {Array} entries
		 * @return {Array}
		 *
		 * The double filter() & map() is required because we need to know if
		 * the state of the LAST transition is "rejected", so we need an array
		 * of transitions only.
		 */
		portListingFormatEntriesToTimeline: function(entries) {
			var self = this,
				isLastAndRejected = function(transition, idx, transitions) {
					return transitions.length - 1 === idx && transition.transition.new === 'rejected';
				};

			return _
				.chain([
					_.chain(entries)
						.filter('author')
						.map(function(comment) {
							return {
								content: comment.content,
								isSuperDuperEntry: _.get(comment, 'superduper_comment', false),
								timestamp: moment(monster.util.gregorianToDate(comment.timestamp)).valueOf(),
								title: comment.author
							};
						})
						.value(),
					_.chain(entries)
						.reject(function(entry) {
							return _.has(entry, 'author') || _.get(entry, 'transition.new', 'unconfirmed') === 'unconfirmed';
						})
						.map(function(transition, idx, array) {
							return {
								content: _.get(transition, 'reason', undefined),
								// show fix button if the last transition's status is "rejected"
								needFix: isLastAndRejected(transition, idx, array),
								status: transition.transition.new,
								timestamp: moment(monster.util.gregorianToDate(transition.timestamp)).valueOf(),
								// only show the "Action Required" text if the last transition's status is "rejected"
								title: self.i18n.active().portListing.misc[isLastAndRejected(transition, idx, array) ? 'alternateStatus' : 'status'][transition.transition.new]
							};
						})
						.value()
				])
				.reduce(function(acc, item) {
					return acc.concat(item);
				}, [])
				.groupBy(function(entry) {
					return moment(entry.timestamp).startOf('day').valueOf();
				})
				.map(function(entries, timestamp) {
					return {
						entries: _.sortBy(entries, 'timestamp'),
						timestamp: _.parseInt(timestamp)
					};
				})
				.sortBy('timestamp')
				.value();
		},

		/**
		 * @param  {Function} args.success
		 */
		portListingHelperListPorts: function(args) {
			var self = this,
				listAccountPorts = function(callback) {
					self.portListingRequestListPort({
						data: {
							filters: {
								paginate: false
							}
						},
						success: function(ports) {
							callback(null, ports);
						}
					});
				},
				listDescendantsPorts = function(callback) {
					self.portListingRequestListDescendantsPorts({
						data: {
							filters: {
								paginate: false
							}
						},
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
				var portRequests = _
					.chain(results)
					.map(function(payload) {
						return _
							.chain(payload)
							.map(function(account) {
								return account.port_requests;
							})
							.reduce(function(acc, item) {
								return acc.concat(item);
							}, [])
							.value();
					})
					.reduce(function(acc, item) {
						return acc.concat(item);
					}, [])
					.value();

				self.appFlags.portListing.accountNames = _
					.chain(results)
					.map(function(payload) {
						return _.map(payload, function(account) {
							return {
								id: account.account_id,
								name: account.account_name
							};
						});
					})
					.reduce(function(acc, item) {
						return acc.concat(item);
					}, [])
					.transform(function(object, account) {
						object[account.id] = account.name;
					}, {})
					.value();
				self.appFlags.portListing.portRequests = _.keyBy(portRequests, 'id');

				args.success(portRequests);
			});
		},

		/**************************************************
		 *              Requests declarations             *
		 **************************************************/

		/**
		 * @param  {Function} args.success
		 * @param  {Function} [args.error]
		 */
		portListingRequestListPort: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.list',
				data: _.merge({
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

		/**
		 * @param  {Function} args.success
		 */
		portListingRequestListDescendantsPorts: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.listDescendants',
				data: _.merge({
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

		/**
		 * @param  {Function} args.success
		 * @param  {String} args.data.portRequestId
		 */
		portListingRequestGetPort: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.get',
				data: _.merge({
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

		/**
		 * @param  {Function} args.success
		 * @param  {String} args.data.portRequestId
		 * @param  {String} args.data.state
		 * @param  {Object} args.data.data
		 */
		portListingRequestPatchPortState: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.changeState',
				data: _.merge({
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

		/**
		 * @param  {Function} args.success
		 * @param  {String} args.data.portRequestId
		 * @param  {String} args.data.documentName
		 */
		portListingRequestGetAttachment: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.getAttachment',
				data: _.merge({
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

		/**
		 * @param  {Function} args.success
		 * @param  {String} args.data.portRequestId
		 * @param  {Array} args.data.data.comments
		 */
		portListingRequestCreateComment: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.addComment',
				data: _.merge({
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

		/**
		 * @param  {Function} args.success
		 * @param  {String} args.data.portRequestId
		 */
		portListingRequestGetTimeline: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.getTimeline',
				data: _.merge({
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

		/**
		 * @param  {Function} args.success
		 */
		portListingRequestListLastSubmitted: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.listLastSubmitted',
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
		}
	};

	return portListing;
});
