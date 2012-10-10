winkstart.module('skeleton', 'skeleton', {
        css: {
            skeleton: 'css/skeleton.css'
        },

        templates: {
            skeleton: 'tmpl/skeleton.html'
        },

        subscribe: {
            'skeleton.activate' : 'activate',
            'skeleton.initialized' : 'initialized',
            'skeleton.module_activate': 'module_activate'
        }
    },

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
                name: THIS.__module,
                weight: 0 /* TODO: Whapps are displayed from left to right depending on their weight (higher weight are on the right) */
            });

            //This disables lazy loading
            THIS.initialization_check();
        });

        THIS.whapp_config();

        winkstart.publish('skeleton.loaded');
    },
    {
        /* A modules object is required for the loading routine.
         * The format is as follows:
         * <module name>: <initialization status>
         */
        modules: {
            'sub_module': false
        },

        /* The following code is generic and should be abstracted.
         * For the time being, you can just copy and paste this
         * into other whapps.
         *
         * BEGIN COPY AND PASTE CODE
         */
        is_initialized: false,

        uninitialized_count: 1337,

        initialized: function() {
            var THIS = this;

            THIS.is_initialized = true;

            if(winkstart.apps['skeleton']['default']) {
                $('[data-whapp="skeleton"] > a').addClass('activate');
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

                            if(!(--THIS.uninitialized_count)) {
                                winkstart.publish(THIS.__module + '.initialized', {});
                            }
                        });
                    }
                });
            } else {
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

        whapp_config: function() {
            var THIS = this;

            /* Uncomment if you want this whapp to be masqueradable
            winkstart.apps['skeleton'] = $.extend(true, {
                is_masqueradable: true
            }, winkstart.apps['skeleton']);
            */
        },

        /* A setup_page function is required for the copy and paste code */
        setup_page: function() {
            var THIS = this;

            $('#ws-content').empty()
                            .append(THIS.templates.skeleton.tmpl());
        }
        /* End copy and paste */
    }
);
