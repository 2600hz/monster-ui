define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var trunks = {

		requests: {
		},

		subscribe: {
			'myaccount.trunks.renderContent': 'trunksRender',
			'myaccount.refreshBadges': 'trunksRefreshBadges'
		},

		appFlags: {
			trunks: {
				allTypes: [ 'inbound', 'outbound', 'twoway' ],
				currentType: null
			}
		},

		/**
		 * Renders the trunking limits view
		 * @param  {Object}                          args
		 * @param  {('inbound'|'outbound'|'twoway')} args.key         Trunk type
		 * @param  {Function}                        [args.callback]  Callback
		 */
		trunksRender: function(args) {
			var self = this,
				initTemplate = function initTemplate(dataLimits) {
					var trunkType = self.appFlags.trunks.currentType,
						trunksValue = _.get(
							dataLimits,
							self.trunksGenerateLimitPropertyName(trunkType),
							0),
						dataTemplate = {
							value: trunksValue,
							trunkType: trunkType
						},
						$template = $(self.getTemplate({
							name: 'layout',
							data: dataTemplate,
							submodule: 'trunks'
						})),
						$slider = $template.find('#slider_trunks');

					monster.ui.tooltips($template);

					$slider.slider({
						min: 0,
						max: 100,
						range: 'min',
						value: trunksValue > 0 ? trunksValue : 0
					});

					self.trunksUpdateSliderValuePosition({
						slider: $slider,
						sliderValue: $template.find('.slider-value')
					});

					self.trunksBindEvents({
						template: $template,
						dataLimits: dataLimits
					});

					return $template;
				};

			self.appFlags.trunks.currentType = args.key;

			self.trunksRequestGetLimits({
				success: function(dataLimits) {
					monster.pub('myaccount.renderSubmodule', initTemplate(dataLimits));

					_.has(args, 'callback') && args.callback();
				}
			});
		},

		/**
		 * Refresh trunking limit badges on menu
		 * @param  {Object}   args
		 * @param  {Function} args.callback  Callback for each menu update action
		 */
		trunksRefreshBadges: function(args) {
			var self = this;

			// We can't do the except logic for trunks, because we need to update the 2 other tabs anyway, and they're all using the same API
			self.trunksRequestGetLimits({
				success: function(dataLimits) {
					_.each(self.appFlags.trunks.allTypes, function(trunkType) {
						monster.pub('myaccount.updateMenu', {
							key: trunkType,
							data: _.get(
								dataLimits,
								self.trunksGenerateLimitPropertyName(trunkType),
								0),
							callback: args.callback
						});
					});
				}
			});
		},

		/**
		 * Bind template content events
		 * @param  {Object} args
		 * @param  {jQuery} args.template    Template to bind
		 * @param  {Object} args.dataLimits  Limits data
		 */
		trunksBindEvents: function(args) {
			var self = this,
				trunkType = self.appFlags.trunks.currentType,
				$template = args.template,
				$slider = $template.find('#slider_trunks'),
				$sliderValue = $template.find('.slider-value');

			$slider
				.on('slide', function(event, ui) {
					$sliderValue.html(ui.value);

					self.trunksUpdateSliderValuePosition({
						slider: $slider,
						sliderValue: $sliderValue
					});
				})
				.on('change', function() {
					self.trunksUpdateSliderValuePosition({
						slider: $slider,
						sliderValue: $sliderValue
					});
				});

			$template.find('.update-limits').on('click', function(e) {
				e.preventDefault();

				var trunksNewLimit = $slider.slider('value');

				self.trunksHelperUpdateTrunkLimit({
					trunksLimit: trunksNewLimit,
					trunkType: trunkType,
					success: function() {
						monster.pub('myaccount.updateMenu', {
							data: trunksNewLimit,
							key: trunkType
						});

						self.trunksRender({
							key: trunkType,
							callback: function() {
								monster.ui.toast({
									type: 'success',
									message: self.getTemplate({
										name: '!' + self.i18n.active().trunks.saveSuccessMessage
									})
								});
							}
						});
					}
				});
			});
		},

		/**
		 * Update a trunk limit
		 * @param  {Object}    args
		 * @param  {Number}    args.trunksLimit  Trunks limit to be applied
		 * @param  {Function}  [args.success]    Success callback
		 * @param  {Function}  [args.error]      Error callback
		 */
		trunksHelperUpdateTrunkLimit: function(args) {
			var self = this;

			monster.waterfall([
				function(waterfallCallback) {
					self.trunksRequestGetLimits({
						success: function(dataLimits) {
							waterfallCallback(null, dataLimits);
						},
						error: function() {
							waterfallCallback(true);
						}
					});
				},
				function(dataLimits, waterfallCallback) {
					var trunksLimitPropName = self.trunksGenerateLimitPropertyName(self.appFlags.trunks.currentType),
						updateData = {
							inbound_trunks: _.get(dataLimits, 'inbound_trunks', 0),
							twoway_trunks: _.get(dataLimits, 'twoway_trunks', 0)
						};

					updateData[trunksLimitPropName] = args.trunksLimit;

					self.trunksRequestUpdateLimits({
						data: {
							data: _.merge({}, dataLimits, updateData)
						},
						success: function() {
							waterfallCallback(null);
						},
						error: function() {
							waterfallCallback(true);
						},
						onChargesCancelled: function() {
							waterfallCallback('cancelled');
						}
					});
				}
			], function(err) {
				if (err === 'cancelled') {
					return;
				}
				if (err) {
					_.has(args, 'error') && args.error(err);
				} else {
					_.has(args, 'success') && args.success();
				}
			});
		},

		// Utils

		/**
		 * Gets the property name corresponding to the specified trunk type
		 * @param  {('inbound'|'outbound'|'twoway')}} trunkType  Trunk type
		 */
		trunksGenerateLimitPropertyName: function(trunkType) {
			return trunkType + '_trunks';
		},

		/**
		 * Updates slider value element position
		 * @param  {Object} args
		 * @param  {jQuery} args.slider       Slider jQuery object
		 * @param  {jQuery} args.sliderValue  Slider value jQuery object
		 */
		trunksUpdateSliderValuePosition: function(args) {
			var $slider = args.slider,
				$sliderValue = args.sliderValue;

			$sliderValue
				.css('left',
					$slider
						.find('.ui-slider-handle')
						.css('left'));
		},

		/**
		 * Get limits from API
		 * @param  {Object}   args
		 * @param  {Function} [args.success]  Success callback
		 * @param  {Function} [args.error]    Error callback
		 */
		trunksRequestGetLimits: function(args) {
			var self = this;

			self.callApi({
				resource: 'limits.get',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					_.has(args, 'success') && args.success(data.data, status);
				},
				error: function(data, status) {
					_.has(args, 'error') && args.error(data, status);
				}
			});
		},

		/**
		 * Update limits
		 * @param  {Object}   args
		 * @param  {Object}   args.data
		 * @param  {Object}   args.data.data             Limits data
		 * @param  {Function} [args.success]             Success callback
		 * @param  {Function} [args.error]               Error callback
		 * @param  {Function} [args.onChargesCancelled]  On charges cancelled callback
		 */
		trunksRequestUpdateLimits: function(args) {
			var self = this;

			self.callApi({
				resource: 'limits.update',
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					_.has(args, 'success') && args.success(data.data, status);
				},
				error: function(data, status) {
					_.has(args, 'error') && args.error(data, status);
				},
				onChargesCancelled: function(data, status) {
					_.has(args, 'onChargesCancelled') && args.onChargesCancelled(data, status);
				}
			});
		}
	};

	return trunks;
});
