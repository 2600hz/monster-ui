winkstart.module('app_manager', 'appnav', {
        css: [
            'css/appnav.css'
        ],

        templates: {
            'appnav': 'tmpl/appnav.handlebars',
            'applist': 'tmpl/appnav_applist.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'appnav.activate': 'activate',
            'appnav.toggle': 'toggle',
            'appnav.hide': 'hide'
        }
    },
    /* The code in this initialization function is required for
     * loading routine.
     */
    function() {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },

    {
        is_rendered: false,
        current_app_id: undefined,

        activate: function(user_data) {
            var THIS = this;

            if(!THIS.is_rendered) {
                var app_list = $.map(user_data.apps, function(val, key) {
                    return {
                        app_name: val.label,
                        app_id: val.id,
                        app_class: val.icon
                    };
                });
                THIS.render(app_list);
            }
            
        },

        render: function(_app_list, callback) {
            var THIS = this,
                $appnav_html = THIS.templates.appnav.tmpl(),
                app_list = _app_list;

            THIS.render_applist(app_list, $appnav_html);

            $('#applist_filter_input', $appnav_html).keyup(function(e) {
                var input_val = $(this).val().toLowerCase(),
                    new_app_list = app_list.slice();

                if(input_val) {
                    new_app_list = $.map(app_list, function(val, key) {
                        return (val.app_name.toLowerCase().indexOf(input_val) >= 0) ? val : null;
                    });
                }

                THIS.render_applist(new_app_list, $appnav_html);
            });

            $('#total_available_apps', $appnav_html).html(Object.keys(winkstart.config.available_apps).length);
            $('#appstore_link', $appnav_html).click(function() {
                winkstart.alert('info','App Store currently under construction.');
            });


            $('body > .navbar').after($appnav_html);

            // Search bar disabled for now
            $('.applist-filter', $appnav_html).hide();
            // Appstore disabled for now
            $('#appstore_link', $appnav_html).hide();

            THIS.is_rendered = true;
            if(typeof callback === 'function') { callback(); }
        },

        render_applist: function(_app_list, _parent) {
            var THIS = this,
                $applist = $('ul.applist', _parent),
                nice_scrollbar = $applist.getNiceScroll()[0] || $applist.niceScroll({
                                                                    cursorcolor:"#333",
                                                                    cursoropacitymin:0.5,
                                                                    hidecursordelay:1000,
                                                                    zindex:2000
                                                                });

            $applist.empty()
                    .append(THIS.templates.applist.tmpl({
                        app_list: _app_list,
                        active: THIS.current_app_id
                    }));

            $('.applist-elem', $applist).click(function() {
                var app_id = $(this).data('app_id');
                THIS.current_app_id = app_id;
                if(app_id) {
                    winkstart.publish(app_id+".activate");
                    THIS.toggle();
                }
            });

            $('.applist-notfound', $applist).click(function() {
                THIS.focus_input(_parent);
            });

            nice_scrollbar.resize();

        },

        clear_input: function(_parent) {
            $('#applist_filter_input', _parent).val("").keyup();
        },

        focus_input: function(_parent) {
            $('#applist_filter_input', _parent).focus();
        },

        toggle: function() {
            var THIS = this,
                $appnav = $('#appnav', 'body'),
                nice_scrollbar = $('ul.applist', $appnav).getNiceScroll()[0];

            if($appnav.hasClass('appnav-open')) {
                nice_scrollbar.hide();
                $appnav.slideUp(300, function() { 
                    THIS.clear_input($appnav);
                    nice_scrollbar.resize();
                }).removeClass('appnav-open');
            } else {
                winkstart.publish('myaccount.hide');
                $appnav.slideDown(300, function() {
                    nice_scrollbar.show()
                                  .resize();
                }).addClass('appnav-open');
                THIS.focus_input($appnav);
            }
        },

        /* Although the 'toggle' function allows to hide as well, this function hides the appnav without any animation */
        hide: function() {
            var THIS = this,
                $appnav = $('#appnav', 'body'),
                nice_scrollbar = $('ul.applist', $appnav).getNiceScroll()[0];

            if($appnav.hasClass('appnav-open')) {
                if(nice_scrollbar) { nice_scrollbar.hide(); }
                $appnav.hide()
                         .removeClass('appnav-open');
                THIS.clear_input($appnav);
            }
        }
    }
);
