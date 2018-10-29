define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {

		requests: {
			/* Provisioner */
			'common.chooseModel.getProvisionerData': {
				apiRoot: monster.config.api.provisioner,
				url: 'phones',
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

					self.chooseModelRenderProvisioner(dataTemplate, args.callback, args.callbackMissingBrand);
				}
			});
		},

		chooseModelFormatProvisionerData: function(data) {
			var formattedData = {
					brands: []
				},
				families,
				models;

			_.each(data, function(brand, brandKey) {
				families = [];

				_.each(brand.families, function(family, familyKey) {
					models = [];

					_.each(family.models, function(model, modelKey) {
						models.push({
							id: modelKey.toLowerCase(),
							name: model.name
						});
					});

					families.push({
						id: familyKey.toLowerCase(),
						name: family.name,
						models: models
					});
				});

				formattedData.brands.push({
					id: brandKey.toLowerCase(),
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
				templateDevice = $(self.getTemplate({
					name: 'provisioner',
					data: dataTemplate,
					submodule: 'chooseModel'
				}));

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

			monster.ui.mask(templateDevice.find('#mac_address'), 'macAddress');

			templateDevice.find('.device-popup-search').on('keyup', function() {
				var $this = $(this),
					searchType = $this.data('search-type'),
					searchTerm = $this.val().toUpperCase(),
					$elements = templateDevice.find('.brand-box');

				if (searchType === 'models') {
					$elements = $('.model-box');
				}

				// Loop through all elements, and hide those who don't match the search query
				$elements.each(function(index, element) {
					var $element = $(element),
						criteria = $element.data('brand');

					if ($element.data('model')) {
						criteria = $element.data('model');
					}

					if (criteria.toString().toUpperCase().indexOf(searchTerm) > -1) {
						$element.addClass('search-match-' + searchType);
						$element.show();
					} else {
						$element.removeClass('search-match-' + searchType);
						$element.hide();
					}

					if (index === ($elements.length - 1)) {
						var $matches = $('.search-match-' + searchType);

						switch ($matches.length) {
							case 1:
								$matches.trigger('click');
								templateDevice.find('.block-model').slideDown();
								break;
							case 0:
								templateDevice.find('.block-model').slideUp();
								templateDevice.find('.block-footer').slideUp();
								templateDevice.find('.model-box.selected').removeClass('selected');
								break;
						}
					}
				});
			});

			templateDevice.find('.brand-box').on('click', function() {
				var $this = $(this),
					brand = $this.data('brand'),
					$searchBox = templateDevice.find('.device-popup-search[data-search-type="models"]');

				selectedBrand = brand;

				if (!$this.hasClass('unselected') && !$this.hasClass('selected')) {
					$this.addClass('selected');

					$.each($this.siblings(), function(index, val) {
						$(val).addClass('unselected');
					});

					templateDevice.find('.models-brand[data-brand="' + brand + '"]').show(0, function() {
						templateDevice.find('.block-model').slideDown();
					});
				} else if ($this.hasClass('unselected')) {
					$searchBox.val('');
					$searchBox.trigger('keyup');
					templateDevice.find('.models-brand[data-brand="' + templateDevice.find('.brand-box.selected').data('brand') + '"]').fadeOut('fast', function() {
						templateDevice.find('.brand-box.selected').removeClass('selected').addClass('unselected');

						$this.removeClass('unselected').addClass('selected');
						templateDevice.find('.models-brand[data-brand="' + brand + '"]').fadeIn('fast');
					});
				}
			});

			templateDevice.find('.model-box').on('click', function() {
				var $this = $(this);
				selectedModel = $this.data('model');
				selectedFamily = $this.data('family');

				templateDevice.find('.model-box').removeClass('selected');

				$this.addClass('selected');

				templateDevice
					.find('.actions .selection')
						.text(self.getTemplate({
							name: '!' + self.i18n.active().chooseModel.deviceSelected,
							data: {
								brand: selectedBrand,
								model: selectedModel
							},
							submodule: 'chooseModel'
						}));
				templateDevice.find('.block-footer').slideDown(function() {
					$('html, body').animate({ scrollTop: templateDevice.find('div.block-device-info div.title-bar').offset().top }, function() {
						templateDevice.find('#name').focus();
					});
				});
			});

			templateDevice.find('.missing-brand').on('click', function() {
				popup.dialog('close').remove();

				callbackMissingBrand && callbackMissingBrand();
			});

			templateDevice.find('.action-device').on('click', function() {
				if (monster.ui.valid(templateDevice.find('#device_form'))) {
					var formData = monster.ui.getFormData('device_form'),
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
						},
						callbackAfterSave = function() {
							popup.dialog('close').remove();
						};

					callback && callback(dataDevice, callbackAfterSave);
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
