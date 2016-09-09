define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var ringingDurationControl = {

		requests: {},

		subscribe: {
			'common.ringingDurationControl.render': 'ringingDurationControlRender',
			'common.ringingDurationControl.addEndpoint': 'ringingDurationControlAddEndpoint',
			'common.ringingDurationControl.getEndpoints': 'ringingDurationControlGetEndpoints'
		},

		/* Arguments:
		** container: jQuery Div
		** endpoints: array of endpoints (containing id, name, delay and timeout)
		** callback: callback executed once we rendered the number control
		*/
		ringingDurationControlRender: function(args){
			var self = this,
				container = args.container,
				endpoints = args.endpoints,
				callback = args.callback,
				template = $(monster.template(self, 'ringingDurationControl-layout', args));

			container.empty()
					 .append(template);

			monster.ui.tooltips(template);

			template.find('.grid-time').sortable({
				items: '.grid-time-row:not(.title)',
				placeholder: 'grid-time-row-placeholder'
			});

			self.ringingDurationControlRenderSliders(template, endpoints);

			self.ringingDurationControlBindEvents($.extend(args, {template: template}));

			callback && callback({
				template: template,
				data: endpoints
			});
		},

		ringingDurationControlBindEvents: function(args) {
			var self = this,
				template = args.template,
				endpoints = args.endpoints;

			template.find('.distribute-button').on('click', function() {
				var sliders = template.find('.grid-time-row:not(.disabled) .slider-time');
					max = sliders.first().slider('option', 'max'),
					section = Math.floor(max/sliders.length),
					current = 0;
				$.each(sliders, function() {
					$(this).slider('values', [current, current+=section]);
				});
			});

			template.find('.disable-row').on('change', function() {
				var parentRow = $(this).parents('.grid-time-row');
				if($(this).prop('checked')) {
					parentRow.find('.times').stop().animate({ opacity: 0 });
					parentRow.find('.name').stop().animate({ opacity: 0.5 });
					parentRow.addClass('disabled');
				} else {
					parentRow.find('.times').stop().animate({ opacity: 1 });
					parentRow.find('.name').stop().animate({ opacity: 1 });
					parentRow.removeClass('disabled');
				}
			});

			template.on('click', '.grid-time-row.title .scale-max', function() {
				var $this = $(this),
					input = $this.siblings('.scale-max-input');

				input.show()
					 .focus()
					 .select();
				$this.hide();
			});

			template.on('blur', '.grid-time-row.title .scale-max-input', function(e) {
				var $this = $(this),
					value = $this.val()
					intValue = parseInt($this.val());
				if(value != $this.data('current') && !isNaN(intValue) && intValue >= 30) {
					var displayedEndpoints = self.ringingDurationControlGetEndpoints({container: template, includeDisabled: true});
					self.ringingDurationControlRenderSliders(template, displayedEndpoints, intValue);
				} else {
					$this.val($this.data('current')).hide();
					$this.siblings('.scale-max').show();
				}
			});

			template.on('keydown', '.grid-time-row.title .scale-max-input', function(e) {
				var charCode = (e.which) ? e.which : event.keyCode;
				if(charCode > 57 && charCode < 96) { return false; }
				else if(charCode === 13) { $(this).blur(); }
				else if(charCode === 27) {
					var $this = $(this);
					$this.val($this.data('current')).blur();
				}
			});

			template.on('click', '.remove-user', function() {
				var parentRow = $(this).parents('.grid-time-row'),
					userId = parentRow.data('id');
				template.find('.add-user[data-id="'+userId+'"]').removeClass('in-use');
				parentRow.remove();
			});
		},

		ringingDurationControlRenderSliders: function(template, endpoints, maxSeconds) {
			var self = this,
				scaleSections = 6, //Number of 'sections' in the time scales for the sliders
				scaleMaxSeconds = maxSeconds && maxSeconds >= 30 ? maxSeconds : 120; //Maximum of seconds, corresponding to the end of the scale

			if(!maxSeconds) {
				var currentMax = 0;
				_.each(endpoints, function(endpoint) {
					currentMax = (endpoint.delay+endpoint.timeout > currentMax) ? endpoint.delay+endpoint.timeout : currentMax;
				});
				scaleMaxSeconds = currentMax > scaleMaxSeconds ? Math.ceil(currentMax/60)*60 : scaleMaxSeconds;
			}

			var sliderTooltip = function(event, ui) {
					var val = ui.value,
						tooltip = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val + '</div></div>';

					$(ui.handle).html(tooltip);
				},
				createTooltip = function(event, ui, userId, sliderObj) {
					var val1 = sliderObj.slider('values', 0),
						val2 = sliderObj.slider('values', 1),
						tooltip1 = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val1 + '</div></div>',
						tooltip2 = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val2 + '</div></div>';

					template.find('.grid-time-row[data-id="'+ userId + '"] .slider-time .ui-slider-handle').first().html(tooltip1);
					template.find('.grid-time-row[data-id="'+ userId + '"] .slider-time .ui-slider-handle').last().html(tooltip2);
				},
				createSlider = function(endpoint) {
					var gridTimeRow = template.find('.grid-time-row[data-id="'+ endpoint.id +'"]'),
						slider = gridTimeRow.find('.slider-time').slider({
							range: true,
							min: 0,
							max: scaleMaxSeconds,
							values: [ endpoint.delay, endpoint.delay+endpoint.timeout ],
							slide: sliderTooltip,
							change: sliderTooltip,
							create: function(event, ui) {
								createTooltip(event, ui, endpoint.id, $(this));
							},
						});
					if(gridTimeRow.hasClass('deleted')) {
						slider.slider('disable');
					}
					createSliderScale(gridTimeRow);
				},
				createSliderScale = function(container, isHeader) {
					var scaleContainer = container.find('.scale-container')
						isHeader = isHeader || false;

					scaleContainer.empty();

					for(var i=1; i<=scaleSections; i++) {
						var toAppend = '<div class="scale-element" style="width:'+(100/scaleSections)+'%;">'
									 + (isHeader 
								 		? (i==scaleSections 
								 			? '<input type="text" value="'+scaleMaxSeconds+'" data-current="'+scaleMaxSeconds+'" class="scale-max-input" maxlength="3"><span class="scale-max">'
								 			:'<span>')
								 			+ Math.floor(i*scaleMaxSeconds/scaleSections) + ' Sec</span>' 
							 			: '')
									 + '</div>';
						scaleContainer.append(toAppend);
					}
					if(isHeader) {
						scaleContainer.append('<span>0 Sec</span>');
					}
				};
		
				_.each(endpoints, function(endpoint) {
					createSlider(endpoint);
				});
				createSliderScale(template.find('.grid-time-row.title'), true);
		},

		ringingDurationControlAddEndpoint: function(args) {
			var self = this,
				container = args.container;
			container.find('.grid-time').append(monster.template(self, 'ringingDurationControl-row', args));
			self.ringingDurationControlRenderSliders(container, [args.endpoint], parseInt(container.find('.grid-time-row.title .scale-max-input').val()));
		},

		ringingDurationControlGetEndpoints: function(args) {
			var self = this,
				container = args.container,
				includeDisabled = args.includeDisabled,
				endpoints = $.map(container.find('.grid-time-row[data-id]'), function(row) {
					var $row = $(row),
						values = $row.find('.slider-time').slider('values');

					if(includeDisabled || !$row.hasClass('disabled')) {
						return {
							id: $row.data('id'),
							delay: values[0],
							timeout: (values[1] - values[0]),
							name: $row.find('.name').text()
						}
					}
				});

			args.callback && args.callback(endpoints);
			return endpoints;
		}
	}

	return ringingDurationControl;
});
