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
							self.trunksGetLimitPropertyName(trunkType),
							0),
						dataTemplate = {
							value: trunksValue,
							trunkType: trunkType
						},
						template = $(self.getTemplate({
							name: 'layout',
							data: dataTemplate,
							submodule: 'trunks'
						}));

					monster.ui.tooltips(template);

					template.find('#slider_trunks').slider({
						min: 0,
						max: 100,
						range: 'min',
						value: trunksValue > 0 ? trunksValue : 0
					});

					return template;
				};

			self.appFlags.trunks.currentType = args.key;

			self.trunksGetLimits({
				success: function(dataLimits) {
					var template = initTemplate(dataLimits);

					self.trunksBindEvents({
						template: template,
						dataLimits: dataLimits
					});

					monster.pub('myaccount.renderSubmodule', template);

					self.trunksUpdateSliderValuePosition({
						slider: template.find('#slider_trunks'),
						sliderValue: template.find('.slider-value')
					});

					args.hasOwnProperty('callback') && args.callback();
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
			self.trunksGetLimits({
				success: function(dataLimits) {
					_.each(self.appFlags.trunks.allTypes, function(trunkType) {
						monster.pub('myaccount.updateMenu', {
							module: self.name,
							key: trunkType,
							data: _.get(
								dataLimits,
								self.trunksGetLimitPropertyName(trunkType),
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
		 * @param  {JQuery} args.template    Template to bind
		 * @param  {Object} args.dataLimits  Limits data
		 */
		trunksBindEvents: function(args) {
			var self = this,
				trunkType = self.appFlags.trunks.currentType,
				template = args.template,
				slider = template.find('#slider_trunks'),
				sliderValue = template.find('.slider-value');

			slider
				.on('slide', function(event, ui) {
					sliderValue.html(ui.value);

					self.trunksUpdateSliderValuePosition({
						slider: slider,
						sliderValue: sliderValue
					});
				})
				.on('change', function() {
					self.trunksUpdateSliderValuePosition({
						slider: slider,
						sliderValue: sliderValue
					});
				});

			template.find('.update-limits').on('click', function(e) {
				var trunksNewLimit = slider.slider('value');

				e.preventDefault();

				self.trunksHelperUpdateTrunkLimit({
					trunksLimit: trunksNewLimit,
					trunkType: trunkType,
					success: function() {
						monster.pub('myaccount.updateMenu', {
							module: self.name,
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
					self.trunksGetLimits({
						success: function(dataLimits) {
							waterfallCallback(null, dataLimits);
						},
						error: function() {
							waterfallCallback(true);
						}
					});
				},
				function(dataLimits, waterfallCallback) {
					var trunksLimitPropName = self.trunksGetLimitPropertyName(self.appFlags.trunks.currentType),
						updateData = {
							inbound_trunks: _.get(dataLimits, 'inbound_trunks', 0),
							twoway_trunks: _.get(dataLimits, 'twoway_trunks', 0)
						};

					updateData[trunksLimitPropName] = args.trunksLimit;

					self.trunksUpdateLimits({
						limits: _.merge(dataLimits, updateData),
						success: function() {
							waterfallCallback(null);
						},
						error: function() {
							waterfallCallback(true);
						}
					});
				}
			], function(err) {
				if (err) {
					args.hasOwnProperty('error') && args.error(err);
				} else {
					args.hasOwnProperty('success') && args.success();
				}
			});
		},

		// Utils

		/**
		 * Gets the property name corresponding to the specified trunk type
		 * @param  {('inbound'|'outbound'|'twoway')}} trunkType  Trunk type
		 */
		trunksGetLimitPropertyName: function(trunkType) {
			return trunkType + '_trunks';
		},

		/**
		 * Updates slider value element position
		 * @param  {Object} args
		 * @param  {JQuery} args.slider       Slider JQuery object
		 * @param  {JQuery} args.sliderValue  Slider value JQuery object
		 */
		trunksUpdateSliderValuePosition: function(args) {
			args.sliderValue
				.css('left',
					args.slider
						.find('.ui-slider-handle')
						.css('left'));
		},

		/**
		 * Get limits from API
		 * @param  {Object}   args
		 * @param  {Function} [args.success]  Success callback
		 * @param  {Function} [args.error]    Error callback
		 */
		trunksGetLimits: function(args) {
			var self = this;

			self.callApi({
				resource: 'limits.get',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data, status);
				},
				error: function(data, status) {
					args.hasOwnProperty('error') && args.error(data, status);
				}
			});
		},

		/**
		 * Update limits
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
					args.hasOwnProperty('success') && args.success(data.data, status);
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
