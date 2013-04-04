winkstart.module('myaccount', 'transactions', {
        css: [
           'css/transactions.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           transactions: 'tmpl/transactions.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.transactions.render': 'render'
        },

        resources: {
            'transactions.get': {
                url: '{api_url}/accounts/{account_id}/transactions',
                verb: 'GET'
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        transactions_get: function(success, error) {
            var THIS = this;
            winkstart.request('transactions.get', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url
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

        render: function() {
            var THIS = this;

            THIS.transactions_get(function(data) {
                var $transactions_html = THIS.templates.transactions.tmpl({ amount: 330 });

                winkstart.publish('myaccount.render_submodule', $transactions_html);
            });

        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this,
                $transactions_menu_html = THIS.templates.menu.tmpl({});

            winkstart.publish('myaccount.add_submodule', $transactions_menu_html, 10, 'billing_category');
        }
    }
);
