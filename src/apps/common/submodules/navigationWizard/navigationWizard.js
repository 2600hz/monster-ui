define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var navigationWizard = {
		subscribe: {
			'common.navigationWizard.render': 'navigationWizardRender'
		},

		appFlags: {
			currentStep: 0
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

			self.appFlags.currentStep = currentStep;

			if (container) {
				self.navigationWizardBindEvents($.extend({ template: layout }, args));

				container
					.empty()
					.append(layout);

				self.navigationWizardGenerateTemplate(currentStep, args);
			} else {
				throw new Error('A container must be provided.');
			}
		},

		navigationWizardBindEvents: function(args) {
			var self = this,
				thisArg = args.thisArg,
				template = args.template,
				currentStep = self.appFlags.currentStep;

			self.navigationWizardSetSelected(currentStep, args);
			self.navigationWizardGenerateTemplate(currentStep, args);

			//Clicking the next button
			template
				.find('#next')
					.on('click', function(event) {
						event.preventDefault();

						var currentStep = self.appFlags.currentStep,
							result = self.navigationWizardUtilForTemplate(currentStep, args);

						if (result.valid === true) {
							self.navigationWizardSetPreviousSelected(currentStep, args);

							//merge data
							args = _.merge({}, args, {
								data: result.data
							});

							currentStep += 1;

							self.navigationWizardSetSelected(currentStep, args);
							self.navigationWizardGenerateTemplate(currentStep, args);
						}
					});

			//Clicking the done/complete button
			template
				.find('#done')
					.on('click', function(event) {
						event.preventDefault();

						var result = self.navigationWizardUtilForTemplate(currentStep, args),
							currentStep = self.appFlags.currentStep;

						if (result.valid === true) {
							thisArg[args.done](args);
						}
					});

			//Clicking the back button
			template
				.find('.back')
					.on('click', function(event) {
						event.preventDefault();

						var currentStep = self.appFlags.currentStep;

						self.navigationWizardSetPreviousSelected(currentStep, args);

						currentStep -= 1;

						self.navigationWizardSetSelected(currentStep, args);
						self.navigationWizardGenerateTemplate(currentStep, args);
					});

			//Clicking the cancel button
			template
				.find('#cancel')
					.on('click', function(event) {
						event.preventDefault();

						thisArg[args.cancel](args);
					});

			//Clicking the clear link
			template
				.find('#clear')
					.on('click', function(event) {
						event.preventDefault();

						var currentStep = self.appFlags.currentStep,
							step = args.steps[currentStep],
							formattedData = _.merge({}, args, {
								data: step.default
							});

						//re-render template with default values
						self.navigationWizardSetSelected(currentStep, formattedData);
						self.navigationWizardGenerateTemplate(currentStep, formattedData);
					});

			//Clicking on the menu item
			template
				.on('click', '.completed', function(event) {
					//make sure we display page as previously selected
					self.navigationWizardSetPreviousSelected(self.appFlags.currentStep, args);

					//set new template and menu items to reflect that
					var currentStep = $(this).data('id');

					self.navigationWizardSetSelected(currentStep, args);
					self.navigationWizardGenerateTemplate(currentStep, args);
				});
		},

		navigationWizardSetPreviousSelected: function(currentStep, args) {
			var self = this,
				template = args.template;

			template
				.find('div.step[data-id="' + currentStep + '"]')
					.removeClass('selected')
						.addClass('completed');
		},

		navigationWizardSetSelected: function(currentStep, args) {
			var self = this,
				template = args.template,
				steps = args.steps;

			self.appFlags.currentStep = currentStep;

			template
				.find('.right-content')
					.empty()
						.append(steps[currentStep].template);

			template
				.find('.step[data-id="' + currentStep + '"]')
					.removeClass('completed')
						.addClass('selected');

			//hide clear button if it's not a form
			if (steps[currentStep].default) {
				template
					.find('#clear')
						.show();
			} else {
				template
					.find('#clear')
						.hide();
			}

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

		navigationWizardGenerateTemplate: function(currentStep, args) {
			var self = this,
				thisArg = args.thisArg,
				steps = args.steps,
				template = steps[currentStep].template;

			self.appFlags.currentStep = currentStep;
			thisArg[template](args);
		},

		navigationWizardUtilForTemplate: function(currentStep, args) {
			var self = this,
				thisArg = args.thisArg,
				steps = args.steps,
				util = steps[currentStep].util;

			return thisArg[util](args.template, args);
		}
	};

	return navigationWizard;
});
