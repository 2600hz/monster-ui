winkstart.module('myaccount', 'myaccount', {
        css: [
            'css/myaccount.css'
        ],

        templates: {
            'nav': 'tmpl/nav.handlebars',
            'myaccount': 'tmpl/myaccount.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.initialized' : 'initialized',
            'myaccount.module_activate': 'module_activate',
            'myaccount.display': 'show',
            'myaccount.add_submodule': 'add_submodule',
            'auth.account.loaded': 'activate'
        }
    },

    function() {
        var THIS = this,
            count = 0;

        if('modules' in winkstart.apps[THIS.__module]) {
            if('whitelist' in winkstart.apps[THIS.__module].modules) {
                THIS.modules = {};

                $.each(winkstart.apps[THIS.__module].modules.whitelist, function(k, v) {
                    THIS.modules[v] = false;
                });
            }

            if('blacklist' in winkstart.apps[THIS.__module].modules) {
                $.each(winkstart.apps[THIS.__module].modules.blacklist, function(k, v) {
                    if(v in THIS.modules) {
                        delete THIS.modules[v];
                    }
                });
            }
        }

        $.each(THIS.modules, function() {
            count++;
        });

        THIS.uninitialized_count = count;

        THIS.initialization_check();

        THIS.whapp_config();
    },
    {
        modules: {
            'billing': false
        },

        is_initialized: false,

        uninitialized_count: 1337,

        orig_whapp_config: $.extend(true, {}, winkstart.apps['myaccount']),

        activate: function(user_data) {
            var THIS = this;

            THIS.whapp_auth(function() {
                THIS.initialization_check(user_data);
            });
        },

        initialized: function(user_data) {
            var THIS = this;

            THIS.is_initialized = true;
        },

        initialization_check: function(user_data) {
            var THIS = this;

            if (!THIS.is_initialized) {
                $.each(THIS.modules, function(k, v) {
                    if(!v) {
                        THIS.modules[k] = true;
                        winkstart.module(THIS.__module, k).init(function() {
                            winkstart.log(THIS.__module + ': Initialized ' + k);

                            if(!(--THIS.uninitialized_count)) {
                                winkstart.publish(THIS.__module + '.initialized', user_data);
                            }
                        });
                    }
                })
            } else {
                THIS.setup_page(user_data);
            }
        },

        module_activate: function(args) {
            var THIS = this;

            THIS.whapp_auth(function() {
                winkstart.publish(args.name + '.activate');
            });
        },

        whapp_auth: function(callback) {
            var THIS = this;

            if('auth_token' in winkstart.apps[THIS.__module] && winkstart.apps[THIS.__module].auth_token) {
                callback();
            }
            else {
                winkstart.publish('auth.shared_auth', {
                    app_name: THIS.__module,
                    callback: (typeof callback == 'function') ? callback : undefined
                });
            }
        },

        whapp_config: function() {
            var THIS = this;

            winkstart.apps['myaccount'] = $.extend(true, {
                api_url: winkstart.apps['auth'].api_url,
                account_id: winkstart.apps['auth'].account_id,
                user_id: winkstart.apps['auth'].user_id
            }, THIS.orig_whapp_config);
        },

        setup_page: function(user_data) {
            var THIS = this,
                $myaccount_html = THIS.templates.myaccount.tmpl(),
                $nav_html = THIS.templates.nav.tmpl({
                    name: user_data.first_name + ' ' + user_data.last_name
                });

            $('body .navbar').after($myaccount_html);

            winkstart.publish('linknav.add', 'myaccount', $nav_html, 'myaccount-link', {
                click: function() {
                    winkstart.publish('myaccount.display');
                }
            });

            THIS.render_myaccount($myaccount_html);
        },

        render_myaccount: function($myaccount_html) {
            var THIS = this;

            $('.myaccount-close', $myaccount_html).on('click', function() {
                winkstart.publish('myaccount.display');
            });

            winkstart.publish('myaccount.loaded', $myaccount_html);
        },

        show: function() {
            var $body = $('body'),
                $myaccount = $body.find('.myaccount');

            if($myaccount.is(':hidden')) {
                 $myaccount.slideDown(500);
            } else {
                $myaccount.slideUp(500);    
            }
        },

        add_submodule: function($menu, _weight) {
            var THIS = this,
                inserted = false,
                $myaccount = $('body .myaccount'),
                $divider = $('<li class="divider"></li>'),
                $nav_list = $('.myaccount-menu .nav', $myaccount);

            $menu.on('click', function() {
                $('.myaccount-menu .nav li', $myaccount).removeClass('active');
                $menu.addClass('active');
            });

            if(_weight) {
                $menu.data('weight', _weight);

                $('li:not(.divider)', $nav_list).each(function(index) {
                    var weight = $(this).data('weight');

                    if(_weight < weight) {
                        $(this)
                            .before($menu)
                            .before($divider);
                        inserted = true;
                    }
                    else if(index >= $('li:not(.divider)', $nav_list).length - 1) {
                        $(this)
                            .after($menu)
                            .after($divider);
                        inserted = true;
                    }
                });
            }

            if(!inserted) {
                $('.myaccount-menu .nav', $myaccount)
                    .append($menu)
                    .append($divider);
            }
        }
    }
);
