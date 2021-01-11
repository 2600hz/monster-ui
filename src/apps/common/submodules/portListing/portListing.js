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
				states: [
					{ value: 'unconfirmed', next: [1, 6] },
					{ value: 'submitted', next: [2, 4, 6] },
					{ value: 'pending', next: [3, 4, 5, 6] },
					{ value: 'scheduled', next: [4, 5, 6] },
					{ value: 'rejected', next: [1, 5, 6] },
					{ value: 'completed', next: [] },
					{ value: 'canceled', next: [] }
				],
				tabs: ['account', 'agent', 'descendants'],
				subtabs: ['suspended', 'progressing', 'completed'],
				range: 'monthly'
			}
		},

		/**
		 * Store getter
		 * @param  {Array|String} [path]
		 * @param  {*} [defaultValue]
		 * @return {*}
		 */
		portListingGet: function(path, defaultValue) {
			var self = this,
				store = ['_store', 'portListing'];
			return _.get(
				self,
				_.isUndefined(path)
					? store
					: _.flatten([store, _.isString(path) ? path.split('.') : path]),
				defaultValue
			);
		},

		/**
		 * Store setter
		 * @param  {Array|String} [path]
		 * @param  {*} [value]
		 */
		portListingSet: function(path, value) {
			var self = this,
				hasValue = _.toArray(arguments).length === 2,
				store = ['_store', 'portListing'];
			_.set(
				self,
				hasValue
					? _.flatten([store, _.isString(path) ? path.split('.') : path])
					: store,
				hasValue ? value : path
			);
		},

		/**
		 * Check if the user is masquerading or is not a reseller
		 */
		portListingCheckProfile: function() {
			return monster.util.isMasquerading() || !monster.util.isReseller();
		},

		/**
		 * @param {String} type
		 */
		portListingIsTypeCompleted: function(type) {
			return type === 'completed';
		},

		/**
		 * @param  {Boolean} args.isMonsterApp
		 * @param  {jQuery} [args.parent]
		 * @param  {String} [args.data.accountId]
		 */
		portListingRender: function(args) {
			var self = this,
				accountId = _.get(args, 'data.accountId', self.accountId),
				isMonsterApp = !!_.get(args, 'isMonsterApp', false),
				subTabs = _.map(self.appFlags.portListing.subtabs, function(tab) {
					return {
						text: self.i18n.active().portListing.tabs[tab],
						id: tab,
						callback: function(args) {
							self.portListingRenderListing(_.merge(args, { type: tab }));
						}
					};
				}),
				tabs = _
					.chain(self.appFlags.portListing.tabs)
					.reject(function(tab) {
						return tab === 'agent' && !monster.util.isSuperDuper() && _.get(monster.config.whitelabel, 'port.authority') !== self.accountId;
					})
					.map(function(tab) {
						return {
							text: self.i18n.active().portListing.tabs[tab],
							id: tab,
							menus: [{
								tabs: subTabs
							}]
						};
					})
					.value(),
				container,
				parent;

			if (isMonsterApp) {
				container = args.parent;
			} else {
				parent = _.has(args, 'parent.getId')
					? args.parent
					: monster.ui.fullScreenModal(null, {
						inverseBg: true,
						cssContentId: 'port_app_container'
					});
				container = $('.core-absolute').find('#' + parent.getId() + ' .modal-content');
			}

			self.portListingSet('isMonsterApp', isMonsterApp);
			self.portListingSet('accountId', accountId);
			self.portListingSet('parent', parent);
			self.portListingSet('container', container);

			monster.ui.generateAppLayout(_.merge({}, self, { name: 'port' }), {
				layout: 'docked',
				parent: container,
				menus: [
					{
						tabs: self.portListingCheckProfile() ? subTabs : tabs
					}
				]
			});
		},

		/**************************************************
		 *               Templates rendering              *
		 **************************************************/
		portListingRenderListing: function(args) {
			var self = this,
				type = args.type,
				tab = self.portListingGet('container').find('nav.app-navbar a.active').data('id'),
				type = self.portListingCheckProfile() ? (tab || type) : type,
				template = $(self.getTemplate({
					name: 'listing',
					data: {
						type: self.portListingIsTypeCompleted(type)
					},
					submodule: 'portListing'
				}));

			self.portListingSet('accountNamesById', {});
			self.portListingSet('portRequest', {});
			self.portListingSet('portRequestsById', {});
			self.portListingSet('type', type);
			self.portListingSet('tab', tab);

			self.portListingRenderTableList({
				template: template,
				tab: tab,
				type: type
			});

			self.portListingBindListingEvents({
				template: template
			});

			args.container.empty().html(template).show();
		},

		/**
		 * @param {Object} args.template
		 * @param {String} args.type
		 * @param {String} args.portRequests
		 */
		portListingRenderTableList: function(args) {
			var self = this,
				type = args.type,
				template = args.template,
				tab = args.tab,
				templateList = $(self.getTemplate({
					name: 'ports-listing',
					data: {
						isMonsterApp: self.portListingGet('isMonsterApp'),
						type: type
					},
					submodule: 'portListing'
				})),
				templateEmpty = $(self.getTemplate({
					name: 'ports-listing-empty',
					data: {},
					submodule: 'portListing'
				}));

			monster.ui.footable(templateList.find('#ports_listing'), {
				getData: function(filters, callback) {
					self.portListingGenericRows({
						tab: tab,
						type: type,
						isMonsterApp: self.portListingGet('isMonsterApp'),
						fromDate: args.fromDate,
						toDate: args.toDate,
						callback: callback
					});
				},
				backendPagination: {
					enabled: self.portListingIsTypeCompleted(type),
					allowLoadAll: false
				},
				afterInitialized: function() {
					if (self.portListingGet('hasPorts')) {
						template.find('#ports_listing_wrapper').empty().append(templateList);
					} else {
						template.find('.port-top-button').hide();
						template.find('#ports_listing_wrapper').empty().append(templateEmpty);
					}

					self.portListingBindTableEvents({
						template: args.template
					});
				}
			});
		},

		/**
		 * @param {Object} args
		 * @param {String} args.tab
		 * @param {String} args.type
		 * @param {Object} args.fromDate
		 * @param {Object} args.toDate
		 * @param {Boolean} args.isMonsterApp
		 * @param {Function} args.callback
		 */
		portListingGenericRows: function(args) {
			var self = this,
				tab = args.tab,
				type = args.type,
				fromDate = args.fromDate,
				toDate = args.toDate,
				isMonsterApp = args.isMonsterApp,
				callback = args.callback;

			self.portListingHelperListPorts({
				tab: tab,
				type: type,
				fromDate: fromDate,
				toDate: toDate,
				success: function(data) {
					var requests = data.data,
						hasPorts = !_.isEmpty(requests),
						$rows = $(self.getTemplate({
							name: 'generic-rows',
							data: {
								isMonsterApp: isMonsterApp,
								type: type,
								hasPorts: hasPorts,
								requests: _.sortBy(self.portListingFormatDataToTemplate(requests), 'state')
							},
							submodule: 'portListing'
						}));

					self.portListingSet('hasPorts', hasPorts);

					callback && callback($rows, data);
				}
			});
		},

		/**
		 * @param  {String} args.portRequestId
		 */
		portListingRenderDetail: function(args) {
			var self = this,
				container = self.portListingGet('container'),
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
							.get('transition')
							.value(),
						numbers = _.get(
							portRequest,
							'_read_only.ported_numbers',
							_.get(portRequest, 'numbers')
						),
						unactionableStatuses = ['canceled', 'completed'],
						isAgent = self.portListingUtilIsAgent(_.get(portRequest, '_read_only.port_authority')),
						isUpdateable = !_.includes(unactionableStatuses, portRequest.port_state);

					return _.merge({
						isAgent: isAgent,
						canUpdate: isAgent && isUpdateable,
						canRequireAction: isUpdateable,
						lastSubmitted: _.isUndefined(lastSubmitted)
							? undefined
							: {
								timestamp: lastSubmitted.timestamp,
								submitter: monster.util.getUserFullName(lastSubmitted.authorization.user)
							},
						numbers: numbers,
						numbersAmount: _.size(numbers),
						timeline: self.portListingFormatEntriesToTimeline(results.timeline)
					}, _.pick(portRequest, [
						'carrier',
						'name',
						'port_state',
						'reference_number',
						'scheduled_date',
						'winning_carrier'
					]));
				};

			self.portListingSet('accountId', self.portListingGet(['portRequestsById', portRequestId]).account_id);

			monster.ui.insertTemplate(container, function(insertTemplateCallback) {
				monster.parallel({
					portRequest: function(callback) {
						self.portListingRequestGetPort({
							data: {
								accountId: self.portListingGet('accountId'),
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
								accountId: self.portListingGet('accountId')
							},
							success: function(transitions) {
								callback(null, transitions);
							}
						});
					},
					timeline: function(callback) {
						self.portListingRequestGetTimeline({
							data: {
								accountId: self.portListingGet('accountId'),
								portRequestId: portRequestId
							},
							success: function(timelineData) {
								callback(null, timelineData);
							}
						});
					}
				}, function(err, results) {
					self.portListingSet('portRequest', results.portRequest);

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
				portRequest = self.portListingGet('portRequest'),
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
				portRequest = self.portListingGet('portRequest'),
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

			if (self.portListingGet('isMonsterApp')) {
				monster.pub('port.render');
			} else {
				self.portListingRender({
					isMonsterApp: self.portListingGet('isMonsterApp'),
					parent: self.portListingGet('parent'),
					data: {
						accountId: self.portListingGet('accountId')
					}
				});
			}
		},

		/**
		 * @param  {jQuery} args.template
		 */
		portListingBindListingEvents: function(args) {
			var self = this,
				template = args.template,
				optionsDatePicker = {
					container: template,
					range: self.appFlags.portListing.range
				},
				dates = monster.util.getDefaultRangeDates(self.appFlags.portListing.range),
				fromDate = dates.from,
				toDate = dates.to;

			monster.ui.initRangeDatepicker(optionsDatePicker);

			template.find('#startDate').datepicker('setDate', fromDate);
			template.find('#endDate').datepicker('setDate', toDate);

			template
				.find('.port-filter')
					.on('click', function(event) {
						event.preventDefault();

						var fromDate = template.find('input.filter-from').datepicker('getDate'),
							toDate = template.find('input.filter-to').datepicker('getDate'),
							tab = self.portListingGet('tab'),
							type = self.portListingGet('type');

						self.portListingRenderTableList({
							template: self.portListingGet('container'),
							fromDate: fromDate,
							toDate: toDate,
							type: type,
							tab: tab
						});
					});
		},

		/**
		 * @param  {jQuery} args.template
		 */
		portListingBindTableEvents: function(args) {
			var self = this,
				template = args.template;

			template
				.find('.port-wizard')
					.on('click', function(event) {
						event.preventDefault();

						monster.pub('common.portWizard.render', {
							container: self.portListingGet('container'),
							data: {
								accountId: self.portListingGet('accountId')
							},
							globalCallback: function() {
								self.portListingGlobalCallback();
							}
						});
					});

			template
				.find('.footable')
					.on('click', '.listing-item', function(event) {
						event.preventDefault();
						var portRequestId = $(this).data('id'),
							portRequest = self.portListingGet(['portRequestsById', portRequestId]);

						if (portRequest.port_state === 'unconfirmed') {
							monster.pub('common.portWizard.render', {
								container: self.portListingGet('container'),
								data: {
									accountId: portRequest.account_id,
									portRequestId: portRequestId
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
				accountId = self.portListingGet('accountId'),
				portRequest = self.portListingGet('portRequest'),
				portRequestId = portRequest.id,
				textareaWrapper = template.find('.textarea-wrapper'),
				textarea = textareaWrapper.find('textarea[name="comment"]');

			template
				.find('#back')
					.on('click', function(event) {
						event.preventDefault();

						self.portListingGlobalCallback();
					});

			template
				.find('#load_wizard')
					.on('click', function(event) {
						event.preventDefault();

						monster.pub('common.portWizard.render', {
							container: self.portListingGet('container'),
							data: {
								accountId: accountId,
								portRequestId: portRequestId
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
										accountId: self.portListingGet('accountId'),
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
						container: self.portListingGet('container'),
						data: {
							accountId: accountId,
							portRequestId: portRequestId
						},
						globalCallback: function() {
							self.portListingGlobalCallback();
						}
					});
				});

			template
				.find('.add-comment')
					.on('click', function(event) {
						event.preventDefault();
						if (_.chain(textarea.val()).trim().isEmpty().value()) {
							return;
						}
						var $this = $(this),
							isPrivate = _.get($this.data(), 'is_private', false),
							isRequiringAction = _.get($this.data(), 'is_requiring_action', false),
							comment = textarea.val(),
							$buttons = textareaWrapper.find('button');

						textarea.val('');
						$buttons.prop('disabled', 'disabled');

						self.portListingHelperAddComment({
							callback: function() {
								$buttons.prop('disabled', false);
							},
							comment: comment,
							isRequiringAction: isRequiringAction,
							isPrivate: isPrivate
						});
					});
		},

		/**
		 * @param  {jQuery} args.dialog
		 */
		portListingBindUpdateStatusEvents: function(args) {
			var self = this,
				dialog = args.dialog,
				portRequest = self.portListingGet('portRequest'),
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
								accountId: self.portListingGet('accountId'),
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

							if (!_.isEmpty(reason)) {
								patchRequestData.data.reason = reason;
							}

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
				container = self.portListingGet('container'),
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

		/**************************************************
		 *              Data handling helpers             *
		 **************************************************/

		/**
		 * @param  {Function} args.callback
		 * @param  {String} args.comment
		 * @param  {Boolean} [args.isRequiringAction=false]
		 * @param  {Boolean} [args.isPrivate=false]
		 */
		portListingHelperAddComment: function(args) {
			var self = this,
				callback = args.callback,
				comment = args.comment,
				isRequiringAction = _.get(args, 'isRequiringAction', false),
				isPrivate = _.get(args, 'isPrivate', false),
				container = self.portListingGet('container'),
				user = monster.apps.auth.currentUser,
				now = moment().toDate(),
				timestampOfDay = moment(now).startOf('day').valueOf(),
				author = user.first_name + ' ' + user.last_name;

			self.portListingRequestCreateComment({
				data: {
					accountId: self.portListingGet('accountId'),
					portRequestId: self.portListingGet('portRequest.id'),
					data: {
						comments: [
							{
								timestamp: monster.util.dateToGregorian(now),
								action_required: isRequiringAction,
								author: author,
								content: comment,
								is_private: isPrivate
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
							isPrivate: newComment.is_private
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

					callback && callback();
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
								isPrivate: _.get(
									comment,
									'is_private',
									_.get(comment, 'superduper_comment', false)
								),
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
				.flatten()
				.groupBy(function(entry) {
					return moment.tz(entry.timestamp, monster.util.getCurrentTimeZone()).startOf('day').valueOf();
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

		portListingRequestByType: function(args) {
			var self = this;

			self.portListingRequestListPort({
				data: {
					filters: args.filters
				},
				success: function(ports) {
					self.portListingSetters(ports);
					args.success(self.portlistingFlattenResults(ports));
				}
			});
		},

		portlistingRequestDescendantsByType: function(args) {
			var self = this;

			self.portListingRequestListDescendantsPorts({
				data: {
					filters: args.filters
				},
				success: function(ports) {
					self.portListingSetters(ports);
					args.success(self.portlistingFlattenResults(ports));
				}
			});
		},

		portListingRequestByAgent: function(args) {
			var self = this;

			self.portListingRequestListAgentPorts({
				data: {
					filters: args.filters
				},
				success: function(ports) {
					self.portListingSetters(ports);
					args.success(self.portlistingFlattenResults(ports));
				}
			});
		},

		portListingFormatDataToTemplate: function formatDataToTemplate(portRequests) {
			var self = this;

			return _.map(portRequests, function(request) {
				return {
					account: {
						id: request.account_id,
						name: self.portListingGet(['accountNamesById', request.account_id])
					},
					amount: _
						.chain(request)
						.get(
							'_read_only.ported_numbers',
							_.get(request, 'numbers', {})
						)
						.size()
						.value(),
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
		},

		/**
		 * @param  {Object}   args
		 * @param  {Function} args.success
		 * @param  {String}   args.tab
		 * @param  {String}   args.type
		 * @param  {Date}     [args.fromDate]
		 * @param  {Date}     [args.toDate]
		 */
		portListingHelperListPorts: function(args) {
			var self = this,
				filters = {
					paginate: false,
					by_types: args.type
				},
				dates,
				fromDate,
				toDate;

			if (self.portListingIsTypeCompleted(args.type)) {
				dates = monster.util.getDefaultRangeDates(self.appFlags.portListing.range);
				fromDate = _.get(args, 'fromDate', dates.from);
				toDate = _.get(args, 'toDate', dates.to);

				filters = _.merge(filters, {
					modified_from: monster.util.dateToBeginningOfGregorianDay(fromDate),
					modified_to: monster.util.dateToEndOfGregorianDay(toDate)
				});
			}

			args.filters = filters;

			switch (args.tab) {
				case 'account':
				default:
					self.portListingRequestByType(args);
					break;
				case 'agent':
					self.portListingRequestByAgent(args);
					break;
				case 'descendants':
					self.portlistingRequestDescendantsByType(args);
					break;
			}
		},

		portlistingFlattenResults: function(results) {
			return _.assign({}, results, {
				data: _.flatMap(results, function(payload) {
					return _.flatMap(payload.port_requests, function(account) {
						return account;
					});
				})
			});
		},

		/**
		 * @param { Array } results
		 */
		portListingSetters: function(results) {
			var self = this,
				flattenResults = _.map(results, function(account) {
					return {
						id: account.account_id,
						name: account.account_name,
						requests: account.port_requests
					};
				}),
				portRequestsById = _.keyBy(_.flatMap(flattenResults, function(account) { return account.requests; }), 'id');

			self.portListingSet('accountNamesById', _.transform(flattenResults, function(object, account) {
				object[account.id] = account.name;
			}));

			self.portListingSet('portRequestsById', _.merge(portRequestsById, self.portListingGet(['portRequestsById'])));
		},

		/**
		 * Determine whether or not the current user has agent permmissions. In this context, an
		 * agent is a user that has the ability to update the status of a port request and to
		 * privately comment/require actions when posting a comment.
		 * @param  {String} [authorityId]
		 * @return {Boolean}
		 */
		portListingUtilIsAgent: function(authorityId) {
			return monster.util.isSuperDuper() || _.get(monster, 'apps.auth.originalAccount.id') === authorityId;
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
					accountId: self.portListingGet('accountId')
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
		 * @param  {Object} args.data
		 * @param  {Function} args.success
		 * @param  {Function} args.error
		 */
		portListingRequestListDescendantsPorts: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.listDescendants',
				data: _.merge({
					accountId: self.portListingGet('accountId')
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
		 * @param  {Object} args.data
		 * @param  {Function} args.success
		 * @param  {Function} args.error
		 */
		portListingRequestListAgentPorts: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.listPortAuthority',
				data: _.merge({
					accountId: self.portListingGet('accountId')
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
					accountId: self.portListingGet('accountId')
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
					accountId: self.portListingGet('accountId')
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
					accountId: self.portListingGet('accountId')
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
					accountId: self.portListingGet('accountId')
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
					accountId: self.portListingGet('accountId')
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
					accountId: self.portListingGet('accountId'),
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
