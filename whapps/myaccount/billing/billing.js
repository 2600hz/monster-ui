winkstart.module('myaccount', 'billing', {
        css: [
           'css/billing.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           billing: 'tmpl/billing.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.billing.render': 'render'
        },

        resources: {
            'billing.get': {
                url: '{api_url}/accounts/{account_id}/braintree/customer',
                contentType: 'application/json',
                verb: 'GET'
            },
            'billing.update': {
                url: '{api_url}/accounts/{account_id}/braintree/customer',
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
        update_billing: function(data, new_data, success, error) {
            winkstart.request('billing.update', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
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

        get_billing: function(success, error) {
            winkstart.request('billing.get', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url
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

        render: function(_parent) {
            var THIS = this,
                $billing_html = THIS.templates.billing.tmpl();

            winkstart.publish('myaccount.select_menu', THIS.__module);

            $('.myaccount .myaccount-content .container-fluid').html($billing_html);

            $('#accordion', $billing_html).accordion({
                collapsible: true,
                heightStyle: 'content'
            });

            $('#billing_history', $billing_html).hide();

            $('#billing_history_link', $billing_html).on('click', function() {
                $('#billing_overview', $billing_html).slideUp();
                $('#billing_history', $billing_html).slideDown();
            });

            $('#billing_overview_link', $billing_html).on('click', function() {
                $('#billing_history', $billing_html).slideUp();
                $('#billing_overview', $billing_html).slideDown();
            });

            $('#card', $billing_html).change(function() {
                THIS.get_billing(function(_data) {
                    console.log(_data);
                });
            });

        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this,
                $billing_menu_html = THIS.templates.menu.tmpl();

            winkstart.publish('myaccount.add_submodule', $billing_menu_html, 5);
        }
    }
);
