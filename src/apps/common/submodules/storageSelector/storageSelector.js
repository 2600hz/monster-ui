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
				var formattedData = self.storageSelectorFormatData(data),
					template = $(self.getTemplate({
						name: 'list',
						submodule: 'storageSelector',
						data: formattedData
					})),
					modal = monster.ui.fullScreenModal(template),
					afterSelect = function(id) {
						var storageAttachment = {
							id: id
						};

						if (data.hasOwnProperty('storage') && data.storage.hasOwnProperty('attachments') && data.storage.attachments.hasOwnProperty(id)) {
							storageAttachment = $.extend(true, {}, storageAttachment, data.storage.attachments[id]);
						}

						args.callback && args.callback(storageAttachment);
					};

				self.storageSelectorBind(template, modal, afterSelect);
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
				callback && callback(results);
			});
		},

		storageSelectorFormatData: function(data) {
			var formattedData = {
				storageChoices: []
			};

			if (data.hasOwnProperty('storage') && data.storage.hasOwnProperty('attachments') && !_.isEmpty(data.storage.attachments)) {
				_.each(data.storage.attachments, function(attachment, id) {
					formattedData.storageChoices.push({
						id: id,
						name: attachment.name,
						logoBrandName: attachment.handler === 's3' ? 'aws' : 'g-drive'
					});
				});
			}

			return formattedData;
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

			template.find('.cancel-link').on('click', function() {
				modal.close();
			});
		}
	};

	return storageSelector;
});
