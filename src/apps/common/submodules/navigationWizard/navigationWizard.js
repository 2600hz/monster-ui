define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var navigationWizard = {
		subscribe: {
			'common.navigationWizard.render': 'navigationWizardRender',
			'common.navigationWizard.goToStep': 'navigationWizardGoToStep'
		},

		appFlags: {
			navigationWizard: {
				currentStep: 0
			}
		},

		navigationWizardRender: function(args) {
			var self = this,
				container = args.container,
				currentStep = _.isUndefined(args.currentStep) ? 0 : args.currentStep,
				stepsCompleted = _.get(args, 'stepsCompleted', []),
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
				self.appFlags.navigationWizard.currentStep = currentStep;
				self.appFlags.navigationWizard.wizardArgs = _.merge({ template: layout }, args);

				self.navigationWizardBindEvents();

				container
					.empty()
					.append(layout);

				self.navigationWizardGenerateTemplate();

				_.each(stepsCompleted, function(step) {
					if (step === currentStep) {
						return;
					}

					container
						.find('.step[data-id="' + step + '"]')
							.addClass('completed');
				});
			} else {
				throw new Error('A container must be provided.');
			}
		},

		navigationWizardBindEvents: function() {
			var self = this,
				wizardArgs = self.appFlags.navigationWizard.wizardArgs,
				template = wizardArgs.template,
				thisArg = wizardArgs.thisArg;

			self.navigationWizardSetSelected({
				stepId: self.appFlags.navigationWizard.currentStep
			});

			//Clicking the next button
			template
				.find('#next')
					.on('click', function(event) {
						event.preventDefault();

						var currentStep = self.appFlags.navigationWizard.currentStep,
							result = self.navigationWizardUtilForTemplate();

						if (!result.valid) {
							return;
						}

						self.navigationWizardUnsetCurrentSelected({
							isCompleted: true
						});

						if (result.data) {
							self.appFlags.navigationWizard.wizardArgs = _.merge({}, self.appFlags.navigationWizard.wizardArgs, {
								data: result.data
							});
						} else if (result.args) {
							self.appFlags.navigationWizard.wizardArgs = result.args;
						}

						currentStep += 1;

						self.navigationWizardSetSelected({
							stepId: currentStep
						});
						self.navigationWizardGenerateTemplate();
					});

			//Clicking the done/complete button
			template
				.find('#done')
					.on('click', function(event) {
						event.preventDefault();

						var result = self.navigationWizardUtilForTemplate(),
							wizardArgs = self.appFlags.navigationWizard.wizardArgs;

						if (!result.valid) {
							return;
						}

						thisArg[wizardArgs.done](wizardArgs);
					});

			//Clicking the back button
			template
				.find('.back')
					.on('click', function(event) {
						event.preventDefault();

						var currentStep = self.appFlags.navigationWizard.currentStep;

						self.navigationWizardUnsetCurrentSelected();

						currentStep -= 1;

						self.navigationWizardSetSelected({
							stepId: currentStep
						});
						self.navigationWizardGenerateTemplate();
					});

			//Clicking the cancel button
			template
				.find('#cancel')
					.on('click', function(event) {
						event.preventDefault();

						var wizardArgs = self.appFlags.navigationWizard.wizardArgs;

						thisArg[wizardArgs.cancel](wizardArgs);
					});

			//Clicking the clear link
			template
				.find('#clear')
					.on('click', function(event) {
						event.preventDefault();

						var currentStep = self.appFlags.navigationWizard.currentStep,
							wizardArgs = self.appFlags.navigationWizard.wizardArgs,
							step = wizardArgs.steps[currentStep];

						self.appFlags.navigationWizard.wizardArgs = _.merge({}, wizardArgs, {
							data: step.default
						});

						//re-render template with default values
						self.navigationWizardSetSelected({
							stepId: currentStep
						});
						self.navigationWizardGenerateTemplate();
					});

			//Clicking on the menu item
			template
				.on('click', '.visited', function() {
					var stepId = $(this).data('id');
					self.navigationWizardGoToStep({
						stepId: stepId
					});
				});
		},

		/**
		 * Go to a specific step that has been already completed
		 * @param  {Object} args
		 * @param  {String} args.stepId  Destination step identifier
		 */
		navigationWizardGoToStep: function(args) {
			var self = this,
				stepId = args.stepId;

			//make sure we display page as previously selected
			self.navigationWizardUnsetCurrentSelected();

			//set new template and menu items to reflect that
			self.navigationWizardSetSelected({
				stepId: stepId
			});
			self.navigationWizardGenerateTemplate();
		},

		navigationWizardUnsetCurrentSelected: function(args) {
			var self = this,
				isCompleted = _.get(args, 'isCompleted', false),
				appFlags = self.appFlags,
				currentStep = appFlags.navigationWizard.currentStep,
				$template = appFlags.navigationWizard.wizardArgs.template,
				$currentStepItem = $template.find('div.step[data-id="' + currentStep + '"]');

			$currentStepItem.removeClass('selected');

			if (isCompleted) {
				$currentStepItem.addClass('completed');
			}
		},

		navigationWizardSetSelected: function(args) {
			var self = this,
				stepId = args.stepId,
				appFlags = self.appFlags,
				wizardArgs = appFlags.navigationWizard.wizardArgs,
				template = wizardArgs.template,
				steps = wizardArgs.steps;

			self.appFlags.navigationWizard.currentStep = stepId;

			template
				.find('.right-content')
					.empty()
						.append(steps[stepId].template);

			template
				.find('.step[data-id="' + stepId + '"]')
					.addClass('selected visited');

			//hide clear button if it's not a form
			if (steps[stepId].default) {
				template
					.find('#clear')
						.show();
			} else {
				template
					.find('#clear')
						.hide();
			}

			//Hide back button in the first page
			if (stepId === 0) {
				template.find('.back').hide();
			} else {
				template.find('.back').show();
			}

			//Display done button
			if ((steps.length - 1) === stepId) {
				template.find('#next').hide();
				template.find('#done').show();
			} else {
				template.find('#done').hide();
				template.find('#next').show();
			}
		},

		navigationWizardGenerateTemplate: function() {
			var self = this,
				appFlags = self.appFlags,
				wizardArgs = appFlags.navigationWizard.wizardArgs,
				thisArg = wizardArgs.thisArg,
				steps = wizardArgs.steps,
				currentStep = appFlags.navigationWizard.currentStep,
				template = steps[currentStep].template;

			self.appFlags.navigationWizard.currentStep = currentStep;
			thisArg[template](wizardArgs);
		},

		navigationWizardUtilForTemplate: function() {
			var self = this,
				appFlags = self.appFlags,
				wizardArgs = appFlags.navigationWizard.wizardArgs,
				thisArg = wizardArgs.thisArg,
				steps = wizardArgs.steps,
				currentStep = appFlags.navigationWizard.currentStep,
				util = steps[currentStep].util;

			return thisArg[util](wizardArgs.template, wizardArgs);
		}
	};

	return navigationWizard;
});
