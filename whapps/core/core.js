// This is the core module. It is responsible for loading all a base layout, a base navigation bar and any registered whApps
winkstart.module('core', 'core',
    {
        resources: {
            'core.get_whitelabel': {
                url: '{api_url}/whitelabel/{domain}',
                contentType: 'application/json',
                verb: 'GET'
            }
        }
    },
    function(args) {
        var THIS = this,
            uninitialized_count = 0,
            domain = URL.match(/^(?:https?:\/\/)*([^\/?#]+).*$/)[1],
            api_url = winkstart.config.whitelabel_api_url || winkstart.apps['auth'].api_url,
            load_modules = function() {
                // First thing we're going to do is go through is load our layout
                winkstart.module('core', 'layout').init({ parent: $('body') }, function() {
                    winkstart.module('core', 'whappnav').init({ parent: $('body') }, function() {
                        winkstart.module('core', 'linknav').init({ parent: $('body') }, function() {
                            // Now move onto apps
                            winkstart.log('WhApps: Loading WhApps...');

                            // Load any other apps requested (only after core is initialized)
                            $.each(winkstart.apps, function(k, v) {
                                uninitialized_count++;
                            });

                            $.each(winkstart.apps, function(k, v) {
                                winkstart.log('WhApps: Would load ' + k + ' from URL ' + v.url);
                                winkstart.module.loadApp(k, function() {
                                    this.init(function() {
                                        if(!(--uninitialized_count)) {
                                            winkstart.publish('core.loaded');
                                        }
                                    });
                                    winkstart.log('WhApps: Initializing ' + k);
                                });
                            });

                            winkstart.log('WhApps: Finished Loading WhApps');
                        });
                    });
                });
            };

        winkstart.registerResources('auth', THIS.config.resources);

        winkstart.request('core.get_whitelabel', {
                api_url: api_url,
                domain: domain
            },
            function(_data, status) {
                delete _data.data.id;
                delete _data.data.description;
                winkstart.config = $.extend({}, winkstart.config, _data.data);
                load_modules();
            },
            function(_data, status) {
                if(status != 404) {
                    delete winkstart.config.company_name;
                }
                load_modules();
            }
        );

    }
);
