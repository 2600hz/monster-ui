define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var extensionTools = {

		subscribe: {
			'common.extensionTools.select': 'extensionToolsRenderSelect'
		},

		appFlags: {},

		extensionToolsRenderSelect: function(args) {
			var self = this,
				accountId = args.accountId,
				callbackSuccess = function(extension) {
					args.callback(extension);

					popup.dialog('close').remove();
				},
				popup;

			self.extensionToolsSelectData(function(data) {
				var template = $(monster.template(self, 'extensionTools-getNewDialog', data));

				monster.ui.footable(template.find('.footable'));
				self.extensionToolsSelectBindEvents(template, callbackSuccess, data);

				popup = monster.ui.dialog(template, {
					position: ['center', 20],
					title: self.i18n.active().extensionTools.getNew.title
				});
			});
		},

		extensionToolsSelectData: function(callback) {
			var self = this,
				parsedNumber,
				formattedData = {
					extensions: []
				};

			self.extensionToolsListCallflows(function(callflows) {
				_.each(callflows, function(callflow) {
					_.each(callflow.numbers, function(number) {
						parsedNumber = parseInt(number);

						if(parsedNumber && parsedNumber > 0 && parsedNumber < 100000) {
							formattedData.extensions.push({ extension: parsedNumber, callflow: callflow.name || self.i18n.active().extensionTools.getNew.table.unNamedCallflow });
						}
					})
				})

				formattedData.extensions.sort(function(a,b) {
					return a.extension > b.extension ? 1 : -1;
				});

				callback && callback(formattedData);
			});
		},

		extensionToolsSelectBindEvents: function(template, callbackSuccess, data) {
			var self = this,
				form = template.find('#select_extension_form'),
				listValidationExtensions = [];

			_.each(data.extensions, function(item) {
				listValidationExtensions.push(item.extension + '');
			});

			monster.ui.validate(form, {
				rules: {
					'extension': {
						checkList: listValidationExtensions
					}
				}
			});

			template.find('#extension_number').keyup(function(event){
				if(event.keyCode === 13){
					template.find('#proceed_select_extension').click();
				}
			});

			template.find('#proceed_select_extension').on('click', function(e) {
				e.preventDefault();

				if(monster.ui.valid(form)) {
					var dataForm = monster.ui.getFormData('select_extension_form'),
						formattedData = self.extensionToolsSelectFormatData(dataForm);

					callbackSuccess && callbackSuccess(formattedData);
				}
			});
		},

		extensionToolsSelectFormatData: function(data) {
			var formattedData;

			if(data.hasOwnProperty('extension')) {
				formattedData = data.extension;
			}

			return formattedData;
		},

		extensionToolsListCallflows: function(callback) {
			var self = this;

			self.callApi({
				resource: 'callflow.list',
				data: {
					accountId: self.accountId,
					filters: {
						paginate: 'false'
					}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		}
	};

	return extensionTools;
});
