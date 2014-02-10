define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),

		templates = {
			inboundMenu: 'inboundMenu',
			outboundMenu: 'outboundMenu',
			inboundTrunks: 'inboundTrunks',
			outboundTrunks: 'outboundTrunks'
		};

	var app = {

		name: 'myaccount-trunks',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'trunks.getLimits': {
				url: 'accounts/{accountId}/limits',
				verb: 'GET'
			},
			'trunks.updateLimits': {
				url: 'accounts/{accountId}/limits',
				verb: 'POST'
			}
		},

		subscribe: {
			'myaccount-trunks.renderContent': '_renderContent'
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(callback){
			var self = this;

			self.getLimits(function(data) {
				var dataInbound = {
						inbound: data.data.inbound_trunks || 0,
					},
					dataOutbound =  {
						twoway: data.data.twoway_trunks || 0
					},
					trunksInboundMenu = $(monster.template(self, 'inboundMenu', dataInbound)),
					trunksOutboundMenu = $(monster.template(self, 'outboundMenu', dataOutbound)),
					argsInbound = {
						name: self.name,
						title: self.i18n.active().inboundTitle,
						menu: trunksInboundMenu,
						weight: 20,
						category: 'trunkingCategory'
					},
					argsOutbound = {
						name: self.name,
						title: self.i18n.active().outboundTitle,
						menu: trunksOutboundMenu,
						weight: 40,
						category: 'trunkingCategory'
					};

				monster.pub('myaccount.addSubmodule', argsInbound);
				monster.pub('myaccount.addSubmodule', argsOutbound);

				callback && callback();
			});
		},

		_renderContent: function(args) {
			var self = this;

			if(args.key === 'inbound') {
				self.renderInbound();
			}
			else {
				self.renderOutbound();
			}
		},

		renderInbound: function() {
			var self = this;

			self.getLimits(function(data) {
				var amountInbound = 6.99,
					inbound = data.data.inbound_trunks || 0,
					totalAmountInbound = amountInbound * inbound,
					dataTemplate = {
						inbound: inbound,
						amountInbound: amountInbound.toFixed(2),
						totalAmountInbound: totalAmountInbound.toFixed(2)
					},
					trunksInboundView = $(monster.template(self, 'inboundTrunks', dataTemplate));

				trunksInboundView.find('.icon-question-sign[data-toggle="tooltip"]').tooltip();

				trunksInboundView.find('#slider_inbound').slider({
					min: 0,
					max: 100,
					range: 'min',
					value: data.data.inbound_trunks > 0 ? data.data.inbound_trunks : 0,
					slide: function( event, ui ) {
						trunksInboundView.find('.slider-value').html(ui.value);
						totalAmountInbound = ui.value*amountInbound;
						trunksInboundView.find('.total-amount .total-amount-value').html(totalAmountInbound.toFixed(2));

						trunksInboundView.find('.slider-value-wrapper').css('left', trunksInboundView.find('#slider_inbound .ui-slider-handle').css('left'));
					},
					change: function(event, ui) {
						trunksInboundView.find('.slider-value-wrapper').css('left', trunksInboundView.find('#slider_inbound .ui-slider-handle').css('left'));
					}
				});

				trunksInboundView.find('.update-limits').on('click', function(e) {
					e.preventDefault();

					monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
						function() {
							self.getLimits(function(dataLimits) {
								var updateData = {
									inbound_trunks: trunksInboundView.find('#slider_inbound').slider('value'),
									twoway_trunks: 'data' in data ? data.data.twoway_trunks || 0 : 0
								};

								updateData = $.extend(true, dataLimits.data, updateData);

								self.updateLimits(updateData, function(_data) {
									var argsMenu = {
										module: self.name,
										key: 'inbound',
										data: updateData.inbound_trunks
									};

									monster.pub('myaccount.updateMenu', argsMenu);
									self.renderInbound();
									//TODO toastr saved
								});
							});
						}
					);
				});

				monster.pub('myaccount.renderSubmodule', trunksInboundView);

				trunksInboundView.find('.slider-value-wrapper').css('left', trunksInboundView.find('#slider_inbound .ui-slider-handle').css('left'));
			});
		},

		renderOutbound: function() {
			var self = this;

			self.getLimits(function(data) {
				var amountTwoway = 29.99,
					twoway = data.data.twoway_trunks || 0,
					totalAmountTwoway = amountTwoway * twoway,
					dataTemplate = {
						twoway: twoway,
						amountTwoway: amountTwoway.toFixed(2),
						totalAmountTwoway: totalAmountTwoway.toFixed(2)
					},
					trunksOutboundView = $(monster.template(self, 'outboundTrunks', dataTemplate));

				trunksOutboundView.find('.icon-question-sign[data-toggle="tooltip"]').tooltip();

				trunksOutboundView.find('#slider_twoway').slider({
					min: 0,
					max: 100,
					range: 'min',
					value: data.data.twoway_trunks > 0 ? data.data.twoway_trunks : 0,
					slide: function( event, ui ) {
						trunksOutboundView.find('.slider-value').html(ui.value);
						totalAmountTwoway = ui.value * amountTwoway;

						trunksOutboundView.find('.total-amount .total-amount-value').html(totalAmountTwoway.toFixed(2));

						trunksOutboundView.find('.slider-value-wrapper').css('left', trunksOutboundView.find('#slider_twoway .ui-slider-handle').css('left'));
					},
					change: function(event, ui) {
						trunksOutboundView.find('.slider-value-wrapper').css('left', trunksOutboundView.find('#slider_twoway .ui-slider-handle').css('left'));
					}
				});

				trunksOutboundView.find('.update-limits').on('click', function(e) {
					e.preventDefault();

					monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
						function() {
							self.getLimits(function(dataLimits) {
								var updateData = {
									twoway_trunks: trunksOutboundView.find('#slider_twoway').slider('value'),
									inbound_trunks: 'data' in data ? data.data.inbound_trunks || 0 : 0
								};

								updateData = $.extend(true, dataLimits.data, updateData);

								self.updateLimits(updateData, function(_data) {
									var argsMenu = {
										module: self.name,
										data: updateData.twoway_trunks,
										key: 'outbound'
									};

									monster.pub('myaccount.updateMenu', argsMenu);
									self.renderOutbound();
								});
							});
						}
					);
				});

				monster.pub('myaccount.renderSubmodule', trunksOutboundView);

				trunksOutboundView.find('.slider-value-wrapper').css('left', trunksOutboundView.find('#slider_twoway .ui-slider-handle').css('left'));
			});
		},

		//utils
		getLimits: function(success, error) {
			var self = this;

			monster.request({
				resource: 'trunks.getLimits',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

		updateLimits: function(limits, success, error) {
			var self = this;

			monster.request({
				resource: 'trunks.updateLimits',
				data: {
					accountId: self.accountId,
					data: limits
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		}
	};

	return app;
});
