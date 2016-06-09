define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var trunks = {

		requests: {
		},

		subscribe: {
			'myaccount.trunks.renderContent': '_trunksRenderContent',
			'myaccount.refreshBadges': '_trunksRefreshBadges'
		},

		_trunksRenderContent: function(args) {
			var self = this;
			if(args.key === 'inbound') {
				self.trunksRenderInbound(args.callback);
			}
			else if(args.key === 'outbound') {
				self.trunksRenderOutbound(args.callback);
			}
			else if(args.key === 'twoway') {
				self.trunksRenderTwoway(args.callback)
			}
		},

		_trunksRefreshBadges: function(args) {
			var self = this;

			// We can't do the except logic for trunks,  because we need to update the 2 other tabs anyway, and they're all using the same API
			self.trunksGetLimits(function(dataLimits) {
				var argsMenuInbound = {
						module: 'trunks',
						key: 'inbound',
						data: dataLimits.data.inbound_trunks || 0,
						callback: args.callback
					},
					argsMenuOutbound = {
						module: 'trunks',
						key: 'outbound',
						data: dataLimits.data.outbound_trunks || 0,
						callback: args.callback
					},
					argsMenuTwoway = {
						module: 'trunks',
						key: 'twoway',
						data: dataLimits.data.twoway_trunks || 0,
						callback: args.callback
					};

				monster.pub('myaccount.updateMenu', argsMenuInbound);
				monster.pub('myaccount.updateMenu', argsMenuOutbound);
				monster.pub('myaccount.updateMenu', argsMenuTwoway);
			});
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

				monster.ui.tooltips(trunksInboundView);

				trunksInboundView.find('#slider_inbound').slider({
					min: 0,
					max: 100,
					range: 'min',
					value: data.data.inbound_trunks > 0 ? data.data.inbound_trunks : 0,
					slide: function( event, ui ) {
						trunksInboundView.find('.slider-value').html(ui.value);
						totalAmountInbound = ui.value*amountInbound;
						trunksInboundView.find('.total-amount .total-amount-value').html(totalAmountInbound.toFixed(2));

						trunksInboundView.find('.slider-value').css('left', trunksInboundView.find('#slider_inbound .ui-slider-handle').css('left'));
					},
					change: function(event, ui) {
						trunksInboundView.find('.slider-value').css('left', trunksInboundView.find('#slider_inbound .ui-slider-handle').css('left'));
					}
				});

				trunksInboundView.find('.update-limits').on('click', function(e) {
					e.preventDefault();

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
				});

				monster.pub('myaccount.renderSubmodule', trunksInboundView);

				trunksInboundView.find('.slider-value').css('left', trunksInboundView.find('#slider_inbound .ui-slider-handle').css('left'));

				callback && callback();
			});
		},

		trunksRenderOutbound: function(callback) {
			var self = this;

			self.trunksGetLimits(function(data) {
				var amountOutbound = 29.99,
					outbound = data.data.outbound_trunks || 0,
					totalAmountOutbound = amountOutbound * outbound,
					dataTemplate = {
						outbound: outbound,
						amountOutbound: amountOutbound.toFixed(2),
						totalAmountOutbound: totalAmountOutbound.toFixed(2)
					},
					trunksOutboundView = $(monster.template(self, 'trunks-outbound', dataTemplate));

				monster.ui.tooltips(trunksOutboundView);

				trunksOutboundView.find('#slider_outbound').slider({
					min: 0,
					max: 100,
					range: 'min',
					value: data.data.outbound_trunks > 0 ? data.data.outbound_trunks : 0,
					slide: function( event, ui ) {
						trunksOutboundView.find('.slider-value').html(ui.value);
						totalAmountOutbound = ui.value * amountOutbound;

						trunksOutboundView.find('.total-amount .total-amount-value').html(totalAmountOutbound.toFixed(2));

						trunksOutboundView.find('.slider-value').css('left', trunksOutboundView.find('#slider_outbound .ui-slider-handle').css('left'));
					},
					change: function(event, ui) {
						trunksOutboundView.find('.slider-value').css('left', trunksOutboundView.find('#slider_outbound .ui-slider-handle').css('left'));
					}
				});

				trunksOutboundView.find('.update-limits').on('click', function(e) {
					e.preventDefault();

					self.trunksGetLimits(function(dataLimits) {
						var updateData = {
							outbound_trunks: trunksOutboundView.find('#slider_outbound').slider('value'),
							inbound_trunks: 'data' in data ? data.data.inbound_trunks || 0 : 0,
							twoway_trunks: 'data' in data ? data.data.twoway_trunks || 0 : 0
						};

						updateData = $.extend(true, dataLimits.data, updateData);

						self.trunksUpdateLimits(updateData, function(_data) {
							var argsMenu = {
								module: self.name,
								data: updateData.outbound_trunks,
								key: 'outbound'
							};

							monster.pub('myaccount.updateMenu', argsMenu);
							self.trunksRenderOutbound();
						});
					});
				});

				monster.pub('myaccount.renderSubmodule', trunksOutboundView);

				trunksOutboundView.find('.slider-value').css('left', trunksOutboundView.find('#slider_outbound .ui-slider-handle').css('left'));

				callback && callback();
			});
		},

		trunksRenderTwoway: function(callback) {
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
					trunksTwowayView = $(monster.template(self, 'trunks-twoway', dataTemplate));

				monster.ui.tooltips(trunksTwowayView);

				trunksTwowayView.find('#slider_twoway').slider({
					min: 0,
					max: 100,
					range: 'min',
					value: data.data.twoway_trunks > 0 ? data.data.twoway_trunks : 0,
					slide: function( event, ui ) {
						trunksTwowayView.find('.slider-value').html(ui.value);
						totalAmountTwoway = ui.value * amountTwoway;

						trunksTwowayView.find('.total-amount .total-amount-value').html(totalAmountTwoway.toFixed(2));

						trunksTwowayView.find('.slider-value').css('left', trunksTwowayView.find('#slider_twoway .ui-slider-handle').css('left'));
					},
					change: function(event, ui) {
						trunksTwowayView.find('.slider-value').css('left', trunksTwowayView.find('#slider_twoway .ui-slider-handle').css('left'));
					}
				});

				trunksTwowayView.find('.update-limits').on('click', function(e) {
					e.preventDefault();

					self.trunksGetLimits(function(dataLimits) {
						var updateData = {
							twoway_trunks: trunksTwowayView.find('#slider_twoway').slider('value'),
							inbound_trunks: 'data' in data ? data.data.inbound_trunks || 0 : 0
						};

						updateData = $.extend(true, dataLimits.data, updateData);

						self.trunksUpdateLimits(updateData, function(_data) {
							var argsMenu = {
								module: self.name,
								data: updateData.twoway_trunks,
								key: 'twoway'
							};

							monster.pub('myaccount.updateMenu', argsMenu);
							self.trunksRenderTwoway();
						});
					});
				});

				monster.pub('myaccount.renderSubmodule', trunksTwowayView);

				trunksTwowayView.find('.slider-value').css('left', trunksTwowayView.find('#slider_twoway .ui-slider-handle').css('left'));

				callback && callback();
			});
		},

		//utils
		trunksGetLimits: function(success, error) {
			var self = this;

			self.callApi({
				resource: 'limits.get',
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

			self.callApi({
				resource: 'limits.update',
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
