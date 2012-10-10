winkstart.module('auth', 'auth',
    {
        css: [
            'css/auth.css'
        ],

        templates: {
            recover_password: 'tmpl/recover_password.html',
            login: 'tmpl/login.html',
            new_login: 'tmpl/new_login.html',
            register: 'tmpl/register.html',
            new_password: 'tmpl/new_password.html',
            code: 'tmpl/code.html',
            landing: 'tmpl/landing.html'
        },

        subscribe: {
            'auth.activate' : 'activate',
            'auth.login' : 'login_popup', //popup login process
            'auth.welcome' : 'login', //login from the welcome page
            'auth.load_account' : 'load_account',
            'auth.recover_password' : 'recover_password',
            'auth.new_password': 'new_password',
            'auth.authenticate' : 'authenticate',
            'auth.shared_auth' : 'shared_auth',
            'auth.register' : 'register',
            'auth.save_registration' : 'save_registration',
            'auth.landing': 'landing',
            'core.loaded': 'core_loaded'
        },

        validation: [
            { name: '#username', regex: /^[a-zA-Z0-9\_\-]{3,16}$/ },
            { name: '#email', regex: /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/ }
        ],

        validation_recover: [
            { name: '#username', regex: /^.+$/ },
            { name: '#account_name', regex: /^.*$/ },
            { name: '#account_realm', regex: /^.*$/ },
            { name: '#phone_number', regex: /^.*$/ }
        ],

        validation_new_password: [
            { name: '#old_password', regex: '.+' },
            { name: '#new_password1', regex: '.+' },
            { name: '#new_password2', regex: '.+' }
        ],

        resources: {
            'auth.user_auth': {
                url: '{api_url}/user_auth',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'auth.shared_auth': {
                url: '{api_url}/shared_auth',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'auth.register': {
                url: '{api_url}/signup',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'auth.activate': {
                url: '{api_url}/signup/{activation_key}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'auth.get_user': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'auth.user.update': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'auth.recover_password': {
                url: '{api_url}/user_auth/recovery',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'auth.invite_code': {
                url: '{api_url}/onboard/invite/{invite_code}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'auth.get_account': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            }
        }
    },
    function() {
        var cookie_data,
            THIS = this;

        winkstart.registerResources(this.__whapp, this.config.resources);

        if(!$.cookie('c_winkstart_auth')) {
            winkstart.publish('auth.welcome');
        }

        if('account_name' in URL_DATA) {
            account_name = URL_DATA['account_name'];
        }

        if('auth_url' in URL_DATA) {
            winkstart.apps['auth'].api_url = URL_DATA['auth_url'];
        }
        else {
            var host = URL.match(/^(?:https?:\/\/)*([^\/?#]+).*$/)[1];

            if(typeof winkstart.config.base_urls == 'object' && host in winkstart.config.base_urls) {
                if('auth_url' in winkstart.config.base_urls[host]) {
                    winkstart.apps['auth'].api_url = winkstart.config.base_urls[host].auth_url;
                }
            }
        }
        winkstart.module(THIS.__module, 'onboarding').init(function() {
            winkstart.log('Core: Loaded Onboarding');
        });
    },

    {
        request_realm : false,

        get_account: function(success, error) {
            winkstart.request('auth.get_account', {
                    api_url: winkstart.apps['auth'].api_url,
                    account_id: winkstart.apps['auth'].account_id
                },
                function(_data, status) {
                    if(typeof success === 'function') {
                        success(_data);
                    }
                },
                function(_data, status) {
                    if(typeof error === 'function') {
                        error(_data);
                    }
                }
            );
        },

        core_loaded: function() {
            if(URL_DATA['activation_key']) {
                winkstart.postJSON('auth.activate', {crossbar: true, api_url : winkstart.apps['auth'].api_url, activation_key: URL_DATA['activation_key'], data: {}}, function(data) {

                   winkstart.alert('info','You are now registered! Please log in.', function() {
                       winkstart.publish('auth.welcome', {username: data.data.user.username});
                   });

                   if(data.auth_token != '' && data.auth_token != 'null' && data.auth_token != 'undefined'){
                        winkstart.apps['auth'].account_id = data.data.account.id;
                        winkstart.apps['auth'].auth_token = data.auth_token;
                        winkstart.apps['auth'].user_id = data.data.user.id;
                        winkstart.apps['auth'].realm = data.data.account.realm;
                        winkstart.publish('auth.load_account');
                   }
                });
            }
            else if(URL_DATA['recover_password']) {
                winkstart.alert('info','You are in the Recover Password tool.');
            }

            if(cookie_data = $.cookie('c_winkstart_auth')) {
                $('#ws-content').empty();
                eval('winkstart.apps["auth"] = ' + cookie_data);
                winkstart.publish('auth.load_account');
            }
        },

        register: function() {
            var THIS = this;

            var dialogRegister = winkstart.dialog(THIS.templates.register.tmpl({}), {
                title: 'Register a New Account',
                resizable : false,
                modal: true
            });

            $('#username', dialogRegister).focus();

            winkstart.validate.set(THIS.config.validation, dialogRegister);

            $('button.register', dialogRegister).click(function(event) {
                event.preventDefault(); // Don't run the usual "click" handler

                winkstart.validate.is_valid(THIS.config.validation, dialogRegister, function() {
                        if ($('#password', dialogRegister).val() == $('#password2', dialogRegister).val()) {
                            if(winkstart.is_password_valid($('#password', dialogRegister).val())) {
                                var realm;
                                if(THIS.request_realm) {
                                    realm = $('#realm', dialogRegister).val();
                                } else {
                                    realm = $('#username', dialogRegister).val() + (typeof winkstart.config.realm_suffix === 'object' ? winkstart.config.realm_suffix.register : winkstart.config.realm_suffix);
                                }

                                // If realm was set in the URL, override all
                                if('realm' in URL_DATA) {
                                    realm = URL_DATA['realm'];
                                }

                                var rest_data = {
                                    crossbar : true,
                                    api_url : winkstart.apps['auth'].api_url,
                                    data : {
                                        'account': {
                                            'realm': realm,
                                            'name' :$('#name', dialogRegister).val(),
                                            'app_url': URL
                                        },
                                        'user': {
                                            'username':$('#username', dialogRegister).val(),
                                            'password' : $('#password', dialogRegister).val(),
                                            'first_name': $('#first_name', dialogRegister).val() ,
                                            'last_name':$('#last_name', dialogRegister).val(),
                                            'email': $('#email', dialogRegister).val(),
                                            'apps': winkstart.config.register_apps
                                        }
                                    }
                                };
                                winkstart.putJSON('auth.register', rest_data, function (json, xhr) {
                                    $.cookie('c_winkstart.login', null);
                                    winkstart.alert('info','Registered successfully. Please check your e-mail to activate your account!');
                                    dialogRegister.dialog('close');
                                });
                            }
                        }
                        else {
                            winkstart.alert('Please confirm your password');
                        }
                    },
                    function() {
                        winkstart.alert('There were errors on the form, please correct!');
                    }
                );
            });
        },

        get_realm_from_url: function() {
            var realm = '';

            if('realm' in URL_DATA) {
                realm = URL_DATA['realm'];
            }

            return realm;
        },

        get_account_name_from_url: function() {
            var account_name = '',
                host,
                host_parts;

            if('account_name' in URL_DATA) {
                account_name = URL_DATA['account_name'];
            }
            else {
                host = URL.match(/^(?:https?:\/\/)*([^\/?#]+).*$/)[1];
                host_parts = host.split('.');

                if(typeof winkstart.config.base_urls == 'object' && host_parts.slice(1).join('.') in winkstart.config.base_urls) {
                    account_name = host_parts[0];
                }
            }

            return account_name;
        },

        login: function(args) {
            var THIS = this,
                username = (typeof args == 'object' && 'username' in args) ? args.username : '',
                account_name = THIS.get_account_name_from_url(),
                realm = THIS.get_realm_from_url(),
                cookie_login = $.parseJSON($.cookie('c_winkstart.login')) || {},
                data_tmpl = {
                    username: username || cookie_login.login || '',
                    request_account_name: (realm || account_name) ? false : true,
                    account_name: account_name || cookie_login.account_name || '',
                    remember_me: cookie_login.login || cookie_login.account_name ? true : false,
                    register_btn: winkstart.config.hide_registration || false
                },
                login_html = THIS.templates.new_login.tmpl(data_tmpl),
                code_html = THIS.templates.code.tmpl(),
                contentDiv = $('.welcome-page-top .right_div', '#content_welcome_page')
                                .empty()
                                .append(login_html);

            if(data_tmpl.username != '') {
                $('#password', contentDiv).focus();
            }
            else {
                $('#login', contentDiv).focus();
            }

            $('.login', contentDiv).click(function(event) {
                event.preventDefault(); // Don't run the usual "click" handler

                var login_username = $('#login', contentDiv).val(),
                    login_password = $('#password', contentDiv).val(),
                    login_account_name = $('#account_name', contentDiv).val(),
                    hashed_creds = $.md5(login_username + ':' + login_password),
                    login_data = {};

                if(realm) {
                    login_data.realm = realm;
                }
                else if(account_name) {
                    login_data.account_name = account_name;
                }
                else if(login_account_name) {
                    login_data.account_name = login_account_name;
                }
                else {
                    login_data.realm = login_username + (typeof winkstart.config.realm_suffix === 'object' ? winkstart.config.realm_suffix.login : winkstart.config.realm_suffix);
                }

                winkstart.putJSON('auth.user_auth', {
                        api_url: winkstart.apps['auth'].api_url,
                        data: $.extend(true, {
                            credentials: hashed_creds
                        }, login_data)
                    },
                    function (data, status) {
                        winkstart.apps['auth'].account_id = data.data.account_id;
                        winkstart.apps['auth'].auth_token = data.auth_token;
                        winkstart.apps['auth'].user_id = data.data.owner_id;
                        winkstart.apps['auth'].realm = realm;

                        // Deleting the welcome message
                        $('#ws-content').empty();

                        if($('#remember_me', contentDiv).is(':checked')) {
                            var cookie_login = {};
                            login_username ? cookie_login.login = login_username : true;
                            login_data.account_name ? cookie_login.account_name = login_data.account_name : true;
                            $.cookie('c_winkstart_login', JSON.stringify(cookie_login));
                        }
                        else{
                            $.cookie('c_winkstart_login', null);
                        }

                        $.cookie('c_winkstart_auth', JSON.stringify(winkstart.apps['auth']));

                        winkstart.publish('auth.load_account');
                    },
                    function(data, status) {
                        if(status === 400) {
                            winkstart.alert('Invalid credentials, please check that your username and account name are correct.');
                        }
                        else if($.inArray(status, [401, 403]) > -1) {
                            winkstart.alert('Invalid credentials, please check that your password and account name are correct.');
                        }
                        else if(status === 'error') {
                            winkstart.alert('Oh no! We are having trouble contacting the server, please try again later...');
                        }
                        else {
                            winkstart.alert('An error was encountered while attempting to process your request (Error: ' + status + ')');
                        }
                    }
                );
            });

            $('button.register', contentDiv).click(function(e) {
                e.preventDefault();

                if(!winkstart.config.nav.register) {
                    if(winkstart.config.register_type == "onboard") {
                        $('#ws-content')
                            .empty()
                            .append(code_html);
                    } else {
                        winkstart.publish('auth.register');
                    }
                }
                else {
                    window.location.href = winkstart.config.nav.register;
                }
            });

            $('button.register', code_html).click(function(e) {
                e.preventDefault();
                var code = $('input#code', code_html).val();

                if(code != "" && code != null) {
                    winkstart.request('auth.invite_code', {
                            api_url: winkstart.apps.auth.api_url,
                            invite_code: code,
                        },
                        function(_data, status) {
                            winkstart.publish('onboard.register', {
                                invite_code: code
                            });
                        },
                        function(_data, status) {
                            switch(_data['error']) {
                                case '404':
                                    winkstart.alert('error', 'Invalid invite code !');
                                    break;
                                case '410':
                                    winkstart.alert('error', 'Invite code already used !');
                                    break;
                                default:
                                    winkstart.alert('error', '<p>An error occurred</p>' + winkstart.print_r(_data));
                                    break;
                            }
                        }
                    );
                }

            });

            $('a.recover_password', contentDiv).click(function(e) {
                e.preventDefault();

                winkstart.publish('auth.recover_password');
            });
        },

        login_popup: function(args) {
            var THIS = this,
                username = (typeof args == 'object' && 'username' in args) ? args.username : '',
                account_name = THIS.get_account_name_from_url(),
                realm = THIS.get_realm_from_url(),
                login_html = THIS.templates.login.tmpl({
                    username: username,
                    request_account_name: (realm || account_name) ? false : true,
                    account_name: account_name
                });

            var dialogDiv = winkstart.dialog(login_html, {
                title : 'Login',
                resizable : false,
                width: '340',
                modal: true
            });

            if(username != '') {
                $('#password', dialogDiv).focus();
            }

            $('.login', dialogDiv).click(function(event) {
                event.preventDefault(); // Don't run the usual "click" handler

                var login_username = $('#login', dialogDiv).val(),
                    login_password = $('#password', dialogDiv).val(),
                    login_account_name = $('#account_name', dialogDiv).val(),
                    hashed_creds = $.md5(login_username + ':' + login_password),
                    login_data = {};

                if(realm) {
                    login_data.realm = realm;
                }
                else if(account_name) {
                    login_data.account_name = account_name;
                }
                else if(login_account_name) {
                    login_data.account_name = login_account_name;
                }
                else {
                    login_data.realm = login_username + (typeof winkstart.config.realm_suffix === 'object' ? winkstart.config.realm_suffix.login : winkstart.config.realm_suffix);
                }

                winkstart.putJSON('auth.user_auth', {
                        api_url: winkstart.apps['auth'].api_url,
                        data: $.extend(true, {
                            credentials: hashed_creds
                        }, login_data)
                    },
                    function (data, status) {
                        winkstart.apps['auth'].account_id = data.data.account_id;
                        winkstart.apps['auth'].auth_token = data.auth_token;
                        winkstart.apps['auth'].user_id = data.data.owner_id;
                        winkstart.apps['auth'].realm = realm;

                        $(dialogDiv).dialog('close');

                        // Deleting the welcome message
                        $('#ws-content').empty();

                        $.cookie('c_winkstart_auth', JSON.stringify(winkstart.apps['auth']));

                        winkstart.publish('auth.load_account');
                    },
                    function(data, status) {
                        if(status === 400) {
                            winkstart.alert('Invalid credentials, please check that your username and account name are correct.');
                        }
                        else if($.inArray(status, [401, 403]) > -1) {
                            winkstart.alert('Invalid credentials, please check that your password and account name are correct.');
                        }
                        else if(status === 'error') {
                            winkstart.alert('Oh no! We are having trouble contacting the server, please try again later...');
                        }
                        else {
                            winkstart.alert('An error was encountered while attempting to process your request (Error: ' + status + ')');
                        }
                    }
                );
            });

            $('a.register', dialogDiv).click(function(event) {
                event.preventDefault(); // Don't run the usual "click" handler

                winkstart.publish('auth.register');

                $(dialogDiv).dialog('close');
            });

            $('a.recover_password', dialogDiv).click(function(event) {
                event.preventDefault(); // Don't run the usual "click" handler

                winkstart.publish('auth.recover_password');

                $(dialogDiv).dialog('close');
            });
        },

        landing: function(parent) {
            var THIS = this,
                parent = parent || $('.ws-content'),
                landing_html = THIS.templates.landing.tmpl();

            parent
                .empty()
                .append(landing_html);
        },

        load_account: function(args) {
            winkstart.log('Loading your apps!');
            var THIS = this,
                rest_data = {
                    crossbar : true,
                    account_id : winkstart.apps['auth'].account_id,
                    api_url : winkstart.apps['auth'].api_url,
                    user_id : winkstart.apps['auth'].user_id
                };

            THIS.get_account(
                function(_data) {
                    winkstart.getJSON('auth.get_user', rest_data,
                        function (json, xhr) {
                            json.data.account_name = (_data.data || {}).name || winkstart.config.company_name;
                            json.data.apps = json.data.apps || {};

                            winkstart.publish('auth.account.loaded', json.data);

                            $.each(json.data.apps, function(k, v) {
                                winkstart.log('WhApps: Loading ' + k + ' from URL ' + v.api_url);
                                winkstart.apps[k] = v;

                                if(!('account_id' in v)) {
                                    winkstart.apps[k].account_id = winkstart.apps['auth'].account_id;
                                }

                                if(!('user_id' in v)) {
                                    winkstart.apps[k].user_id = winkstart.apps['auth'].user_id;
                                }

                                winkstart.module.loadApp(k, function() {
                                    this.init();
                                    winkstart.log('WhApps: Initializing ' + k);
                                });
                            });

                            if(json.data.require_password_update) {
                                winkstart.publish('auth.new_password', json.data);
                            }

                            var landing = true;
                            $.each(json.data.apps, function(k, v) {
                                if(v['default']) {
                                    landing = false;
                                }
                            });

                            if(landing) {
                                winkstart.publish('auth.landing', $('.ws-content'));
                            }

                        },
                        function(data, status) {
                            winkstart.alert('error', 'An error occurred while loading your account.',
                                function() {
                                    $.cookie('c_winkstart_auth', null);
                                    window.location.reload();
                                }
                            );
                        }
                    );
                },
                function(_data) {
                    winkstart.alert('error', 'An error occurred while loading your account.',
                        function() {
                            $.cookie('c_winkstart_auth', null);
                            window.location.reload();
                        }
                    );
                }
            );
        },

        shared_auth: function(args) {
            var THIS = this;

            var rest_data = {
                api_url : winkstart.apps[args.app_name].api_url,
                data: {
                    realm : winkstart.apps['auth'].realm,                     // Treat auth as global
                    account_id : winkstart.apps['auth'].account_id,           // Treat auth as global
                    shared_token : winkstart.apps['auth'].auth_token          // Treat auth as global
                }
            };

            var get_user_fn = function(auth_token, app_name, callback) {
                var options = {
                    account_id: winkstart.apps['auth'].account_id,
                    api_url : winkstart.apps['auth'].api_url,
                    user_id: winkstart.apps['auth'].user_id
                };

                winkstart.apps[app_name] = $.extend(true, {}, options, winkstart.apps[app_name]);
                winkstart.apps[app_name]['auth_token'] = auth_token;

                winkstart.getJSON('auth.get_user', options, function(json, xhr) {
                    if(typeof callback == 'function') {
                        callback();
                    }
                });
            };

            if(winkstart.apps['auth'].api_url != winkstart.apps[args.app_name].api_url) {
                winkstart.putJSON('auth.shared_auth', rest_data, function (json, xhr) {
                    // If this is successful, we'll get a server-specific auth token back
                    get_user_fn(json.auth_token, args.app_name, args.callback);
                });
            }
            else {
                get_user_fn(winkstart.apps['auth'].auth_token, args.app_name, args.callback);
            }
        },

        new_password: function(user_data) {
            var THIS = this;

            var dialog_new_password = winkstart.dialog(THIS.templates.new_password.tmpl(), {
                title: 'Please set a new password',
                width: '500px'
            });

            winkstart.validate.set(THIS.config.validation_new_password, dialog_new_password);

            $('.btn_new_password', dialog_new_password).click(function(event) {
                event.preventDefault();
                var data_new_password = form2object('new_password_form');

                winkstart.validate.is_valid(THIS.config.validation_new_password, dialog_new_password, function() {
                    if(data_new_password.new_password1 === data_new_password.new_password2) {
                        user_data.password = data_new_password.new_password1;
                        user_data.require_password_update = false;

                        winkstart.request(true, 'auth.user.update', {
                                api_url: winkstart.apps.auth.api_url,
                                account_id: winkstart.apps.auth.account_id,
                                user_id: user_data.id,
                                data: user_data
                            },
                            function(_data, status) {
                                winkstart.alert('info', 'Password updated !');
                                dialog_new_password.dialog('close');
                            },
                            function(_data, status) {
                                winkstart.alert('error', 'Error :' + status);
                            }
                        );
                    }
                    else {
                        $('#new_password1', dialog_new_password).val('');
                        $('#new_password2', dialog_new_password).val('');
                        winkstart.alert('Password typed don\'t match. Please retype your new password');
                    }
                });
            });
        },

        /* (╯°□°）︵ ┻━━┻━ */
        recover_password: function(args) {
            var THIS = this;

            var dialogRecover = winkstart.dialog(THIS.templates.recover_password.tmpl({}), {
                title: 'Recover Password'
            });

            winkstart.validate.set(THIS.config.validation_recover, dialogRecover);

            $('.btn_recover_password', dialogRecover).click(function(event) {
                event.preventDefault();
                var data_recover = form2object('recover_password_form');

                data_recover.account_realm == '' ? delete data_recover.account_realm : true;
                data_recover.account_name == '' ? delete data_recover.account_name : true;
                data_recover.phone_number == '' ? delete data_recover.phone_number : true;

                winkstart.validate.is_valid(THIS.config.validation_recover, dialogRecover, function() {
                    winkstart.request(true, 'auth.recover_password', {
                            api_url: winkstart.apps['auth'].api_url,
                            data: data_recover
                        },
                        function(_data, status) {
                            winkstart.alert('info', _data.data);
                            dialogRecover.dialog('close');
                        },
                        function(_data, status) {
                            var msg_error = 'Error ' + status + '<br/>';
                            if(_data.data) {
                                $.each(_data.data, function(k, v) {
                                    $.each(_data.data[k], function(key, msg) {
                                        msg_error += '<br/>' + msg;
                                    });
                                });
                            }

                            winkstart.alert('error', msg_error);
                        }
                    );
                });
            });
        },

        authenticate: function() {
            var _t = this;
            amplify.request('auth.establish', {
                username: '',
                passwordhash: ''
            }, function(data) {
                _t.session.authenticated = true;
                _t.session.token         = data.auth_token;
                _t.session.expires       = data.expires;
                winkstart.alert('User authenticated');
            });
        },

        init: function() {
            // Check if we already have a session stored in a cookie
            var auth = $.cookie('winkstart');
            if ( auth ) {
                this.session = auth;
            }
        },

        activate: function() {
/*            if(ACTIVATION_KEY) {
                var rest_data = { activtion_key : ACTIVATION_KEY, data: {} };
                winkstart.postJSON('auth.activate', rest_data, function (json, xhr) {
                    winkstart.log(json);
                    REALM_LOGIN = json.data.account.realm;
                    alert('You are now registered');
                });
                ACTIVATION_KEY = null;
            }
            else */
            if(winkstart.apps['auth'].auth_token == null) {
                winkstart.publish('auth.login');
            }
            else {
                winkstart.confirm('Are you sure that you want to log out?', function() {
                    // Remove any individual keys
                    $.each(winkstart.apps, function(k, v) {
                        // TODO: ADD APP UNLOADING CODE HERE. Remove CSS and scripts. This should inherently delete apps.

                        winkstart.apps[k].realm = null;
                        winkstart.apps[k].auth_token = null;
                        winkstart.apps[k].user_id = null;
                        winkstart.apps[k].account_id = null;
                    });

                    $.cookie('c_winkstart_auth', null);

                    $('#ws-content').empty();

                    // Temporary hack until module unloading works properly
                    window.location.reload();
                });
            }
        }
    }
);

