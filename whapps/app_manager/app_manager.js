winkstart.module('app_manager', 'app_manager', {
        subscribe: {
            'app_manager': 'activate',
            'app_manager.activate' : 'activate',
            'app_manager.initialized' : 'initialized',
            'app_manager.module_activate': 'module_activate',
            'auth.account.loaded' : 'activate'
        }
    },
    /* The code in this initialization function is required for
     * loading routine.
     */
    function() {
        var THIS = this;

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

        THIS.uninitialized_count = THIS._count(THIS.modules);

        THIS.initialization_check();

        THIS.whapp_config();
    },
    {
        modules: {
            'appnav': false
        },

        is_initialized: false,

        uninitialized_count: 1337,

        initialized: function() {
            var THIS = this;

            THIS.is_initialized = true;

            if(winkstart.apps['app_manager']['default']) {
                $('[data-whapp="app_manager"] > a').addClass('activate');
                THIS.setup_page();
            }
        },

        activate: function() {
            var THIS = this;

            THIS.whapp_auth(function() {
                THIS.initialization_check();
            });
        },

        initialization_check: function() {
            var THIS = this;

            if (!THIS.is_initialized) {
                // Load the modules
                $.each(THIS.modules, function(k, v) {
                    if(!v) {
                        THIS.modules[k] = true;
                        winkstart.module(THIS.__module, k).init(function() {
                            winkstart.log(THIS.__module + ': Initialized ' + k);

                            if(!--THIS.uninitialized_count) {
                                winkstart.publish(THIS.__module + '.initialized', {});
                            }
                        });
                    }
                });
            }
            else {
                THIS.setup_page();
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

        _count: function(obj) {
            var count = 0;

            $.each(obj, function() {
                count++;
            });

            return count;
        },

        setup_page: function() {
            // var THIS = this;
            // winkstart.publish('app_manager.module_activate', {name: 'appnav'});
        },

        whapp_config: function() {
            var THIS = this;

            winkstart.apps['app_manager'] = $.extend(true, {
                api_url: winkstart.apps['auth'].api_url,
                is_masqueradable: true
            }, winkstart.apps['app_manager']);
        }
    }
);
