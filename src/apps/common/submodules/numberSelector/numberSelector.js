define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var numberSelector = {
		requests: {

		},

		subscribe: {
			'common.numberSelector.render': 'numberSelectorRender'
		},

		/**
		 * @param  {Object} args
		 * @param  {String} [args.inputName='']
		 * @param  {String} [args.number=undefined]
		 * @param  {Boolean} [args.noBuy=false]
		 * @param  {Boolean} [args.noExtension=false]
		 * @param  {Boolean} [args.noSpare=false]
		 * @param  {Boolean} [args.noCallerId=true]
		 * @param  {Boolean} [args.noAssigned=true]
		 * @param  {Boolean} [args.width=220px]
		 * @param  {Object} [args.labels]
		 */
		numberSelectorRender: function(args) {
			var self = this,
				inputName = _.get(args, 'inputName', ''),
				number = _.get(args, 'number'),
				noBuy = _.isBoolean(args.noBuy) ? args.noBuy : false,
				noExtension = _.isBoolean(args.noExtension) ? args.noExtension : false,
				noSpare = _.isBoolean(args.noSpare) ? args.noSpare : false,
				noAssigned = _.isBoolean(args.noAssigned) ? args.noAssigned : true,
				noCallerIdFromArg = _.isBoolean(args.noCallerId) ? args.noCallerId : true,
				noCallerId = noCallerIdFromArg || !monster.util.getCapability('caller_id.external_numbers').isEnabled,
				container = args.container,
				labels = $.extend({
					empty: self.i18n.active().numberSelector.emptyValue,
					remove: self.i18n.active().numberSelector.removeLink,
					spare: self.i18n.active().numberSelector.spareLink,
					external: self.i18n.active().numberSelector.externalLink,
					assignedLink: self.i18n.active().numberSelector.assignedLink,
					buy: self.i18n.active().numberSelector.buyLink,
					extension: self.i18n.active().numberSelector.extensionLink,
					hideNumber: false
				}, args.labels),
				initTemplate = function(numbers) {
					var isSelectedValid = _
							.chain(numbers)
							.flatMap()
							.includes(number)
							.value(),
						dataToTemplate = noCallerId ? {
							labels: labels,
							inputName: inputName,
							number: number,
							noSpare: noSpare,
							noAssigned: noAssigned,
							noCallerId: true,
							noBuy: monster.config.whitelabel.hideBuyNumbers
								? true
								: noBuy,
							noExtension: noExtension
						} : {
							labels: labels,
							inputName: inputName,
							number: isSelectedValid ? number : undefined,
							noSpare: noSpare,
							noAssigned: noAssigned || _.isEmpty(numbers.assignedNumbers),
							noCallerId: _.isEmpty(numbers.external) || noCallerId,
							noBuy: monster.config.whitelabel.hideBuyNumbers
								? true
								: noBuy,
							noExtension: noExtension
						},
						$template = $(self.getTemplate({
							name: 'layout',
							data: dataToTemplate,
							submodule: 'numberSelector'
						}));

					if (args.width) {
						$template.find('.number-selector-displayed, .number-selector-content').css('width', args.width);
					}

					self.numberSelectorBindEvents($.extend({
						numbers: numbers,
						template: $template
					}, args, {
						labels: labels
					}));

					return $template;
				};

			monster.ui.insertTemplate(container, function(insertTemplateCallback) {
				self.numberSelectorGetData(noCallerId, function(err, numbers) {
					insertTemplateCallback(initTemplate(numbers));
				});
			}, {
				loadingTemplate: 'spinner'
			});
		},

		numberSelectorGetData: function(noCallerId, next) {
			var self = this,
				listExternalNumbers = function(next) {
					if (!monster.util.getCapability('caller_id.external_numbers').isEnabled) {
						return next(null, []);
					}
					self.callApi({
						resource: 'externalNumbers.list',
						data: {
							accountId: self.accountId
						},
						success: _.flow(
							_.partial(_.get, _, 'data'),
							_.partial(_.filter, _, 'verified'),
							_.partial(_.map, _, 'number'),
							_.partial(next, null)
						),
						error: next
					});
				},
				listAssignedNumbers = function(next) {
					self.callApi({
						resource: 'numbers.list',
						data: {
							accountId: self.accountId,
							filters: {
								paginate: false
							}
						},
						success: _.flow(
							_.partial(_.get, _, 'data.numbers'),
							_.partial(_.pickBy, _, 'used_by'),
							_.keys,
							_.partial(next, null)
						),
						error: next
					});
				};

			if (noCallerId) {
				return next(null, []);
			}

			monster.parallel({
				external: listExternalNumbers,
				assignedNumbers: listAssignedNumbers
			}, next);
		},

		numberSelectorBindEvents: function(args) {
			var self = this,
				template = args.template,
				removeCallback = args.removeCallback,
				afterCallback = args.afterCallback,
				spareFilters = args.spareFilters,
				customNumbers = args.customNumbers,
				dropdown = template.find('.number-selector-dropdown'),
				input = template.find('.number-selector-input'),
				displayed = template.find('.number-selector-displayed .number'),
				removeElement = template.find('.remove-element'),
				addNumberToControl = function(number) {
					input.val(number);
					displayed.text(monster.util.formatPhoneNumber(number));
					removeElement.find('.number').text(monster.util.formatPhoneNumber(number));
					removeElement.removeClass('hidden');
				},
				// Handles return from spare control or from buy numbers, one being an array, the other being a map
				addNumberCallback = function(numberList) {
					if (numberList && !_.isEmpty(numberList)) {
						var num = _.isArray(numberList) ? numberList[0].phoneNumber : _.keys(numberList)[0];

						standardCallback(num);
					}
				},
				standardCallback = function(number) {
					addNumberToControl(number);

					afterCallback && afterCallback(number);
				};

			dropdown.on('click', function() {
				dropdown.toggleClass('open');
			});

			dropdown.on('blur', function() {
				dropdown.removeClass('open');
			});

			template.find('.number-selector-element').on('click', function() {
				switch ($(this).data('action')) {
					case 'remove': {
						var current = input.val();
						input.val('');
						displayed.text(args.labels.empty);
						removeElement.addClass('hidden');
						removeCallback && removeCallback(current);
						break;
					}
					case 'spare': {
						if (customNumbers) {
							monster.pub('common.monsterListing.render', {
								dataList: customNumbers,
								dataType: 'numbers',
								singleSelect: true,
								okCallback: addNumberCallback
							});
						} else {
							monster.pub('common.numbers.dialogSpare', {
								accountName: monster.apps.auth.currentAccount.name,
								accountId: self.accountId,
								featureFilters: spareFilters,
								singleSelect: true,
								callback: addNumberCallback
							});
						}
						break;
					}
					case 'external':
						monster.pub('common.monsterListing.render', {
							dataList: _
								.chain(args.numbers.external)
								.keyBy()
								.mapValues(function() {
									return {};
								})
								.value(),
							dataType: 'numbers',
							singleSelect: true,
							okCallback: addNumberCallback
						});
						break;
					case 'assigned':
						monster.pub('common.monsterListing.render', {
							dataList: _.chain(args.numbers.assignedNumbers)
								.keyBy()
								.mapValues(function() {
									return {};
								})
								.value(),
							dataType: 'numbers',
							singleSelect: true,
							okCallback: addNumberCallback
						});
						break;
					case 'extension': {
						monster.pub('common.extensionTools.select', {
							callback: standardCallback
						});
						break;
					}
					case 'buy': {
						monster.pub('common.buyNumbers', {
							accountId: self.accountId,
							searchType: 'regular',
							singleSelect: true,
							callbacks: {
								success: addNumberCallback
							}
						});
						break;
					}
				}
			});
		}
	};

	return numberSelector;
});
