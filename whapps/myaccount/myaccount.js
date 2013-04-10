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
            'myaccount.render_submodule': 'render_submodule',
            'myaccount.update_menu': 'update_menu',
            'auth.account.loaded': 'activate'
        },

        resources: {
            'myaccount.account_get': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            }
        }
    },

    function() {
        var THIS = this,
            count = 0;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);

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
            'transactions': false,
            'profile': false,
            'service_plan': false,
            'balance': false,
            'trunks': false
        },

        groups: {},

        whapp_vars: {
            billing_provider: 'braintree'
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

            $.extend(winkstart.apps[THIS.__module], THIS.whapp_vars);
        },

        setup_page: function(user_data) {
            var THIS = this,
                $myaccount_html = THIS.templates.myaccount.tmpl(),
                $nav_html = THIS.templates.nav.tmpl({
                    name: user_data.first_name + ' ' + user_data.last_name
                });


            $('body > .navbar').after($myaccount_html);

            winkstart.publish('linknav.add', 'myaccount', $nav_html, 'myaccount-link', {
                click: function() {
                    winkstart.publish('myaccount.display');
                }
            });

            THIS.groups = {
                'account_category': {
                    id: 'account_category',
                    friendly_name: i18n.t('myaccount.myaccount.account_category'),
                    weight: 0
                },
                'billing_category': {
                    id: 'billing_category',
                    friendly_name: i18n.t('myaccount.myaccount.billing_category'),
                    weight: 10
                },
                'trunking_category': {
                    id: 'trunking_category',
                    friendly_name: i18n.t('myaccount.myaccount.trunking_category'),
                    weight: 20
                }
            };

            THIS.render_myaccount($myaccount_html);
        },

        update_menu: function(module, data, key) {
            var THIS = this;

            if(data !== undefined) {
                if(key) {
                    $('[data-key="'+key+'"] .badge').html(data);
                }
                else {
                    $('[data-module="'+module+'"] .badge').html(data);
                }
            }
        },

        render_submodule: function($submodule_html) {
            $('.myaccount .myaccount-right .myaccount-content').html($submodule_html);
        },

        render_myaccount: function($myaccount_html) {
            var THIS = this;

            $('.myaccount-close', $myaccount_html).on('click', function() {
                winkstart.publish('myaccount.display');
            });

            $('.signout', $myaccount_html).on('click', function() {
                winkstart.publish('auth.logout');
            });

            winkstart.request('myaccount.account_get', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url
                },
                function(data, status) {
                    winkstart.publish('myaccount.loaded', $myaccount_html, data.data);
                }
            );
        },

        show: function() {
            var $myaccount = $('.myaccount', 'body');

            if($myaccount.hasClass('myaccount-open')) {
                $myaccount.slideUp(300).removeClass('myaccount-open');
            }
            else {
                $myaccount.slideDown(300).addClass('myaccount-open');
            }
        },

        add_submodule: function($menu, _weight, _category) {
            var THIS = this,
                inserted = false,
                $myaccount = $('body .myaccount'),
                $nav_list = $('.myaccount-menu .nav', $myaccount),
                category = _category || 'account_category';

            $menu.on('click', function() {
                $('.myaccount-menu .nav li', $myaccount).removeClass('active');
                $menu.addClass('active');

                var key = 'myaccount.' + $menu.data('module') + '.title';
                if($menu.data('key')) {
                    key = 'myaccount.' + $menu.data('module') + '.' + $menu.data('key');
                }

                $('.myaccount-module-title').html(i18n.t(key));
            });

            category = THIS.groups[category];

            if($('#'+category.id, $nav_list).size() === 0) {
                var inserted = false;
                $('li.nav-header', $nav_list).each(function(k, v) {
                    if($(this).data('weight') > category.weight) {
                        $(this).before('<li id="'+category.id+'" data-weight="'+category.weight+'" class="nav-header hidden-phone blue-gradient-reverse">'+ category.friendly_name +'</li>');
                        inserted = true;
                    }
                });

                if(inserted === false) {
                    $nav_list.append('<li id="'+category.id+'" data-weight="'+category.weight+'" class="nav-header hidden-phone blue-gradient-reverse">'+ category.friendly_name +'</li>');
                }
            }

            if(_weight) {
                $menu.data('weight', _weight);

                var category_reached = false;

                $('li', $nav_list).each(function(index,v) {
                    if(category_reached) {
                        var weight = $(this).data('weight');

                        if(_weight < weight || $(v).hasClass('nav-header')) {
                            $(this)
                                .before($menu);

                            return false;
                        }
                    }

                    if($(v).attr('id') === category.id) {
                        category_reached = true;
                    }

                    if(index >= ($('li', $nav_list).length - 1)) {
                        $(this).after($menu);

                        return false;
                    }
                });
            }
            else {
                $('#'+category.id, $nav_list).after($menu);
            }
        }
    }
);
