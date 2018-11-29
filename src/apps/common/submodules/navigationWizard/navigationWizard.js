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
				layout = $(self.getTemplate({
					name: 'layout',
					data: {
						title: args.title,
						steps: args.steps
					},
					submodule: 'navigationWizard'
				}));

			if (container) {
				self.navigationWizardBindEvents($.extend({ template: layout }, args));

				container
					.empty()
					.append(layout);
			} else {
				throw new Error('A container must be provided.');
			}
		},

		navigationWizardBindEvents: function(args) {
			var self = this,
				container = args.container,
				template = args.template,
				steps = args.steps,
				removeCallback = args.removeCallback,
				afterCallback = args.afterCallback,
				currentStep = 0;

			self.setSelected(currentStep, args);

			//Clicking on the menu item
			template
				.find('.next')
					.on('click', function(event) {
						event.preventDefault();
						console.log(steps[currentStep].form);

				/*		var $form = template.find('#'+steps[currentStep].form),
							formData = monster.ui.getFormData(steps[currentStep].form);

						console.log($form);
						console.log(formData);*/
						currentStep += 1;
						self.setSelected(currentStep, args);

					});

			//Clicking on the menu item
			template
				.find('.back')
					.on('click', function(event) {
						event.preventDefault();

						currentStep -= 1;
						self.setSelected(currentStep, args);
					});

			//Clicking on cancel
			template
				.find('#cancel')
					.on('click', function(event) {
						event.preventDefault();

						container
							.empty()
							.append(args.cancel);
					});

			template
				.find('#clear')
				.on('click', function(event) {
					event.preventDefault();
					console.log('clear');
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

					monster.ui.tooltips(template);

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
		}
	};

	return navigationWizard;
});
