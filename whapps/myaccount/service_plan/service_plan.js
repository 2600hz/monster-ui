winkstart.module('myaccount', 'service_plan', {
        css: [
           'css/service_plan.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           service_plan: 'tmpl/service_plan.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.service_plan.render': 'render'
        },

        resources: {
            'service_plan.get': {
                url: '{api_url}/accounts/{account_id}/service_plans/current',
                verb: 'GET'
            },
            'subscription.get': {
                url: '{api_url}/accounts/{account_id}/transactions/subscriptions',
                verb: 'GET'
            },
            'service_plan.download_csv_test': {
                url: '{api_url}/accounts/{account_id}/service_plans/current?depth=4&identifier=items&accept=csv',
                verb: 'GET'
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        download_csv: function(success, error) {
            var THIS = this;
            winkstart.request('service_plan.download_csv_test', {
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

        service_plan_get: function(success, error) {
            var THIS = this;
            winkstart.request('service_plan.get', {
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

        subscription_get: function(success, error) {
            var THIS = this;
            winkstart.request('subscription.get', {
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
            var THIS = this,
                defaults = {
                    total_amount: 0,
                    service_plan_array: []
                },
                render_data = defaults;

            winkstart.parallel({
                    service_plan: function(callback) {
                        THIS.service_plan_get(function(data) {
                            var data_array = [],
                                total_amount = 0;

                            if('items' in data.data) {
                                $.each(data.data.items, function(category_name, category) {
                                    $.each(category, function(item_name, item) {
                                        var discount = item.single_discount_rate + (item.cumulative_discount_rate * item.cumulative_discount),
                                            monthly_charges = parseFloat(((item.rate * item.quantity) - discount) || 0).toFixed(2);

                                        var translated_key = i18n.t('myaccount.service_plan.'+item_name);

                                        if(monthly_charges > 0) {
                                            data_array.push({
                                                service: translated_key === 'myaccount.service_plan.' + item_name ? item_name : translated_key,
                                                rate: item.rate || 0,
                                                quantity: item.quantity || 0,
                                                discount: discount > 0 ? '-'+i18n.t('core.layout.currency_used')+ parseFloat(discount).toFixed(2) : '',
                                                monthly_charges: monthly_charges
                                            });

                                            total_amount += parseFloat(monthly_charges);
                                        }
                                    });
                                });
                            }

                            var sort_by_price = function(a, b) {
                                return parseFloat(a.monthly_charges) >= parseFloat(b.monthly_charges) ? -1 : 1;
                            }

                            data_array.sort(sort_by_price);

                            render_data.service_plan_array = data_array;
                            render_data.total_amount = parseFloat(total_amount).toFixed(2);

                            callback(null, data);
                        });
                    },
                    subscription: function(callback) {
                        THIS.subscription_get(function(data) {
                            render_data.due_date = winkstart.parse_date(data.data[0].next_bill_date, 'short');

                            callback(null, data);
                        });
                    }
                },
                function(err, results) {
                    var $service_plan_html = THIS.templates.service_plan.tmpl(render_data);

                    $('.icon-question-sign[data-toggle="tooltip"]', $service_plan_html).tooltip();

                    $('#get_csv', $service_plan_html).on('click', function() {
                        window.location.href = winkstart.apps['myaccount'].api_url+'/accounts/'+winkstart.apps['myaccount'].account_id+'/service_plans/current?depth=4&identifier=items&accept=csv&auth_token=' + winkstart.apps['myaccount'].auth_token;
                    });
                    $('#get_pdf', $service_plan_html).on('click', function() {
                        window.location.href = winkstart.apps['myaccount'].api_url + '/accounts/' +
                                           winkstart.apps['myaccount'].account_id + '/service_plans/current?identifier=items&depth=4&auth_token=' + winkstart.apps['myaccount'].auth_token;
                    });

                    winkstart.publish('myaccount.render_submodule', $service_plan_html);
                }
            );
        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this,
                $service_plan_menu_html = THIS.templates.menu.tmpl({});

            winkstart.publish('myaccount.add_submodule', $service_plan_menu_html, 20, 'billing_category');
        }
    }
);
