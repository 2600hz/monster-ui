define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {

		requests: {
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

					dataTemplate.show_not_listed_links = args.showNotListedLinks;

					self.chooseModelRenderProvisioner(dataTemplate, function(dataModel) {
						args.callback(dataModel);
					});
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

		chooseModelRenderProvisioner: function(dataTemplate, callback) {
			var self = this,
				selectedBrand,
				selectedFamily,
				selectedModel,
				templateDevice = $(monster.template(self, 'chooseModel-provisioner', dataTemplate));

			templateDevice.find('.brand-box').on('click', function() {
				var $this = $(this),
					brand = $this.data('brand');

				selectedBrand = brand;

				$this.removeClass('unselected').addClass('selected');
				templateDevice.find('.brand-box:not([data-brand="'+brand+'"])').removeClass('selected').addClass('unselected');
				templateDevice.find('.devices-brand').hide();
				templateDevice.find('.devices-brand[data-brand="'+ brand + '"]').show();

				templateDevice.find('.block-device').show();
			});

			templateDevice.find('.device-box').on('click', function() {
				var $this = $(this);
				selectedModel = $this.data('model'),
				selectedFamily = $this.data('family');

				templateDevice.find('.device-box').removeClass('selected');

				$this.addClass('selected');

				templateDevice.find('.actions .selection').text(monster.template(self, '!' + self.i18n.active().chooseModel.deviceSelected, { brand: selectedBrand, model: selectedModel }));
				templateDevice.find('.actions').show();
			});

			templateDevice.find('.device-box').dblclick(function() {
				var $this = $(this),
					dataModel = {
					endpoint_brand: selectedBrand,
					endpoint_family: $this.data('family'),
					endpoint_model: $this.data('model')
				};

				popup.dialog('close').remove();

				callback && callback(dataModel);
			});

			templateDevice.find('.missing-brand').on('click', function() {
				popup.dialog('close').remove();

				callback && callback();
			});

			templateDevice.find('.next-step').on('click', function() {
				var dataModel = {
					endpoint_brand: selectedBrand,
					endpoint_family: selectedFamily,
					endpoint_model: selectedModel
				};

				popup.dialog('close').remove();

				callback && callback(dataModel);
			});

			var popup = monster.ui.dialog(templateDevice, {
				position: ['center', 20],
				title: self.i18n.active().chooseModel.title
			});
		}
	};

	return app;
});
