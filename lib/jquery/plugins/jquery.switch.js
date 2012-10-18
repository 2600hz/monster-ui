(function($) {

	var defaults = {
			state: false,

		},

		publicMethods = {},

		privateMethods = {
			init: function(options) {
				var $this = $(this);
					$this.data('settings', $.extend({}, defaults, options)),
					settings = $this.data('settings');

				if($this.attr('type') != "checkbox" ){
					$.error('Input has to be a checkbox.');
				}
				$this.hide();

				if($this.attr('checked')) {
					$this.data('settings', $.extend({}, settings, {state: true}));
				}

				div_switch = $('<div>')
					.css({
						'background-image': 'url("img/switch.png")',
						'background-repeat': 'no-repeat',
						'width': 94,
						'height': 27,
						'border-radius': 5,
					})
					.click(function() {
						privateMethods.setState($this, $(this));
					});

				privateMethods.setState($this, div_switch);

				$this.after(div_switch);

				return $this;
			},

			setState: function(checkbox, div) {
				var s = checkbox.data('settings');

				checkbox.trigger('change', s.state);

				if(s.state){
					div.css({backgroundPosition: 0});
					checkbox.attr('checked', 'checked');
					checkbox.data('settings', $.extend({}, s, {state: false}));
				} else {
					div.css({backgroundPosition: -53});
					checkbox.removeAttr('checked');
					checkbox.data('settings', $.extend({}, s, {state: true}));
				}
			},


		};

	$.fn.switch = function(method) {
		var args = arguments;

		$(this).each(function() {
			if (publicMethods[method]) {
				return publicMethods[method].apply(this, Array.prototype.slice.call(args, 1));
			} else if (typeof method === 'object' || !method) {
				return privateMethods.init.apply(this, args);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.switch');
			}
		});

		return $(this);
	};
})(jQuery);