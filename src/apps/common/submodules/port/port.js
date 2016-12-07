define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		fileUpload = require('fileupload'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		requests: {
			'common.numbers.metadata': {
				apiRoot: monster.config.api.phonebook,
				url: 'locality/metadata?lerg_lookup=true',
				verb: 'POST'
			}
		},

		subscribe: {
			'common.port.render': 'portRender'
		},

		isLaunchedInAppMode: true,

		defaultStateToDisplay: 'allOpenState',

		states: [
			{ value: 'unconfirmed', next: [1,6] },
			{ value: 'submitted', next: [2,4,6] },
			{ value: 'pending', next: [3,4,5,6] },
			{ value: 'scheduled', next: [4,5,6] },
			{ value: 'rejected', next: [1,5,6] },
			{ value: 'completed', next: [] },
			{ value: 'canceled', next: [] }
		],

		portRender: function(args) {
			var self = this,
				args = args || {},
				accountId = args.accountId || self.accountId,
				dialogOptions = {
					width: '940px',
					position: ['center', 20],
					title: self.i18n.active().port.dialogTitle,
					autoOpen: false,
					dialogClass: 'port-container-dialog'
				},
				parent = args.hasOwnProperty('parent') ? args.parent : monster.ui.dialog('', dialogOptions);

			// Add the corresponding text to each state to display it in the dropdowns
			_.each(self.states, function(state, idx) {
				state.text = self.i18n.active().port.state[state.value];
			});

			if (args.hasOwnProperty('accountId')) {
				self.isLaunchedInAppMode = false;
			} else {
				self.isLaunchedInAppMode = true;
			}

			self.portRenderPendingOrder(parent, accountId);
		},

		portFormatPendingOrderData: function(accounts) {
			// Remove accounts without any port requests
			accounts = accounts.filter(function(v) { return v.port_requests.length > 0; });

			// Sort requests by updated date
			accounts.forEach(function(account, i) {
				account.port_requests.sort(function(a, b) {
					return a.updated < b.updated ? 1 : -1;
				});
			});

			return accounts;
		},

		portRenderPendingOrder: function(parent, accountId) {
			var self = this,
				fullUIStates = [
					{ value: 'allOpenState', text: self.i18n.active().port.extraStatuses.allOpen },
					{ value: 'allState', text: self.i18n.active().port.extraStatuses.all }
				].concat(self.states),
				template = $(monster.template(self, 'port-pendingOrders', {
					states: fullUIStates,
					defaultStateToDisplay: self.defaultStateToDisplay,
					isLaunchedInAppMode: self.isLaunchedInAppMode
				}));

			parent
				.empty()
				.append(template);

			self.portBindPendingOrderEvents(parent, accountId);
			self.portRenderPendingOrderListing(parent, accountId, self.defaultStateToDisplay);

			if (parent.hasClass('ui-dialog-content')) {
				parent.dialog('open');
			}
		},

		portToggleRequestsDisplay: function(container, accountId, displayType, noFade) {
			var requestWrapper = container.find('.accounts-list > .requests-wrapper'),
				requestWrapperIsEmpty = requestWrapper.hasClass('empty'),
				accountSection = container.find('.account-section');

			if (displayType === 'accounts') {
				if (!requestWrapperIsEmpty) {
					var accountsList = {};

					requestWrapper.addClass('empty');
					requestWrapper.find('.request-box').each(function(idx, el) {
						var $el = $(el),
							accountId = $el.data('account_id');

						if (accountsList.hasOwnProperty(accountId)) {
							accountsList[accountId].push($el);
						}
						else {
							accountsList[accountId] = [ $el ];
						}

						container.find('.account-section[data-id="' + accountId + '"] .requests-wrapper').append($el);
					});

					for (var accountId in accountsList) {
						container
							.find('.account-section[data-id="' + accountId + '"] .requests-wrapper')
							.append(accountsList[accountId].sort(function(a, b) {
								return $(a).data('updated_date') < b.data('updated_date') ? 1 : -1;
							}));
					}
				}

				if(noFade) {
					accountSection.show();
				} else {
					accountSection.fadeIn(400);
				}
			}
			else if (displayType === 'requests') {
				if (requestWrapperIsEmpty) {
					var showRequests = function() {
						requestWrapper.append(container.find('.request-box').sort(function(a, b) {
							return $(a).data('updated_date') < $(b).data('updated_date') ? 1 : -1;
						}));

						requestWrapper.removeClass('empty');
					};
					if(noFade) {
						accountSection.hide();
						showRequests();
					} else {
						accountSection.fadeOut(400, showRequests);
					}
				}
			}
		},

		portBindPendingOrderEvents: function(parent, accountId, data) {
			var self = this,
				container = parent.find('#orders_list');

			self.portPositionDialogBox();

			container.find('span.pull-right a').on('click', function() {
				self.portRenderAddNumber(parent, accountId);
			});

			container
				.find('.search-numbers')
					.on('click', function() {
						var numberToSearch = container.find('#search_input').val();

						if (/(\+1|1)?([0-9]{10})/.test(numberToSearch)) {
							self.portSearchNumber({
								data: {
									accountId: accountId,
									number: numberToSearch
								},
								success: function(data) {
									container
										.find('.filter-options')
											.hide();

									container
										.find('#number_searched')
											.text(monster.util.formatPhoneNumber(numberToSearch));

									container
										.find('#search_indicator')
											.removeClass('hidden');

									self.portRenderPendingOrderListing(parent, accountId, undefined, data);
								}
							});
						}
						else {
							toastr.error(self.i18n.active().port.toastr.error.number);
						}
					});

			container
				.find('#search_indicator')
					.on('click', function() {
						$(this)
							.addClass('hidden');

						container
							.find('#search_input')
								.val('');

						container
							.find('.filter-options')
								.show();

						container
							.find('.filter-select')
								.val(self.defaultStateToDisplay);

						self.portRenderPendingOrderListing(parent, accountId, self.defaultStateToDisplay);
					});

			container.find('.filter-options .btn-group:first-child .btn').on('click', function() {
				var $this = $(this);
				if (!$this.hasClass('active')) {
					$this.siblings().removeClass('active');
					$this.addClass('active');
					self.portToggleRequestsDisplay(container, accountId, $this.data('value'));
				}
			});

			container.find('.filter-options .btn-group:last-child .filter-select').on('change', function() {
				self.portRenderPendingOrderListing(parent, accountId, $(this).val());
			});
		},

		portRenderPendingOrderListing: function (parent, accountId, state, dataSearch) {
			var self = this,
				container = parent.find('.accounts-list'),
				generateTemplate = function (data) {
					var dataToTemplate = {
							data: self.portFormatPendingOrderData(data),
							isAdmin: monster.util.isSuperDuper()
						},
						template = $(monster.template(self, 'port-pendingOrdersList', dataToTemplate));

					container
						.empty()
						.append(template);

					if (!self.isLaunchedInAppMode || dataSearch) {
						self.portToggleRequestsDisplay(container, accountId, 'requests', true);
					}

					self.portRenderDynamicCells(parent, data);
					self.portBindPendingOrderListingEvents(parent, accountId, data);
				};

			if (dataSearch) {
				generateTemplate(dataSearch);
			}
			else {
				self.portListRequests(accountId, state, function (data) {
					generateTemplate(data);
				});
			}
		},

		portBindPendingOrderListingEvents: function (parent, accountId, data) {
			var self = this,
				container = parent.find('.accounts-list');

			container.find('.account-header').on('click', function() {
				var section = $(this).parents('.account-section');

				if (section.hasClass('active')) {
					section.find('.requests-wrapper').slideUp(function() {
						section.find('.left-part i')
							.removeClass('fa-chevron-down monster-white')
							.addClass('fa-chevron-right');

						section.removeClass('active');
					});
				}
				else {
					section.addClass('animate');
					section.find('.requests-wrapper').slideDown(function() {
						section.find('.left-part i')
							.removeClass('fa-chevron-right')
							.addClass('fa-chevron-down monster-white');

						section.removeClass('animate');
						section.addClass('active');
					});
				}
			});

			container
				.find('.account-ancestors')
					.on('click', function(event) {
						event.stopPropagation();

						var accountId = $(this).parents('.account-section').data('id');

						monster.pub('common.accountAncestors.render', {
							accountId: accountId
						});
					});

			container.find('.request-box .request-state').on('change', '.switch-state', function(event) {
				var el = $(this),
					box = el.parents('.request-box'),
					accountId = box.data('account_id'),
					requestId = box.data('id'),
					currentRequest = self.portGetRequest(accountId, requestId, data),
					newState = el.val();

				if (newState === 'rejected') {
					self.portRequestChangeState({
						data: {
							accountId: accountId,
							portRequestId: requestId,
							state: newState
						},
						success: function(newRequest) {
							delete newRequest.scheduled_date;

						self.portRequestUpdate(accountId, requestId, newRequest, function(updatedRequest) {
							self.portUpdateData(accountId, updatedRequest, data);
							self.portRenderDynamicCells(container, updatedRequest);

							box.find('.actions .dropdown-menu')
								.prepend(monster.template(self, 'port-orderActions'));

							toastr.success(self.i18n.active().port.toastr.success.request.update);
						});
						}
					});
				}
				else if (newState === 'scheduled') {
					self.portRenderScheduledDatePopup(parent, {
						callbackSave: function (newScheduledDate) {
							self.portRequestChangeState({
								data: {
									accountId: accountId,
									portRequestId: requestId,
									state: newState,
									data: {
										scheduled_date: newScheduledDate
									}
								},
								success: function(newRequest) {
									newRequest.scheduled_date = newScheduledDate;

									self.portRequestUpdate(accountId, requestId, newRequest, function (updatedRequest) {
										self.portUpdateData(accountId, updatedRequest, data);
										self.portRenderDynamicCells(container, updatedRequest);

										toastr.success(self.i18n.active().port.toastr.success.request.update);
									});
								},
								error: function() {
									toastr.error(self.i18n.active().port.toastr.error.request.update);
								}
							});
						},
						callbackCancel: function() {
							self.portRenderDynamicCells(container, currentRequest);
						}
					});
				}
				else {
					self.portRequestChangeState({
						data: {
							accountId: accountId,
							portRequestId: requestId,
							state: newState
						},
						success: function(newRequest) {
							self.portUpdateData(accountId, newRequest, data);
							self.portRenderDynamicCells(container, newRequest);

							box.find('.continue-request, .delete-request')
								.remove();

							toastr.success(self.i18n.active().port.toastr.success.request.update);
						},
						error: function() {
							toastr.error(self.i18n.active().port.toastr.error.request.update);
						},
						cancel: function() {
							self.portRenderDynamicCells(container, currentRequest);
						}
					});
				}
			});

			container.find('.request-box .scheduled-date .edit').on('click', function() {
				var $this = $(this),
					accountId = $this.parents('.request-box').data('account_id'),
					requestId = $this.parents('.request-box').data('id'),
					currentRequest = self.portGetRequest(accountId, requestId, data),
					scheduledDate = currentRequest.scheduled_date;

				self.portRenderScheduledDatePopup(parent, {
					scheduledDate: scheduledDate,
					callbackSave: function(newScheduledDate) {
						$.extend(true, currentRequest, {
							scheduled_date: newScheduledDate
						});

						self.portRequestUpdate(accountId, requestId, currentRequest, function(updatedRequest) {
							self.portUpdateData(accountId, updatedRequest, data);
							$this.text(monster.util.toFriendlyDate(monster.util.gregorianToDate(updatedRequest.scheduled_date), 'shortDateTime'));
						});
					}
				});
			});

			container.find('.request-box .actions').on('click', 'li', function() {
				var $this = $(this),
					accountId = $this.parents('.request-box').data('account_id'),
					requestId = $this.parents('.request-box').data('id'),
					currentRequest = self.portGetRequest(accountId, requestId, data),
					template;

				if ($this.hasClass('continue-request')) {
					var dataList = { orders: [currentRequest] };

					template = monster.template(self, 'port-submitDocuments', { whitelabelPort: monster.config.whitelabel.port, port: currentRequest });

					parent
						.empty()
						.append(template);

					self.portRenderSubmitDocuments(parent, accountId, dataList);
				}
				else if ($this.hasClass('info-request')) {
					var uploads = {};

					if (currentRequest.hasOwnProperty('uploads')) {
						_.each(currentRequest.uploads, function(upload, key) {
							var type = key.slice(0, -4);

							uploads[type] = _.extend(upload, {
								name: key
							});
						});
					}

					var dialogOptions = {
							position: ['center', 20],
							title: self.i18n.active().port.infoPopup.title
						},
						dialog;

					template = monster.template(self, 'port-requestInfo', {
						request: currentRequest,
						uploads: uploads
					});

					dialog = $(monster.ui.dialog(template, dialogOptions));

					dialog
						.find('.download')
							.on('click', function(event) {
								event.preventDefault();

								var type = $(this).data('type');

								self.portRequestGetAttachment(accountId, currentRequest.id, uploads[type].name, function(attachmentData) {
									self.portGhettoAttachmentDownload(uploads[type].name, attachmentData);
								});
							});
				}
				else if ($this.hasClass('delete-request')) {
					self.portRequestDelete(accountId, requestId, function() {
						$this.parents('.request-box')
							.remove();

						toastr.success(self.i18n.active().port.toastr.success.request.delete);
					});
				}
				else if ($this.hasClass('comments-request')) {
					self.portRenderComments(parent, accountId, requestId);
				}
			});
		},

		portRenderScheduledDatePopup: function(parent, args) {
			var self = this,
				dataTemplate = args.hasOwnProperty('scheduledDate') ? { scheduledDate: args.scheduledDate } : {},
				template = $(monster.template(self, 'port-editScheduledDate', dataTemplate)),
				popup = monster.ui.dialog(template, {
					title: self.i18n.active().port.pendingOrders.scheduledDatePopup.title,
					beforeClose: function (event, ui) {
						args.hasOwnProperty('callbackCancel') && args.callbackCancel();
					}
				});

			self.portBindScheduledDatePopupEvents(parent, popup, args);
		},

		portBindScheduledDatePopupEvents: function(parent, popup, args) {
			var self = this,
				$timepicker = popup.find('#scheduled_time'),
				$datepicker = popup.find('#scheduled_date'),
				datepickerOptions = {
					minDate: new Date(),
					beforeShowDay: $.datepicker.noWeekends
				};

			monster.ui.timepicker($timepicker);
			monster.ui.datepicker($datepicker, datepickerOptions);

			popup.find('.save-link').on('click', function() {
				var scheduledTimeInMiliSeconds = $timepicker.timepicker('getSecondsFromMidnight') * 1000,
					scheduledDateInMiliSeconds = $datepicker.datepicker('getDate').getTime(),
					newScheduledDate = monster.util.dateToGregorian(new Date(scheduledDateInMiliSeconds + scheduledTimeInMiliSeconds));

				popup.dialog('close');

				args.hasOwnProperty('callbackSave') && args.callbackSave(newScheduledDate);
			});

			popup.find('.cancel-link').on('click', function() {
				popup.dialog('close');
			});
		},

		portRenderComments: function(parent, accountId, portRequestId) {
			var self = this;

			self.portRequestGet(accountId, portRequestId, function(port) {
				var template = $(monster.template(self, 'port-commentsPopup', {
						isAdmin: monster.apps.auth.originalAccount.superduper_admin
					})),
					comments = port.hasOwnProperty('comments') ? port.comments : [],
					initDialog = function() {
						var dialogOptions = {
								width: '960px',
								position: ['center', 20],
								title: self.i18n.active().port.commentsPopup.title
							},
							dialog = monster.ui.dialog(template, dialogOptions);

						self.portBindCommentsEvents(dialog, accountId, port, comments);
					};

				if (_.isEmpty(comments)) {
					template.find('.comments').hide();
					initDialog();
				}
				else {
					self.portRequestListUsers(accountId, function(users) {
						users = (function arrayToObject(usersArray) {
							var usersObject = {};

							usersArray.forEach(function(v, i) {
								usersObject[v.id] = v.first_name.concat(' ', v.last_name);
							});

							return usersObject;
						})(users);

						comments.forEach(function(v, i) {
							v.author = users[v.user_id];
							v.isAdmin = monster.apps.auth.originalAccount.superduper_admin;

							if (v.superduper_comment ? monster.apps.auth.originalAccount.superduper_admin : true) {
								template.find('.comments')
									.append(monster.template(self, 'port-comment', v));

								template.find('.comments .comment:last-child .comment-body')
									.html(v.content);
							}
						});

						initDialog();
					});
				}
			});
		},

		portBindCommentsEvents: function(container, accountId, data, comments) {
			var self = this;

			monster.ui.wysiwyg(container.find('.wysiwyg-container'));

			container.find('.comments').on('click', '.delete-comment', function() {
				var el = $(this),
					comment = el.parents('.comment'),
					id = el.data('id'),
					index = _.findIndex(comments, function(val) {
						return val.timestamp === id;
					});

				monster.ui.confirm(self.i18n.active().port.infoPopup.confirm.deleteComment, function() {
					// comments.forEach(function(v, i, a) {
					// 	if (v.timestamp === id) {
					// 		comments.splice(i, 1);
					// 	}
					// });

					// data.comments = comments;

					// self.portRequestUpdate(accountId, data.id, data, function(data) {
					self.portRequestDeleteComment(accountId, data.id, index, function(newComments) {
						comments = newComments;
						comment.fadeOut('400', function() {
							$(this).remove();

							if (container.find('.comment').length === 0) {
								container.find('.comments').slideUp();
							}

							toastr.success(self.i18n.active().port.toastr.success.comment.delete);
						});
					});
				});
			});

			container.find('.actions .add-comment').on('click', function() {
				var currentUser = monster.apps.auth.currentUser,
					newComment = {
						user_id: self.userId,
						timestamp: monster.util.dateToGregorian(new Date()),
						content: container.find('.wysiwyg-editor').html(),
						superduper_comment: container.find('#superduper_comment').is(':checked')
					};

				// comments.push(newComment);
				// data.comments = comments;

				self.portRequestAddComment(accountId, data.id, newComment, function(newComments) {
					comments = newComments;
					newComment.author = currentUser.first_name.concat(' ', currentUser.last_name);
					newComment.isAdmin = monster.apps.auth.originalAccount.superduper_admin;

					container.find('.comments')
						.show()
						.append($(monster.template(self, 'port-comment', newComment)));

					container.find('.comments .comment:last-child .comment-body')
						.html(newComment.content);

					container.find('.comments').animate({
							scrollTop: container.find('.comments').scrollTop() + container.find('.comments .comment:last-child').position().top
						}, 300, function() {
							monster.ui.highlight($(this).find('.comment:last-child'));
					});

					container.find('.wysiwyg-editor').empty();
				});
			});
		},

		portRequestAddComment: function(accountId, portRequestId, comment, callback) {
			var self = this,
				commentData = {
					comments: _.isArray(comment) ? comment : [comment]
				};

			self.callApi({
				resource: 'port.addComment',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: commentData
				},
				success: function(data, status) {
					callback && callback(data.data && data.data.comments);
				}
			});
		},

		portRequestDeleteComment: function(accountId, portRequestId, commentId, callback) {
			var self = this;

			self.callApi({
				resource: 'port.deleteComment',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					commentId: commentId
				},
				success: function(data, status) {
					callback && callback(data.data && data.data.comments);
				}
			});
		},

		portRenderAddNumber: function(parent, accountId) {
			var self = this,
				template = monster.template(self, 'port-addNumbers');

			parent.empty()
				.append(template);

			self.portBindAddNumberEvents(parent, accountId);
		},

		portBindAddNumberEvents: function(parent, accountId) {
			var self = this,
				container = parent.find('div#add_numbers');

			self.portPositionDialogBox();
			self.portComingSoon(container, ['.help-links li:not(.separator) a']);

			container.find('#add_numbers_link').on('click', function(e) {
				//e.stopPropagation();

				var numbersArray = container.find('input').val().split(' ');

				numbersArray.forEach(function(val, idx, array) {
					if (/^(\+1|1[0-9]{10})/.test(val)) {
						array[idx] = val.replace(/(\+1|1)?([0-9]{10})/, '$2');
					}
				});

				numbersArray = numbersArray.filter(function(el, idx, list) {
					return el && /^[0-9]{10}$/.test(el);
				});

				if (numbersArray.length === 0) {
					toastr.error(self.i18n.active().port.toastr.error.numbers);

					container.find('div.row-fluid')
						.addClass('error');
				}
				else {
					self.portFormatNumbers(numbersArray, function(formattedData) {
						if (formattedData.orders.length > 0) {
							container.find('div.row-fluid')
								.removeClass('error');

							container.find('#numbers_list')[0].value = '';

							/*
							 * unbind because it is used in portManagerOrders
							 * to add number without adding the port-managerOrders template again
							 */
							container.find('button')
								.unbind('click');

							self.portRenderManagerOrders(parent, accountId, formattedData);
						}
						else {
							container.find('#numbers_list')[0].value = '';
						}
					});
				}
			});
		},

		portRenderManagerOrders: function(parent, accountId, data) {
			var self = this,
				template = $(monster.template(self, 'port-manageOrders', data));

			template.insertAfter(parent.find('#add_numbers'));

			self.portBindManageOrdersEvents(parent, accountId, data);
		},

		portBindManageOrdersEvents: function(parent, accountId, data) {
			var self = this,
				container = parent.find('#port_container');

			self.portPositionDialogBox();
			self.portCancelOrder(parent, accountId, container);
			self.portComingSoon(container, ['#footer .help-links li:not(.separator) a']);

			container.find('#add_numbers_link').on('click', function() {
				var numbersArray = container.find('div#add_numbers').find('input').val().split(' '),
					listedNumbers = [];

				container
					.find('#manage_orders li')
						.each(function() {
							listedNumbers.push($(this).data('value').toString());
						});

				numbersArray.forEach(function(val) {
					if (/^(\+1|1[0-9]{10})/.test(val)) {
						val = val.replace(/^(\+1|1)?([0-9]{10})$/, '$2');
					}
				});

				numbersArray = numbersArray.filter(function(el) {
					return el && /^[0-9]{10}$/.test(el) && listedNumbers.indexOf(el) < 0;
				});

				if (numbersArray.length === 0) {
					toastr.error(self.i18n.active().port.toastr.error.numbers);
					container
						.find('div#add_numbers')
						.find('div.row-fluid')
						.addClass('error');
				}
				else {
					self.portFormatNumbers(numbersArray, function(formattedData) {
						container.find('#numbers_list')[0].value = '';

						container
							.find('div#add_numbers')
							.find('div.row-fluid')
							.removeClass('error');

						_.each(formattedData.orders, function(orderValue, orderKey) {
							container
								.find('#manage_orders .order')
									.each(function() {
										var $this = $(this),
											carrier = $this.data('carrier');

										if (carrier === orderValue.carrier) {
											_.each(orderValue.numbers, function(numberValue) {
													$this
														.find('ul')
															.append(
																'<li data-value="' + numberValue + '" data-carrier="' + carrier + '">' + 
																	'<i class="fa fa-exclamation-triangle"></i>' + 
																	monster.util.formatPhoneNumber(numberValue) + 
																	'<i class="fa fa-times-circle pull-right"></i>' + 
																'</li>'
															);
											});

											formattedData.orders.splice(orderKey, 1);
										}
									});

							if (formattedData.orders.length !== 0) {
								container
									.find('#manage_orders')
										.find('.row-fluid:last-child')
											.append($(monster.template(self, 'port-order', formattedData.orders[orderKey])));
							}
						});
					});
				}
			});

			container.on('click', '#manage_orders li .remove-number', function() {
				var elem = $(this),
					ul = elem.parent().parent();

				elem.parent().remove();

				if (ul.is(':empty')) {
					ul.parent().parent().remove();
				}

				if (container.find('div#manage_orders').find('.row-fluid:last-child').is(':empty')) {
					container
						.find('div#manage_orders')
						.find('.row-fluid:last-child')
						.animate({ height: '0px' }, 500);

					self.portRenderAddNumber(parent, accountId);
				}
			});

			container.find('#manage_orders_next_link').on('click', function() {
				var formToValidate = container.find('#eula form');

				monster.ui.validate(formToValidate, {
					messages: {
						'conditions[]': {
							required: self.i18n.active().port.requiredConditions,
							minlength: self.i18n.active().port.requiredConditions
						}
					},
					errorPlacement: function(error, element) {
						error.insertAfter(container.find('#eula form .control-group:last-child'));
					}
				});

				if (monster.ui.valid(formToValidate)) {
					var ordersList = { orders: [] };

					container.find('div#manage_orders').find('div.order').each(function() {
						var elem = $(this),
							order = {},
							numbersList = [];

						$.each(elem.find('li'), function(idx, val) {
							numbersList.push($(val).data('value'));
						});

						order.carrier = elem.find('li:first-child').data('carrier');
						order.numbers = numbersList;

						ordersList.orders.push(order);
					});

					data.orders.forEach(function(order, idx) {
						for (var i = 0, len = ordersList.orders.length; i < len; i++) {
							if (ordersList.orders[i].carrier === order.carrier) {
								$.extend(true, ordersList.orders[i], order);

								break;
							}
						}
					});

					self[ordersList.orders.length === 1 ? 'portRenderSubmitDocuments' : 'portRenderResumeOrders'](parent, accountId, ordersList);
				}
				else {
					container.find('div#eula').find('input').each(function() {
						if (!$(this).is(':checked')) {
							$(this).parents('.control-group').addClass('error');
						}
						else {
							$(this).parents('.control-group').removeClass('error');
						}
					});
				}
			});
		},

		portRenderResumeOrders: function(parent, accountId, data) {
			var self = this,
				template = $(monster.template(self, 'port-resumeOrders', data));

			$.each(template.find('.row-fluid'), function(idx, val) {
				val = $(val);

				val.find('.order-key')
					.text((parseInt(val.find('.order-key').text(), 10) + 1).toString());
			});

			parent
				.empty()
				.append(template);

			self.portBindResumeOrdersEvents(parent, accountId, data);
		},

		portBindResumeOrdersEvents: function(parent, accountId, data) {
			var self = this,
				container = parent.find('#resume_orders');

			self.portPositionDialogBox();

			container.find('.resume-order-btn').on('click', function() {
				var index = $(this).data('index');

				self.portRenderSubmitDocuments(parent, accountId, data, index);
			});
		},

		portRenderSubmitDocuments: function(parent, accountId, data, index) {
			var self = this,
				index = index || 0,
				template = $(monster.template(self, 'port-submitDocuments', { whitelabelPort: monster.config.whitelabel.port, port: data.orders[index] }));

			parent
				.empty()
				.append(template);

			self.portBindSubmitDocumentsEvents(parent, accountId, data, index);
		},

		portBindSubmitDocumentsEvents: function(parent, accountId, data, index) {
			var self = this,
				container = parent.find('#port_container');

			self.portPositionDialogBox();
			self.portCancelOrder(parent, accountId, container, data, index);
			self.portComingSoon(container, [
				'#upload_bill .row-fluid.info a',
				'#loa p a:not(#sign_doc)',
				'#footer .help-links li:not(.separator) a'
			]);

			container.find('.file-upload-container input').each(function(idx, el) {
				var input = $(el),
					type = input.data('name'),
					options = {
						btnText: self.i18n.active().port.submitDocuments.changeButton,
						mimeTypes: ['application/pdf'],
						wrapperClass: 'input-append',
						success: function(results) {
							if (data.orders[index].hasOwnProperty('id')) {
								if (data.orders[index].hasOwnProperty(type.concat('.pdf'))) {
									self.portRequestUpdateAttachment(accountId, data.orders[index].id, type.concat('.pdf'), results[0].file, function() {
										data.orders[index][type.concat('_attachment')] = results[0].file;
									});
								}
								else {
									self.portRequestAddAttachment(accountId, data.orders[index].id, type.concat('.pdf'), results[0].file, function() {
										data.orders[index][type.concat('_attachment')] = results[0].file;
									});
								}
							}
							else {
								data.orders[index][type.concat('_attachment')] = results[0].file;
							}
						},
						error: function(error) {
							for ( var key in error ) {
								if ( error[key].length > 0 ) {
									toastr.error(self.i18n.active().port.toastr.error[key].concat(error[key].join(', ')));
								}
							}
						}
					}

				if (data.orders[index].hasOwnProperty('uploads') && data.orders[index].uploads.hasOwnProperty(type.concat('.pdf'))) {
					options.filesList = [ type.concat('.pdf') ];
				}

				if (type === 'bill') {
					options['bigBtnClass'] = 'btn btn-success span12';
					options['bigBtnText'] = self.i18n.active().port.submitDocuments.uploadBillButton;
					options['btnClass'] = 'btn btn-success';
				}
				else {
					options['bigBtnClass'] = 'btn span10';
					options['btnClass'] = 'btn';

					if (type === 'loa') {
						options['bigBtnText'] = self.i18n.active().port.submitDocuments.loaUploadStep;
					}
					else if (type === 'resporg') {
						options['bigBtnText'] = self.i18n.active().port.submitDocuments.resporg.uploadStep;
					}
				}

				input.fileUpload(options);
			});

			container.find('#upload_bill .remove-number').on('click', function() {
				var li = $(this).parent(),
					ul = li.parent(),
					numberToRemove = li.data('value'),
					indexOfNumberToRemove = data.orders[index].numbers.indexOf(numberToRemove);

				if (indexOfNumberToRemove >= 0) {
					data.orders[index].numbers.slice(indexOfNumberToRemove, 1);

					li.remove();
				}

				if (ul.is(':empty')) {
					if (data.orders.length > 1) {
						data.orders.splice(index, 1);

						self.portRenderResumeOrders(parent, accountId, data);
					}
					else {
						self.portReloadApp(parent, accountId);
					}
				}
			});

			container.find('#submit_documents_add_numbers_link').on('click', function() {
				parent.empty()
					.append(monster.template(self, 'port-addNumbers'));

				self.portRenderManagerOrders(parent, accountId, data);
			});

			container.find('#submit_documents_save_link').on('click', function() {
				var transferNameForm = container.find('#transfer_name_form');

				monster.ui.validate(transferNameForm);

				if (monster.ui.valid(transferNameForm)) {
					var transferNameFormData = monster.ui.getFormData('transfer_name_form', '.', true),
						billFormData = monster.ui.getFormData('bill_form', '.', true);

					$.extend(true, data.orders[index], billFormData, transferNameFormData);

					self.portSaveOrder(parent, accountId, data, index);
				}
				else {
					if (container.find('.monster-invalid').length > 0) {
						$('html, body').animate({
							scrollTop: container.find('.monster-invalid').first().offset().top - 10
						}, 300);
					}
				}
			});

			container.find('#submit_documents_next_link').on('click', function() {
				var order = data.orders[index],
					hasBillAttachment = order.hasOwnProperty('bill_attachment') || order.hasOwnProperty('uploads') && order.uploads.hasOwnProperty('bill.pdf') ? true : false,
					hasLoaAttachment = order.hasOwnProperty('loa_attachment') || order.hasOwnProperty('uploads') && order.uploads.hasOwnProperty('loa.pdf') ? true : false,
					transferNameForm = container.find('#transfer_name_form'),
					billForm = container.find('#bill_form'),
					submitData = true;

				monster.ui.validate(transferNameForm);
				monster.ui.validate(billForm);

				if (!monster.ui.valid(transferNameForm)) {
					submitData = false;
				}

				if (!monster.ui.valid(billForm)) {
					submitData = false;
				}

				if (!hasBillAttachment || !hasLoaAttachment) {
					submitData = false;

					monster.ui.alert('error', self.i18n.active().port.toastr.error.submit.document);
				}

				if (submitData) {
					var transferNameFormData = monster.ui.getFormData('transfer_name_form'),
						billFormData = monster.ui.getFormData('bill_form');

					if (order.hasOwnProperty('id')) {
						delete order.bill_attachment;
						delete order.loa_attachment;
						delete order.resporg_attachment;
					}

					$.extend(true, order, billFormData, transferNameFormData);

					self.portRenderConfirmOrder(parent, accountId, data, index);
				}
				else {
					if (container.find('.monster-invalid').length > 0) {
						$('html, body').animate({
							scrollTop: container.find('.monster-invalid').first().offset().top - 10
						}, 300);
					}
				}
			});
		},

		portRenderConfirmOrder: function(parent, accountId, data, index) {
			var self = this,
				order = data.orders[index],
				todayDate = new Date(),
				businessDate = monster.util.getBusinessDate(4),
				createdDate = order.hasOwnProperty('created') ? order.created : todayDate,
				transferDate = order.hasOwnProperty('transfer_date') ? monster.util.gregorianToDate(order.transfer_date) : businessDate,
				isTransferDateNotValid = businessDate.getTime() >= transferDate.getTime(),
				dataTemplate = $.extend(true, {}, order, {
					total: order.numbers.length,
					transfer_date: isTransferDateNotValid ? businessDate : transferDate,
					created: createdDate
				}),
				template = $(monster.template(self, 'port-confirmOrder', dataTemplate));

			parent
				.empty()
				.append(template);

			self.portBindConfirmOrderEvents(parent, accountId, data, index);
		},

		portBindConfirmOrderEvents: function(parent, accountId, data, index) {
			var self = this,
				container = parent.find('#port_container'),
				datePickerInput = container.find('input.date-input'),
				order = data.orders[index];

			self.portPositionDialogBox(),
			self.portCancelOrder(parent, accountId, container, data, index);
			self.portComingSoon(container, ['#footer .help-links li:not(.separator) a']);

			monster.ui.datepicker(datePickerInput, {
				minDate: monster.util.getBusinessDate(4),
				beforeShowDay: $.datepicker.noWeekends,
				onSelect: function(dateText, inst) {
					var span = container.find('#transfer_schedule_date'),
						textColor = span.css('color'),
						speed = 200;

					span.animate({ color: span.css('backgroundColor') }, speed, function() {
						span.text(dateText);
						span.animate({ color: textColor }, speed);
					});
				},
			});

			container.find('#numbers_to_buy option')
				.last()
				.prop('selected', 'selected');

			container.find('#numbers_to_buy option').each(function(idx, el) {
				var elem = $(el);

				elem.val(parseInt(elem.val(), 10) + 1)
					.text(elem.val());
			});

			container.find('#confirm_order_save_link').on('click', function() {
				var notificationEmailFormData = monster.ui.getFormData('notification_email_form', '.', true),
					transferDateFormData = monster.ui.getFormData('transfer_date_form');

				$.extend(true, order, notificationEmailFormData, transferDateFormData);

				order.transfer_date = monster.util.dateToGregorian(new Date(order.transfer_date));

				self.portSaveOrder(parent, accountId, data, index);
			});

			container.find('#confirm_order_add_numbers_link').on('click', function() {
				parent.empty()
					.append(monster.template(self, 'port-addNumbers'));

				self.portRenderManagerOrders(parent, accountId, data);
			});

			container.find('#confirm_order_submit_link').on('click', function() {
				var notificationEmailForm = container.find("#notification_email_form");

				monster.ui.validate(notificationEmailForm);

				if (monster.ui.valid(notificationEmailForm)) {
					var notificationEmailFormData = monster.ui.getFormData('notification_email_form'),
						transferDateFormData = monster.ui.getFormData('transfer_date_form');

					$.extend(true, order, notificationEmailFormData, transferDateFormData);

					order.transfer_date = monster.util.dateToGregorian(new Date(order.transfer_date));

					if (order.hasOwnProperty('id')) {
						self.portRequestUpdate(accountId, order.id, order, function() {
							if (order.hasOwnProperty('port_sate')) {
								self.portReloadApp(parent, accountId);
							}
							else {
								self.portRequestChangeState({
									data: {
										accountId: accountId,
										portRequestId: order.id,
										state: 'submitted'
									},
									success: function() {
										self.portReloadApp(parent, accountId);
									}
								});
							}
						});
					}
					else {
						self.portRequestAdd(accountId, order, function(portRequestId) {
							data.orders.splice(index, 1);

							self.portRequestChangeState({
								data: {
									accountId: accountId,
									portRequestId: portRequestId,
									state: 'submitted'
								},
								success: function() {
									if (data.orders.length > 0) {
										self.portRenderResumeOrders(parent, accountId, data);
									}
									else {
										self.portReloadApp(parent, accountId);
									}
								},
								cancel: function() {
									self.portRequestDelete(accountId, portRequestId);
								}
							});
						});
					}
				}
				else {
					if (container.find('.monster-invalid').length > 0) {
						$('html, body').animate({
							scrollTop: container.find('.monster-invalid').first().offset().top - 10
						}, 300);
					}
				}
			});
		},

		/* Methods */
		portSearchNumber: function(args) {
			var self = this,
				accountId = args.data.accountId,
				number = args.data.number;

			monster.parallel({
					account: function(callback) {
						self.portRequestSearchNumber(accountId, number, function (data) {
							callback(null, data);
						});
					},
					descendants: function(callback) {
						if (self.isLaunchedInAppMode) {
							self.portRequestSearchNumberByDescendants(accountId, number, function (data) {
								callback(null, data);
							});
						}
						else {
							callback(null, []);
						}
					}
				},
				function(err, results) {
					var requests = results.account.concat(results.descendants);

					// TODO: Remove this block once KAZOO-4248 is resolved
					if (requests.length > 1) {
						requests = _.uniq(requests, function(val, idx) {
							return val.id;
						});
					}

					if (requests.length === 1) {
						self.portRequestGetAccount(requests[0].account_id, function (account) {
							args.success([{
								account_id: requests[0].account_id,
								account_name: account.name,
								port_requests: requests
							}]);
						});
					}
					else {
						args.success([]);
					}
				}
			);
		},

		portListRequests: function(accountId, state, callback) {
			var self = this;

			monster.parallel({
					requests: function(callback) {
						var args = {
							accountId: accountId,
							state: (self.isLaunchedInAppMode ? state : 'all'),
							withDescendants: false,
							success: function(data) {
								callback(null, data);
							}
						};

						self.portRequestList(args);
					},
					descendants: function(callback) {
						if (self.isLaunchedInAppMode) {
							var args = {
								accountId: accountId,
								state: state,
								withDescendants: true,
								success: function(data) {
									callback(null, data);
								}
							};

							self.portRequestList(args);
						}
						else {
							callback(null, []);
						}
					}
				},
				function(err, results) {
					var requests = results.descendants.sort(function(a, b) {
							return a.account_name.toLowerCase() > b.account_name.toLowerCase() ? 1 : -1;
						});

					if (results.requests.length) {
						requests.unshift({
							account_id: accountId,
							account_name: monster.apps.auth.currentAccount.name,
							port_requests: results.requests
						});
					}

					for (var i = 0, len = requests.length; i < len; i++) {
						requests[i].amount = requests[i].port_requests.length;
					}

					callback(requests);
				}
			);
		},

		portRenderDynamicCells: function(parent, args) {
			var self = this,
				getStatesToDisplay = function(newState) {
					var states = self.states,
						statesList = [];

					newState = _.find(states, function(stateValue, stateIdx) {
						return stateValue.value === newState;
					});

					_.each(newState.next, function(indexValue, indexIdx) {
						statesList.push(states[indexValue]);
					});

					statesList.unshift(newState);

					return statesList;
				},
				populateDynamicCells = function populateDynamicCells(requestData) {
					var $box = parent.find('.request-box[data-id="' + requestData.id + '"]'),
						isAdmin = monster.apps.auth.originalAccount.superduper_admin,
						$scheduledDate = $box.find('.scheduled-date'),
						$selectState = $box.find('.request-state'),
						requestState = requestData. port_state;

					$box
						.data({
							state: requestState,
							scheduled_date: requestData.hasOwnProperty('scheduled_date') ? requestData.scheduled_date : '',
							updated_date: requestData.updated
						});

					if (isAdmin) {
						if (requestState === 'completed') {
							$selectState
								.empty()
								.text(self.i18n.active().port.state[requestState]);

							$scheduledDate.empty();
						}
						else {
							var dataCell;

							$selectState
								.empty()
								.append($(monster.template(self, 'port-selectStates', { states: getStatesToDisplay(requestState) })));

							/**
							 * Render the scheduled date cell according to the state of port request
							 * and the value of scheduled_date (if it is set or not)
							 */
							if (requestState === 'scheduled') {
								if (requestData.hasOwnProperty('scheduled_date')) {
									dataCell = { scheduledDate: requestData.scheduled_date };
								}

								$scheduledDate
									.empty()
									.append($(monster.template(self, 'port-scheduledDateCell', dataCell)));
							}
							else {
								$scheduledDate
									.empty()
									.text(self.i18n.active().port.noScheduledDate);
							}
						}
					}
					else {
						$selectState
							.empty()
							.text(self.i18n.active().port.state[requestState]);

						/**
						 * Render the scheduled date cell according to the state of port request
						 * and the value of scheduled_date (if it is set or not)
						 */
						if (requestState === 'scheduled') {
							$scheduledDate
								.empty()
								.text(monster.util.toFriendlyDate(requestData.scheduled_date, 'shortDateTime'));
						}
						else {
							$scheduledDate
								.empty()
								.text(self.i18n.active().port.noScheduledDate);
						}
					}
				};

			if (args instanceof Array) {
				_.each(args, function(accountValue, accountIdx) {
					_.each(accountValue.port_requests, function(requestValue, requestIdx) {
						populateDynamicCells(requestValue);
					});
				});
			}
			else {
				populateDynamicCells(args);
			}
		},

		portPositionDialogBox: function() {

			$("html, body").animate({ scrollTop: "0" }, 100);
			if ( $('body').height() - ($('.ui-dialog').height() + 80) <= 0 ) {
				$('.ui-dialog').animate({top: '80'}, 200);
			} else {
				$('.ui-dialog').animate({top: ($("body").height() / 2) - ($('.ui-dialog').height() / 2)}, 200);
			}
		},

		portObjectsToArray: function(orders) {
			if ( typeof orders.length != 'undefined' ) {
				for (var order in orders ) {
					var numbers = new Array();

					for (var number in orders[order].numbers) {
						numbers.push(number);
					}

					delete orders[order].numbers;
					orders[order].numbers = numbers;
				}
			} else {
				var numbers = new Array();

				for (var number in orders.numbers) {
					numbers.push(number);
				}

				delete orders.numbers;
				orders.numbers = numbers;
			}

			return orders;
		},

		portArrayToObjects: function(node) {
			if (_.isArray(node)) {
				var object = {};

				_.each(node, function(value, idx) {
					object[value] = {};
				});

				return object;
			}
			else {
				return node;
			}
		},

		portReloadApp: function(parent, accountId) {
			var self = this,
				args = {};

			if (parent.hasClass('ui-dialog-content')) {
				parent.dialog('close');
				args.accountId = accountId;
			}
			else {
				parent.empty();
				args.parent = $('#monster-content');
			}

			self.portRender(args);
		},

		portComingSoon: function(context, targets) {
			var self = this

			targets.forEach(function(val, idx) {
				context.find(val).on('click', function(event) {
					event.preventDefault();

					var type = $(this).data('type');

					if (type === 'faq') {
						var popup = monster.ui.dialog(monster.template(self, 'port-faqPopup'), {
								title: 'Porting Manager FAQ',
								width: '800px'
							}),
							toggles = popup.find('.accordion-toggle');

						toggles
							.on('click', function() {
								toggles.removeClass('in');
								$(this).addClass('in');
							});
					}
					else {
						monster.ui.alert(self.i18n.active().port.comingSoon);
					}
				});
			})
		},

		portFormatNumbers: function(numbersArray, globalCallback) {
			var self = this,
				formattedData = { orders: [] },
				callbackError = function() {
					var order = {
						carrier: self.i18n.active().port.unknownCarrier,
						numbers: numbersArray
					};

					formattedData.orders.push(order);

					globalCallback && globalCallback(formattedData);
				};

			if(monster.config.api.hasOwnProperty('phonebook')) {
				monster.request({
					resource: 'common.numbers.metadata',
					data: {
						data: numbersArray,
						country: 'US'
					},
					success: function(data) {
						var formattedData = { orders: [] },
							carriersMap = {},
							addNumberToCarrier = function(carrierName, number) {
								var found = -1;
								
								if(carriersMap.hasOwnProperty(carrierName)) {
									formattedData.orders[carriersMap[carrierName]].numbers.push(number);
								}
								else {
									var newIndex = formattedData.orders.length;

									formattedData.orders.push({
										carrier: carrierName,
										numbers: [ number ]
									});

									carriersMap[carrierName] = newIndex;
								}
							};

						_.each(data.data, function(numberData, did) {
							if(numberData.hasOwnProperty('lrn') && numberData.lrn.hasOwnProperty('lerg') && numberData.lrn.lerg.hasOwnProperty('company') && numberData.lrn.lerg.company) {
								addNumberToCarrier(numberData.lrn.lerg.company, did);
							}
							else if(numberData.hasOwnProperty('lrn') && numberData.lrn.hasOwnProperty('carrier') && numberData.lrn.carrier.hasOwnProperty('dba') && numberData.lrn.carrier.dba) {
								addNumberToCarrier(numberData.lrn.carrier.dba, did);
							}
							else if(numberData.hasOwnProperty('carrier') && numberData.carrier.hasOwnProperty('dba') && numberData.carrier.dba) {
								addNumberToCarrier(numberData.carrier.dba, did);
							}
							else {
								addNumberToCarrier(self.i18n.active().port.unknownCarrier, did);
							}
						});

						globalCallback(formattedData);
					},
					error: callbackError
				});
			}
			else {
				callbackError();
			}
		},

		portSaveOrder: function(parent, accountId, data, index) {
			var self = this,
				orderExist = data.orders[index].hasOwnProperty('id');

			if (orderExist) {
				self.portRequestUpdate(accountId, data.orders[index].id, data.orders[index], function() {
					self.portReloadApp(parent, accountId);
				});
			}
			else {
				self.portRequestAdd(accountId, data.orders[index], function() {
					if (data.orders.length > 1) {
						data.orders.splice(index, 1);

						self.portRenderResumeOrders(parent, accountId, data);
					}
					else {
						self.portReloadApp(parent, accountId);
					}
				});
			}
		},

		portCancelOrder: function(parent, accountId, container, data, index) {
			var self = this,
				data = data || undefined,
				index = index || 0;

			container.find('div#footer').find('button.btn-danger').on('click', function() {
				if (typeof data === 'undefined') {
					self.portReloadApp(parent, accountId);
				}
				else {
					monster.ui.confirm(self.i18n.active().port.cancelOrderPopup, function() {
						if (data.orders[index].hasOwnProperty('id')) {
							self.portRequestDelete(accountId, data.orders[index].id, function() {
								self.portReloadApp(parent, accountId);
							});
						} else {
							if (data.orders.length > 1) {
								data.orders.splice(index, 1);
								self.portRenderResumeOrders(parent, accountId, data);
							} else {
								self.portReloadApp(parent, accountId);
							}
						}
					});
				}
			});
		},

		portGetRequest: function(accountId, requestId, data) {
			return data.filter(function(accountValue, accountIdx) {
				return accountValue.account_id === accountId;
			})[0].port_requests.filter(function(requestValue, requestIdx) {
				return requestValue.id === requestId;
			})[0];
		},

		portUpdateData: function(accountId, newRequest, data) {
			for (var accountIdx in data) {
				if (data[accountIdx].account_id === accountId) {
					for (var requestIdx in data[accountIdx].port_requests) {
						if (data[accountIdx].port_requests[requestIdx].id === newRequest.id) {
							data[accountIdx].port_requests[requestIdx] = newRequest;
						}
						break;
					}
				}
				break;
			}
		},

		/**
		 * Because of the way attachments are stored (in base64),
		 * we needed a way to trigger the browser modal download
		 * and the jQuery .click() method was not triggering it
		 * automaticaly so we had to use the HTMLElement.click()
		 * @param  {String} type name of the attachment
		 * @param  {String} data base64 pdf to download
		 */
		portGhettoAttachmentDownload: function(name, data) {
			var link = document.getElementById('download_attachment');

			link.href = data;
			link.download = name;
			link.click();
		},

		/* Request */
		portRequestAdd: function(accountId, order, callbackSuccess, callbackError) {
			var self = this,
				attachments = {};

			if (order.hasOwnProperty('bill_attachment')) {
				attachments.bill = order.bill_attachment;
				delete order.bill_attachment;
			}

			if (order.hasOwnProperty('loa_attachment')) {
				attachments.loa = order.loa_attachment;
				delete order.loa_attachment;
			}

			if (order.hasOwnProperty('resporg_attachment')) {
				attachments.resporg = order.resporg_attachment;
				delete order.resporg_attachment;
			}

			order = $.extend(true, order, { port_state: 'unconfirmed' });

			order.numbers = self.portArrayToObjects(order.numbers);

			self.callApi({
				resource: 'port.create',
				data: {
					accountId: accountId,
					data: order
				},
				success: function(data, status) {
					var portRequestId = data.data.id,
						serializedRequests = {};

					_.each(attachments, function(value, key) {
						serializedRequests[key] = function(callback) {
							self.portRequestAddAttachment(accountId, portRequestId, key.concat('.pdf'), value, function(data) {
								callback(null, data);
							});
						}
					});

					monster.series(serializedRequests,
						function(err, results) {
							if (err) {
								callbackError && callbackError();
							}
							else {
								callbackSuccess && callbackSuccess(portRequestId);
							}
						}
					);
				},
				error: function(data, status){
					callbackError && callbackError();
				}
			});
		},

		portRequestUpdate: function(accountId, portRequestId, order, callbackSuccess, callbackError) {
			var self = this;

			order.numbers = self.portArrayToObjects(order.numbers);

			if (order.hasOwnProperty('bill_attachment')) {
				delete order.bill_attachment;
			}

			if (order.hasOwnProperty('loa_attachment')) {
				delete order.loa_attachment;
			}

			if (order.hasOwnProperty('resporg_attachment')) {
				delete order.resporg_attachment;
			}

			self.callApi({
				resource: 'port.update',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: order
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data, status){
					callbackError && callbackError();
				}
			});
		},

		portRequestDelete: function(accountId, portRequestId, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.delete',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess();
				},
				error: function(data, status){
					callbackError && callbackError();
				}
			});
		},

		portRequestList: function(args) {
			var self = this,
				mapStates = {
					allOpenState: ['unconfirmed', 'submitted', 'pending', 'scheduled', 'rejected'],
					allState : ['all']
				},
				fnToUse = args.withDescendants ? 'portRequestListByDescendants' : 'portRequestListUniqueState';

			if(mapStates.hasOwnProperty(args.state)) {
				var parallelRequests = {},
					resultsArray = [];

				_.each(mapStates[args.state], function(loopState) {
					parallelRequests[loopState] = function(callback) {
						self[fnToUse](args.accountId, loopState, function(res) {
							callback(null, res);
						});
					}
				});

				monster.parallel(parallelRequests, function(err, results) {
					_.each(results, function(stateArray) {
						resultsArray = resultsArray.concat(stateArray);
					});

					args.success(resultsArray);
				});
			}
			else {
				self[fnToUse](args.accountId, args.state, args.success, args.error);
			}
		},

		portRequestListUniqueState: function(accountId, state, callbackSuccess, callbackError) {
			var self = this,
				apiResource = (state === 'all') ? 'port.list' : 'port.listByState',
				apiData = {
					accountId: accountId,
					filters: {
						paginate: false
					}
				};

			if(state !== 'all') {
				apiData.state = state || 'submitted';
			}

			self.callApi({
				resource: apiResource,
				data: apiData,
				success: function(data, status) {
					var requests = (data.data.length === 1 && 'port_requests' in data.data[0]) ? data.data[0].port_requests : data.data;
					callbackSuccess && callbackSuccess(self.portObjectsToArray(requests));
				},
				error: function(data, status){
					callbackError && callbackError();
				}
			});
		},

		portRequestListByDescendants: function(accountId, state, callbackSuccess, callbackError) {
			var self = this,
				apiResource = (state === 'all') ? 'port.listDescendants' : 'port.listDescendantsByState',
				apiData = {
					accountId: accountId,
					filters: {
						paginate: false
					}
				};

			if(state !== 'all') {
				apiData.state = state || 'submitted';
			}

			self.callApi({
				resource: apiResource,
				data: apiData,
				success: function(data, status) {
					var data = data.data;

					for (var k in data) {
						data[k].port_requests = self.portObjectsToArray(data[k].port_requests);
					}

					callbackSuccess && callbackSuccess(data);
				},
				error: function(data, status) {
					callbackError && callbackError();
				}
			});
		},

		portRequestGet: function(accountId, portRequestId, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.get',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(self.portObjectsToArray(data.data));
				},
				error: function(data, status){
					callbackError && callbackError();
				}
			});
		},

		portRequestGetDescendants: function(accountId, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.listDescendants',
				data: {
					accountId: accountId,
					data: {}
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data, status){
					callbackError && callbackError();
				}
			});
		},

		portRequestListAttachments: function(accountId, portRequestId, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.listAttachments',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data, status){
					callbackError && callbackError();
				}
			});
		},

		portRequestAddAttachment: function(accountId, portRequestId, documentName, data, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.createAttachment',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					documentName: documentName,
					data: data
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data,status) {
					callbackError && callbackError();
				}
			});
		},

		portRequestUpdateAttachment: function(accountId, portRequestId, documentName, data, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.updateAttachment',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					documentName: documentName,
					data: data
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess();
				},
				error: function(data, status) {
					callbackError && callbackError();
				},
			});
		},

		portRequestDeleteAttachment: function(accountId, portRequestId, documentName) {
			var self = this;

			self.callApi({
				resource: 'port.deleteAttachment',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					documentName: documentName,
					data: {}
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess();
				},
				error: function(data, status) {
					callbackError && callbackError();
				}
			});
		},

		portRequestGetAttachment: function(accountId, portRequestId, documentName, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.getAttachment',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					documentName: documentName,
					data: {},
					generateError: false
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data);
				},
				error: function(data, status) {
					callbackError && callbackError(data);
				}
			});
		},

		portRequestChangeState: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.changeState',
				data: _.extend({
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(data, status) {
					if (parseInt(data.error, 10) !== 402) {
						args.hasOwnProperty('error') && args.error();
					}
				},
				onChargesCancelled: function() {
					args.hasOwnProperty('cancel') && args.cancel();
				}
			});
		},

		portRequestReadyState: function(accountId, portRequestId, data, callbackSuccess, callbackError) {
			var self = this;

			data.port_state = 'submitted';

			self.callApi({
				resource: 'port.update',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: data
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess();
				},
				error: function(data, status) {
					callbackError && callbackError();
				}
			});
		},

		portRequestListUsers: function(accountId, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'user.list',
				data: {
					accountId: accountId
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data, status) {
					callbackError && callbackError();
				}
			});
		},

		portRequestSearchNumber: function(accountId, number, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.searchNumber',
				data: {
					accountId: accountId,
					number: number
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data, status) {
					callbackError && callbackError();
				}
			});
		},

		portRequestSearchNumberByDescendants: function(accountId, number, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.searchNumberByDescendants',
				data: {
					accountId: accountId,
					number: number
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data, status) {
					callbackError && callbackError();
				}
			});
		},

		portRequestGetAccount: function(accountId, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'account.get',
				data: {
					accountId: accountId
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data, status) {
					callbackError && callbackError();
				}
			});
		}
	};

	return app;
});
