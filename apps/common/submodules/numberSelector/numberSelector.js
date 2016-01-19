define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var numberSelector = {
		requests: {

		},

		subscribe: {
			'common.numberSelector.render': 'numberSelectorRender'
		},

		numberSelectorRender: function(args) {
			var self = this,
				container = args.container,
				labels = $.extend({
					empty: self.i18n.active().numberSelector.emptyValue,
					remove: self.i18n.active().numberSelector.removeLink,
					spare: self.i18n.active().numberSelector.spareLink,
					buy: self.i18n.active().numberSelector.buyLink,
					hideNumber: false
				}, args.labels),
				layout = $(monster.template(self, 'numberSelector-layout', {
					labels: labels,
					inputName: args.inputName || '',
					number: args.number,
					noSpare: args.noSpare === true ? true : false,
					noBuy: args.noBuy === true ? true : false
				}));

			if(container) {
				args.labels = labels;
				self.numberSelectorBindEvents($.extend({ template: layout }, args));
				container.append(layout);
			} else {
				throw 'A container must be provided.';
			}
		},

		numberSelectorBindEvents: function(args) {
			var self = this,
				template = args.template,
				removeCallback = args.removeCallback,
				spareCallback = args.spareCallback,
				buyCallback = args.buyCallback,
				/**
				 * If specified, globalAddNumberCallback will override
				 * buyCallback and spareCallback and be called without
				 * consideration of the source of the selected number.
				 * @type {Function}
				 */
				globalAddNumberCallback = args.globalAddNumberCallback,
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
				addNumberCallback = function(numberList) {
					if(numberList && !_.isEmpty(numberList)) {
						var num = _.isArray(numberList) ? numberList[0].phoneNumber : Object.keys(numberList)[0];

						addNumberToControl(num);

						if (globalAddNumberCallback) {
							globalAddNumberCallback(num);
						}
						else {
							spareCallback && spareCallback(num);
						}
					}
				};

			dropdown.on('click', function() {
				dropdown.toggleClass('open');
			});

			dropdown.on('blur', function() {
				dropdown.removeClass('open');
			});

			template.find('.number-selector-element').on('click', function() {
				switch($(this).data('action')) {
					case 'remove': {
						var current = input.val();
						input.val('');
						displayed.text(args.labels.empty);
						removeElement.addClass('hidden');
						removeCallback && removeCallback(current);
						break;
					}
					case 'spare': {
						if(customNumbers) {
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
					case 'buy': {
						monster.pub('common.buyNumbers', {
							accountId: self.accountId,
							searchType: 'regular',
							callbacks: {
								success: function(numbers) {
									// We changed this code, so that we can give ways to code using that common control to still add a number to the control, without having to know the logic of said control.
									// Before they had no access to the addNumberToControl method, so we give it to them here.
									if(globalAddNumberCallback) {
										globalAddNumberCallback(numbers, addNumberToControl);
									}
									else {
										buyCallback(numbers);
									}
								}
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
