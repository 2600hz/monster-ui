define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var navigationWizard = {
		subscribe: {
			'common.navigationWizard.render': 'navigationWizardRender',
			'common.navigationWizard.goToStep': 'navigationWizardGoToStep',
			'common.navigationWizard.arguments': 'navigationWizardArguments'
		},

		appFlags: {
			// Default values just for reference, they will be overwritten anyways
			navigationWizard: {
				askForConfirmationOnCancel: false,
				currentStep: 0,
				validateOnStepChange: false,
				wizardArgs: {}
			}
		},

		/**
		 * Renders the navigation wizard component
		 * @param  {Object} args
		 * @param  {Boolean} [args.askForConfirmationOnCancel=false]  Whether or not to ask the user for
		 *                                                            confirmation on wizard cancellation
		 * @param  {String} args.cancel  Name of the function to be invoked when the cancel wizard
		 *                               button is clicked. It must be defined as a property of
		 *                               thisArg.
		 * @param  {jQuery} args.container  Element that will contain the wizard
		 * @param  {Object} [args.data]  Initial data
		 * @param  {String} args.done  Name of the function to be invoked when completing the
		 *                             wizard. It must be defined as a property of thisArg.
		 * @param  {String} [args.doneButton]  Text to be displayed in the wizard done button
		 * @param  {Object[]} args.steps  List of steps with their configuration parameters
		 * @param  {String} args.steps[].description  Step description, to be displayed in the menu
		 * @param  {String} args.steps[].label  Step label, to be displayed in the left menu
		 * @param  {String} args.steps[].template  Name of the function to render the step. It must
		 *                                         be defined as a property of thisArg.
		 * @param  {String} args.steps[].util  Name of the function to validate and process the
		 *                                     step data. It must be defined as a property of
		 *                                     thisArg.
		 * @param  {Number[]} [args.stepsCompleted=[]]  Indexes of the steps that are already
		 *                                              completed
		 * @param  {Any} args.thisArg  Reference to the object where the wizard is invoked
		 * @param  {String} args.title  Title of the wizard
		 * @param  {Boolean} [args.validateOnStepChange=false]  Whether or not to invoke the validation
		 *                                                      function for the current step, before
		 *                                                      moving to another step
		 */
		navigationWizardRender: function(args) {
			var self = this,
				container = args.container,
				stepsCompleted = _.get(args, 'stepsCompleted', []),
				layout = $(self.getTemplate({
					name: 'layout',
					data: {
						title: args.title,
						steps: args.steps,
						doneButton: _.get(args, 'doneButton', '')
					},
					submodule: 'navigationWizard'
				})),
				navigationWizardFlagsDefaults = {
					askForConfirmationOnCancel: false,
					currentStep: 0,
					validateOnStepChange: false
				},
				navigationWizardFlags = _.merge(
					{},
					navigationWizardFlagsDefaults,
					_.pick(args, 'askForConfirmationOnCancel', 'currentStep', 'validateOnStepChange')
				);

			if (!container) {
				throw new Error('A container must be provided.');
			}

			_.each(stepsCompleted, function(step) {
				if (step > _.get(navigationWizardFlags, 'lastCompletedStep', -1)) {
					navigationWizardFlags.lastCompletedStep = step;
				}

				if (step === navigationWizardFlags.currentStep) {
					return;
				}

				layout
					.find('.step[data-id="' + step + '"]')
						.addClass('completed visited');
			});

			navigationWizardFlags.wizardArgs = args;
			navigationWizardFlags.wizardArgs.template = layout;
			self.appFlags.navigationWizard = navigationWizardFlags;

			self.navigationWizardBindEvents();

			container
				.empty()
				.append(layout);

			self.navigationWizardGenerateTemplate();
		},

		/**
		 * Bind wizard events
		 */
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
							eventType: 'next'
						});
					});

			//Clicking the done/complete button
			template
				.find('#done')
					.on('click', function(event) {
						event.preventDefault();

						self.navigationWizardComplete({
							eventType: 'done'
						});
					});

			template
				.find('#save_app')
					.on('click', function(event) {
						event.preventDefault();

						self.navigationWizardComplete({
							eventType: 'save'
						});
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

						monster.waterfall([
							function(waterfallCallback) {
								if (!navigationWizardFlags.askForConfirmationOnCancel) {
									return waterfallCallback(null, true);
								}

								monster.ui.confirm(
									self.i18n.active().navigationWizard.cancelDialogMessage,
									function() {
										waterfallCallback(null, true);
									},
									function() {
										waterfallCallback(null, false);
									}
								);
							}
						], function(err, cancelWizard) {
							if (!cancelWizard) {
								return;
							}

							thisArg[wizardArgs.cancel](wizardArgs);
						});
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

		/**
		 * Passes the wizard arguments to the specified callback
		 * @param  {Function} callback  Callback
		 */
		navigationWizardArguments: function(callback) {
			var self = this;

			callback(self.appFlags.navigationWizard.wizardArgs);
		},

		/**
		 * Unsets the current step, and marks it as completed if required
		 * @param  {Object} args
		 * @param  {Boolean} [args.isCompleted=false]  Whether or not to mark the current step as
		 *                                             completed
		 */
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

		/**
		 * Sets another wizard step as the current selected step
		 * @param  {Object} args
		 * @param  {Number} args.stepId  Step index
		 */
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

		/**
		 * Invokes the render function for the current step
		 */
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
		 * @param  {('back'|'done'|'goto'|'next'|'save')} args.eventType  Type of event that
		 *                                                                triggered the execution
		 *                                                                of the util method
		 * @param  {Boolean} args.completeStep  Indicates whether or not the current step will be
		 *                                      completed
		 */
		navigationWizardUtilForTemplate: function(args) {
			var self = this,
				eventType = args.eventType,
				completeStep = args.completeStep,
				navigationWizardFlags = self.appFlags.navigationWizard,
				wizardArgs = navigationWizardFlags.wizardArgs,
				thisArg = wizardArgs.thisArg,
				steps = wizardArgs.steps,
				currentStep = navigationWizardFlags.currentStep,
				util = steps[currentStep].util;

			return thisArg[util](wizardArgs.template, wizardArgs, {
				eventType: eventType,
				completeStep: completeStep
			});
		},

		/**
		 * Move to a specific wizard step
		 * @param  {Object} args
		 * @param  {String} args.stepId  Destination step identifier
		 * @param  {('back'|'goto'|'next')} args.eventType  Type of event that triggered the change
		 */
		navigationWizardChangeStep: function(args) {
			var self = this,
				stepId = args.stepId,
				eventType = args.eventType,
				navigationWizardFlags = self.appFlags.navigationWizard,
				wizardArgs = navigationWizardFlags.wizardArgs,
				isCurrentStepCompleted = navigationWizardFlags.currentStep <= navigationWizardFlags.lastCompletedStep,
				movingForward = stepId > navigationWizardFlags.currentStep,
				validateCurrentStep = navigationWizardFlags.validateOnStepChange || movingForward,
				completeCurrentStep = isCurrentStepCompleted || movingForward,
				result;

			if (stepId === navigationWizardFlags.currentStep) {
				return;
			}

			if (validateCurrentStep) {
				result = self.navigationWizardUtilForTemplate({
					eventType: eventType,
					completeStep: completeCurrentStep
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
		},

		/**
		 * Completes the wizard by validating the current step and invoking its done function
		 * @param  {Object} args
		 * @param  {('save'|'done')} args.eventType  Type of event that invoked the wizard completion
		 */
		navigationWizardComplete: function(args) {
			var self = this,
				wizardArgs = self.appFlags.navigationWizard.wizardArgs,
				result = self.navigationWizardUtilForTemplate({
					eventType: args.eventType,
					completeStep: true
				});

			if (!result.valid) {
				return;
			}

			wizardArgs.thisArg[wizardArgs.done](wizardArgs);
		}
	};

	return navigationWizard;
});
