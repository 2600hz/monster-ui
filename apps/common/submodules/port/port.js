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

		portRender: function(args){
			var self = this,
				args = args || {},
				accountId = args.accountId || self.accountId;

			self.portPositionDialogBox();

			self.portRequestList(accountId, function(data) {
				var portTemplate = $(monster.template(self, 'port-pendingOrders', {
						data: data,
						isAdmin: monster.apps.auth.originalAccount.superduper_admin
					})),
					parent = args.parent || monster.ui.dialog('', {
						width: '940px',
						position: ['center', 20],
						title: self.i18n.active().port.dialogTitle
					});

				parent.empty().append(portTemplate);

				self.portRenderStateCell(parent, data);

				self.portPendingOrders(accountId, parent, data);
			});
		},

		portRenderStateCell: function(parent, data, portRequestId){
			var self = this,
				isAdmin = monster.apps.auth.originalAccount.superduper_admin,
				states = [
					{ value: 'unconfirmed', 'text': '', next: [1] },
					{ value: 'submitted', 'text': '', next: [2,3,4] },
					{ value: 'scheduled', 'text': '', next: [3,4] },
					{ value: 'rejected', 'text': '', next: [1,4] },
					{ value: 'completed', 'text': '', next: [] }
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
							.find('.collapse[data-id="' + portRequestId + '"] td:nth-child(3)')
							.empty()
							.text(self.i18n.active().port.state[data]);
					}
					else {
						parent
							.find('.collapse[data-id="' + portRequestId + '"] td:nth-child(3)')
							.empty()
							.append($(monster.template(self, 'port-selectStates', { states: getStatesToDisplay(data) })));
					}
				}
			}
			else {
				_.each(data, function(val, key) {
					var td = parent .find('.collapse[data-id="' + val.id + '"] td:nth-child(3)');

					if (isAdmin) {
						if (val.port_state === 'completed') {
							td.empty()
								.text(self.i18n.active().port.state[val.port_state]);
						}
						else {
							td.empty()
								.append($(monster.template(self, 'port-selectStates', { states: getStatesToDisplay(val.port_state) })));
						}
					}
					else {
						td.empty()
							.text(self.i18n.active().port.state[val.port_state]);
					}
				});
			}
		},

		/**
		  * @desc bind events of the port-pendingOrders template
		  * @param parent - .ui-dialog-content
		*/
		portPendingOrders: function(accountId, parent, data) {
			var self = this,
				container = parent.find('#orders_list');

			self.portPositionDialogBox();

			/*
			 * on click on a tr in the table
			 * show/hide the numbers of the port clicked in the table
			 */
			container.find('tr.collapse').on('click', function() {
				var caret = $(this).find('i[class^="icon-caret-"]'),
					changeCaretDiretion = function(element, direction) {
						element.prop('class', 'icon-caret-' + direction);
					};

				if ( !$(this).hasClass('active') ) {
					changeCaretDiretion(container.find('tr.collapse.active').find('i.icon-caret-down'), 'right');

					container
						.find('tr.collapse.active')
						.removeClass('active');

					container
						.find('tr[data-id]:not(.collapse)')
						.css('display', 'none');

					container
						.find('tr[data-id="' + $(this).data('id') + '"]:not(.collapse)')
						.css('display', 'table-row');

					changeCaretDiretion(caret, 'down');

					$(this).addClass('active');
				} else {

					container
						.find('tr[data-id="' + $(this).data('id') + '"]:not(.collapse)')
						.css('display', 'none');

					changeCaretDiretion(caret, 'right');

					$(this).removeClass('active');
				}
			});

			/*
			 * on click on the Start New Transfer link
			 * empty .ui-dialog-content and load port-addNumbers template
			 */
			container.find('span.pull-right').find('a').on('click', function() {
				parent
					.empty()
					.append($(monster.template(self, 'port-addNumbers')));

				self.portAddNumbers(accountId, parent);
			});

			container.find('.collapse td:nth-child(3)').on('click', '.switch-state', function(event) {
				event.stopPropagation();
			});

			container.find('.collapse td:nth-child(3)').on('change', '.switch-state', function(event) {
				var el = $(this),
					portRequestId = el.parents('.collapse').data('id'),
					newState = $(this).val();

				self.portRequestChangeState(accountId, portRequestId, newState, function() {
					var button = el.parents('.collapse').find('td:last-child button');

					self.portRenderStateCell(container, newState, portRequestId);

					if (newState === 'unconfirmed') {
						button
							.removeClass('btn-info')
							.addClass('btn-success')
							.text(self.i18n.active().port.pendingOrders.continueButton);
					}
					else {
						button
							.removeClass('btn-success')
							.addClass('btn-info')
							.text(self.i18n.active().port.pendingOrders.infoButton);
					}

					toastr.success(self.i18n.active().port.toastr.success.request.update);
				}, function() {
					toastr.error(self.i18n.active().port.toastr.error.request.update);
				});
			});

			/*
			 * on click on the continue button
			 * empty .ui-dialog-content and load port-submitDocuments template
			 */
			container.find('td:last-child').find('button').on('click', function(event) {
				var button = $(this);
				event.stopPropagation();

				self.portRequestGet(accountId, $(this).parent().parent().data('id'), function(data) {
					if ( button.hasClass('btn-success') ) {
						parent
							.empty()
							.append($(monster.template(self, 'port-submitDocuments', data)));

						self.portSubmitDocuments(accountId, parent, { orders: [data] });
					}
					else {
						var popup = $(monster.ui.dialog(
								$(monster.template(self, 'port-requestInfo', data)),
								{
									title: self.i18n.active().port.infoPopup.title,
									width: '560px',
									position: ['center', 20]
								}
							));
					}
				})
			});

			container.find('.collapse td:last-child .icon-comments').on('click', function(event) {
				event.stopPropagation();
				var portRequestId = $(this).parents('.collapse').data('id'),
					currentUser = monster.apps.auth.currentUser;

				self.portRequestGet(accountId, portRequestId, function(data) {
					var template = $(monster.template(self, 'port-commentsPopup', { isAdmin: monster.apps.auth.originalAccount.superduper_admin })),
						comments = data.hasOwnProperty('comments') ? data.comments : [],
						initPopup = function() {
							var popup = $(monster.ui.dialog(template, {
								title: self.i18n.active().port.commentsPopup.title,
								width: '960px',
								position: ['center', 20]
							}));

							monster.ui.wysiwyg(popup.find('.wysiwyg-container'));

							popup.find('.comments').on('click', '.delete-comment', function() {
								var comment = $(this).parents('.comment'),
									id = $(this).data('id');

								monster.ui.confirm(self.i18n.active().port.infoPopup.confirm.deleteComment, function() {
									comments.forEach(function(v, i, a) {
										if (v.timestamp === id) {
											comments.splice(i, 1);
										}
									});

									data.comments = comments;

									self.portRequestUpdate(accountId, portRequestId, data, function(data) {
										comment.fadeOut('400', function() {
											$(this).remove();

											if (_.isEmpty(data.comments)) {
												popup.find('.comments').slideUp();
											}

											toastr.success(self.i18n.active().port.toastr.success.comment.delete);
										});
									});
								});
							});

							popup.find('.actions .btn-success').on('click', function() {
								var newComment = {
										user_id: self.userId,
										timestamp: monster.util.dateToGregorian(new Date()),
										content: popup.find('.wysiwyg-editor').html(),
										superduper_comment: popup.find('#superduper_comment').is(':checked')
									};

								comments.push(newComment);
								data.comments = comments;

								self.portRequestUpdate(accountId, portRequestId, data, function() {
									newComment.author = currentUser.first_name.concat(' ', currentUser.last_name);
									newComment.isAdmin = monster.apps.auth.originalAccount.superduper_admin;

									popup
										.find('.comments')
										.show()
										.append($(monster.template(self, 'port-comment', newComment)));

									popup
										.find('.comments .comment:last-child .comment-body')
										.html(newComment.content);

									popup.find('.comments').animate({
											scrollTop: popup.find('.comments').scrollTop() + popup.find('.comments .comment:last-child').position().top
										}, 300, function() {
											monster.ui.fade($(this).find('.comment:last-child'));
									});

									popup.find('.wysiwyg-editor').empty();
								});
							});
						};

					if (_.isEmpty(comments)) {
						template.find('.comments').hide();
						initPopup();
					}
					else {
						self.callApi({
							resource: 'user.list',
							data: {
								accountId: accountId
							},
							success: function(data, status) {

								var users = (function arrayToObject(usersArray) {
										var usersObject = {};

										usersArray.forEach(function(v, i) {
											usersObject[v.id] = v.first_name.concat(' ', v.last_name);
										});

										return usersObject;
									})(data.data);

								comments.forEach(function(v, i) {
									v.author = users[v.user_id];
									v.isAdmin = monster.apps.auth.originalAccount.superduper_admin;

									if (v.superduper_comment ? monster.apps.auth.originalAccount.superduper_admin : true) {
										template
											.find('.comments')
											.append($(monster.template(self, 'port-comment', v)));

										template
											.find('.comments .comment:last-child .comment-body')
											.html(v.content);
									}
								});

								initPopup();
							}
						});
					}
				});
			});

			container.find('.collapse td:last-child .icon-comments').hover(function() {
				$(this).toggleClass('icon-comments icon-comments-alt');
			});
		},

		/**
		  * @desc bind events of the port-resumeOrders template
		  * @param parent - .ui-dialog-content
		*/
		portResumeOrders: function(accountId, parent, data) {
			var self = this,
				container = parent.find('div#resume_orders');

			$.each(container.find('.row-fluid'), function(key, elem) {
				$(elem).find('.order-key').text((parseInt($(elem).find('.order-key').text(), 10) + 1).toString());
			});

			self.portPositionDialogBox();

			/*
			 * on click the Complete this order button
			 * empty .ui-dialog-content and load port-submitDocuments template
			 */
			container.find('button').on('click', function() {
				parent
					.empty()
					.append($(monster.template(self, 'port-submitDocuments', data.orders[$(this).data('index')])));

				self.portSubmitDocuments(accountId, parent, data, $(this).data('index'));
			});
		},

		/**
		  * @desc bind events of the port-addNumbers template
		  * @param parent - .ui-dialog-content
		*/
		portAddNumbers: function(accountId, parent) {
			var self = this,
				container = parent.find('div#add_numbers');

			self.portPositionDialogBox();

			/*
			 * on click on the Add button
			 * check if the input is empty
			 * if not load port-ManageOrders template after port-addNumber template
			 */
			container.find('button').on('click', function() {
				var numbersArray = container.find('input').val().split(' ');

				numbersArray = numbersArray.filter(function(el, idx) {
					if ( el && /(^1[0-9]{10}$)|(^[0-9]{10}$)/.test(el) ) {
						return el;
					}
				});

				if ( numbersArray.length === 0 ) {
					toastr.error(self.i18n.active().port.toastr.error.number.multiple);
					container
						.find('div.row-fluid')
						.addClass('error');
				} else {
					self.portFormatNumbers(container, numbersArray, function(container, formattedData) {

						if ( formattedData.orders.length > 0 ) {
							container
								.find('div.row-fluid')
								.removeClass('error');

							container.find('#numbers_list')[0].value = '';

							/*
							 * unbind because it is used in portManagerOrders
							 * to add number without adding the port-managerOrders template again
							 */
							container
								.find('button')
								.unbind('click');

							$(monster.template(self, 'port-manageOrders', formattedData)).insertAfter(container);

							self.portManageOrders(accountId, parent);
						} else {
							container.find('#numbers_list')[0].value = '';
						}
					});
				}
			});

			self.portComingSoon(container.find('.help-links li:not(.separator) a'));
		},

		/**
		  * @desc bind events of the port-manageOrders template
		  * @param parent - .ui-dialog-content
		*/
		portManageOrders: function(accountId, parent) {
			var self = this,
				container = parent.find('div#port_container');

			self.portPositionDialogBox();

			/*
			 * on click on Add button
			 * check if input is empty
			 * if not add the numbers sorted in orders
			 */
			// container.find('div#add_numbers').find('button').on('click', function() {
			container.on('click', 'div#add_numbers button', function() {
				var numbersArray = container.find('div#add_numbers').find('input').val().split(' ');

				numbersArray = numbersArray.filter(function(el, idx) {
					if ( el && /(^1[0-9]{10}$)|(^[0-9]{10}$)/.test(el) ) {
						return el;
					}
				});

				if ( numbersArray.length === 0 ) {
					toastr.error(self.i18n.active().port.toastr.error.number.multiple);
					container
						.find('div#add_numbers')
						.find('div.row-fluid')
						.addClass('error');
				} else {
					self.portFormatNumbers(container, numbersArray, function(container, formattedData) {
						container.find('#numbers_list')[0].value = '';

						container
							.find('div#add_numbers')
							.find('div.row-fluid')
							.removeClass('error');

						for ( var order in formattedData.orders ) {
							container.find('#manage_orders').find('div.order').each(function(index, el) {
								var carrier = $(this).find('h4').text();

								if ( carrier == formattedData.orders[order].carrier ) {
									for ( var number in formattedData.orders[order].numbers) {
										$(this).find('ul').append('<li data-value="' + formattedData.orders[order].numbers[number] + '" data-carrier="' + carrier + '"><i class="icon-warning-sign"></i>' + formattedData.orders[order].numbers[number] + '<i class="icon-remove-sign pull-right"></i></li>');
									}

									formattedData.orders.splice(order, 1);
								}
							})

							if ( formattedData.orders.length != 0 ) {
								container
									.find('div#manage_orders')
									.find('div.row-fluid:last-child')
									.append($(monster.template(self, 'port-order', formattedData.orders[order])));
							}
						}
					});
				}
			});

			/*
			 * on click on Remove number icon
			 * remove the number from the the UI
			 * if there is not any numbers left
			 * load port-addNumbers template
			 */
			container.on('click', '#manage_orders li i.icon-remove-sign', function() {
				var ul = $(this).parent().parent();

				$(this)
					.parent()
					.remove();

				if ( ul.is(':empty') ) {
					ul.parent().parent().remove();
				}

				if ( container.find('div#manage_orders').find('.row-fluid:last-child').is(':empty') ) {
					container
						.find('div#manage_orders')
						.find('.row-fluid:last-child')
						.animate({height: '0px'}, 500);

					parent
						.empty()
						.append($(monster.template(self, 'port-addNumbers')));

					self.portAddNumbers(accountId, parent);
				}
			});

			container.find('div#eula').find('input').on('click', function() {
				if ( $(this).is(':checked') ) {
					$(this).parent().parent().removeClass('error');
				} else {
					$(this).parent().parent().addClass('error');
				}
			});

			self.portCancelOrder(accountId, parent, container);

			/*
			 * on click on Next button
			 * if all checkboxes checked
			 * empty .ui-dialog-content and load port-submitDocuments template
			 */
			container.find('div#footer').find('button.btn-success').on('click', function() {
				var allChecked = new Boolean();

				container.find('div#eula').find('input').each(function() {
					if ( !$(this).is(':checked') ) {
						allChecked = false;
					}
				});

				if ( allChecked ) {

					var ordersList = { orders: [] };

					container.find('div#manage_orders').find('div.order').each(function() {
						var order = new Object(),
							numbersList = new Array();

						$(this).find('li').each(function() {
							numbersList.push($(this).data('value'));
						});

						order.carrier = $(this).find('li:first-child').data('carrier');
						order.numbers = numbersList;

						ordersList.orders.push(order);
					});

					if ( ordersList.orders.length == 1 ) {
						parent
							.empty()
							.append($(monster.template(self, 'port-submitDocuments', ordersList.orders[0])));

						self.portSubmitDocuments(accountId, parent, ordersList);
					} else {
						parent
							.empty()
							.append($(monster.template(self, 'port-resumeOrders', ordersList)));

						self.portResumeOrders(accountId, parent, ordersList);
					}
				} else {
					container.find('div#eula').find('input').each(function() {
						if ( !$(this).is(':checked') ) {
							$(this).parent().parent().addClass('error');
						}
					});
				}
			});

			self.portComingSoon(container.find('#footer .help-links li:not(.separator) a'));
		},

		/**
		  * @desc return an object with numbers sorted by area code
		  * @param numbersList - array of phone numbers
		*/
		portFormatNumbers: function(container, numbersArray, callback) {
			var self = this;

			monster.request({
				resource: 'common.numbers.metadata',
				data: {
					data: numbersArray,
					country: 'US'
				},
				success: function(data) {
					data = data.data;

					var carriersList = new Array(),
						formattedData = { orders: [] },
						errorCount = 0;

					for (var number in data) {
						if ( data[number].company == null || data[number].company == 'undefined' || data[number].company == "" ) {
							errorCount++;
							delete data[number];
							continue;
						}
						carriersList.push(data[number].company);
					}

					carriersList = _.uniq(carriersList);

					for (var carrier in carriersList) {
						var numbersArray = new Array(),
							order = new Object();

						for (var number in data) {
							if ( data[number].company == carriersList[carrier] ) {
								numbersArray.push(number);
							}
						}

						order.carrier = carriersList[carrier];
						order.numbers = numbersArray;

						formattedData.orders[carrier] = order;
					}

					if ( errorCount == 1 ) {
						toastr.error(self.i18n.active().port.toastr.error.number.single, '', {"timeOut": 5000});
					} else if ( errorCount > 1 ) {
						toastr.error(self.i18n.active().port.toastr.error.number.multiple, '', {"timeOut": 5000});
					}

					callback(container, formattedData);
				}
			});
		},

		/**
		  * @desc bind events of the port-manageOrders template
		  * @param parent - .ui-dialog-content
		*/
		portSubmitDocuments: function(accountId, parent, data, index) {
			var self = this,
				index = index || 0,
				container = parent.find('div#port_container');

			self.portPositionDialogBox();

			container.find('.file-upload-container input').each(function(idx, el) {
				var input = $(el),
					type = input.prop('name'),
					options = {
						btnText: self.i18n.active().port.submitDocuments.changeButton,
						mimeTypes: ['application/pdf'],
						wrapperClass: 'input-append',
						success: function(results) {
							if (data.orders[index].hasOwnProperty('id')) {
								if (data.orders[index].hasOwnProperty(type.concat('.pdf'))) {
									self.portRequestUpdateAttachment(accountId, data.orders[index].id, type.concat('.pdf'), reuslts[0].file, function() {
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

				if ( type === 'bill' ) {
					options['bigBtnClass'] = 'btn btn-success span12';
					options['bigBtnText'] = self.i18n.active().port.submitDocuments.uploadBillButton;
					options['btnClass'] = 'btn btn-success';
				} else if ( type === 'loa' ) {
					options['bigBtnClass'] = 'btn span10';
					options['bigBtnText'] = self.i18n.active().port.submitDocuments.loaUploadStep;
					options['btnClass'] = 'btn';
				}

				input.fileUpload(options);
			});

			/*
			 * on click on Remove number icon
			 * remove the number from the the UI
			 * if there is not any numbers left
			 * load port-addNumbers template
			 */
			container.find('div#upload_bill').find('i.icon-remove-sign').on('click', function() {
				var ul = $(this).parent().parent();

				container
					.find('div#upload_bill')
					.find('li[data-value="' + $(this).parent().data('value') + '"]')
					.remove();

				for ( var number in data.orders[index].numbers ) {
					if ( data.orders[index].numbers[number] == $(this).parent().data('value') ) {
						data.orders[index].numbers.splice(data.orders[index].numbers.indexOf(data.orders[index].numbers[number]), 1);
					}
				}

				if ( ul.is(':empty') ) {
					if ( data.orders.length > 1) {
						data.orders.splice(index, 1);

						parent
							.empty()
							.append($(monster.template(self, 'port-resumeOrders', data)));

						self.portResumeOrders(accountId, parent, data);
					} else {
						self.portReloadApp(accountId, parent);
					}
				}
			});

			container.find('div#continue_later').find('button.btn-info').on('click', function() {
				var submitData = true;

				if ( container.find('#transfer_helper').val() == '' ) {
					submitData = false;
					$('html, body').animate({ scrollTop: container.find('div#name_transfer').offset().top }, 100);
					container.find('#transfer_helper')
						.parent()
						.parent()
						.addClass('error');
				}

				if ( submitData ) {
					data.orders[index].name = container.find('input#transfer_helper').val();
					if ( typeof data.orders[index].bill == 'undefined' ) {
						data.orders[index].bill = new Object();
					}
					data.orders[index].bill.name = container.find('input#account_name').val();
					data.orders[index].bill.address = container.find('input#address').val();
					data.orders[index].bill.locality = container.find('input#locality').val();
					data.orders[index].bill.region = container.find('input#region').val();
					data.orders[index].bill.postal_code = container.find('input#postal_code').val();


					self.portSaveOrder(accountId, parent, data, index);
				}
			});

			self.portCancelOrder(accountId, parent, container, data, index);

			/*
			 * on click on Submit button
			 * if all required inputs filled
			 * empty .ui-dialog-content and load port-confirmOrders template
			 * else show which inputs contain errors
			 */
			container.find('div#footer').find('button.btn-success').on('click', function() {
				var input = container.find('div#name_transfer').find('input#transfer_helper'),
					transferName = container.find('#transfer_helper').val(),
					accountName = container.find('#account_name').val(),
					postalCode = container.find('#postal_code').val(),
					locality = container.find('#locality').val(),
					address = container.find('#address').val(),
					region = container.find('#region').val(),
					submitData = true;

				if ( transferName == '' ) {
					submitData = false;
					$('html, body').animate({ scrollTop: container.find('div#name_transfer').offset().top }, 100);
					input
						.parent()
						.parent()
						.addClass('error');
				}

				if ( accountName == '' ) {
					submitData = false;
				}

				if ( locality == '' ) {
					submitData = false;
				}

				if ( region == '' ) {
					submitData = false;
				}

				if ( address == '' ) {
					submitData = false;
				}

				if ( postalCode == '' ) {
					submitData = false;
				}

				if (!data.orders[index].hasOwnProperty('bill_attachment') && !data.orders[index].uploads.hasOwnProperty('bill.pdf')) {
					submitData = false;
				}

				if (!data.orders[index].hasOwnProperty('loa_attachment') && !data.orders[index].uploads.hasOwnProperty('loa.pdf')) {
					submitData = false;
				}

				if ( submitData ) {
					var date = monster.util.getBusinessDate(4).getTime(),
						created = data.orders[index].hasOwnProperty('created') ? data.orders[index].created : date,
						transfer_date = data.orders[index].hasOwnProperty('transfer_date') ? monster.util.dateToGregorian(new Date(data.orders[index].transfer_date)) : date,
						dataTemplate = {
							name: transferName,
							created: created,
							transfer_date: transfer_date,
							total: data.orders[index].numbers.length,
							numbers: data.orders[index].numbers,
							price: data.orders[index].numbers.length * 5
						};

					input
						.parent()
						.parent()
						.removeClass('error');

					if (data.orders[index].hasOwnProperty('id')) {
						delete data.orders[index].loa_attachment;
						delete data.orders[index].bill_attachment;
					}

					data.orders[index] = $.extend(true, data.orders[index], {
						name: transferName,
						bill: {
							name: accountName,
							locality: locality,
							region: region,
							address: address,
							postal_code: postalCode
						}
					});

					if (data.orders[index].hasOwnProperty('notifications')) {
						dataTemplate.notifications = { email: { send_to: data.orders[index].notifications.email.send_to } };
					}

					parent
						.empty()
						.append($(monster.template(self, 'port-confirmOrder', dataTemplate)));

					self.portConfirmOrder(accountId, parent, data, index);
				}
			});

			self.portComingSoon(container.find('#upload_bill .row-fluid.info a'));
			self.portComingSoon(container.find('#loa h4 a'));
			self.portComingSoon(container.find('#loa p a:not(#sign_doc)'));
			self.portComingSoon(container.find('#footer .help-links li:not(.separator) a'));
		},

		/**
		  * @desc bind events of the port-confirmOrder template
		  * @param parent - .ui-dialog-content
		*/
		portConfirmOrder: function(accountId, parent, data, index) {
			var self = this,
				container = parent.find('div#port_container'),
				date = monster.util.getBusinessDate(4),
				formatedDate = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear(),
				transferDate = data.orders[index].hasOwnProperty('transfer_date') ? new Date(data.orders[index].transfer_date) : date,
				formattedTransferDate = (transferDate.getMonth() + 1) + "/" + transferDate.getDate() + "/" + transferDate.getFullYear();

			self.portPositionDialogBox();

			container.find('#transfer_schedule_date').text(date - transferDate >= 0 ? formatedDate : formattedTransferDate);

			container.find('#numbers_to_buy option').each(function(idx, el) {
				$(el)
					.val(parseInt($(el).val(), 10) + 1)
					.text(parseInt($(el).text(), 10) + 1);
			});

			container.find('#numbers_to_buy option').last().prop('selected', 'selected');

			/*
			 * initialize datepicker, toggle inputs and select value
			 */
			container.find('input.date-input').datepicker({
				minDate: date,
				beforeShowDay: $.datepicker.noWeekends,
				constrainInput: true,
				dateFormat: 'mm/dd/yy',
				onSelect: function(dateText, inst) {
					container.find('#transfer_schedule_date').text(dateText);
				}
			});

			container.find('input.date-input').datepicker('setDate', transferDate);
			container.find('.switch').bootstrapSwitch();

			if ( typeof data.orders[index].temporary_numbers != 'undefined') {
				container.find('.switch').bootstrapSwitch('setState', true);

				container
					.find('div#temporary_numbers')
					.find('div.row-fluid:nth-child(2)')
					.slideDown('500', function() {
						container
							.find('div#temporary_numbers')
							.find('select#numbers_to_buy')
							.prop('disabled', false);
					});

				container.find('#numbers_to_buy').val(data.orders[index].temporary_numbers);
			} else {
				container.find('.switch').bootstrapSwitch('setState', false);

				container
						.find('div#temporary_numbers')
						.find('select#numbers_to_buy')
						.prop('disabled', true);

				container
					.find('div#temporary_numbers')
					.find('div.row-fluid:nth-child(2)')
					.slideUp('500');
			}

			/*
			 * on click on switch button
			 * if switch to on show select numbers
			 * else hide and disable select numbers
			 */
			container.find('div#temporary_numbers').find('div.switch').on('switch-change', function() {
				if ( $(this).find('div.switch-animate').hasClass('switch-off') ) {
					container
						.find('div#temporary_numbers')
						.find('select#numbers_to_buy')
						.prop('disabled', true);

					container
						.find('div#temporary_numbers')
						.find('div.row-fluid:nth-child(2)')
						.slideUp('500');
				} else if ( $(this).find('div.switch-animate').hasClass('switch-on') ) {
					container
						.find('div#temporary_numbers')
						.find('div.row-fluid:nth-child(2)')
						.slideDown('500', function() {
							container
								.find('div#temporary_numbers')
								.find('select#numbers_to_buy')
								.prop('disabled', false);
						});
				}
			});

			/*
			 * on click on Save button
			 * empty .ui-dialog-content and load port-resumeOrders template
			 */

			container.find('div#continue_later').find('button.btn-info').on('click', function() {
				data.orders[index].notifications = { email: { send_to: container.find('input#notification_email').val() } };
				data.orders[index].transfer_date = monster.util.dateToGregorian(new Date(container.find('input#transfer_numbers_date').val()));

				if ( container.find('#temporary_numbers').find('.switch-animate').hasClass('switch-on') ) {
					data.orders[index].temporary_numbers = container.find('select#numbers_to_buy')[0][container.find('select#numbers_to_buy')[0].selectedIndex].value;
				} else {
					delete data.orders[index]['temporary_numbers'];
				}

				self.portSaveOrder(accountId, parent, data, index);

			});

			self.portCancelOrder(accountId, parent, container, data, index);

			/*
			 * on click on Submit button
			 * if email input empty scroll to it
			 * else load portRender
			 */
			container.find('div#footer').find('button.btn-success').on('click', function() {
				var submitData = true;

				if ( container.find('#notification_email').val() == '' ) {
					submitData = false;
				}

				if ( submitData ) {
					data.orders[index].notifications = { email: { send_to: container.find('input#notification_email').val() } };
					data.orders[index].transfer_date = monster.util.dateToGregorian(new Date(container.find('input#transfer_numbers_date').val()));

					if ( container.find('#temporary_numbers').find('.switch-animate').hasClass('switch-on') ) {
						data.orders[index].temporary_numbers = container.find('select#numbers_to_buy').val();
					} else if ( typeof data.orders[index].temporary_numbers != 'undefined' ) {
						delete data.orders[index].temporary_numbers;
					}

					if ( typeof data.orders[index].id == 'undefined' ) {
						self.portRequestAdd(accountId, data.orders[index], function(portRequestId) {
							data.orders.splice(index, 1);

							self.portRequestChangeState(accountId, portRequestId, 'submitted', function() {
								if ( typeof data.orders[0] == 'undefined' ) {
									self.portReloadApp(accountId, parent);
								} else {
									parent
										.empty()
										.append($(monster.template(self, 'port-resumeOrders', data)));

									self.portResumeOrders(accountId, parent, data);
								}
							});
						});
					} else {
						self.portRequestUpdate(accountId, data.orders[index].id, data.orders[index], function() {
							if (data.orders[index].port_state === 'unconfirmed') {
								self.portRequestChangeState(accountId, data.orders[index].id, 'submitted', function() {
									self.portReloadApp(accountId, parent);
								});
							}
							else {
								self.portReloadApp(accountId, parent);
							}
						});
					}
				}
			});

			self.portComingSoon(container.find('#footer .help-links li:not(.separator) a'));
		},

		portPositionDialogBox: function() {

			$("html, body").animate({ scrollTop: "0" }, 100);
			if ( $('body').height() - ($('.ui-dialog').height() + 80) <= 0 ) {
				$('.ui-dialog').animate({top: '80'}, 200);
			} else {
				$('.ui-dialog').animate({top: ($("body").height() / 2) - ($('.ui-dialog').height() / 2)}, 200);
			}
		},

		portSaveOrder: function(accountId, parent, data, index) {
			var self = this,
				index = index || 0;

			if (data.orders[index].hasOwnProperty('id')) {
				self.portRequestUpdate(accountId, data.orders[index].id, data.orders[index], function() {
					self.portReloadApp(accountId, parent);
				});
			}
			else {
				self.portRequestAdd(accountId, data.orders[index], function() {
					if (data.orders.length > 1) {
						data.orders.splice(index, 1);

						parent
							.empty()
							.append($(monster.template(self, 'port-resumeOrders', data)));

						self.portResumeOrders(accountId, parent, data);
					}
					else {
						self.portReloadApp(accountId, parent);
					}
				});
			}
		},

		portCancelOrder: function(accountId, parent, container, data, index) {
			var self = this,
				data = data || undefined,
				index = index || 0;

			container.find('div#footer').find('button.btn-danger').on('click', function() {
				if ( typeof data === 'undefined' ) {
					self.portReloadApp(accountId, parent);
				} else {
					monster.ui.confirm(self.i18n.active().port.cancelOrderPopup, function() {
						if ( typeof data.orders[index].id === 'undefined' ) {
							if ( data.orders.length > 1 ) {
								data.orders.splice(index, 1);
								parent.empty().append($(monster.template(self, 'port-resumeOrders', data)));
								self.portResumeOrders(accountId, parent, data);
							} else {
								self.portReloadApp(accountId, parent);
							}
						} else {
							self.portRequestDelete(accountId, data.orders[index].id, function() {
								self.portReloadApp(accountId, parent);
							});
						}
					});
				}
			});
		},

		portRequestAdd: function(accountId, order, callback) {
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
									callback(portRequestId);
								});
							}
							else {
								callback(portRequestId);
							}
						});
					}
					else {
						if (attachments.hasOwnProperty('loa')) {
							self.portRequestAddAttachment(accountId, portRequestId, 'loa.pdf', attachments.loa, function(data) {
								callback(portRequestId);
							});
						}
						else {
							callback(portRequestId);
						}
					}
				}
			});
		},

		portRequestUpdate: function(accountId, portRequestId, order, callback) {
			var self = this;

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
					callback(data.data);
				}
			});
		},

		portRequestDelete: function(accountId, portRequestId, callback) {
			var self = this;

			self.callApi({
				resource: 'port.delete',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function(data, status) {
					callback();
				}
			});
		},

		portRequestList: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'port.list',
				data: {
					accountId: accountId,
					data: {}
				},
				success: function(data, status) {
					self.portObjectsToArray(data.data);

					callback(data.data);
				}
			});
		},

		portRequestGet: function(accountId, portRequestId, callback) {
			var self = this;

			self.callApi({
				resource: 'port.get',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function(data, status) {
					self.portObjectsToArray(data.data);

					callback(data.data);
				}
			});
		},

		portRequestGetDescendants: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'port.listDescendants',
				data: {
					accountId: accountId,
					data: {}
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},

		portRequestListAttachments: function(accountId, portRequestId, callback) {
			var self = this;

			self.callApi({
				resource: 'port.listAttachments',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},

		portRequestAddAttachment: function(accountId, portRequestId, documentName, data, callback) {
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
					callback && callback(data.data);
				}
			});
		},

		portRequestUpdateAttachment: function(accountId, portRequestId, documentName, data, callback) {
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
					callback && callback();
				}
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
				success: function(data, status) {}
			});
		},

		portRequestGetAttachment: function(accountId, portRequestId, documentName, callback) {
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
					callback(data.data);
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
					callbackError && callbackError();
				}
			});
		},

		portRequestReadyState: function(accountId, portRequestId, data, callback) {
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
					callback()
				}
			});
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
			var numbers = order.numbers;

			delete order.numbers;
			order.numbers = new Object();
			for (var number in numbers) {
				order.numbers[numbers[number]] = new Object();
			}

			return order;
		},

		portReloadApp: function(accountId, parent) {
			var self = this,
				args = new Object();

			args.accountId = accountId;

			if ( parent.hasClass('ui-dialog-content') ) {
				parent.parent().remove();
			} else {
				parent.empty();
				args.parent = $('#monster-content');
			}

			self.portRender(args);
		},

		portComingSoon: function(context) {
			var self = this;

			context.on('click', function(event) {
				event.preventDefault();

				monster.ui.alert('Coming Soon!');
			});
		}
	};

	return app;
});
