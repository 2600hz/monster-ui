define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
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
						parent = monster.ui.dialog($(monster.template(self, 'port-ordersList', format(data))), { title: 'transfert [port] numbers' });

					self.portPendingOrders(parent.find('div#port_container'));
				}
			});
		},

		/**
		  * @desc bind events in the port container
		  * @param parent - jquery object
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
			});

			container.find('span.pull-right').find('a').on('click', function() {
				$('.ui-dialog-content')
					.empty()
					.append($(monster.template(self, 'port-step1')));

				self.portAddNumbers(parent);
			});
		},

		portAddNumbers: function(parent) {
			var self = this,
				parent = $('.ui-dialog').find('div#port_container');

			var body = window.innerHeight,
				dialog = $('.ui-dialog').css('height').substring(0, $('.ui-dialog').css('height').length - 2),
				total = Math.round((body - dialog) / 2);

			$('.ui-dialog').animate({top: total + 'px'}, 200);

			parent.find('div#add_numbers').find('button').on('click', function() {
				if ( parent.find('div#add_numbers').find('input').val() == "" ) {
					parent.find('div#add_numbers').find('input').addClass('error');
				} else {
					var numbersList = parent.find('div#add_numbers').find('input').val().split(' ');

					if ( $('.ui-dialog').css('top').substring(0, $('.ui-dialog').css('top').length - 2) > 80 ) {
						$('.ui-dialog').animate({top: '80px'}, 200);
					}

					$(monster.template(self, 'port-step2')).insertAfter(parent.find('div#add_numbers'));

					parent.find('div#add_numbers').find('button').on('click', function() {
						console.log('click');
					});

					parent.find('div#manage_orders').find('i.icon-remove-sign').on('click', function() {
						var ul = $(this).parent().parent();

						parent.find('div#manage_orders').find('li[data-value="' + $(this).parent().data('value') + '"]').remove();

						if ( ul.is(':empty') ) {
							ul.parent().parent().remove();
						}

						if ( parent.find('div#manage_orders').find('.row-fluid:last-child').is(':empty') ) {
							parent.find('div#manage_orders').find('.row-fluid:last-child').animate({height: '0px'}, 500);
							$('.ui-dialog-content')
								.empty()
								.append($(monster.template(self, 'port-step1')));

							self.portAddNumbers();
						}
					});

					parent.find('#footer').find('button.btn-success').on('click', function() {
						$('.ui-dialog-content')
							.empty()
							.append($(monster.template(self, 'port-step3')));

						self.portSubmitDocuments(parent);
					});
				}
			});
		},

		portSubmitDocuments: function(parent) {
			var self = this,
				parent = $('.ui-dialog').find('div#port_container');

			$("html, body").animate({ scrollTop: "0px" }, 100);

			parent.find('div#footer').find('button.btn-success').on('click', function() {
				$('.ui-dialog-content')
					.empty()
					.append($(monster.template(self, 'port-step4')));

				self.portConfirmOrder(parent);
			});

			parent.find('div#upload_bill').find('i.icon-remove-sign').on('click', function() {
				var ul = $(this).parent().parent();

				parent.find('div#upload_bill').find('li[data-value="' + $(this).parent().data('value') + '"]').remove();

				if ( ul.is(':empty') ) {
					ul.parent().parent().remove();

					$('.ui-dialog-content')
						.empty()
						.append($(monster.template(self, 'port-step1')));

					self.portAddNumbers();
				}
			});
		},

		portConfirmOrder: function(parent) {
			var self = this,
				parent = $('.ui-dialog').find('div#port_container'),
				dateInput = parent.find('input.date-input');

			dateInput.datepicker({ minDate: 0 });
			dateInput.datepicker('setDate', new Date());

			$("html, body").animate({ scrollTop: "0px" }, 100);

			parent.find('div#footer').find('button.btn-success').on('click', function() {
				$('.ui-dialog').remove();
				self.portRender();
			});
		}
	};

	return app;
});
