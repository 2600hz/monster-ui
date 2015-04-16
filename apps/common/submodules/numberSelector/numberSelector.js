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
				layout = $(monster.template(self, 'numberSelector-layout', {
					inputName: args.inputName || '',
					number: args.number
				}));

			if(container) {
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
				dropdown = template.find('.number-selector-dropdown'),
				input = template.find('.number-selector-input'),
				displayed = template.find('.number-selector-displayed .number'),
				removeElement = template.find('.remove-element');

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
						displayed.text(self.i18n.active().numberSelector.emptyValue);
						removeElement.addClass('hidden');
						removeCallback && removeCallback(current);
						break;
					}
					case 'spare': {
						monster.pub('common.numbers.dialogSpare', {
							accountName: monster.apps['auth'].currentAccount.name,
							accountId: self.accountId,
							callback: function(numberList) {
								if(numberList && numberList.length) {
									var num = numberList[0].phoneNumber;
									input.val(num);
									displayed.text(monster.util.formatPhoneNumber(num));
									removeElement.find('.number').text(monster.util.formatPhoneNumber(num));
									removeElement.removeClass('hidden');
									spareCallback && spareCallback(num);
								}
							}
						});
						break;
					}
					case 'buy': {
						monster.pub('common.buyNumbers', {
							accountId: self.accountId,
							searchType: 'regular',
							callbacks: {
								success: function(numbers) {
									if(numbers && !_.isEmpty(numbers)) {
										var num = Object.keys(numbers)[0];
										input.val(num);
										displayed.text(monster.util.formatPhoneNumber(num));
										removeElement.find('.number').text(monster.util.formatPhoneNumber(num));
										removeElement.removeClass('hidden');
										spareCallback && spareCallback(num);
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
