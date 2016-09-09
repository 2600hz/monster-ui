define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var monsterListing = {
		requests: {

		},

		subscribe: {
			'common.monsterListing.render': 'monsterListingRender'
		},

		monsterListingRender: function(args) {
			var self = this,
				container = args.container,
				formattedData = self.monsterListingFormatData(args),
				layout = $(monster.template(self, 'monsterListing-layout', formattedData.labels)),
				popup;

			layout.find('.grid-content').append(monster.template(self, formattedData.templateName, formattedData));

			monster.ui.tooltips(layout, {
				options: {
					container: 'body'
				}
			});

			layout.find('.empty-search-row').hide();

			if(container) {
				container
					.empty()
					.append(layout);
			} else {
				popup = monster.ui.dialog(layout, {
					title: formattedData.labels.title,
					position: ['center', 20]
				});
			}

			self.monsterListingBindEvents($.extend({}, args, { 
				template: layout,
				popup: popup,
				formattedData: formattedData
			}));
		},

		monsterListingFormatData: function(args) {
			var self = this,
				dataType = args.dataType,
				formattedData = {
					dataList: args.dataList,
					singleSelect: args.singleSelect
				};

			switch(dataType) {
				case 'numbers': {
					formattedData.sortedDataList = _.map(args.dataList, function(val, key) {
						val.phoneNumber = key;
						return val;
					});
					monster.util.sort(formattedData.sortedDataList, 'phoneNumber');
					formattedData.templateName = 'monsterListing-numbers';
					break;
				}
				case 'users': {
					formattedData.sortedDataList = _.map(args.dataList, function(val, key) {
						val.name = val.first_name + ' ' + val.last_name;
						return val;
					});
					if(_.isArray(args.dataList)) {
						formattedData.dataList = _.indexBy(args.dataList, 'id');
					}
					monster.util.sort(formattedData.sortedDataList);
					formattedData.templateName = 'monsterListing-default';
					break;
				}
				default: {
					if(_.isArray(args.dataList)) {
						formattedData.sortedDataList = args.dataList;
						formattedData.dataList = _.indexBy(args.dataList, 'id');
					} else {
						formattedData.sortedDataList = _.toArray(args.dataList);
					}
					monster.util.sort(formattedData.sortedDataList);
					formattedData.templateName = 'monsterListing-default';
					break;
				}
			}

			if(dataType in self.i18n.active().monsterListing) {
				formattedData.labels = $.extend({}, self.i18n.active().monsterListing[dataType], args.labels);
			} else {
				formattedData.labels = $.extend({}, self.i18n.active().monsterListing['default'], args.labels);
			}
			formattedData.labels.headline = args.singleSelect ? formattedData.labels.headlineSingle : formattedData.labels.headline;

			return formattedData;
		},

		monsterListingBindEvents: function(args) {
			var self = this,
				template = args.template,
				popup = args.popup,
				formattedData = args.formattedData,
				sortedDataList = formattedData.sortedDataList,
				dataList = formattedData.dataList,
				cancelCallback = args.cancelCallback,
				okCallback = args.okCallback;

			template.on('keyup', '.search-query', function() {
				var rows = template.find('.monster-listing-box'),
					emptySearch = template.find('.empty-search-row'),
					currentRow;

				currentSearch = $(this).val().toLowerCase();

				_.each(rows, function(row) {
					currentRow = $(row);
					currentRow.data('search').toLowerCase().indexOf(currentSearch) < 0 ? currentRow.hide() : currentRow.show();
				});

				if(rows.size() > 0) {
					rows.is(':visible') ? emptySearch.hide() : emptySearch.show();
				}
			});

			template.find('.monster-listing-box:not(.no-data)').on('click', function(event) {
				var $this = $(this);

				if(!$(event.target).is('input, .monster-checkbox, .monster-checkbox > *')) {
					var $current_cb = $this.find('input'),
						cb_value = $current_cb.prop('checked');

					$current_cb
						.prop('checked', !cb_value)
						.change();
				}
			});

			template.find('.monster-listing-box:not(.no-data) input').on('change', function(event) {
				if(args.singleSelect) {
					template.find('.monster-listing-box').removeClass('selected');
					$(this).parents('.monster-listing-box').addClass('selected');
				} else {
					$(this).parents('.monster-listing-box').toggleClass('selected');
				}
			});

			template.find('.proceed').on('click', function() {
				var selectedRow = template.find('.monster-listing-box.selected'),
					remainingQuantity = sortedDataList.length - selectedRow.length,
					selectedData = [];

				_.each(selectedRow, function(row) {
					var id = $(row).data('id');

					selectedData.push((dataList.hasOwnProperty(id) ? dataList[id] : id));
				});

				if(selectedData.length > 0) {
					okCallback && okCallback(selectedData, remainingQuantity);

					popup && popup.dialog('close').remove();
				}
				else {
					monster.ui.alert('error', formattedData.labels.noDataSelected);
				}
			});

			template.find('.cancel').on('click', function(e) {
				popup && popup.dialog('close').remove();
				cancelCallback && cancelCallback();
			});
		}
	};

	return monsterListing;
});
