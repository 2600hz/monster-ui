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

		appFlags: {
			chooseModel: {
				/**
				 * Family names for which model names should be prefixed by its family name
				 * @type {Array}
				 */
				familyNamesAsPrefix: [
					'vvx'
				]
			}
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
			var self = this,
				resolveModelName = function resolveModelName(familyName, modelName) {
					return _
						.chain(self.appFlags.chooseModel.familyNamesAsPrefix)
						.filter(function(name) {
							return name === familyName;
						})
						.map(_.toUpper)
						.concat([modelName])
						.join(' ')
						.value();
				};

			return {
				brands: _.map(data, function(brand, brandKey) {
					return {
						id: _.lowerCase(brandKey),
						name: brand.name,
						families: _.map(brand.families, function(family, familyKey) {
							return {
								id: _.toLower(familyKey),
								name: family.name,
								models: _.map(family.models, function(model, modelKey) {
									return {
										id: _.toLower(modelKey),
										name: resolveModelName(family.name, model.name)
									};
								})
							};
						})
					};
				})
			};
		},

		hideDeviceFooter: function(templateDevice) {
			templateDevice.find('.block-footer').slideUp();
		},

		hideDeviceBoxes: function(templateDevice, searchType) {
			var self = this;

			if (searchType === 'models') {
				templateDevice.find('.model-box').removeClass('selected').removeClass('unselected');
				self.hideDeviceFooter(templateDevice);
			} else if (searchType === 'brand') {
				templateDevice.find('.models-brand[data-brand="' + templateDevice.find('.brand-box.selected').data('brand') + '"]').fadeOut('fast', function() {
					templateDevice.find('.brand-box').removeClass('selected').removeClass('unselected');
				});

				templateDevice.find('.block-model').slideUp();
				self.hideDeviceFooter(templateDevice);
				templateDevice.find('.model-box.selected').removeClass('selected');
			}
		},

		getSearchRequest: function(templateDevice, event) {
			var $this = $(event.target),
				self = this;

			var searchType = $this.data('search_type'),
				searchTypeClass = 'search-match-' + searchType,
				searchTerm = $this.val().trim().toUpperCase(),
				$elements = templateDevice.find('.brand-box');

			if (searchType === 'models') {
				var selectedBrand = templateDevice.find('.brand-box.selected').data('brand');
				$elements = $('.models-brand[data-brand="' + selectedBrand + '"] .model-box');
			}

			templateDevice.find('.' + searchTypeClass).removeClass(searchTypeClass);

			// Loop through all elements, and hide those who don't match the search query
			$elements.each(function(index, element) {
				var $element = $(element),
					criteria = $element.data('brand');

				if ($element.data('model')) {
					criteria = $element.data('model');
				}

				if (criteria.toString().trim().toUpperCase().indexOf(searchTerm) > -1) {
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
							templateDevice.find('.models-brand');
							templateDevice.find('.block-model').slideDown();
							if (searchType === 'brand') {
								templateDevice.find('.device-popup-search[data-search_type="models"]').focus().val('');
								templateDevice.find('.model-box.search-match-models.selected').removeClass('selected');
								templateDevice.find('.model-box').show();
								self.hideDeviceFooter(templateDevice);
							}
							break;
						case 0:
							self.hideDeviceBoxes(templateDevice, searchType);
							self.hideDeviceFooter(templateDevice);
							break;
						default:
							self.hideDeviceBoxes(templateDevice, searchType);
							break;
					}
				}
			});
		},

		chooseModelRenderProvisioner: function(dataTemplate, callback, callbackMissingBrand) {
			var self = this,
				selectedBrand,
				selectedFamily,
				selectedModel,
				templateDevice;

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

			templateDevice.find('.device-popup-search').on('keydown', _.debounce(function(event) {
				self.getSearchRequest(templateDevice, event);
			}, 250));

			templateDevice.find('.brand-box').on('click', function() {
				var $this = $(this),
					brand = $this.data('brand'),
					$searchBox = templateDevice.find('.device-popup-search[data-search_type="models"]');

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
						templateDevice.find('.block-model').css('display', 'block');
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
					popup.animate({
						scrollTop: popup.find('.block-device-info').offset().top
					}, 250, function() {
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
