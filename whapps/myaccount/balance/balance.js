winkstart.module('myaccount', 'balance', {
        css: [
           'css/balance.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           balance: 'tmpl/balance.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.balance.render': 'render'
        },

        resources: {
            'balance.get': {
                url: '{api_url}/accounts/{account_id}/{billing_provider}/credits',
                contentType: 'application/json',
                verb: 'GET'
            },
            'balance.update': {
                url: '{api_url}/accounts/{account_id}/{billing_provider}/credits',
                contentType: 'application/json',
                verb: 'PUT'
            },
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        balance_get: function(success, error) {
            var THIS = this;

            winkstart.request('balance.get', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    billing_provider: winkstart.apps['myaccount'].billing_provider
                },
                function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                function(data, status) {
                    if(typeof error == 'function') {
                        error(data, status);
                    }
                }
            );
        },

        balance_add: function(credits, success, error) {
            var THIS = this;

            winkstart.request('balance.update', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    billing_provider: winkstart.apps['myaccount'].billing_provider,
                    data: {
                        'amount': credits
                    }
                },
                function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                function(data, status) {
                    if(typeof error == 'function') {
                        error(data, status);
                    }
                }
            );
        },

        update_menu: function(data) {
            var THIS = this;

            if(data) {
                $('.myaccount .' + THIS.__module + ' .amount').html(data.toFixed(2));
            }
        },

        render: function() {
            var THIS = this;

            THIS.balance_get(function(data) {
               var $balance_html = THIS.templates.balance.tmpl({
                    'amount': data.data.amount.toFixed(2) || '0.00'
                });

                $('.add-credit', $balance_html).on('click', function(ev) {
                    ev.preventDefault();

                    winkstart.confirm('Your on-file credit card will immediately be charged for any changes you make. If you have changed any recurring services, new charges will be pro-rated for your billing cycle.<br/><br/>Are you sure you want to continue?',
                        function() {
                            var credits_to_add = parseFloat($('#amount', $balance_html).val().replace(',','.'));

                            THIS.balance_add(credits_to_add,
                                function() {
                                    THIS.update_menu((parseFloat($('#amount', $balance_html).val()) + credits_to_add).toFixed(2));
                                    winkstart.publish('myaccount.balance.render');
                                    winkstart.alert('Your changes have been saved!');
                                },
                                winkstart.error_message.process_error()
                            );
                        }
                    );
                });

                winkstart.publish('myaccount.select_menu', THIS.__module);
                $('.myaccount .myaccount-content .container-fluid').html($balance_html);
            });

        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this;

            THIS.balance_get(function(data) {
                var $balance_menu_html = THIS.templates.menu.tmpl({
                    'amount': data.data.amount.toFixed(2) || '0.00'
                });

                winkstart.publish('myaccount.add_submodule', $balance_menu_html, 2);
            });
        }
    }
);
