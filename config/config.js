( function(winkstart, amplify, $) {

    winkstart.config =  {
        /* Was winkstart.debug */
        debug: false,

        /* Language settings */
        language: 'fr',
        fallback_language: 'en',

        advancedView: false,

        /* Registration Type */
        register_type: 'onboard',

        /* Do you want the signup button or not ? default to false if not set */
        hide_registration: false,

        onboard_roles: {
            'default': {
                apps: {
                    voip: {
                        label: 'Hosted PBX',
                        icon: 'phone',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    },
                    pbxs: {
                        label: 'PBX Connector',
                        icon: 'device',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    },
                    numbers: {
                        label: 'Number Manager',
                        icon: 'menu1',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    }
                },
                available_apps: ['voip', 'cluster', 'userportal', 'accounts', 'developer', 'numbers', 'pbxs'],
                default_api_url: 'http://api.2600hz.com:8000/v1'
            },
            'reseller': {
                apps: {
                    voip: {
                        label: 'Hosted PBX',
                        icon: 'phone',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    },
                    accounts: {
                        label: 'Accounts',
                        icon: 'account',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    },
                    numbers: {
                        label: 'Number Manager',
                        icon: 'menu1',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    }
                },
                available_apps: ['voip', 'cluster', 'userportal', 'accounts', 'developer', 'numbers', 'pbxs'],
                default_api_url: 'http://api.2600hz.com:8000/v1'
            },
            'small_office': {
                apps: {
                    voip: {
                        label: 'Hosted PBX',
                        icon: 'phone',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    },
                    numbers: {
                        label: 'Number Manager',
                        icon: 'menu1',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    }
                },
                available_apps: ['voip', 'cluster', 'userportal', 'accounts', 'developer', 'numbers', 'pbxs'],
                default_api_url: 'http://api.2600hz.com:8000/v1'
            },
            'single_phone': {
                apps: {
                    voip: {
                        label: 'Hosted PBX',
                        icon: 'phone',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    },
                    numbers: {
                        label: 'Number Manager',
                        icon: 'menu1',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    }
                },
                available_apps: ['voip', 'cluster', 'userportal', 'accounts', 'developer', 'numbers', 'pbxs'],
                default_api_url: 'http://api.2600hz.com:8000/v1'
            },
            'api_developer': {
                apps: {
                    developer: {
                        label: 'Developer Tool',
                        icon: 'connectivity',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    },
                    numbers: {
                        label: 'Number Manager',
                        icon: 'menu1',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    }
                },
                available_apps: ['voip', 'cluster', 'userportal', 'accounts', 'developer', 'numbers', 'pbxs'],
                default_api_url: 'http://api.2600hz.com:8000/v1'
            },
            'voip_minutes': {
                apps: {
                    pbxs: {
                        label: 'PBX Connector',
                        icon: 'device',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    },
                    numbers: {
                        label: 'Number Manager',
                        icon: 'menu1',
                        api_url: 'http://api.2600hz.com:8000/v1'
                    }
                },
                available_apps: ['voip', 'cluster', 'userportal', 'accounts', 'developer', 'numbers', 'pbxs'],
                default_api_url: 'http://api.2600hz.com:8000/v1'
            }
        },

        device_threshold: [5, 20, 50, 100],

        /* web server used by the cdr module to show the link to the logs */
        logs_web_server_url: 'http://cdrs.2600hz.com/',

        /* Customized name displayed in the application (login page, resource module..) */
        company_name: '2600hz',

        base_urls: {
            'u.2600hz.com': {
                /* If this was set to true, Winkstart would look for u_2600hz_com.png in config/images/logos */
                custom_logo: false
            },
            'apps.2600hz.com': {
                custom_logo: false
            }
        },

        /* Was winkstart.realm_suffix */
        realm_suffix: {
            //login: '.sip.2600hz.com',
            login: '.thinky64.2600hz.com',
            register: '.trial.2600hz.com'
        },

        /* What applications is available for a user that just registered */
        register_apps: {
            cluster: {
               label: 'Cluster Manager',
               icon: 'cluster_manager',
               api_url: 'http://api.2600hz.com:8000/v1'
            },
            voip: {
                label: 'Trial PBX',
                icon: 'phone',
                api_url: 'http://api.2600hz.com:8000/v1'
            },
            accounts: {
                label: 'Accounts',
                icon: 'account',
                api_url: 'http://api.2600hz.com:8000/v1'
            }
        },

        /* Custom links */
        nav: {
            help: 'http://wiki.2600hz.com',
            learn_more: 'http://www.2600hz.com/'
        },

        default_api_url: 'http://api.2600hz.com:8000/v1',

        available_apps: {
            'voip': {
                id: 'voip',
                label: 'Hosted PBX',
                icon: 'device',
                desc: 'Manage vmboxes, callflows ...'
            },
            'cluster': {
                id: 'cluster',
                label: 'Cluster Manager',
                icon: 'cluster_manager',
                desc: 'Manage Servers and Infrastructure'
            },
            'userportal': {
                id: 'userportal',
                label: 'User Portal',
                icon: 'user',
                desc: 'Let the user manage is own vmbox ...'
            },
            'accounts': {
                id: 'accounts',
                label: 'Accounts',
                icon: 'account',
                desc: 'Manage your sub-accounts'
            },
            'developer': {
                id: 'developer',
                label: 'Developer',
                icon: 'connectivity',
                desc: 'Api Developer Tool'
            },
            'pbxs': {
                id: 'pbxs',
                label: 'PBX Connector',
                icon: 'device',
                desc: 'Manage your pbxs'
            },
            'numbers': {
                id: 'numbers',
                label: 'Number Manager',
                icon: 'menu1',
                desc: 'Manage your numbers'
            }
        }
    };

    winkstart.apps = {
        'auth' : {
            api_url: 'http://api.2600hz.com:8000/v1',
        }
    };

    amplify.cache = false;

})(window.winkstart = window.winkstart || {}, window.amplify = window.amplify || {}, jQuery);
