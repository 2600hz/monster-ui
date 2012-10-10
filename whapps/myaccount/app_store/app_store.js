winkstart.module('myaccount', 'app_store', {
        css: [
            'css/app_store.css'
        ],

        templates: {
            app_store: 'tmpl/app_store.html'
        },

        subscribe: {
            'myaccount.nav.post_loaded': 'myaccount_loaded',
            'app_store.popup': 'popup'
        },

        resources: {
            'app_store.user_get': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'app_store.user_update': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'app_store.account_get': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'app_store.account_update': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        update_acct: function(data, new_data, success, error) {
            winkstart.request('app_store.user_update', {
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

        myaccount_loaded: function(user_data) {
            var THIS = this;

            if(winkstart.config.available_apps) {
                winkstart.request('app_store.account_get', {
                        api_url: winkstart.apps['myaccount'].api_url,
                        account_id: winkstart.apps['myaccount'].account_id,
                    },
                    function(_data, status) {

                        if(!_data.data.available_apps) {
                            _data.data.available_apps = [];

                            $.each(winkstart.config.available_apps, function(k, v) {
                                _data.data.available_apps.push(v.id);
                            });

                            winkstart.request('app_store.account_update', {
                                    api_url: winkstart.apps['myaccount'].api_url,
                                    account_id: winkstart.apps['myaccount'].account_id,
                                    data: _data.data
                                },
                                function(_data_updated, status) {
                                    THIS.add_sublink(_data_updated, user_data);
                                }
                            );
                        } else {
                            THIS.add_sublink(_data, user_data);
                        }
                    }
                );
            }
        },

        add_sublink: function(data, user_data) {
            if((data.data.available_apps && data.data.available_apps.length > 0) && (!user_data.priv_level || user_data.priv_level === 'admin')) {
                winkstart.publish('nav.add_sublink', {
                    link: 'nav',
                    sublink: 'app_store',
                    label: 'App Store',
                    weight: '20',
                    publish: 'app_store.popup'
                });
            }
        },

        render_app_store: function(data, target, callback) {
            var THIS = this;

            winkstart.request('app_store.user_get', {
                account_id: winkstart.apps['myaccount'].account_id,
                api_url: winkstart.apps['myaccount'].api_url,
                user_id: winkstart.apps['myaccount'].user_id
            },
            function(user_info, status) {

                winkstart.request('app_store.account_get', {
                        api_url: winkstart.apps['myaccount'].api_url,
                        account_id: winkstart.apps['myaccount'].account_id,
                    },
                    function(_data, status) {

                        var data = $.extend({}, data, {
                            available_apps: {},
                            apps: user_info.data.apps || {}
                        });

                        _data.data.available_apps = _data.data.available_apps || ((winkstart.config.onboard_roles || {})['default'] || {}).available_apps || [];

                        $.each(_data.data.available_apps, function(k, v) {
                            if(v in winkstart.config.available_apps) {
                                data.available_apps[k] = winkstart.config.available_apps[v];
                            }
                        });

                        var app_store_html = THIS.templates.app_store.tmpl(data),
                            count = 0,
                            total = $('.app-store-ul li', app_store_html).length;

                        $('*[rel=popover]:not([type="text"])', app_store_html).popover({
                            trigger: 'hover'
                        });

                        $('*[rel=popover][type="text"]', app_store_html).popover({
                            trigger: 'focus'
                        });

                        $('.switch', app_store_html)['switch']();

                        $('#left_scroll', app_store_html).click(function() {
                            if(count > 0){
                                var width = $('.app-store-ul li', app_store_html).outerWidth();
                                $('.app-store-ul').animate(
                                    {left: '+=' + width},
                                    500
                                );
                                count--;
                            }
                        });

                        $('#right_scroll', app_store_html).click(function() {
                            if(count+5 < total) {
                                var width = $('.app-store-ul li', app_store_html).outerWidth();
                                $('.app-store-ul').animate(
                                    {left: '-=' + width},
                                    500
                                );
                                count++;
                            }
                        });

                        $('#app_store_save', app_store_html).click(function(e) {
                            e.preventDefault();

                            winkstart.confirm(
                                'Warning! This is going to refresh the page.',
                                function(){

                                    winkstart.request('app_store.user_get', {
                                            account_id: winkstart.apps['myaccount'].account_id,
                                            api_url: winkstart.apps['myaccount'].api_url,
                                            user_id: winkstart.apps['myaccount'].user_id
                                        },
                                        function(_user_data, status) {
                                            var apps = {},
                                                tmp = _user_data.data;

                                            _user_data.data.apps = _user_data.data.apps || {};

                                            $('.app', app_store_html).find('[checked]').each(function() {
                                                var id = $(this).attr('name');

                                                if(_user_data.data.apps[id]) {
                                                    apps[id] = _user_data.data.apps[id];
                                                } else {
                                                    apps[id] = winkstart.config.available_apps[id];
                                                    apps[id].api_url = _data.data.default_api_url || winkstart.config.default_api_url;
                                                }

                                            });
                                            tmp.apps = apps;

                                            THIS.update_acct(tmp, {}, function() {
                                                window.location.reload();
                                            });

                                        }
                                    );
                                }
                            );
                        });

                        (target)
                            .empty()
                            .append(app_store_html);

                        if(typeof callback == "function") {
                            callback();
                        }
                    }
                );
            });
        },

        popup: function(){
            var THIS = this,
                popup_html = $('<div class="inline_popup"><div class="inline_content main_content app-store"/></div>');

            THIS.render_app_store({}, $('.inline_content', popup_html),
                function() {
                    winkstart.dialog(popup_html, {
                        height: 'auto',
                        modal: true,
                        title: 'App Store',
                        autoOpen: true
                    });
                }
            );
        }
    }
);
