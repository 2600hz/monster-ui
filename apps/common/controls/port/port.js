define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		bootstrapSwitch = require('bootstrap-switch'),
		monster = require('monster'),
		timepicker = require('timepicker');

	var app = {

		requests: {
			'common.port.list': {
				apiRoot: 'apps/common/static/',
				url: "ports.json",
				verb: 'GET'
			}/*,
			'common.port.list': {
				url: 'accounts/{accountId}/phone_numbers',
				verb: 'GET'
			}*/
		},

		subscribe: {
			'common.port.render': 'portRender'
		},

		portRender: function(args){
			var self = this;
				// callbackAfterRender = args.callbackAfterRender;

			monster.request({
				resource: 'common.port.list',
				data: {},
				success: function(data, status) {
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

					self.portPendingOrders(parent.find('div#port_container'));
				}
			});
		},

		/**
		  * @desc bind events in the port container
		  * @param parent - #port_container
		*/
		portPendingOrders: function(parent) {
			var self = this,
				container = parent.find('div#orders_list');

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

			container.find('td:last-child').find('button').on('click', function(event) {
				event.stopPropagation();

				if ( $(this).hasClass('btn-success') ) {
					$('.ui-dialog-content')
						.empty()
						.append($(monster.template(self, 'port-resumeOrders')));

					self.portResumeOrders(parent);
				}
			});

			container.find('span.pull-right').find('a').on('click', function() {
				$('.ui-dialog-content')
					.empty()
					.append($(monster.template(self, 'port-step1')));

				self.portAddNumbers(parent);
			});
		},

		portResumeOrders: function(parent) {
			var self = this,
				parent = $('.ui-dialog').find('div#resume_orders'),
				body = window.innerHeight,
				dialog = $('.ui-dialog').css('height').substring(0, $('.ui-dialog').css('height').length - 2),
				total = Math.round((body - dialog) / 2);

			$('.ui-dialog').animate({top: total + 'px'}, 200);

			parent.find('button').on('click', function() {
				$('.ui-dialog-content')
					.empty()
					.append($(monster.template(self, 'port-step3')));

				self.portSubmitDocuments(parent);
			});
		},

		portAddNumbers: function(parent) {
			var self = this,
				parent = $('.ui-dialog').find('div#port_container'),
				body = window.innerHeight,
				dialog = $('.ui-dialog').css('height').substring(0, $('.ui-dialog').css('height').length - 2),
				total = Math.round((body - dialog) / 2);

			$('.ui-dialog').animate({top: total + 'px'}, 200);

			parent.find('div#add_numbers').find('button').on('click', function() {
				var numbersList = parent.find('div#add_numbers').find('input').val();

				if ( numbersList == "" ) {
					parent
						.find('div#add_numbers')
						.find('div.row-fluid')
						.addClass('error');
				} else {
					numbersList = self.portFormatNumbers(numbersList.split(' '));

					parent
						.find('div#add_numbers')
						.find('div.row-fluid')
						.removeClass('error');

					parent
						.find('div#add_numbers')
						.find('button')
						.unbind('click');

					console.log(numbersList);

					$(monster.template(self, 'port-step2'), numbersList).insertAfter(parent.find('div#add_numbers'));
					self.portManageOrders(parent);
				}
			});
		},

		portManageOrders: function(parent) {
			var self = this,
				parent = $('.ui-dialog').find('div#port_container');

			if ( $('.ui-dialog').css('top').substring(0, $('.ui-dialog').css('top').length - 2) > 80 ) {
				$('.ui-dialog').animate({top: '80px'}, 200);
			}

			parent.find('div#add_numbers').find('button').on('click', function() {
				if ( parent.find('div#add_numbers').find('input').val() == "" ) {
					parent
						.find('div#add_numbers')
						.find('div.row-fluid')
						.addClass('error');
				} else {
					console.log('click');
					parent
						.find('div#add_numbers')
						.find('div.row-fluid')
						.removeClass('error');
				}
			});

			parent.find('div#manage_orders').find('i.icon-remove-sign').on('click', function() {
				var ul = $(this).parent().parent();

				parent
					.find('div#manage_orders')
					.find('li[data-value="' + $(this).parent().data('value') + '"]')
					.remove();

				if ( ul.is(':empty') ) {
					ul.parent().parent().remove();
				}

				if ( parent.find('div#manage_orders').find('.row-fluid:last-child').is(':empty') ) {
					parent
						.find('div#manage_orders')
						.find('.row-fluid:last-child')
						.animate({height: '0px'}, 500);

					$('.ui-dialog-content')
						.empty()
						.append($(monster.template(self, 'port-step1')));

					self.portAddNumbers();
				}
			});

			parent.find('#footer').find('button.btn-success').on('click', function() {
				var allChecked = new Boolean();

				parent.find('div#eula').find('input').each(function(index, el) {
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

		portFormatNumbers: function(numbersList) {
			var areaCodes = new Array();
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

				switch ( areaCodes[code] ) {
					case '213':
						order.carrier = 'at&t';
						break;
					case '415':
						order.carrier = 'verizon';
						break;
					case '530':
						order.carrier = 'sprint';
						break;
					case '669':
						order.carrier = 't-mobile';
						break;
				}

				order.numbers = orderNumbersList;

				formattedData.orders[code] = order;
			}

			return formattedData;
		},

		portSubmitDocuments: function(parent) {
			var self = this,
				parent = $('.ui-dialog').find('div#port_container');

			if ( $('.ui-dialog').css('top').substring(0, $('.ui-dialog').css('top').length - 2) > 80 ) {
				$('.ui-dialog').animate({top: '80px'}, 200);
			}

			$("html, body").animate({ scrollTop: "0px" }, 100);

			parent.find('div#upload_bill').find('i.icon-remove-sign').on('click', function() {
				var ul = $(this).parent().parent();

				parent
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

			parent.find('div#footer').find('button.btn-success').on('click', function() {
				var input = parent.find('div#name_transfer').find('input#transfer_helper');

				if ( input.val() == "" ) {
					$('html, body').animate({ scrollTop: parent.find('div#name_transfer').offset().top }, 100);

					input
						.parent()
						.parent()
						.delay(1000)
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

		portConfirmOrder: function(parent) {
			var self = this,
				parent = $('.ui-dialog').find('div#port_container'),
				dateInput = parent.find('input.date-input'),
				toggleButton = parent.find('.switch');

			dateInput.datepicker({ minDate: '+3d' });
			dateInput.datepicker('setDate', '+3d');

			toggleButton.bootstrapSwitch();

			$("html, body").animate({ scrollTop: "0px" }, 100);

			parent.find('div#temporary_numbers').find('div.switch').on('switch-change', function() {
				if ( $(this).find('div.switch-animate').hasClass('switch-off') ) {
					parent
						.find('div#temporary_numbers')
						.find('select#numbers_to_buy')
						.prop('disabled', true);
				} else if ( $(this).find('div.switch-animate').hasClass('switch-on') ) {
					parent
						.find('div#temporary_numbers')
						.find('select#numbers_to_buy')
						.prop('disabled', false);
				}
			});

			parent.find('div#footer').find('button.btn-success').on('click', function() {
				var notification_email = parent.find('input#notification_email').val(),
					transfer_date = parent.find('input#transfer_numbers_date').val(),
					temporary_numbers = parent.find('select#numbers_to_buy')[0][parent.find('select#numbers_to_buy')[0].selectedIndex].value,
					data = { order: {} };

				if ( notification_email !== "" ) {
					parent
						.find('input#notification_email')
						.parent()
						.parent()
						.removeClass('error');

					data.order.notification_email = notification_email;

					if ( parent.find('div#temporary_numbers').find('div.switch-animate').hasClass('switch-on') ) {
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

					$("html, body").animate({ scrollTop: parent.find('div#notification').offset().top }, 100);
				}
			});
		}
	};

	return app;
});
