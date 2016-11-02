define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var carrierSelector = {

		requests: {},

		subscribe: {
			'common.carrierSelector': 'carrierSelectorRender',
			'common.carrierSelector.getDescription': 'carrierSelectorGetDescription'
		},

		/* data with noMatch parameter
			callbackAfterSave
		*/
		carrierSelectorRender: function(args) {
			var self = this,
				formattedData = self.carrierSelectorFormatData(args.data),
				template = $(monster.template(self, 'carrierSelector-layout', formattedData));

			self.carrierSelectorBindEvents(template, formattedData, args.callbackAfterSave);

			args.container.empty()
						  .append(template);
		},

		carrierSelectorFormatData: function(params) {
			var self = this,
				resellerString = self.i18n.active().carrierSelector['useReseller'].defaultFriendlyName,
				resellerHelp = self.i18n.active().carrierSelector['useReseller'].defaultHelp;

			if(monster.config.whitelabel.hasOwnProperty('companyName') && monster.config.whitelabel.companyName.length) {
				resellerString = monster.template(self, '!'+self.i18n.active().carrierSelector['useReseller'].friendlyName, { variable: monster.config.whitelabel.companyName });
				resellerHelp = monster.template(self, '!'+self.i18n.active().carrierSelector['useReseller'].help, { variable: monster.config.whitelabel.companyName });
			}

			var carrierInfo = {
					noMatchCallflow: params.noMatch,
					type: 'useBlended',
					choices: [
						{
							friendlyName: self.i18n.active().carrierSelector['useBlended'].friendlyName,
							help: self.i18n.active().carrierSelector['useBlended'].help,
							value: 'useBlended'
						},
						{
							friendlyName: resellerString,
							help: resellerHelp,
							value: 'useReseller'
						},
						{
							friendlyName: self.i18n.active().carrierSelector['byoc'].friendlyName,
							help: self.i18n.active().carrierSelector['byoc'].help,
							value: 'byoc'
						}
					]
				};

			// If the branding defined its own order, honor it
			if(monster.config.whitelabel.hasOwnProperty('carrier')) {
				var newChoices = [],
					mapChoices = {};

				// First put the choices in a map so we can access them simply
				_.each(carrierInfo.choices, function(choice) {
					mapChoices[choice.value] = choice;
				})

				// Create the new choices order
				_.each(monster.config.whitelabel.carrier.choices, function(choice) {
					newChoices.push(mapChoices[choice]);
				});

				carrierInfo.choices = newChoices;
			}

			// If we have only one choice, it means we want to hide that tab and not allow users to customize their carriers
			if(carrierInfo.choices.length === 1) {
				carrierInfo.disabled = true;
			}

			// if module is offnet, they use global carriers ("blended")
			if(params.noMatch.flow.module === 'offnet') {
				carrierInfo.type = 'useBlended';
			}
			else if(params.noMatch.flow.module === 'resources'){
				// if hunt_account_id is defined
				if(params.noMatch.flow.data.hasOwnProperty('hunt_account_id')) {
					// check if hunt_account_id = this account id which means he brings his own carrier
					if(params.noMatch.flow.data.hunt_account_id === params.accountData.id) {
						carrierInfo.type = 'byoc';
					}
					// else check if it's = to his resellerId, which means he uses his reseller carriers
					else if(params.noMatch.flow.data.hunt_account_id === params.accountData.reseller_id) {
						carrierInfo.type = 'useReseller';
					}
					// else it's using an accountId we don't know, so we show an error
					else {
						carrierInfo.huntError = 'wrong_hunt_id';
						carrierInfo.type = 'useBlended';
					}
				}
				// otherwise it means this accounts will setup their own carriers
				else {
					carrierInfo.type = 'byoc';
				}
			}

			params.carrierInfo = carrierInfo;

			return params;
		},

		carrierSelectorBindEvents: function(template, data, callbackAfterSave) {
			var self = this,
				contentHtml = template,
				defaultType = data.carrierInfo.type,
				paramAccountId = data.accountData.id,
				paramResellerId = data.accountData.reseller_id,
				noMatchFlow = data.noMatch;

			monster.ui.tooltips(contentHtml);

			contentHtml.find('.carrier-choice').on('click', function() {
				var $this = $(this),
					saveButton = contentHtml.find('.carrier-save');

				contentHtml.find('.carrier-choice')
						   .removeClass('selected');

				$this.addClass('selected');

				$this.data('type') !== defaultType ? saveButton.removeClass('disabled') : saveButton.addClass('disabled');
			});

			contentHtml.find('.carrier-save').on('click', function() {
				var $this = $(this),
					carrierType = contentHtml.find('.carrier-choice.selected').data('type');

				// If the carrierType isn't the same used, we need to update the document.
				if(carrierType !== defaultType) {
					var callbackSuccess = function(data) {
							defaultType = carrierType;
							toastr.success(self.i18n.active().carrierSelector.saveSuccess);
							contentHtml.find('.hunt-error').remove();
							$this.addClass('disabled');

							callbackAfterSave && callbackAfterSave(data);
						},
						paramsNoMatch = {
							type: carrierType,
							accountId: paramAccountId,
							resellerId: paramResellerId
						};

					if(noMatchFlow.hasOwnProperty('id')) {
						paramsNoMatch.callflowId = noMatchFlow.id;

						self.carrierSelectorUpdateNoMatch(paramsNoMatch, callbackSuccess);
					}
					else {
						self.carrierSelectorCreateNoMatch(paramsNoMatch, callbackSuccess);
					}
				}
			});
		},

		carrierSelectorCreateNoMatch: function(params, callback) {
			var self = this,
				whitelabelType = monster.config.whitelabel.hasOwnProperty('carrier') ? monster.config.whitelabel.carrier.choices[0] : false,
				type = params.type || whitelabelType || 'useBlended',
				accountId = params.accountId,
				resellerId = params.resellerId,
				noMatchCallflow = self.carrierSelectorGetDataNoMatch(type, resellerId);

			self.callApi({
				resource: 'callflow.create',
				data: {
					accountId: accountId,
					data: noMatchCallflow
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},

		carrierSelectorUpdateNoMatch: function(params, callback) {
			var self = this,
				type = params.type,
				accountId = params.accountId,
				callflowId = params.callflowId,
				resellerId = params.resellerId,
				noMatchCallflow = self.carrierSelectorGetDataNoMatch(type, resellerId);

			self.callApi({
				resource: 'callflow.update',
				data: {
					accountId: accountId,
					callflowId: callflowId,
					data: noMatchCallflow
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},

		carrierSelectorGetDataNoMatch: function(type, resellerId) {
			var self = this,
				noMatchCallflow = {
					numbers: ['no_match'],
					flow: {
						children: {},
						data: {},
						module: 'offnet'
					}
				};

			if(type !== 'useBlended') {
				noMatchCallflow.flow.module = 'resources';

				if(type === 'useReseller') {
					noMatchCallflow.flow.data.hunt_account_id = resellerId;
				}
			}

			return noMatchCallflow;
		},

		carrierSelectorGetDescription: function(args) {
			var self = this,
				params = args.data,
				callback = args.callback,
				type = "",
				description = "";

			// if module is offnet, they use global carriers ("blended")
			if(params.noMatch.flow.module === 'offnet') {
				type = 'useBlended';
			}
			else if(params.noMatch.flow.module === 'resources'){
				// if hunt_account_id is defined
				if(params.noMatch.flow.data.hasOwnProperty('hunt_account_id')) {
					// check if hunt_account_id = this account id which means he brings his own carrier
					if(params.noMatch.flow.data.hunt_account_id === params.accountData.id) {
						type = 'byoc';
					}
					// else check if it's = to his resellerId, which means he uses his reseller carriers
					else if(params.noMatch.flow.data.hunt_account_id === params.accountData.reseller_id) {
						type = 'useReseller';
					}
					// else it's using an accountId we don't know, so we show an error
					else {
						type = 'useBlended';
					}
				}
				// otherwise it means this accounts will setup their own carriers
				else {
					type = 'byoc';
				}
			}

			if(monster.config.whitelabel.hasOwnProperty('companyName') && type === 'useReseller') {
				description = monster.template(self, '!'+self.i18n.active().carrierSelector['useReseller'].friendlyName, { variable: monster.config.whitelabel.companyName });
			}
			else {
				description = self.i18n.active().carrierSelector[type].friendlyName;
			}

			callback && callback(description);
		}
	};

	return carrierSelector;
});
