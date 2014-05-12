define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {

		requests: {
			/* Provisioner */
			'common.chooseModel.getProvisionerData': {
				apiRoot: monster.config.api.provisioner,
				url: 'api/phones',
				verb: 'GET'
			}
		},

		subscribe: {
			'common.chooseModel.render': 'chooseModelRender'
		},

		chooseModelRender: function(args) {
			var self = this;

			monster.request({
				resource: 'common.chooseModel.getProvisionerData',
				data: {},
				success: function(dataProvisioner) {
					var dataTemplate = self.chooseModelFormatProvisionerData(dataProvisioner.data);

					dataTemplate.show_not_listed_links = args.callbackMissingBrand ? true : false;

					self.chooseModelRenderProvisioner(dataTemplate, function(dataModel) {
						args.callback(dataModel);
					}, args.callbackMissingBrand);
				}
			});
		},

		chooseModelFormatProvisionerData: function(data) {
			var formattedData = {
				brands: []
			};

			_.each(data, function(brand) {
				var families = [];

				_.each(brand.families, function(family) {
					var models = [];

					_.each(family.models, function(model) {

						models.push(model.name);
					});

					families.push({ name: family.name, models: models });
				});

				formattedData.brands.push({
					name: brand.name,
					families: families
				});
			});

			return formattedData;
		},

		chooseModelRenderProvisioner: function(dataTemplate, callback, callbackMissingBrand) {
			var self = this,
				selectedBrand,
				selectedFamily,
				selectedModel,
				templateDevice = $(monster.template(self, 'chooseModel-provisioner', dataTemplate));

			monster.ui.validate(templateDevice.find('#device_form'), {
				rules: {
					'name': {
						required: true
					},
					'mac_address': {
						required: true,
						mac: true
					}
				}
			});

			templateDevice.find('#mac_address').mask("hh:hh:hh:hh:hh:hh", {placeholder:" "});

			templateDevice.find('.brand-box').on('click', function() {
				var $this = $(this),
					brand = $this.data('brand');

				selectedBrand = brand;

				if ( $this.hasClass('unselected') ) {
					$this.removeClass('unselected').addClass('selected');
					templateDevice
						.find('.brand-box:not([data-brand="'+brand+'"])')
						.removeClass('selected')
						.addClass('unselected');

					templateDevice.find('.models-brand:not([data-brand="'+brand+'"])').slideUp(function() {
						templateDevice.find('.models-brand[data-brand="'+ brand + '"]').fadeIn();
					});
				} else {
					$this.addClass('selected');
					templateDevice
						.find('.brand-box:not([data-brand="'+brand+'"])')
						.removeClass('selected')
						.addClass('unselected');

					templateDevice.find('.models-brand[data-brand="'+ brand + '"]').show(function() {
						templateDevice.find('.block-model').slideDown();
					});
				}
			});

			templateDevice.find('.model-box').on('click', function() {
				var $this = $(this);
				selectedModel = $this.data('model'),
				selectedFamily = $this.data('family');

				templateDevice.find('.model-box').removeClass('selected');

				$this.addClass('selected');

				templateDevice.find('.actions .selection').text(monster.template(self, '!' + self.i18n.active().chooseModel.deviceSelected, { brand: selectedBrand, model: selectedModel }));
				templateDevice.find('.block-footer').slideDown();
			});

			templateDevice.find('.missing-brand').on('click', function() {
				popup.dialog('close').remove();

				callbackMissingBrand && callbackMissingBrand();
			});

			templateDevice.find('.action-device').on('click', function() {
				if(monster.ui.valid(templateDevice.find('#device_form'))) {
					var formData = form2object('device_form'),
						dataDevice = {
							device_type: 'sip_device',
							enabled: true,
							mac_address: formData.mac_address,
							name: formData.name,
							provision: {
								endpoint_brand: selectedBrand,
								endpoint_family: selectedFamily,
								endpoint_model: selectedModel
							},
							sip: {
								password: monster.util.randomString(12),
								realm: monster.apps.auth.currentAccount.realm,
								username: 'user_' + monster.util.randomString(10)
							},
							suppress_unregister_notifications: false
						};

					popup.dialog('close').remove();

					callback && callback(dataDevice);
				}
			});

			var popup = monster.ui.dialog(templateDevice, {
				position: ['center', 20],
				title: self.i18n.active().chooseModel.title
			});
		}
	};

	return app;
});
