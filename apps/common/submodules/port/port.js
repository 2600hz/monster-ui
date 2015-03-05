
define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		bootstrapSwitch = require('bootstrap-switch'),
		fileUpload = require('fileupload'),
		monster = require('monster'),
		timepicker = require('timepicker'),
		toastr = require('toastr');

	var app = {

		requests: {
			'common.numbers.metadata': {
				apiRoot: 'http://69.164.206.244/number_manager/api/index.php/',
				url: 'numbers/{country}/meta',
				verb: 'POST'
			}
		},

		subscribe: {
			'common.port.render': 'portRender'
		},

		isLaunchedInAppMode: true,

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

			if (args.hasOwnProperty('accountId')) {
				self.isLaunchedInAppMode = false;
			}

			self.portRenderPendingOrder(parent, accountId);
		},

		portRenderPendingOrder: function(parent, accountId) {
			var self = this;

			parent.empty();

			self.portListRequests(accountId, function(data) {
				var template = monster.template(self, 'port-pendingOrders', {
						data: data,
						isAdmin: monster.apps.auth.originalAccount.superduper_admin
					});

				parent.append(template);

				if (parent.hasClass('ui-dialog-content')) {
					parent.dialog('open');
				}

				self.portRenderStateCell(parent, data);
				self.portBindPendingOrderEvents(parent, accountId);
			});
		},

		portBindPendingOrderEvents: function(parent, accountId) {
			var self = this,
				container = parent.find('#orders_list');

			self.portPositionDialogBox();

			container.find('span.pull-right a').on('click', function() {
				self.portRenderAddNumber(parent, accountId);
			});

			container.find('.account-header').on('click', function() {
				var section = $(this).parents('.account-section');

				if (section.hasClass('active')) {
					section.find('.requests-wrapper').slideUp(function() {
						section.find('.left-part i')
							.removeClass('icon-chevron-down icon-white')
							.addClass('icon-chevron-right');

						section.removeClass('active');
					});
				}
				else {
					section.addClass('animate');
					section.find('.requests-wrapper').slideDown(function() {
						section.find('.left-part i')
							.removeClass('icon-chevron-right')
							.addClass('icon-chevron-down icon-white');

						section.removeClass('animate');
						section.addClass('active');
					});
				}
			});

			container.find('.request-box .request-state').on('change', '.switch-state', function(event) {
				var el = $(this),
					box = el.parents('.request-box'),
					portRequestId = box.data('id'),
					newState = el.val();

				self.portRequestChangeState(accountId, portRequestId, newState, function() {
					self.portRenderStateCell(container, newState, portRequestId);

					box.find('.continue-request, .delete-request')
						.remove();

					toastr.success(self.i18n.active().port.toastr.success.request.update);
				}, function() {
					toastr.error(self.i18n.active().port.toastr.error.request.update);
				});
			});

			container.find('.actions li').on('click', function() {
				var li = $(this),
					portRequestId = li.parents('.request-box').data('id');

				self.portRequestGet(accountId, portRequestId, function(data) {

					if (li.hasClass('continue-request')) {
						var template = monster.template(self, 'port-submitDocuments', data),
							dataList = { orders: [data] };

						parent
							.empty()
							.append(template);

						self.portRenderSubmitDocuments(parent, accountId, dataList);
					}
					else if (li.hasClass('info-request')) {
						var template = monster.template(self, 'port-requestInfo', data),
							dialogOptions = {
								width: '560px',
								position: ['center', 20],
								title: self.i18n.active().port.infoPopup.title
							};

						monster.ui.dialog(template, dialogOptions);
					}
					else if (li.hasClass('delete-request')) {
						self.portRequestDelete(accountId, portRequestId, function() {
							li.parents('.request-box')
								.remove();

							toastr.success(self.i18n.active().port.toastr.success.request.delete);
						});
					}
					/*
					 * TODO: Uncomment and add HTML when we figured out how to manage comment's notifications
					else if (li.hasClass('comments-request')) {
						self.portRenderComments(parent, accountId, portRequestId);
					}
					*/
				})
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
					id = el.data('id');

				monster.ui.confirm(self.i18n.active().port.infoPopup.confirm.deleteComment, function() {
					comments.forEach(function(v, i, a) {
						if (v.timestamp === id) {
							comments.splice(i, 1);
						}
					});

					data.comments = comments;

					self.portRequestUpdate(accountId, data, function(data) {
						comment.fadeOut('400', function() {
							$(this).remove();

							if (_.isEmpty(data.comments)) {
								container.find('.comments').slideUp();
							}

							toastr.success(self.i18n.active().port.toastr.success.comment.delete);
						});
					});
				});
			});

			container.find('.actions .btn-success').on('click', function() {
				var currentUser = monster.apps.auth.currentUser,
					newComment = {
						user_id: self.userId,
						timestamp: monster.util.dateToGregorian(new Date()),
						content: container.find('.wysiwyg-editor').html(),
						superduper_comment: container.find('#superduper_comment').is(':checked')
					};

				comments.push(newComment);
				data.comments = comments;

				self.portRequestUpdate(accountId, data, function() {
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

			container.find('button').on('click', function() {
				var numbersArray = container.find('input').val().split(' ');

				numbersArray = numbersArray.filter(function(el, idx) {
					if ( el && /(^1[0-9]{10}$)|(^[0-9]{10}$)/.test(el) ) {
						return el;
					}
				});

				if (numbersArray.length === 0) {
					toastr.error(self.i18n.active().port.toastr.error.number.multiple);

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

			self.portBindManageOrdersEvents(parent, accountId);
		},

		portBindManageOrdersEvents: function(parent, accountId) {
			var self = this,
				container = parent.find('#port_container');

			self.portPositionDialogBox();
			self.portCancelOrder(parent, accountId, container);
			self.portComingSoon(container, ['#footer .help-links li:not(.separator) a']);

			monster.ui.prettyCheck.create(container.find('#eula'));

			container.on('click', 'div#add_numbers button', function() {
				var numbersArray = container.find('div#add_numbers').find('input').val().split(' ');

				numbersArray = numbersArray.filter(function(el, idx) {
					if ( el && /(^1[0-9]{10}$)|(^[0-9]{10}$)/.test(el) ) {
						return el;
					}
				});

				if (numbersArray.length === 0) {
					toastr.error(self.i18n.active().port.toastr.error.number.multiple);
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

						for (var order in formattedData.orders) {
							container.find('#manage_orders').find('div.order').each(function(index, el) {
								var carrier = $(this).find('h4').text();

								if (carrier == formattedData.orders[order].carrier) {
									for (var number in formattedData.orders[order].numbers) {
										$(this).find('ul').append('<li data-value="' + formattedData.orders[order].numbers[number] + '" data-carrier="' + carrier + '"><i class="icon-warning-sign"></i>' + formattedData.orders[order].numbers[number] + '<i class="icon-remove-sign pull-right"></i></li>');
									}

									formattedData.orders.splice(order, 1);
								}
							});

							if (formattedData.orders.length != 0) {
								container
									.find('div#manage_orders')
									.find('div.row-fluid:last-child')
									.append($(monster.template(self, 'port-order', formattedData.orders[order])));
							}
						}
					});
				}
			});

			container.on('click', '#manage_orders li i.icon-remove-sign', function() {
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

			container.find('div#footer').find('button.btn-success').on('click', function() {
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

					self[ordersList.orders.length === 1 ? 'portRenderSubmitDocuments' : 'portRenderResumeOrders'](parent, accountId, ordersList);
				}
				else {
					container.find('div#eula').find('input').each(function() {
						if (!$(this).is(':checked')) {
							$(this).parent().parent().addClass('error');
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

			container.find('button').on('click', function() {
				var index = $(this).data('index');

				self.portRenderSubmitDocuments(parent, accountId, data, index);
			});
		},

		portRenderSubmitDocuments: function(parent, accountId, data, index) {
			var self = this,
				index = index || 0,
				template = $(monster.template(self, 'port-submitDocuments', data.orders[index]));

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
				'#loa h4 a',
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
				else if (type === 'loa') {
					options['bigBtnClass'] = 'btn span10';
					options['bigBtnText'] = self.i18n.active().port.submitDocuments.loaUploadStep;
					options['btnClass'] = 'btn';
				}

				input.fileUpload(options);
			});

			container.find('div#upload_bill').find('i.icon-remove-sign').on('click', function() {
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

			container.find('div#continue_later').find('button.btn-info').on('click', function() {
				var transferNameForm = container.find('#transfer_name_form');

				monster.ui.validate(transferNameForm);

				if (monster.ui.valid(transferNameForm)) {
					var transferNameFormData = monster.ui.getFormData('transfer_name_form', '.', true),
						billFormData = monster.ui.getFormData('bill_form', '.', true);

					$.extend(true, data.orders[index], billFormData, transferNameFormData);

					self.portSaveOrder(parent, accountId, data, index);
				}
			});

			container.find('#footer button.btn-success').on('click', function() {
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
					}

					$.extend(true, order, billFormData, transferNameFormData);

					self.portRenderConfirmOrder(parent, accountId, data, index);
				}
			});
		},

		portRenderConfirmOrder: function(parent, accountId, data, index) {
			var self = this,
				order = data.orders[index],
				date = monster.util.dateToGregorian(monster.util.getBusinessDate(4)),
				created = order.hasOwnProperty('created') ? order.created : date,
				transferDate = order.hasOwnProperty('transfer_date') ? order.transfer_date : date,
				dataTemplate = $.extend(true, {}, order, {
					total: order.numbers.length,
					price: order.numbers.length * 5,
					transfer_date: date - transferDate >= 0 ? date : transferDate,
					created: created
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
				toggleInput = container.find('.switch'),
				order = data.orders[index];

			self.portPositionDialogBox(),
			self.portCancelOrder(parent, accountId, container, data, index);
			self.portComingSoon(container, ['#footer .help-links li:not(.separator) a']);

			datePickerInput.datepicker({
				minDate: monster.util.getBusinessDate(4),
				beforeShowDay: $.datepicker.noWeekends,
				constrainInput: true,
				dateFormat: 'mm/dd/yy',
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

			toggleInput.bootstrapSwitch();

			container.find('#numbers_to_buy option')
				.last()
				.prop('selected', 'selected');

			if (order.hasOwnProperty('temporary_numbers') && order.temporary_numbers > 0) {
				toggleInput.bootstrapSwitch('setState', true);

				container.find('#temporary_numbers_form div.row-fluid:nth-child(2)')
					.slideDown('400', function() {
						container.find('#numbers_to_buy')
							.val(order.temporary_numbers - 1)
							.prop('disabled', false);
					});
			}
			else {
				toggleInput.bootstrapSwitch('setState', false);

				container.find('#numbers_to_buy')
						.prop('disabled', true);

				container.find('#temporary_numbers_form div.row-fluid:nth-child(2)')
					.slideUp('400');
			}

			toggleInput.on('switch-change', function() {
				var input = $(this);

				if (input.find('div.switch-animate').hasClass('switch-off')) {
					container.find('#numbers_to_buy')
						.prop('disabled', true);

					container.find('#temporary_numbers_form div.row-fluid:nth-child(2)')
						.slideUp('400');
				} else if (input.find('div.switch-animate').hasClass('switch-on')) {
					container.find('#temporary_numbers_form div.row-fluid:nth-child(2)')
						.slideDown('400', function() {
							container.find('#numbers_to_buy')
								.prop('disabled', false);
						});
				}
			});

			container.find('#numbers_to_buy option').each(function(idx, el) {
				var elem = $(el);

				elem.val(parseInt(elem.val(), 10) + 1)
					.text(elem.val());
			});

			container.find('#continue_later button').on('click', function() {
				var notificationEmailFormData = monster.ui.getFormData('notification_email_form', '.', true),
					temporaryNumbersFormData = monster.ui.getFormData('temporary_numbers_form'),
					transferDateFormData = monster.ui.getFormData('transfer_date_form');

				$.extend(true, order, notificationEmailFormData, transferDateFormData, temporaryNumbersFormData);

				order.transfer_date = monster.util.dateToGregorian(new Date(order.transfer_date));

				if (container.find('.switch-animate').hasClass('switch-off')) {
					delete order.temporary_numbers;
				}

				self.portSaveOrder(parent, accountId, data, index);
			});

			container.find('#footer button.btn-success').on('click', function() {
				var notificationEmailForm = container.find("#notification_email_form");

				monster.ui.validate(notificationEmailForm);

				if (monster.ui.valid(notificationEmailForm)) {
					var notificationEmailFormData = monster.ui.getFormData('notification_email_form'),
						temporaryNumbersFormData = monster.ui.getFormData('temporary_numbers_form'),
						transferDateFormData = monster.ui.getFormData('transfer_date_form');

					$.extend(true, order, notificationEmailFormData, transferDateFormData, temporaryNumbersFormData);

					order.transfer_date = monster.util.dateToGregorian(new Date(order.transfer_date));

					if (container.find('.switch-animate').hasClass('switch-off')) {
						delete order.temporary_numbers;
					}

					if (order.hasOwnProperty('id')) {
						self.portRequestUpdate(accountId, order, function() {
							if (order.hasOwnProperty('port_sate')) {
								self.portReloadApp(parent, accountId);
							}
							else {
								self.portRequestChangeState(accountId, order.id, 'submitted', function() {
									self.portReloadApp(parent, accountId);
								});
							}
						});
					}
					else {
						self.portRequestAdd(accountId, order, function(portRequestId) {
							data.orders.splice(index, 1);

							self.portRequestChangeState(accountId, portRequestId, 'submitted', function() {
								if (data.orders.length > 0) {
									self.portRenderResumeOrders(parent, accountId, data);
								}
								else {
									self.portReloadApp(parent, accountId);
								}
							});
						});
					}
				}
			});
		},

		/* Methods */
		portListRequests: function(accountId, callback) {
			var self = this;

			monster.parallel({
					requests: function(callback) {
						self.portRequestList(accountId, function(data) {
							callback(null, data);
						});
					},
					descendants: function(callback) {
						if (self.isLaunchedInAppMode) {
							self.portRequestListByDescendants(accountId, function(data) {
								callback(null, data);
							});
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

		portRenderStateCell: function(parent, data, portRequestId) {
			var self = this,
				isAdmin = monster.apps.auth.originalAccount.superduper_admin,
				states = [
					{ value: 'unconfirmed', next: [1] },
					{ value: 'submitted', next: [2,4] },
					{ value: 'pending', next: [3,4,5] },
					{ value: 'scheduled', next: [4,5] },
					{ value: 'rejected', next: [1,5] },
					{ value: 'completed', next: [] }
				],
				getStatesToDisplay = function(nextState) {
					var statesList = [];

					for (var i = 0, len = states.length; i < len; i++) {
						if (nextState === states[i].value) {
							var indexList = states[i].next;

							indexList.forEach(function(v, idx) {
								statesList.push(states[v]);
							});

							statesList.unshift(states[i]);

							break;
						}
					}

					return statesList;
				};

			for (var k in states) {
				states[k].text = self.i18n.active().port.state[states[k].value];
			}

			if (typeof portRequestId === 'string') {
				if (isAdmin) {
					if (data === 'completed') {
						parent
							.find('.request-box[data-id="' + portRequestId + '"] .request-state')
							.empty()
							.text(self.i18n.active().port.state[data]);
					}
					else {
						parent
							.find('.request-box[data-id="' + portRequestId + '"] .request-state')
							.empty()
							.append($(monster.template(self, 'port-selectStates', { states: getStatesToDisplay(data) })));
					}
				}
			}
			else {
				for (var i = 0, len = data.length; i < len; i++) {
					_.each(data[i].port_requests, function(val, key) {
						var box = parent .find('.request-box[data-id="' + val.id + '"] .request-state');

						if (isAdmin) {
							if (val.port_state === 'completed') {
								box.empty()
									.text(self.i18n.active().port.state[val.port_state]);
							}
							else {
								box.empty()
									.append($(monster.template(self, 'port-selectStates', { states: getStatesToDisplay(val.port_state) })));
							}
						}
						else {
							box.empty()
								.text(self.i18n.active().port.state[val.port_state]);
						}
					});
				}
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

		portArrayToObjects: function(order) {
			if (Array.isArray(order.numbers)) {
				var numbers = order.numbers;

				delete order.numbers;
				order.numbers = new Object();
				for (var number in numbers) {
					order.numbers[numbers[number]] = new Object();
				}
			}

			return order;
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
					monster.ui.alert(self.i18n.active().port.comingSoon);
				});
			})
		},

		portFormatNumbers: function(numbersArray, callback) {
			var self = this;

			monster.request({
				resource: 'common.numbers.metadata',
				data: {
					data: numbersArray,
					country: 'US'
				},
				success: function(data) {
					data = data.data;

					var carriersList = [],
						formattedData = { orders: [] };

					for (var number in data) {
						if (data[number].company == null || data[number].company == 'undefined' || data[number].company == "") {
							data[number].company = self.i18n.active().port.unknownCarrier;
						}

						if (carriersList.indexOf(data[number].company) === -1) {
							carriersList.push(data[number].company);
						}
					}

					for (var carrier in carriersList) {
						var numbersArray = [],
							order = {};

						for (var number in data) {
							if (data[number].company == carriersList[carrier]) {
								numbersArray.push(number);
							}
						}

						order.carrier = carriersList[carrier];
						order.numbers = numbersArray;

						formattedData.orders[carrier] = order;
					}

					callback(formattedData);
				}
			});
		},

		portSaveOrder: function(parent, accountId, data, index) {
			var self = this,
				orderExist = data.orders[index].hasOwnProperty('id');

			if (orderExist) {
				self.portRequestUpdate(accountId, data.orders[index], function() {
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

			order = $.extend(true, order, { port_state: 'unconfirmed' });

			order = self.portArrayToObjects(order);

			self.callApi({
				resource: 'port.create',
				data: {
					accountId: accountId,
					data: order
				},
				success: function(data, status) {
					var portRequestId = data.data.id;

					if (attachments.hasOwnProperty('bill')) {
						self.portRequestAddAttachment(accountId, portRequestId, 'bill.pdf', attachments.bill, function(data) {
							if (attachments.hasOwnProperty('loa')) {
								self.portRequestAddAttachment(accountId, portRequestId, 'loa.pdf', attachments.loa, function(data) {
									callbackSuccess && callbackSuccess(portRequestId);
								});
							}
							else {
								callbackSuccess && callbackSuccess(portRequestId);
							}
						});
					}
					else {
						if (attachments.hasOwnProperty('loa')) {
							self.portRequestAddAttachment(accountId, portRequestId, 'loa.pdf', attachments.loa, function(data) {
								callbackSuccess && callbackSuccess(portRequestId);
							});
						}
						else {
							callbackSuccess && callbackSuccess(portRequestId);
						}
					}
				},
				error: function(data, status){
					callbackError && callbackError();
				}
			});
		},

		portRequestUpdate: function(accountId, order, callbackSuccess, callbackError) {
			var self = this,
				portRequestId = order.id;

			order = self.portArrayToObjects(order);

			if (order.hasOwnProperty('bill_attachment')) {
				delete order.bill_attachment;
			}

			if (order.hasOwnProperty('loa_attachment')) {
				delete order.loa_attachment;
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

		portRequestList: function(accountId, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.list',
				data: {
					accountId: accountId,
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

		portRequestListByDescendants: function(accountId, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.listDescendants',
				data: {
					accountId: accountId,
					filters: {
						paginate: false
					}
				},
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
					data: {}
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data, status) {
					callbackError && callbackError();
				}
			});
		},

		portRequestChangeState: function(accountId, portRequestId, state, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'port.changeState',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					state: state,
					data: {}
				},
				success: function(data, status) {
					callbackSuccess && callbackSuccess();
				},
				error: function(data, status) {
					if (parseInt(data.error, 10) !== 402) {
						callbackError && callbackError();
					}
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
		}
	};

	return app;
});
