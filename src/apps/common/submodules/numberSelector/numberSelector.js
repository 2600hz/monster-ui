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
					extension: self.i18n.active().numberSelector.extensionLink,
					hideNumber: false
				}, args.labels),
				layout = $(monster.template(self, 'numberSelector-layout', {
					labels: labels,
					inputName: args.inputName || '',
					number: args.number,
					noSpare: args.noSpare === true ? true : false,
					noBuy: args.noBuy === true ? true : false,
					noExtension: args.noExtension === true ? true : false
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
					if(numberList && !_.isEmpty(numberList)) {
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
