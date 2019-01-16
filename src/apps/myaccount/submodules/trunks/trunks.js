define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var trunks = {

		requests: {
		},

		subscribe: {
			'myaccount.trunks.renderContent': '_trunksRenderContent',
			'myaccount.refreshBadges': '_trunksRefreshBadges'
		},

		appFlags: {
			trunks: {
				amounts: {
					inbound: 6.99,
					outbound: 29.99,
					twoway: 29.99
				}
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

		/**
		 * Renders the trunking limits view
		 * @param  {Object}    args
		 * @param  {('inbound'|'outbound'|'twoway')} args.trunkType  Trunk type
		 * @param  {Function}  [args.callback]  Callback
		 */
		_trunksRenderContent: function(args) {
			var self = this,
				trunkType = args.key;

			self.trunksGetLimits(function(data) {
				var amount = self.appFlags.trunks.amounts[trunkType],
					trunkValuePropName = trunkType + '_trunks',
					trunksValue = _.get(data.data, trunkValuePropName, 0),
					totalAmount = amount * trunksValue,
					dataTemplate = {
						value: trunksValue,
						trunkType: trunkType
					},
					trunksView = $(self.getTemplate({
						name: 'layout',
						data: dataTemplate,
						submodule: 'trunks'
					}));

				monster.ui.tooltips(trunksView);

				trunksView.find('#slider_trunks').slider({
					min: 0,
					max: 100,
					range: 'min',
					value: trunksValue > 0 ? trunksValue : 0,
					slide: function(event, ui) {
						trunksView.find('.slider-value').html(ui.value);
						totalAmount = ui.value * amount;

						trunksView.find('.total-amount .total-amount-value').html(totalAmount.toFixed(2));

						trunksView.find('.slider-value').css('left', trunksView.find('#slider_trunks .ui-slider-handle').css('left'));
					},
					change: function() {
						trunksView.find('.slider-value').css('left', trunksView.find('#slider_trunks .ui-slider-handle').css('left'));
					}
				});

				trunksView.find('.update-limits').on('click', function(e) {
					e.preventDefault();

					self.trunksGetLimits(function(dataLimits) {
						var updateData = {
							inbound_trunks: 'data' in data ? data.data.inbound_trunks || 0 : 0,
							twoway_trunks: 'data' in data ? data.data.twoway_trunks || 0 : 0
						};

						updateData[trunkValuePropName] = trunksView.find('#slider_trunks').slider('value');

						self.trunksUpdateLimits({
							limits: _.merge(dataLimits.data, updateData),
							success: function(_data) {
								var argsMenu = {
									module: self.name,
									data: _.get(updateData, trunkValuePropName),
									key: trunkType
								};

								monster.pub('myaccount.updateMenu', argsMenu);
								self._trunksRenderContent({ key: trunkType });
								//TODO toastr saved
							}
						});
					});
				});

				monster.pub('myaccount.renderSubmodule', trunksView);

				trunksView.find('.slider-value').css('left', trunksView.find('#slider_trunks .ui-slider-handle').css('left'));

				args.hasOwnProperty('callback') && args.callback();
			});
		},

		//utils
		trunksGetLimits: function(success, error) {
			var self = this;

			self.callApi({
				resource: 'limits.get',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

		/**
		 * Update trunk limits
		 * @param  {Object}   args
		 * @param  {Object}   args.limits     Trunk limits
		 * @param  {Function} [args.success]  Success callback
		 * @param  {Function} [args.error]    Error callback
		 */
		trunksUpdateLimits: function(args) {
			var self = this;

			self.callApi({
				resource: 'limits.update',
				data: {
					accountId: self.accountId,
					data: args.limits
				},
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data, status);
				},
				error: function(data, status) {
					args.hasOwnProperty('error') && args.error(data, status);
				},
				onChargesCancelled: function(data, status) {
					args.hasOwnProperty('error') && args.error(data, status);
				}
			});
		}
	};

	return trunks;
});
