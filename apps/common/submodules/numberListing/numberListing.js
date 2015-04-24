define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var numberListing = {
		requests: {

		},

		subscribe: {
			'common.numberListing.render': 'numberListingRender'
		},

		numberListingRender: function(args) {
			var self = this,
				container = args.container,
				numbers = args.numbers,
				sortedNumbers = monster.util.sort(_.map(numbers, function(val, key) {
					val.phoneNumber = key;
					return val;
				}), 'phoneNumber'),
				layout = $(monster.template(self, 'numberListing-layout', {
					numbers: sortedNumbers,
					headline: args.headline || (args.singleNumber ? self.i18n.active().numberListing.headlineSingle : self.i18n.active().numberListing.headline),
					okButton: args.okButton || self.i18n.active().numberListing.proceed,
					cancelButton: args.cancelButton || self.i18n.active().cancel,
					singleNumber: args.singleNumber
				})),
				popup;

			layout.find('[data-toggle="tooltip"]').tooltip();

			layout.find('.empty-search-row').hide();


			if(container) {
				container
					.empty()
					.append(layout);
			} else {
				popup = monster.ui.dialog(layout, {
					title: args.title || self.i18n.active().numberListing.title,
					position: ['center', 20]
				});
			}

			self.numberListingBindEvents($.extend({ 
				template: layout,
				popup: popup,
				sortedNumbers: sortedNumbers
			}, args));
		},

		numberListingBindEvents: function(args) {
			var self = this,
				template = args.template,
				popup = args.popup,
				numbers = args.numbers,
				sortedNumbers = args.sortedNumbers,
				cancelCallback = args.cancelCallback,
				okCallback = args.okCallback;

			template.on('keyup', '.search-query', function() {
				var rows = template.find('.number-box'),
					emptySearch = template.find('.empty-search-row'),
					currentRow;

				currentNumberSearch = $(this).val().toLowerCase();

				_.each(rows, function(row) {
					currentRow = $(row);
					currentRow.data('search').toLowerCase().indexOf(currentNumberSearch) < 0 ? currentRow.hide() : currentRow.show();
				});

				if(rows.size() > 0) {
					rows.is(':visible') ? emptySearch.hide() : emptySearch.show();
				}
			});

			template.find('.number-box:not(.no-data)').on('click', function(event) {
				var $this = $(this);

				if(!$(event.target).is('input, .monster-checkbox, .monster-checkbox > *')) {
					var $current_cb = $this.find('input'),
						cb_value = $current_cb.prop('checked');

					$current_cb
						.prop('checked', !cb_value)
						.change();
				}
			});

			template.find('.number-box:not(.no-data) input').on('change', function(event) {
				if(args.singleNumber) {
					template.find('.number-box').removeClass('selected');
					$(this).parents('.number-box').addClass('selected');
				} else {
					$(this).parents('.number-box').toggleClass('selected');
				}
			});

			template.find('.proceed').on('click', function() {
				var selectedNumbersRow = template.find('.number-box.selected'),
					remainingQuantity = sortedNumbers.length - selectedNumbersRow.length,
					selectedNumbers = [];

				_.each(selectedNumbersRow, function(row) {
					var number = $(row).data('number');

					selectedNumbers.push(numbers[number]);
				});

				if(selectedNumbers.length > 0) {
					okCallback && okCallback(selectedNumbers, remainingQuantity);

					popup && popup.dialog('close').remove();
				}
				else {
					monster.ui.alert('error', self.i18n.active().numberListing.noNumberSelected);
				}
			});

			template.find('.cancel').on('click', function(e) {
				popup && popup.dialog('close').remove();
				cancelCallback && cancelCallback();
			});
		}
	};

	return numberListing;
});
