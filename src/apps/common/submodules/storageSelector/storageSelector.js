define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var storageSelector = {
		requests: {},

		subscribe: {
			'common.storageSelector.render': 'storageSelectorRender'
		},

		storageSelectorRender: function(args) {
			var self = this;

			self.storageSelectorGetData(args, function(data) {
				var formattedData = self.storageSelectorFormatData(data);

				monster.ui.fullScreenPicker({
					mainTitle: self.i18n.active().storageSelector.mainTitle,
					subTitle: self.i18n.active().storageSelector.subTitle,
					buttonText: self.i18n.active().storageSelector.select,
					choices: formattedData.storageChoices,
					hasIcons: true,
					afterSelected: function(id) {
						var storageAttachment = {
							id: id
						};

						if (data.hasOwnProperty('storage') && data.storage.hasOwnProperty('attachments') && data.storage.attachments.hasOwnProperty(id)) {
							storageAttachment = $.extend(true, {}, storageAttachment, data.storage.attachments[id]);
						}

						args.callback && args.callback(storageAttachment);
					}
				});
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
		}
	};

	return storageSelector;
});
