define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash');

	var navigationWizard = {
		subscribe: {
			'common.navigationWizard.render': 'navigationWizardRender',
			'common.navigationWizard.goToStep': 'navigationWizardGoToStep',
			'common.navigationWizard.arguments': 'navigationWizardArguments'
		},

		appFlags: {
			// Default values just for reference, they will be overwritten anyways
			navigationWizard: {
				currentStep: 0,
				validateOnStepChange: false,
				wizardArgs: {}
			}
		},

		navigationWizardRender: function(args) {
			var self = this,
				container = args.container,
				stepsCompleted = _.get(args, 'stepsCompleted', []),
				navigationWizardFlags = self.appFlags.navigationWizard,
				layout = $(self.getTemplate({
					name: 'layout',
					data: {
						title: args.title,
						steps: args.steps,
						doneButton: _.get(args, 'doneButton', '')
					},
					submodule: 'navigationWizard'
				}));

			if (container) {
				navigationWizardFlags.currentStep = _.get(args, 'currentStep', 0);
				navigationWizardFlags.validateOnStepChange = _.get(args, 'validateOnStepChange', false);
				navigationWizardFlags.wizardArgs = _.merge({
					template: layout
				}, args);

				self.navigationWizardBindEvents();

				container
					.empty()
					.append(layout);

				self.navigationWizardGenerateTemplate();

				_.each(stepsCompleted, function(step) {
					if (step === navigationWizardFlags.currentStep) {
						return;
					}
					if (step > _.get(navigationWizardFlags, 'lastCompletedStep', -1)) {
						navigationWizardFlags.lastCompletedStep = step;
					}

					container
						.find('.step[data-id="' + step + '"]')
							.addClass('completed visited');
				});
			} else {
				throw new Error('A container must be provided.');
			}
		},

		navigationWizardBindEvents: function() {
			var self = this,
				navigationWizardFlags = self.appFlags.navigationWizard,
				wizardArgs = navigationWizardFlags.wizardArgs,
				template = wizardArgs.template,
				thisArg = wizardArgs.thisArg;

			self.navigationWizardSetSelected({
				stepId: navigationWizardFlags.currentStep
			});

			//Clicking the next button
			template
				.find('#next')
					.on('click', function(event) {
						event.preventDefault();

						self.navigationWizardChangeStep({
							stepId: navigationWizardFlags.currentStep + 1,
							eventType: 'next',
							validateCurrentStep: true,
							completeCurrentStep: true
						});
					});

			//Clicking the done/complete button
			template
				.find('#done')
					.on('click', function(event) {
						event.preventDefault();

						var result = self.navigationWizardUtilForTemplate({
							eventType: 'done'
						});

						if (!result.valid) {
							return;
						}

						thisArg[wizardArgs.done](wizardArgs);
					});

			template
				.find('#save_app')
					.on('click', function(event) {
						event.preventDefault();

						var result = self.navigationWizardUtilForTemplate({
							eventType: 'save'
						});

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

						self.navigationWizardChangeStep({
							stepId: navigationWizardFlags.currentStep - 1,
							eventType: 'back'
						});
					});

			//Clicking the cancel button
			template
				.find('#cancel')
					.on('click', function(event) {
						event.preventDefault();

						thisArg[wizardArgs.cancel](wizardArgs);
					});

			//Clicking the clear link
			template
				.find('#clear')
					.on('click', function(event) {
						event.preventDefault();

						var currentStep = navigationWizardFlags.currentStep,
							step = wizardArgs.steps[currentStep];

						_.merge(wizardArgs, {
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

			self.navigationWizardChangeStep({
				stepId: stepId,
				eventType: 'goto'
			});
		},

		navigationWizardArguments: function(callback) {
			var self = this;

			callback(self.appFlags.navigationWizard.wizardArgs);
		},

		navigationWizardUnsetCurrentSelected: function(args) {
			var self = this,
				isCompleted = _.get(args, 'isCompleted', false),
				navigationWizardFlags = self.appFlags.navigationWizard,
				currentStep = navigationWizardFlags.currentStep,
				$template = navigationWizardFlags.wizardArgs.template,
				$currentStepItem = $template.find('div.step[data-id="' + currentStep + '"]');

			$currentStepItem.removeClass('selected');

			if (!isCompleted) {
				return;
			}

			$currentStepItem.addClass('completed');

			if (currentStep > _.get(navigationWizardFlags, 'lastCompletedStep', -1)) {
				navigationWizardFlags.lastCompletedStep = currentStep;
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

		/**
		 * Executes the method to validate and process the current step data
		 * @param  {Object} args
		 * @param  {('back'|'done'|'goto'|'next'|'save')} args.eventType Type of event that
		 *                                                               triggered the execution of
		 *                                                               the util method
		 */
		navigationWizardUtilForTemplate: function(args) {
			var self = this,
				eventType = args.eventType,
				navigationWizardFlags = self.appFlags.navigationWizard,
				wizardArgs = navigationWizardFlags.wizardArgs,
				thisArg = wizardArgs.thisArg,
				steps = wizardArgs.steps,
				currentStep = navigationWizardFlags.currentStep,
				util = steps[currentStep].util;

			return thisArg[util](wizardArgs.template, wizardArgs, {
				eventType: eventType,
				stepAlreadyCompleted: navigationWizardFlags.currentStep <= navigationWizardFlags.lastCompletedStep
			});
		},

		/**
		 * Move to a specific wizard step
		 * @param  {Object} args
		 * @param  {String} args.stepId  Destination step identifier
		 * @param  {('back'|'goto'|'next')} args.eventType  Type of event that triggered the change
		 * @param  {Boolean} [args.validateCurrentStep=this.appFlags.navigationWizard.validateOnStepChange]  Validate the current step,
		 *                                                                                              before moving to the new one
		 * @param  {Boolean} [args.completeCurrentStep=false]  Mark the current step as completed, if valid
		 */
		navigationWizardChangeStep: function(args) {
			var self = this,
				stepId = args.stepId,
				eventType = args.eventType,
				validateCurrentStep = _.get(args, 'validateCurrentStep', self.appFlags.navigationWizard.validateOnStepChange),
				completeCurrentStep = _.get(args, 'completeCurrentStep', false),
				wizardArgs = self.appFlags.navigationWizard.wizardArgs,
				result;

			if (stepId === self.appFlags.navigationWizard.currentStep) {
				return;
			}

			if (validateCurrentStep) {
				result = self.navigationWizardUtilForTemplate({
					eventType: eventType
				});

				if (!result.valid) {
					return;
				}
			}

			//make sure we display page as previously selected
			self.navigationWizardUnsetCurrentSelected({
				isCompleted: _.get(result, 'valid', false) && completeCurrentStep
			});

			if (_.has(result, 'data')) {
				_.merge(wizardArgs, {
					data: result.data
				});
			} else if (_.has(result, 'args')) {
				_.merge(wizardArgs, result.args);
			}

			//set new template and menu items to reflect that
			self.navigationWizardSetSelected({
				stepId: stepId
			});
			self.navigationWizardGenerateTemplate();
		}
	};

	return navigationWizard;
});
