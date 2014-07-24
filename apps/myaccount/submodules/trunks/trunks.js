define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var trunks = {

		requests: {
			'myaccount.trunks.getLimits': {
				url: 'accounts/{accountId}/limits',
				verb: 'GET'
			},
			'myaccount.trunks.updateLimits': {
				url: 'accounts/{accountId}/limits',
				verb: 'POST'
			}
		},

		subscribe: {
			'myaccount.trunks.renderContent': '_trunksRenderContent',
			'myaccount.refreshBadges': '_trunksRefreshBadges'
		},

		_trunksRenderContent: function(args) {
			var self = this;

			if(args.key === 'inbound') {
				self.trunksRenderInbound(function() {
					args.callback && args.callback();
				});
			}
			else {
				self.trunksRenderOutbound(function() {
					args.callback && args.callback();
				});
			}
		},

		_trunksRefreshBadges: function(args) {
			var self = this;

			if(!args.hasOwnProperty('except') || args.except !== 'trunks') {
				self.trunksGetLimits(function(dataLimits) {
					var argsMenuInbound = {
							module: 'trunks',
							key: 'inbound',
							data: dataLimits.data.inbound_trunks,
							callback: args.callback
						},
						argsMenuOutbound = {
							module: 'trunks',
							key: 'outbound',
							data: dataLimits.data.twoway_trunks,
							callback: args.callback
						};

					monster.pub('myaccount.updateMenu', argsMenuInbound);
					monster.pub('myaccount.updateMenu', argsMenuOutbound);
				});
			}
		},

		trunksRenderInbound: function(callback) {
			var self = this;

			self.trunksGetLimits(function(data) {
				var amountInbound = 6.99,
					inbound = data.data.inbound_trunks || 0,
					totalAmountInbound = amountInbound * inbound,
					dataTemplate = {
						inbound: inbound,
						amountInbound: amountInbound.toFixed(2),
						totalAmountInbound: totalAmountInbound.toFixed(2)
					},
					trunksInboundView = $(monster.template(self, 'trunks-inbound', dataTemplate));

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
							self.trunksGetLimits(function(dataLimits) {
								var updateData = {
									inbound_trunks: trunksInboundView.find('#slider_inbound').slider('value'),
									twoway_trunks: 'data' in data ? data.data.twoway_trunks || 0 : 0
								};

								updateData = $.extend(true, dataLimits.data, updateData);

								self.trunksUpdateLimits(updateData, function(_data) {
									var argsMenu = {
										module: self.name,
										key: 'inbound',
										data: updateData.inbound_trunks
									};

									monster.pub('myaccount.updateMenu', argsMenu);
									self.trunksRenderInbound();
									//TODO toastr saved
								});
							});
						}
					);
				});

				monster.pub('myaccount.renderSubmodule', trunksInboundView);

				trunksInboundView.find('.slider-value-wrapper').css('left', trunksInboundView.find('#slider_inbound .ui-slider-handle').css('left'));

				callback && callback();
			});
		},

		trunksRenderOutbound: function(callback) {
			var self = this;

			self.trunksGetLimits(function(data) {
				var amountTwoway = 29.99,
					twoway = data.data.twoway_trunks || 0,
					totalAmountTwoway = amountTwoway * twoway,
					dataTemplate = {
						twoway: twoway,
						amountTwoway: amountTwoway.toFixed(2),
						totalAmountTwoway: totalAmountTwoway.toFixed(2)
					},
					trunksOutboundView = $(monster.template(self, 'trunks-outbound', dataTemplate));

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
							self.trunksGetLimits(function(dataLimits) {
								var updateData = {
									twoway_trunks: trunksOutboundView.find('#slider_twoway').slider('value'),
									inbound_trunks: 'data' in data ? data.data.inbound_trunks || 0 : 0
								};

								updateData = $.extend(true, dataLimits.data, updateData);

								self.trunksUpdateLimits(updateData, function(_data) {
									var argsMenu = {
										module: self.name,
										data: updateData.twoway_trunks,
										key: 'outbound'
									};

									monster.pub('myaccount.updateMenu', argsMenu);
									self.trunksRenderOutbound();
								});
							});
						}
					);
				});

				monster.pub('myaccount.renderSubmodule', trunksOutboundView);

				trunksOutboundView.find('.slider-value-wrapper').css('left', trunksOutboundView.find('#slider_twoway .ui-slider-handle').css('left'));

				callback && callback();
			});
		},

		//utils
		trunksGetLimits: function(success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.trunks.getLimits',
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

		trunksUpdateLimits: function(limits, success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.trunks.updateLimits',
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

	return trunks;
});
