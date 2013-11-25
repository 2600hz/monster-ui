define(function(require){

	var $ = require('jquery'),
		_ = require('underscore'),
		bootstrapSwitch = require('bootstrap-switch'),
		monster = require('monster'),
		timepicker = require('timepicker');

	var app = {

		requests: {
			'common.port.add': {
				url: 'accounts/{accountId}/port_requests',
				verb: 'PUT'
			},
			'common.port.update': {
				url: 'accounts/{accountId}/port_requests/{portRequestId}',
				verb: 'POST'
			},
			'common.port.delete': {
				url: 'accounts/{accountId}/port_requests/{portRequestId}',
				verb: 'DELETE'
			},
			'common.port.get': {
				url: 'accounts/{accountId}/port_requests',
				verb: 'GET'
			},
			'common.port.get.detail': {
				url: 'accounts/{accountId}/port_requests/{portRequestId}',
				verb: 'GET'
			},
			'common.port.get.descendants': {
				url: 'accounts/{accountId}/port_requests/descendants',
				verb: 'GET'
			},
			'common.port.get.attachments': {
				url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments',
				verb: 'GET'
			},
			'common.port.attachment.add': {
				url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments?filename={documentName}',
				verb: 'PUT',
				type: 'application/pdf',
				dataType: 'application/pdf'
			},
			'common.port.attachment.update': {
				url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName}',
				verb: 'POST',
				type: 'application/pdf',
				dataType: 'application/pdf'
			},
			'common.port.attachment.delete': {
				url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName}',
				verb: 'DELETE'
			},
			'common.port.attachment.get': {
				url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName}',
				verb: 'GET',
				type: 'application/pdf',
				dataType: 'application/pdf'
			},
			'common.port.add.state': {
				url: 'accounts/{accountId}/port_requests/{portRequestId}/ready',
				verb: 'PUT'
			},
			'common.port.sort': {
				apiRoot: 'http://10.26.0.68/number_manager/api/',
				url: 'numbers/meta',
				verb: 'POST'
			}
		},

		subscribe: {
			'common.port.render': 'portRender'
		},

		portRender: function(args){
			var self = this,
				args = args || { };

			args.id = ( args.id ) ? args.id : self.accountId;

			self.portRequestGet(args.id, function(data) {
				var formatToTemplate = function(data) {
						for ( var port in data.data ) {
							var date = monster.util.gregorianToDate(data.data[port].created);
							data.data[port].created = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
						}

						return data;
					},
					parent = monster.ui.dialog($(monster.template(self, 'port-pendingOrders', formatToTemplate(data))), { title: 'transfer [port] numbers' });

				self.portPendingOrders(args.id, parent, data);
			});
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

			/*
			 * on click on the continue button
			 * empty .ui-dialog-content and load port-submitDocuments template
			 */
			container.find('td:last-child').find('button').on('click', function(event) {
				event.stopPropagation();

				self.portRequestGetDetail(accountId, $(this).parent().parent().data('id'), function(data) {
					data = { orders: [data.data] };

					if ( container.find('td:last-child').find('button').hasClass('btn-success') ) {
						parent
							.empty()
							.append($(monster.template(self, 'port-submitDocuments', data.orders[0])));

						self.portSubmitDocuments(accountId, parent, data);
					} else {
						console.log('info');
					}
				})
			});
		},

		/**
		  * @desc bind events of the port-resumeOrders template
		  * @param parent - .ui-dialog-content
		*/
		portResumeOrders: function(accountId, parent, data) {
			var self = this,
				container = parent.find('div#resume_orders');;

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
				var numbersList = container.find('input').val();

				if ( numbersList == "" ) {
					container
						.find('div.row-fluid')
						.addClass('error');
				} else {
					monster.request({
						resource: 'common.port.sort',
						data: {
							data: numbersList.split(' ')
						},
						success: function(data) {
							data = data.data;

							var carriersList = new Array(),
								formattedData = { orders: [] };

							for (var number in data) {
								carriersList.push(data[number].company);
							}

							carriersList = _.uniq(carriersList);

							for (var carrier in carriersList) {
								var numbersList = new Array(),
									order = new Object();

								for (var number in data) {
									if ( data[number].company == carriersList[carrier] ) {
										numbersList.push(number);
									}
								}

								order.carrier = carriersList[carrier];
								order.numbers = numbersList;

								formattedData.orders[carrier] = order;
							}

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
						}
					});
				}
			});
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
			container.find('div#add_numbers').find('button').on('click', function() {
				var numbersList = container.find('div#add_numbers').find('input').val();

				if ( numbersList == "" ) {
					container
						.find('div#add_numbers')
						.find('div.row-fluid')
						.addClass('error');
				} else {
					monster.request({
						resource: 'common.port.sort',
						data: {
							data: numbersList.split(' ')
						},
						success: function(data) {
							data = data.data;

							var carriersList = new Array(),
								formattedData = { orders: [] };

							for (var number in data) {
								carriersList.push(data[number].company);
							}

							carriersList = _.uniq(carriersList);

							for (var carrier in carriersList) {
								var numbersList = new Array(),
									order = new Object();

								for (var number in data) {
									if ( data[number].company == carriersList[carrier] ) {
										numbersList.push(number);
									}
								}

								order.carrier = carriersList[carrier];
								order.numbers = numbersList;

								formattedData.orders[carrier] = order;
							}

							container
								.find('div.row-fluid')
								.removeClass('error');

							container.find('#numbers_list')[0].value = '';

							container
								.find('div#add_numbers')
								.find('div.row-fluid')
								.removeClass('error');

							container.find('#numbers_list')[0].value = '';

							for ( var order in formattedData.orders ) {
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

					$('.ui-dialog-content')
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

				// if ( allChecked ) {

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

					$('.ui-dialog-content')
						.empty()
						.append($(monster.template(self, 'port-submitDocuments', ordersList.orders[0])));

					self.portSubmitDocuments(accountId, parent, ordersList);
				// } else {
				// 	container.find('div#eula').find('input').each(function() {
				// 		if ( !$(this).is(':checked') ) {
				// 			$(this).parent().parent().addClass('error');
				// 		}
				// 	});
				// }
			});
		},

		/**
		  * @desc return an object with numbers sorted by area code
		  * @param numbersList - array of phone numbers
		*/
		portFormatNumbers: function(numbersList) {
			var areaCodes = new Array(),
				carrierList = ['at&t', 'verizon', 'sprint', 't-mobile'],
				formattedData = { orders: [] };

			for ( var key in numbersList ) {
				areaCodes.push(numbersList[key].substring(0, 3));
			}

			areaCodes = _.uniq(areaCodes, true);

			for ( var code in areaCodes ) {
				var orderNumbersList = new Array(),
					order = new Object();

				for ( var number in numbersList ) {
					if ( areaCodes[code] == numbersList[number].substring(0, 3) ) {
						orderNumbersList.push(numbersList[number]);
					}
				}

				order.carrier = carrierList[Math.floor(Math.random() * carrierList.length)];
				order.numbers = orderNumbersList;

				formattedData.orders[code] = order;
			}

			return formattedData;
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

			container.find('#bill_form').find('button.upload').on('click', function() {
				$(this).blur();
				container.find('#bill_form').find('input.upload').click();

				container.find('#bill_form').find('input.upload').on('change', function(evt) {
					var file = evt.target.files;

					if(file.length > 0) {
						var reader = new FileReader(),
							binary = 'updating';

						reader.onloadend = function(evt) {
							binary = evt.target.result;

							if ( typeof data.orders[index].id == "undefined" ) {
								data.orders[index].bill_attachment = binary;
							} else {
								if ( typeof data.orders[index].uploads['bill.pdf'] == "undefined" ) {
									self.portRequestAddAttachment(accountId, data.orders[index].id, "bill.pdf", binary, function(data) {
										console.log(data);
									});
								} else {
									self.portRequestUpdateAttachment(accountId, data.orders[index].id, "bill.pdf", binary, function(data) {
										console.log(data);
									});
								}
							}
						}

						reader.readAsDataURL(file[0]);
					}
				});
			});

			/*
			 * on click on Remove number icon
			 * remove the number from the the UI
			 * if there is not any numbers left
			 * load port-addNumbers template
			 */
			container.find('div#upload_bill').find('i.icon-remove-sign').on('click', function() {
				var ul = $(this).parent().parent(),
					args = new Object();

				args.id = accountId;

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
						$('.ui-dialog').remove();
						self.portRender(args);
					}
				}
			});

			container.find('#loa').find('button.upload').on('click', function() {
				$(this).blur();
				container.find('#loa').find('input.upload').click();

				container.find('#loa').find('input.upload').on('change', function(evt) {
					var files = evt.target.files;

					if(files.length > 0) {
						var reader = new FileReader(),
							binary = 'updating';

						reader.onloadend = function(evt) {
							binary = evt.target.result;

							if ( typeof data.orders[index].id == "undefined" ) {
								data.orders[index].loa_attachment = binary;
							} else {
								if ( typeof data.orders[index].uploads['loa.pdf'] == "undefined" ) {
									self.portRequestAddAttachment(accountId, data.orders[index].id, "loa.pdf", binary, function(data) {
										console.log(data);
									});
								} else {
									self.portRequestUpdateAttachment(accountId, data.orders[index].id, "loa.pdf", binary, function(data) {
										console.log(data);
									});
								}
							}
						}

						reader.readAsDataURL(files[0]);
					}
				});
			});

			self.portSaveOrder(accountId, parent, container, data, function(data) {
				data.orders[index].name = container.find('input#transfer_helper').val();
				if ( typeof data.orders[index].bill == 'undefined' ) {
					data.orders[index].bill = new Object();
				}
				data.orders[index].bill.name = container.find('input#account_name').val();
				data.orders[index].bill.address = container.find('input#address').val();
				data.orders[index].bill.city = container.find('input#city').val();
				data.orders[index].bill.state = container.find('input#state').val();
				data.orders[index].bill.zip_code = container.find('input#zip_code').val();

				return data;
			}, index);

			self.portCancelOrder(accountId, parent, container, data, index);

			/*
			 * on click on Submit button
			 * if all required inputs filled
			 * empty .ui-dialog-content and load port-confirmOrders template
			 * else show which inputs contain errors
			 */
			container.find('div#footer').find('button.btn-success').on('click', function() {
				var input = container.find('div#name_transfer').find('input#transfer_helper');

				// if ( input.val() == "" ) {
				// 	$('html, body').animate({ scrollTop: container.find('div#name_transfer').offset().top }, 100);

				// 	input
				// 		.parent()
				// 		.parent()
				// 		.addClass('error');
				// } else {
					input
						.parent()
						.parent()
						.removeClass('error');

					data.orders[index].name = container.find('#transfer_helper').val();
					data.orders[index].bill = new Object();
					data.orders[index].bill.name = container.find('#account_name').val();
					data.orders[index].bill.city = container.find('#city').val();
					data.orders[index].bill.state = container.find('#state').val();
					data.orders[index].bill.address = container.find('#address').val();
					data.orders[index].bill.zip_code = container.find('#zip_code').val();

					var dataTemplate = new Object(),
						date = new Date(Math.floor(+new Date()) + 259200000),
						date = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear(),
						created = monster.util.gregorianToDate(data.orders[index].created),
						created = (created.getMonth() + 1) + "/" + created.getDate() + "/" + created.getFullYear();

					dataTemplate.email = data.orders[index].email;
					dataTemplate.name = data.orders[index].name;
					dataTemplate.created = ( typeof data.orders[index].created == 'undefined' ) ? date : created;
					dataTemplate.transfer = ( typeof data.orders[index].transfer_date == 'undefined' ) ? date : data.orders[index].transfer_date;
					dataTemplate.total = data.orders[index].numbers.length;
					dataTemplate.price = dataTemplate.total * 5;

					$('.ui-dialog-content')
						.empty()
						.append($(monster.template(self, 'port-confirmOrder', dataTemplate)));

					self.portConfirmOrder(accountId, parent, data, index);
				// }
			});
		},

		/**
		  * @desc bind events of the port-confirmOrder template
		  * @param parent - .ui-dialog-content
		*/
		portConfirmOrder: function(accountId, parent, data, index) {
			var self = this,
				container = parent.find('div#port_container'),
				order = data.orders[index];

			self.portPositionDialogBox();

			/*
			 * initialize datepicker, toggle inputs and select value
			 */
			container.find('input.date-input').datepicker({ minDate: '+3d' });
			container.find('input.date-input').datepicker('setDate', '+3d');
			if ( typeof data.orders[index].transfer_date != 'undefined' ) {
				container.find('#transfer_numbers_date').val(data.orders[index].transfer_date);
			}
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

			container.on('change', '#transfer_numbers_date', function() {
				container.find('#transfer_schedule_date').text(container.find('#transfer_numbers_date').val());
			});

			/*
			 * on click on Save button
			 * empty .ui-dialog-content and load port-resumeOrders template
			 */
			self.portSaveOrder(accountId, parent, container, data, function(data) {
				data.orders[index].email = container.find('input#notification_email').val();
				data.orders[index].transfer_date = container.find('input#transfer_numbers_date').val();
				if ( container.find('#temporary_numbers').find('.switch-animate').hasClass('switch-on') ) {
					data.orders[index].temporary_numbers = container.find('select#numbers_to_buy')[index][container.find('select#numbers_to_buy')[index].selectedIndex].value;
				} else {
					delete data.orders[index]['temporary_numbers'];
				}

				return data;
			}, index);

			self.portCancelOrder(accountId, parent, container, data, index);

			/*
			 * on click on Submit button
			 * if email input empty scroll to it
			 * else load portRender
			 */
			container.find('div#footer').find('button.btn-success').on('click', function() {
				if ( typeof data.orders[index].id == 'undefined' ) {
					var email = container.find('input#notification_email').val(),
						transfer_date = container.find('input#transfer_numbers_date').val(),
						temporary_numbers = container.find('select#numbers_to_buy')[0][container.find('select#numbers_to_buy')[0].selectedIndex].value;

					// if ( email !== "" ) {
						container
							.find('input#notification_email')
							.parent()
							.parent()
							.removeClass('error');

						order.email = container.find('#notification_email').val();
						order.transfer_date = container.find('#transfer_numbers_date').val();
						if ( container.find('#temporary_numbers').find('.switch-animate').hasClass('switch-on') ) {
							order.temporary_numbers = temporary_numbers;
						}


						self.portRequestAdd(accountId, data.orders[index], function() {

							data.orders.splice(index, 1);

							if ( typeof data.orders[0] == 'undefined' ) {
								var args = new Object();

								args.id = accountId;

								$('.ui-dialog').remove();
								self.portRender(args);
							} else {
								$('.ui-dialog-content')
									.empty()
									.append($(monster.template(self, 'port-resumeOrders', data)));

								self.portResumeOrders(accountId, parent, data);
							}

						});

					// } else {
					// 	parent
					// 		.find('input#notification_email')
					// 		.parent()
					// 		.parent()
					// 		.addClass('error');

					// 	$("html, body").animate({ scrollTop: container.find('div#notification').offset().top }, 100);
					// }
				} else {
					data.orders[index].email = container.find('input#notification_email').val();
					data.orders[index].transfer_date = container.find('input#transfer_numbers_date').val();
					if ( container.find('#temporary_numbers').find('.switch-animate').hasClass('switch-on') ) {
						data.orders[index].temporary_numbers = container.find('select#numbers_to_buy')[index][container.find('select#numbers_to_buy')[index].selectedIndex].value;
					} else {
						delete data.orders[index]['temporary_numbers'];
					}

					self.portRequestUpdate(data.orders[index].id, data.orders[index], function() {
						var args = new Object()

						args.id = accountId;

						$('.ui-dialog').remove();
						self.portRender(args);
					});
				}
			});
		},

		portPositionDialogBox: function() {
			if ( $('body').height() - ($('.ui-dialog').height() + 80) <= 0 ) {
				$('.ui-dialog').animate({top: '80'}, 200);
			} else {
				$('.ui-dialog').animate({top: ($("body").height() / 2) - ($('.ui-dialog').height() / 2)}, 200);
			}

			$("html, body").animate({ scrollTop: "0" }, 100);
		},

		portSaveOrder: function(accountId, parent, container, data, callback, index) {
			var self = this,
				index = index || 0,
				args = new Object();

			args.id = accountId;

			container.find('div#continue_later').find('button.btn-info').on('click', function() {
				data = callback(data);

				if ( typeof data.orders[index].id === 'undefined' ) {
					self.portRequestAdd(accountId, data.orders[index], function() {
						if ( data.orders.length > 1 ) {
							data.orders.splice(index, 1);
							parent.empty().append($(monster.template(self, 'port-resumeOrders', data)));
							self.portResumeOrders(accountId, parent, data);
						} else {
							$('.ui-dialog').remove();
							self.portRender(args);
						}
					});
				} else {
					self.portRequestUpdate(accountId, data.orders[index].id, data.orders[index], function() {
						$('.ui-dialog').remove();
						self.portRender(args);
					});
				}
			});
		},

		portCancelOrder: function(accountId, parent, container, data, index) {
			var self = this,
				data = data || undefined,
				index = index || 0,
				args = new Object();

			args.id = accountId;

			container.find('div#footer').find('button.btn-danger').on('click', function() {
				if ( typeof data === 'undefined' ) {
					$('.ui-dialog').remove();
					self.portRender(args);
				} else {
					if ( typeof data.orders[index].id === 'undefined' ) {
						if ( data.orders.length > 1 ) {
							data.orders.splice(index, 1);
							parent.empty().append($(monster.template(self, 'port-resumeOrders', data)));
							self.portResumeOrders(accountId, parent, data);
						} else {
							$('.ui-dialog').remove();
							self.portRender(args);
						}
					} else {
						self.portRequestDelete(accountId, parent, data.orders[index].id, function() {
							$('.ui-dialog').remove();
							self.portRender(args);
						});
					}
				}
			});
		},

		portRequestAdd: function(accountId, order, callback) {
			var self = this;

			if ( typeof order.bill_attachment != "undefined" || typeof order.loa_attachment != "undefined" ) {
				var attachments = new Object();

				if ( typeof order.bill_attachment != "undefined" ) {
					attachments.bill = order.bill_attachment;
					delete order.bill_attachment;
				}

				if ( typeof order.loa_attachment != "undefined" ) {
					attachments.loa = order.loa_attachment;
					delete order.bill_attachment;
				}
			}

			console.log(order);

			order = self.portArrayToObjects(order);

			monster.request({
				resource: 'common.port.add',
				data: {
					accountId: accountId,
					data: order
				},
				success: function (data) {
					callback();

					console.log('request: add');
					console.log(data);
				}
			});
		},

		portRequestUpdate: function(accountId, portRequestId, order, callback) {
			var self = this;

			order = self.portArrayToObjects(order);

			monster.request({
				resource: 'common.port.update',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: order
				},
				success: function (data) {
					callback();

					console.log('request: update | portRequestId: ' + portRequestId);
				}
			});
		},

		portRequestDelete: function(accountId, portRequestId, callback) {
			monster.request({
				resource: 'common.port.delete',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function (data) {
					callback();

					console.log('request: delete | portRequestId: ' + portRequestId);
				}
			});
		},

		portRequestGet: function(accountId, callback) {
			var self = this;

			monster.request({
				resource: 'common.port.get',
				data: {
					accountId: accountId,
					data: {}
				},
				success: function (data) {
					self.portObjectsToArray(data.data);

					callback(data);

					console.log('request: get');
					console.log(data.data);
				}
			});
		},

		portRequestGetDetail: function(accountId, portRequestId, callback) {
			var self = this;

			monster.request({
				resource: 'common.port.get.detail',
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function (data) {
					self.portObjectsToArray(data.data);

					callback(data);

					console.log('request: get.detail');
				}
			});
		},

		portRequestGetDescendants: function(accountId, callback) {
			monster.request({
				resource: 'common.port.get.descendants',
				data: {
					accountId: accountId,
					data: {}
				},
				success: function (data) {
					callback(data);

					console.log('request: port.get.descendants');
				}
			});
		},

		portRequestGetAttachments: function(accountId, portRequestId, callback) {
			monster.request({
				resource: "common.port.get.attachments",
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function(data) {
					callback(data);
				}
			});
		},

		portRequestAddAttachment: function(accountId, portRequestId, documentName, data, callback) {
			monster.request({
				resource: "common.port.attachment.add",
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					documentName: documentName,
					data: data
				},
				success: function(data) {
					callback(data);
				}
			});
		},

		portRequestUpdateAttachment: function(accountId, portRequestId, documentName, data, callback) {
			monster.request({
				resource: "common.port.attachment.update",
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					documentName: documentName,
					data: data
				},
				success: function(data) {
					callback(data);
				}
			});
		},

		portRequestDeleteAttachment: function(accountId, portRequestId, documentName, callback) {
			monster.request({
				resource: "common.port.attachment.delete",
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					documentName: documentName,
					data: {}
				},
				success: function(data) {
					callback(data);
				}
			});
		},

		portRequestGetAttachment: function(accountId, portRequestId, documentName, callback) {
			monster.request({
				resource: "common.port.attachment.get",
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					documentName: documentName,
					data: {}
				},	
				success: function(data) {
					callback(data);
				}
			});
		},

		portRequestAddState: function(accountId, portRequestId, callback) {
			monster.request({
				resource: "common.port.add.state",
				data: {
					accountId: accountId,
					portRequestId: portRequestId,
					data: {}
				},
				success: function(data) {
					callback(data);
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
		}
	};

	return app;
});
