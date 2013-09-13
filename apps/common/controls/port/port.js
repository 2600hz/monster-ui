define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		bootstrapSwitch = require('bootstrap-switch'),
		monster = require('monster'),
		timepicker = require('timepicker');

	var app = {

		requests: {
			// 'common.port.list': {
			// 	url: 'accounts/{accountId}/phone_numbers',
			// 	verb: 'GET'
			// },
			'common.port.list': {
				apiRoot: 'apps/common/static/',
				url: "ports.json",
				verb: 'GET'
			}
		},

		subscribe: {
			'common.port.render': 'portRender'
		},

		portRender: function(args){
			var self = this,
				args = args || {};

			monster.request({
				resource: 'common.port.list',
				data: {},
				success: function(data, status) {
					/* format: generation of random fake data */
					var format = function(data) {
							var status = ['Incomplete LOA', 'Pending', 'In Process', 'Completed'];

							for (var port in data.ports) {
								data.ports[port].id = port;
								data.ports[port].status = status[Math.floor(Math.random() * status.length)];
								if ( data.ports[port].status === 'Incomplete LOA' ) {
									data.ports[port].action = true;
								}
							}

							return data;
						},
						parent = monster.ui.dialog($(monster.template(self, 'port-ordersList', format(data))), { title: 'transfer [port] numbers' });

					self.portPendingOrders(parent);
				}
			});
		},

		/**
		  * @desc bind events of the port-pendingOrders template
		  * @param parent - .ui-dialog-content
		*/
		portPendingOrders: function(parent) {
			var self = this,
				container = parent.find('div#orders_list');

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
					.append($(monster.template(self, 'port-step1')));

				self.portAddNumbers(parent);
			});

			/*
			 * on click on the continue button
			 * empty .ui-dialog-content and load port-resumeOrders template
			 */
			container.find('td:last-child').find('button').on('click', function(event) {
				event.stopPropagation();

				if ( $(this).hasClass('btn-success') ) {
					parent
						.empty()
						.append($(monster.template(self, 'port-resumeOrders')));

					self.portResumeOrders(parent);
				}
			});
		},

		/**
		  * @desc bind events of the port-resumeOrders template
		  * @param parent - .ui-dialog-content
		*/
		portResumeOrders: function(parent) {
			var self = this,
				container = parent.find('div#resume_orders'),
				body = window.innerHeight,
				dialog = parent.css('height').substring(0, parent.css('height').length - 2),
				total = Math.round((body - dialog) / 2);

			/*
			 * center the dialog box verticaly
			 */
			$('.ui-dialog').animate({top: total + 'px'}, 200);

			/*
			 * on click the Complete this order button
			 * empty .ui-dialog-content and load port-submitDocuments template
			 */
			container.find('button').on('click', function() {
				parent
					.empty()
					.append($(monster.template(self, 'port-step3')));

				self.portSubmitDocuments(parent);
			});
		},

		/**
		  * @desc bind events of the port-addNumbers template
		  * @param parent - .ui-dialog-content
		*/
		portAddNumbers: function(parent) {
			var self = this,
				container = parent.find('div#add_numbers'),
				body = window.innerHeight,
				dialog = $('.ui-dialog').css('height').substring(0, $('.ui-dialog').css('height').length - 2),
				total = Math.round((body - dialog) / 2);

			/*
			 * center the dialog box verticaly
			 */
			$('.ui-dialog').animate({top: total + 'px'}, 200);

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
					numbersList = self.portFormatNumbers(numbersList.split(' '));

					container
						.find('div.row-fluid')
						.removeClass('error');

					/*
					 * unbind because it is used in portManagerOrders
					 * to add number without adding the port-managerOrders template again
					 */
					container
						.find('button')
						.unbind('click');

					$(monster.template(self, 'port-step2', numbersList)).insertAfter(container);

					self.portManageOrders(parent);
				}
			});
		},

		/**
		  * @desc bind events of the port-manageOrders template
		  * @param parent - .ui-dialog-content
		*/
		portManageOrders: function(parent) {
			var self = this,
				container = parent.find('div#port_container');

			/*
			 * if dialog box too high to fit on the sceen
			 * dock it at 80px at the top of the screen
			 */
			if ( $('.ui-dialog').css('top').substring(0, $('.ui-dialog').css('top').length - 2) > 80 ) {
				$('.ui-dialog').animate({top: '80px'}, 200);
			}

			/*
			 * on click on Add button
			 * check if input is empty
			 * if not add the numbers sorted in orders
			 */
			container.find('div#add_numbers').find('button').on('click', function() {
				if ( container.find('div#add_numbers').find('input').val() == "" ) {
					container
						.find('div#add_numbers')
						.find('div.row-fluid')
						.addClass('error');
				} else {
					console.log('click');
					container
						.find('div#add_numbers')
						.find('div.row-fluid')
						.removeClass('error');
				}
			});

			/*
			 * on click on Remove number icon
			 * remove the number from the the UI
			 * if there is not any numbers left
			 * load port-addNumbers template
			 */
			container.find('div#manage_orders').find('i.icon-remove-sign').on('click', function() {
				var ul = $(this).parent().parent();

				container
					.find('div#manage_orders')
					.find('li[data-value="' + $(this).parent().data('value') + '"]')
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
						.append($(monster.template(self, 'port-step1')));

					self.portAddNumbers(parent);
				}
			});

			/*
			 * on click on Next button
			 * if all checkboxes checked
			 * empty .ui-dialog-content and load port-submitDocuments template
			 */
			container.find('#footer').find('button.btn-success').on('click', function() {
				var allChecked = new Boolean();

				container.find('div#eula').find('input').each(function(index, el) {
					if ( !$(this).is(':checked') ) {
						allChecked = false;
					}
				});

				if ( allChecked ) {
					$('.ui-dialog-content')
						.empty()
						.append($(monster.template(self, 'port-step3')));

					self.portSubmitDocuments(parent);
				}
			});
		},

		/**
		  * @desc return an object with numbers sorted by area code
		  * @param numbersList - array of phone numbers
		*/
		portFormatNumbers: function(numbersList) {
			var areaCodes = new Array(),
				carrierList = ['at&t', 'verizon', 'srpint', 't-mobile'],
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
		portSubmitDocuments: function(parent) {
			var self = this,
				container = parent.find('div#port_container');

			/*
			 * if dialog box too high to fit on the sceen
			 * dock it at 80px at the top of the screen
			 */
			if ( parent.css('top').substring(0, parent.css('top').length - 2) > 80 ) {
				parent.animate({top: '80px'}, 200);
			}

			/*
			 * scroll to the top of the page
			 */
			$("html, body").animate({ scrollTop: "0px" }, 100);

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

				if ( ul.is(':empty') ) {
					ul.parent().parent().remove();

					$('.ui-dialog-content')
						.empty()
						.append($(monster.template(self, 'port-step1')));

					self.portAddNumbers();
				}
			});

			/*
			 * on click on Submit button
			 * if all required inputs filled
			 * empty .ui-dialog-content and load port-submitDocuments template
			 * else show which inputs contain errors
			 */
			container.find('div#footer').find('button.btn-success').on('click', function() {
				var input = container.find('div#name_transfer').find('input#transfer_helper');

				if ( input.val() == "" ) {
					$('html, body').animate({ scrollTop: container.find('div#name_transfer').offset().top }, 100);

					input
						.parent()
						.parent()
						.addClass('error');
				} else {
					input
						.parent()
						.parent()
						.removeClass('error');

					$('.ui-dialog-content')
						.empty()
						.append($(monster.template(self, 'port-step4')));

					self.portConfirmOrder(parent);
				}
			});
		},

		/**
		  * @desc bind events of the port-confirmOrder template
		  * @param parent - .ui-dialog-content
		*/
		portConfirmOrder: function(parent) {
			var self = this,
				container = parent.find('div#port_container'),
				dateInput = container.find('input.date-input'),
				toggleButton = container.find('.switch');

			/*
			 * initialize datepicker and toggle inputs
			 */
			dateInput.datepicker({ minDate: '+3d' });
			dateInput.datepicker('setDate', '+3d');
			toggleButton.bootstrapSwitch();

			/*
			 * scroll to the top of the page
			 */
			$("html, body").animate({ scrollTop: "0px" }, 100);

			/*
			 * on click on switch button
			 * 
			 */
			container.find('div#temporary_numbers').find('div.switch').on('switch-change', function() {
				if ( $(this).find('div.switch-animate').hasClass('switch-off') ) {
					container
						.find('div#temporary_numbers')
						.find('div.row-fluid:nth-child(2)')
						.slideUp('500');

					container
						.find('div#temporary_numbers')
						.find('select#numbers_to_buy')
						.prop('disabled', true);
				} else if ( $(this).find('div.switch-animate').hasClass('switch-on') ) {
					container
						.find('div#temporary_numbers')
						.find('select#numbers_to_buy')
						.prop('disabled', false);

					container
						.find('div#temporary_numbers')
						.find('div.row-fluid:nth-child(2)')
						.slideDown('500');
				}
			});

			container.find('div#footer').find('button.btn-success').on('click', function() {
				var notification_email = container.find('input#notification_email').val(),
					transfer_date = container.find('input#transfer_numbers_date').val(),
					temporary_numbers = container.find('select#numbers_to_buy')[0][container.find('select#numbers_to_buy')[0].selectedIndex].value,
					data = { order: {} };

				if ( notification_email !== "" ) {
					container
						.find('input#notification_email')
						.parent()
						.parent()
						.removeClass('error');

					data.order.notification_email = notification_email;

					if ( container.find('div#temporary_numbers').find('div.switch-animate').hasClass('switch-on') ) {
						data.order.temporary_numbers = temporary_numbers;
					}

					$('.ui-dialog').remove();
					self.portRender();
				} else {
					parent
						.find('input#notification_email')
						.parent()
						.parent()
						.addClass('error');

					$("html, body").animate({ scrollTop: container.find('div#notification').offset().top }, 100);
				}
			});
		}
	};

	return app;
});
