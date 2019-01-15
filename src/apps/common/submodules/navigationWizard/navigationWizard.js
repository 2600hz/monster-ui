define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var navigationWizard = {
		requests: {

		},

		subscribe: {
			'common.navigationWizard.render': 'navigationWizardRender'
		},

		navigationWizardRender: function(args) {
			var self = this,
				container = args.container,
				currentStep = 0,
				layout = $(self.getTemplate({
					name: 'layout',
					data: {
						title: args.title,
						steps: args.steps,
						doneButton: args.doneButton ? args.doneButton : ''
					},
					submodule: 'navigationWizard'
				}));

			if (container) {
				self.navigationWizardBindEvents($.extend({ template: layout }, args));

				container
					.empty()
					.append(layout);

				self.generateTemplate(currentStep, args);
			} else {
				throw new Error('A container must be provided.');
			}
		},

		navigationWizardBindEvents: function(args) {
			var self = this,
				thisArg = args.thisArg,
				template = args.template,
				currentStep = 0;

			self.setSelected(currentStep, args);
			self.generateTemplate(currentStep, args);

			//Clicking next on the menu item
			template
				.find('#next')
					.on('click', function(event) {
						event.preventDefault();

						var result = self.utilForTemplate(currentStep, args);

						if (result.valid === true) {
							//display checkbox
							template
								.find('i[data-id="' + currentStep + '"]')
								.removeClass('hide-check');

							template
								.find('li[data-id="' + currentStep + '"]')
								.addClass('done');

							//merge data
							args = _.merge({}, args, {
								data: result.data
							});

							currentStep += 1;
							self.setSelected(currentStep, args);
							self.generateTemplate(currentStep, args);
						}
					});

			//Clicking next on the menu item
			template
				.find('#done')
					.on('click', function(event) {
						event.preventDefault();

						var result = self.utilForTemplate(currentStep, args);

						if (result.valid === true) {
							thisArg[args.done](args);
						}
					});

			//Clicking on the menu item
			template
				.find('.back')
					.on('click', function(event) {
						event.preventDefault();

						currentStep -= 1;
						self.setSelected(currentStep, args);
						self.generateTemplate(currentStep, args);
					});

			//Clicking on cancel
			template
				.find('#cancel')
					.on('click', function(event) {
						event.preventDefault();

						thisArg[args.cancel](args);
					});
		},

		setSelected: function(currentStep, args) {
			var self = this,
				template = args.template,
				steps = args.steps;

			template
				.find('.right-content')
					.empty()
						.append(steps[currentStep].template);

			template
				.find('li')
					.removeClass('selected');

			template
				.find('.nav span')
					.addClass('hide-content')
						.removeClass('show-content');

			template
				.find('span[data-id="' + currentStep + '"]')
					.addClass('show-content')
						.removeClass('hide-content');

			template
				.find('li[data-id="' + currentStep + '"]')
					.addClass('selected');

			//Hide back button in the first page
			if (currentStep === 0) {
				template.find('.back').hide();
			} else {
				template.find('.back').show();
			}

			//Display done button
			if ((steps.length - 1) === currentStep) {
				template.find('#next').hide();
				template.find('#done').show();
			} else {
				template.find('#done').hide();
				template.find('#next').show();
			}
		},

		generateTemplate: function(currentStep, args) {
			var self = this,
				thisArg = args.thisArg,
				steps = args.steps,
				template = steps[currentStep].template;

			thisArg[template](args);
		},

		utilForTemplate: function(currentStep, args) {
			var self = this,
				thisArg = args.thisArg,
				steps = args.steps,
				util = steps[currentStep].util;

			return thisArg[util](args.template, args);
		}
	};

	return navigationWizard;
});
