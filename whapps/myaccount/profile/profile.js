winkstart.module('myaccount', 'profile', {
        css: [
           'css/profile.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           profile: 'tmpl/profile.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.profile.render': 'render'
        },

        resources: {
            'profile.user_get': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'profile.user_update': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'POST'
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        user_update: function(data, new_data, success, error) {
            winkstart.request('profile.user_update', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    user_id: winkstart.apps['myaccount'].user_id,
                    data: $.extend(true, {}, data, new_data)
                },
                function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            );
        },

        render: function() {
            var THIS = this;

            winkstart.request('profile.user_get', {
                account_id: winkstart.apps['myaccount'].account_id,
                api_url: winkstart.apps['myaccount'].api_url,
                user_id: winkstart.apps['myaccount'].user_id
            },
            function(data, status) {
                var $profile_html = THIS.templates.profile.tmpl({
                    'email': (data.data.email) ? data.data.email : ""
                });

                $('.change-email', $profile_html).on('click', function(e) {
                    e.preventDefault();

                    THIS.user_update(data.data, {
                        email: $('#email', $profile_html).val()
                    },
                    function() {
                        alert('Email address updated!');
                    });
                });


                $('.change-password', $profile_html).click(function(e) {
                    e.preventDefault();

                    var pass = $('#password', $profile_html).val(),
                        confirm_pass = $('#confirm_password', $profile_html).val()

                    if(pass == confirm_pass) {
                        if(winkstart.is_password_valid(pass)) {
                            THIS.user_update(data.data, {
                                    password: pass
                                },
                                function() {
                                    alert('Password updated!');
                                }
                            );
                        }
                    } else {
                        alert('Passwords do not match, please retype the passwords.');
                    }
                });

                winkstart.publish('myaccount.select_menu', THIS.__module);
                $('.myaccount .myaccount-content .container-fluid').html($profile_html); 
            });
        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this,
                $profile_menu_html = THIS.templates.menu.tmpl(); 

            winkstart.publish('myaccount.add_submodule', $profile_menu_html, 1);   
        }
    }
);
