    winkstart.module('accounts', 'accounts', {
        subscribe: {
            'accounts.activate' : 'activate',
            'accounts.initialized' : 'initialized',
            'accounts.module_activate': 'module_activate',
        }
    },
    /* The code in this initialization function is required for
     * loading routine.
     */
    function() {
        var THIS = this;

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

        THIS.whapp_auth(function() {
            winkstart.publish('whappnav.add', {
                name : THIS.__module,
                weight: 10
            });
            THIS.initialization_check();
        });

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        
        billing_provider: 'braintree',

        modules: {
            'accounts_manager': false
        },

        is_initialized: false,

        uninitialized_count: 1337,

        initialized: function() {
            var THIS = this;

            THIS.is_initialized = true;

            if(winkstart.apps['accounts']['default']){
                THIS.setup_page();
                $('[data-whapp="accounts"] > a').addClass('activate');
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
            var THIS = this;

            winkstart.publish('accounts.module_activate', {name: 'accounts_manager'});
        }
    }
);
