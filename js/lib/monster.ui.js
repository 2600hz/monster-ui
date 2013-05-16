define(function(require){

	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

    var requestAmount = 0,
        homeIcon;

    monster.sub('monster.requestStart', function() {
        requestAmount++;

        homeIcon = homeIcon || $('#home_link > i');

        if(homeIcon.hasClass('icon-home')) {
            homeIcon .removeClass('icon-home')
                     .addClass('icon-spin icon-spinner');
        }
    });

    monster.sub('monster.requestEnd', function() {
        if(--requestAmount === 0) {
            homeIcon.removeClass('icon-spin icon-spinner')
                    .addClass('icon-home');
        }
    });

	var ui = {

		alert: function(type, content, callback){

			if(typeof content === "undefined"){
				content = type;
				type = "info";
			}

			var coreApp = monster.apps['core'],
				template = monster.template(coreApp, 'dialog-' + type, { content: content, data: content.data || 'No extended information.' }),
				content = $(template),
				i18n = coreApp.data.i18n[monster.config.i18n.active] || coreApp.data.i18n['en-US'],
				options = {
					title: i18n[type],
					onClose: function(){
						callback && callback();
					}
				},
				dialog;

			dialog = this.dialog(content, options, i18n);

			dialog.find('.btn.alert_button').click(function() {
				dialog.dialog('close');
			});

			dialog.find('.json_error').css({ 'cursor': 'pointer' })

			dialog.find('.json')
				.css('min-width', 0)
				.click(function(event){
					event.preventDefault();
					dialog.find('.json_error').toggle();
				});

			return dialog;
		},

		dialog: function(content, options) {
			var dialog = $("<div />").append(content),
			    coreApp = monster.apps['core'],
				i18n = coreApp.data.i18n[monster.config.i18n.active] || coreApp.data.i18n['en-US'];

			$('input', content).keypress(function(e) {
				if(e.keyCode == 13) {
					e.preventDefault();
					return false;
				}
			});

			//Unoverridable options
			var strict_options = {
                    show: { effect : 'fade', duration : 200 },
                    hide: { effect : 'fade', duration : 200 },
                    zIndex: 20000,
                    close: function() {
                        $('div.popover').remove();
                        dialog.dialog('destroy');
                        dialog.remove();

                        if(typeof options.onClose == 'function') {
                            // jQuery FREAKS out and gets into an infinite loop if the following function kicks back an error. Hence the try/catch.
                            try {
                                options.onClose();
                            }
                            catch(err) {
                                if(console && err.message && err.stack) {
                                    console.log(err.message);
                                    console.log(err.stack);
                                }
                            }
                        }
                    }
                },
                //Default values
                defaults = {
                    width: 'auto',
                    modal: true,
                    resizable: false
                };

			//Overwrite any defaults with settings passed in, and then overwrite any attributes with the unoverridable options.
			options = $.extend(defaults, options || {}, strict_options);
			dialog.dialog(options);

            dialog.siblings().find('.ui-dialog-titlebar-close').text(i18n['close'] || 'X');

			return dialog;       // Return the new div as an object, so that the caller can destroy it when they're ready.'
		}
	};

	return ui;
});
