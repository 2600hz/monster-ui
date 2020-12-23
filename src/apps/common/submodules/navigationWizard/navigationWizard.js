define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var navigationWizard = {
		subscribe: {
			'common.navigationWizard.render': 'navigationWizardRender',
			'common.navigationWizard.goToStep': 'navigationWizardGoToStep',
			'common.navigationWizard.arguments': 'navigationWizardArguments',
			'common.navigationWizard.setButtonProps': 'navigationWizardSetButtonProperties'
		},

		appFlags: {
			// Default values just for reference, they will be overwritten anyways
			navigationWizard: {
				askForConfirmationBeforeExit: false,
				currentStep: 0,
				buttons: {},
				validateOnStepChange: false,
				wizardArgs: {},
				statuses: []
			}
		},

		/**
		 * Renders the navigation wizard component
		 * @param  {Object} args
		 * @param  {Boolean} [args.askForConfirmationBeforeExit=false]  Whether or not to ask the user for
		 *                                                               confirmation when leaving the wizard,
		 *                                                               due to cancellation or page unload
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
		 * @param  {String} [args.steps[].template]  Name of the function to render the step. It must
		 *                                           be defined as a property of thisArg.
		 * @param  {Object} [args.steps[].render]  Parameters used to render the step asynchronously.
		 *                                         If defined, the `template` argument is ignored in
		 *                                         favor of this one to render the step.
		 * @param  {Function} args.steps[].render.callback  Function to build the step template
		 *                                                  asynchronously.
		 * @param  {Object} [args.steps[].render.options]  Options to be passed to the loading template.
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
				buttonSelectors = {
					back: '.back',
					cancel: '#cancel',
					clear: '#clear',
					done: '#done',
					next: '#next'
				},
				navigationWizardFlagsDefaults = {
					askForConfirmationBeforeExit: false,
					buttons: _.mapValues(buttonSelectors, function(selector) {
						return {
							element: layout.find(selector),
							enabled: true
						};
					}),
					currentStep: 0,
					validateOnStepChange: false,
					statuses: [
						'selected',
						'visited',
						'completed',
						'invalid'
					]
				},
				navigationWizardFlags = _.merge(
					{},
					navigationWizardFlagsDefaults,
					_.pick(args, 'askForConfirmationBeforeExit', 'currentStep', 'validateOnStepChange')
				);

			if (!container) {
				throw new Error('A container must be provided.');
			}

			navigationWizardFlags.wizardArgs = args;
			navigationWizardFlags.wizardArgs.template = layout;
			self.appFlags.navigationWizard = navigationWizardFlags;

			// Set-up completed steps after setting the wizard args
			_.each(stepsCompleted, function(step) {
				if (step > _.get(navigationWizardFlags, 'lastCompletedStep', -1)) {
					navigationWizardFlags.lastCompletedStep = step;
				}

				if (step === navigationWizardFlags.currentStep) {
					return;
				}

				self.navigationWizardSetStepStatuses({
					stepId: step,
					statuses: [ 'completed' ]
				});
			});

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

			if (navigationWizardFlags.askForConfirmationBeforeExit) {
				$(window).on('beforeunload.navigationWizard.unbindBeforeLogout', function(e) {
					if (!_.isEmpty($('#navigation_wizard_wrapper'))) {
						return self.i18n.active().navigationWizard.cancelDialogMessage;
					}

					// If wizard is no longer in the DOM, then unbind its events
					return self.navigationWizardUnbindEvents();
				});
			}

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

			template
				.find('#done')
					.on('click', function(event) {
						event.preventDefault();

						// Disable button after it's clicked
						$(this).prop('disabled', true);

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
								if (!navigationWizardFlags.askForConfirmationBeforeExit) {
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

							self.navigationWizardUnbindEvents();
						});
					});

			//Clicking the clear link
			template
				.find('#clear')
					.on('click', function(event) {
						event.preventDefault();

						if ($(this).hasClass('disabled')) {
							return;
						}

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
				.find('.nav')
					.on('click', '.visited, .completed', function() {
						var stepId = $(this).data('id');
						self.navigationWizardGoToStep({
							stepId: stepId
						});
					});
		},

		/**
		 * Unbinds global event handlers set by the navigation wizard
		 */
		navigationWizardUnbindEvents: function() {
			$(window).off('beforeunload.navigationWizard');
		},

		/**
		 * Go to a specific step that has been already completed
		 * @param  {Object} args
		 * @param  {String} args.stepId  Destination step identifier
		 * @param  {Object} [args.args]  New arguments for the step
		 * @param  {Boolean} [args.reload=false]  Force the step to reload, if the stepId is the
		 *                                        same current step
		 */
		navigationWizardGoToStep: function(args) {
			var self = this;

			self.navigationWizardChangeStep(_.merge({
				eventType: 'goto'
			}, args));
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
				currentStep = navigationWizardFlags.currentStep;

			if (!isCompleted) {
				self.navigationWizardSetStepStatuses({
					stepId: currentStep,
					statuses: [ 'visited' ]
				});

				return;
			}

			self.navigationWizardSetStepStatuses({
				stepId: currentStep,
				statuses: [ 'completed' ]
			});

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

			self.navigationWizardSetStepStatuses({
				stepId: stepId,
				statuses: [ 'selected' ]
			});

			// Hide clear button if it's not a form
			if (steps[stepId].default) {
				template
					.find('#clear')
						.removeClass('hidden');
			} else {
				template
					.find('#clear')
						.addClass('hidden');
			}

			// Hide back button in the first page
			if (stepId === 0) {
				template.find('.back').addClass('hidden');
			} else {
				template.find('.back').removeClass('hidden');
			}

			// Display done button
			if ((steps.length - 1) === stepId) {
				template.find('#next').addClass('hidden');
				template.find('#done').removeClass('hidden');
			} else {
				template.find('#done').addClass('hidden');
				template.find('#next').removeClass('hidden');
			}
		},

		/**
		 * Sets the statuses of a step in the left navigation bar
		 * @param  {Object} args
		 * @param  {Number} args.stepId  Step index
		 * @param  {String[]} args.statuses Step statuses
		 */
		navigationWizardSetStepStatuses: function(args) {
			var self = this,
				stepId = args.stepId,
				statuses = args.statuses,
				navigationWizardFlags = self.appFlags.navigationWizard,
				allStatuses = navigationWizardFlags.statuses,
				cssClassesToRemove = _
					.chain(allStatuses)
					.without(statuses)
					.join(' ')
					.value(),
				cssClassesToAdd = _.join(statuses, ' '),
				$template = navigationWizardFlags.wizardArgs.template;

			$template
				.find('.step[data-id="' + stepId + '"]')
					.removeClass(cssClassesToRemove)
					.addClass(cssClassesToAdd);
		},

		/**
		 * Invokes the render function for the current step
		 */
		navigationWizardGenerateTemplate: function() {
			var self = this,
				navigationWizardFlags = self.appFlags.navigationWizard,
				wizardArgs = navigationWizardFlags.wizardArgs,
				thisArg = wizardArgs.thisArg,
				steps = wizardArgs.steps,
				currentStep = navigationWizardFlags.currentStep,
				currentStepData = steps[currentStep],
				template = currentStepData.template,
				render = currentStepData.render;

			navigationWizardFlags.currentStep = currentStep;

			if (_.isUndefined(render)) {
				thisArg[template](wizardArgs);
			} else {
				self.navigationWizardRenderStepTemplate(render);
			}
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
		 * @param  {Object} [args.args]  New arguments for the step
		 * @param  {Boolean} [args.reload=false]  Force the step to reload, if the stepId is the
		 *                                        same current step
		 */
		navigationWizardChangeStep: function(args) {
			var self = this,
				stepId = args.stepId,
				eventType = args.eventType,
				reload = _.get(args, 'reload', false),
				newArgs = _.get(args, 'args', {}),
				navigationWizardFlags = self.appFlags.navigationWizard,
				wizardArgs = navigationWizardFlags.wizardArgs,
				isCurrentStepCompleted = navigationWizardFlags.currentStep <= navigationWizardFlags.lastCompletedStep,
				movingForward = stepId > navigationWizardFlags.currentStep,
				validateOnStepChange = navigationWizardFlags.validateOnStepChange,
				validateCurrentStep = validateOnStepChange || movingForward,
				completeCurrentStep = !validateOnStepChange || isCurrentStepCompleted || movingForward,
				result;

			if (stepId === navigationWizardFlags.currentStep && !reload) {
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

			// Make sure we display page as previously selected
			self.navigationWizardUnsetCurrentSelected({
				isCompleted: _.get(result, 'valid', !validateCurrentStep) && completeCurrentStep
			});

			// Merge results data
			if (_.has(result, 'data')) {
				_.merge(wizardArgs, {
					data: result.data
				});
			} else if (_.has(result, 'args')) {
				_.merge(wizardArgs, result.args);
			}

			// Merge new args
			_.merge(wizardArgs, newArgs);

			// Set new template and menu items to reflect that
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
				//If validation fails for any reason then re-enable the button
				wizardArgs
					.container
						.find('#done')
						.prop('disabled', false);
				return;
			}

			wizardArgs.thisArg[wizardArgs.done](wizardArgs);

			self.navigationWizardUnbindEvents();
		},

		/**
		 * Render a step view
		 * @param  {Object} args
		 * @param  {Function}  args.callback  Function to build the step template
		 * @param  {Object}  arg.options  Load template options
		 */
		navigationWizardRenderStepTemplate: function(args) {
			var self = this,
				navigationWizardFlags = self.appFlags.navigationWizard,
				wizardArgs = navigationWizardFlags.wizardArgs,
				$wizardTemplate = wizardArgs.template,
				$wizardFooterActions = $wizardTemplate.find('.footer .actions'),
				thisArg = wizardArgs.thisArg,
				$container = wizardArgs.container,
				stepId = navigationWizardFlags.currentStep,
				renderStepTemplate = args.callback,
				loadTemplateOptions = _.get(args, 'options', {}),
				enableFooterActions = function(enable) {
					var $buttons = _
							.chain(navigationWizardFlags.buttons)
							.pick([ 'back', 'next', 'done' ])
							.filter(function(buttonMetadata) {
								return buttonMetadata.element.prop('disabled') === enable	// Button has a different enabled state than the one to be set
									&& (!enable || buttonMetadata.enabled === enable);	// Disabling, or the button is expected to have the same state to be set
							})
							.map('element')
							.reduce(function(accum, element) {
								return accum.add(element);
							}, $())
							.value(),
						$links = $wizardFooterActions.find('a');

					$buttons.prop('disabled', !enable);

					if (enable) {
						$links.removeClass('disabled');
					} else {
						$links.addClass('disabled');
					}
				};

			monster.waterfall([
				function(waterfallCallback) {
					enableFooterActions(false);
					waterfallCallback(null);
				},
				function(waterfallCallback) {
					monster.ui.insertTemplate($container.find('.right-content'), function(appendTemplateCallback) {
						waterfallCallback(null, appendTemplateCallback);
					}, loadTemplateOptions);
				},
				function(appendTemplateCallback, waterfallCallback) {
					var renderCallback = function(renderCallbackArgs) {
						var results = _.merge({}, renderCallbackArgs, {
							appendTemplateCallback: appendTemplateCallback
						});

						waterfallCallback(null, results);
					};

					renderStepTemplate.call(thisArg, wizardArgs, renderCallback);
				}
			], function(err, results) {
				var appendTemplateCallback = results.appendTemplateCallback,
					$template = results.template,
					afterRenderCallback = results.callback,
					status = _.get(results, 'status', null),
					insertTemplateCallback = function() {
						if (_.isFunction(afterRenderCallback)) {
							afterRenderCallback();
						}

						enableFooterActions(true);

						if (_.isNil(status)) {
							return;
						}

						self.navigationWizardSetStepStatuses({
							stepId: stepId,
							statuses: [ 'selected', status ]
						});
					};

				// Deferred, to ensure that the loading template does not replace the step template
				_.defer(appendTemplateCallback, $template, insertTemplateCallback);
			});
		},

		/**
		 * Set wizard button properties
		 * @param  {Object|Array} args  Single button properties, or list of buttons properties
		 * @param  {String} [args.button]  Button name
		 * @param  {Boolean} [args.enabled]  Whether to enable or disable the button
		 * @param  {Boolean} [args.display]  Whether to display or hide the button
		 * @param  {jQuery|String|Element} [args.content]  Button new content
		 * @param  {jQuery|String|Element} [args.resetContent]  Reset button content to its default
		 */
		navigationWizardSetButtonProperties: function(args) {
			var self = this,
				buttonProps = _.isArray(args) ? args : [args],
				buttonsMetadata = self.appFlags.navigationWizard.buttons;

			_.each(buttonProps, function(props) {
				var buttonName = props.button,
					button = _.get(buttonsMetadata, buttonName),
					buttonElement = button.element;

				if (_.has(props, 'display')) {
					if (props.display) {
						buttonElement.removeClass('hidden');
					} else {
						buttonElement.addClass('hidden');
					}
				}

				if (_.has(props, 'enabled')) {
					button.enabled = props.enabled;
					buttonElement.prop('disabled', !props.enabled);
				}

				if (_.has(props, 'content')) {
					if (!_.has(button, 'content')) {
						button.content = buttonElement.contents();
					}

					buttonElement
						.empty()
						.append(props.content);
				} else if (_.get(props, 'resetContent', true) && _.has(button, 'content')) {
					buttonElement
						.empty()
						.append(button.content);

					delete button.content;
				}
			});
		}
	};

	return navigationWizard;
});
