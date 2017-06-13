define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var storageSelector = {
		requests: {},

		subscribe: {
			'common.storageSelector.render': 'storageSelectorRender'
		},

		storageSelectorRender: function(args) {
			var self = this;

			self.storageSelectorGetData(args, function(data) {
				var template = $(self.getTemplate({
						name: 'list',
						submodule: 'storageSelector',
						data: data
					})),
					modal = monster.ui.fullScreenModal(template);
				console.log(modal);
				self.storageSelectorBind(template, modal, args.callback);
			});
		},

		storageSelectorGetStorage: function(callback) {
			var self = this;

			self.callApi({
				resource: 'storage.get',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		storageSelectorGetData: function(args, callback) {
			var self = this;

			monster.parallel({
				storage: function(callback) {
					if (args.hasOwnProperty('data')) {
						callback && callback(null, args.data);
					} else {
						self.storageSelectorGetStorage(function(data) {
							callback && callback(null, data);
						});
					}
				}
			}, function(err, results) {
				self.storageSelectorFormatData(results);

				callback && callback(results);
			});
		},

		storageSelectorFormatData: function(data) {
			console.log(data);
			return data;
		},

		storageSelectorBind: function(template, modal, callback) {
			var self = this;

			template.find('.storage-choice').on('click', function() {
				var isSelected = $(this).hasClass('selected');

				template.find('.storage-choice').removeClass('selected');

				if (!isSelected) {
					$(this).addClass('selected');
				}
			});

			template.find('#select_button').on('click', function() {
				var validId = template.find('.storage-choice.selected').data('id');

				if (validId) {
					modal.close();
					callback && callback(validId);
				}
			});

			template.find('.cancel').on('click', function() {
				modal.close();
			});
		}
	};

	return storageSelector;
});
