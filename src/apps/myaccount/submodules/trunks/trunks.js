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
				types: [ 'inbound', 'outbound', 'twoway' ]
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
				trunkType = args.key;

			self.trunksGetLimits({
				success: function(data) {
					var trunkValuePropName = trunkType + '_trunks',
						trunksValue = _.get(data, trunkValuePropName, 0),
						dataTemplate = {
							value: trunksValue,
							trunkType: trunkType
						},
						$trunksView = $(self.getTemplate({
							name: 'layout',
							data: dataTemplate,
							submodule: 'trunks'
						})),
						$slider = $trunksView.find('#slider_trunks'),
						$sliderValue = $trunksView.find('.slider-value');

					monster.ui.tooltips($trunksView);

					$slider.slider({
						min: 0,
						max: 100,
						range: 'min',
						value: trunksValue > 0 ? trunksValue : 0,
						slide: function(event, ui) {
							$sliderValue.html(ui.value);

							$sliderValue.css('left', $slider.find('.ui-slider-handle').css('left'));
						},
						change: function() {
							$sliderValue.css('left', $slider.find('.ui-slider-handle').css('left'));
						}
					});

					$trunksView.find('.update-limits').on('click', function(e) {
						e.preventDefault();

						monster.waterfall([
							function(callback) {
								self.trunksGetLimits({
									success: function(dataLimits) {
										callback(null, dataLimits);
									}
								});
							},
							function(dataLimits, callback) {
								var updateData = {
									inbound_trunks: _.get(data, 'inbound_trunks', 0),
									twoway_trunks: _.get(data, 'twoway_trunks', 0)
								};

								updateData[trunkValuePropName] = $slider.slider('value');

								self.trunksUpdateLimits({
									limits: _.merge(dataLimits, updateData),
									success: function() {
										callback(null, updateData);
									}
								});
							}
						], function(err, updateData) {
							var argsMenu = {
								module: self.name,
								data: _.get(updateData, trunkValuePropName),
								key: trunkType
							};

							monster.pub('myaccount.updateMenu', argsMenu);

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
						});
					});

					monster.pub('myaccount.renderSubmodule', $trunksView);

					$sliderValue.css('left', $slider.find('.ui-slider-handle').css('left'));

					args.hasOwnProperty('callback') && args.callback();
				}
			});
		},

		trunksRefreshBadges: function(args) {
			var self = this;

			// We can't do the except logic for trunks, because we need to update the 2 other tabs anyway, and they're all using the same API
			self.trunksGetLimits({
				success: function(dataLimits) {
					_.each(self.appFlags.trunks.types, function(trunkType) {
						monster.pub('myaccount.updateMenu', {
							module: self.name,
							key: trunkType,
							data: _.get(dataLimits, trunkType + '_trunks', 0),
							callback: args.callback
						});
					});
				}
			});
		},

		// Utils

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
