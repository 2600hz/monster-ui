winkstart.module('myaccount', 'transactions', {
        css: [
           'css/transactions.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           transactions: 'tmpl/transactions.handlebars',
           list_transactions: 'tmpl/list_transactions.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.transactions.render': 'render'
        },

        resources: {
            'transactions.get_monthly': {
                url: '{api_url}/accounts/{account_id}/transactions/monthly_recurring?created_from={from}&created_to={to}',
                verb: 'GET'
            },
            'transactions.get_subscriptions': {
                url: '{api_url}/accounts/{account_id}/transactions/subscriptions',
                verb: 'GET'
            },
            'transactions.get_charges': {
                url: '{api_url}/accounts/{account_id}/transactions?reason=no_call&created_from={from}&created_to={to}',
                verb: 'GET'
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        transactions_get_monthly: function(from, to, success, error) {
            var THIS = this;
            winkstart.request('transactions.get_monthly', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    from: from,
                    to: to
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

        transactions_get_subscriptions: function(success, error) {
            var THIS = this;
            winkstart.request('transactions.get_subscriptions', {
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

        transactions_get_charges: function(from, to, success, error) {
            var THIS = this;
            winkstart.request('transactions.get_charges', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    from: from,
                    to: to
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

        list_transactions: function(from, to, callback) {
            var THIS = this,
                defaults = {
                    amount: 0.00,
                    billing_start_date: winkstart.parse_date(from, 'short'),
                    billing_end_date: winkstart.parse_date(to, 'short')
                };

            winkstart.parallel({
                    monthly: function(callback) {
                        THIS.transactions_get_monthly(from, to, function(data_monthly) {
                            var array_transactions = [];

                            $.each(data_monthly.data, function(k, v) {
                                if(v.add_ons.length === 0 && v.discounts.length === 0) {
                                    v.type = 'charges';
                                }
                                else {
                                    v.type = v.prorated ? 'prorated' : 'monthly';
                                    v.services = [];

                                    $.each(v.add_ons, function(k, add_on) {
                                        add_on.amount = parseFloat(add_on.amount).toFixed(2);
                                        add_on.quantity = parseFloat(add_on.quantity);
                                        add_on.monthly_charges = (add_on.amount * add_on.quantity).toFixed(2);

                                        v.services.push({
                                            service: i18n.t('myaccount.service_plan.'+add_on.id),
                                            rate: add_on.amount,
                                            quantity: add_on.quantity,
                                            discount: '',
                                            monthly_charges: add_on.monthly_charges
                                        });
                                    });
/*
                                    $.each(v.discounts, function(k, v) {

                                    });*/
                                }

                                v.amount = parseFloat(v.amount).toFixed(2);
                                v.created = winkstart.parse_date(v.created_at, 'short');
                                array_transactions.push(v);


                                defaults.amount += parseFloat(v.amount);
                            });

                            callback(null, array_transactions);
                        });
                    },
                    /*subscriptions: function(callback) {
                        THIS.transactions_get_subscriptions(function(data_subscriptions) {
                            var array_subscriptions = [];

                            $.each(data_subscriptions.data, function(k, v) {
                                v.type = 'subscription';
                                array_subscriptions.push(v);

                                if(k === 0) {
                                    defaults.billing_start_date = v.billing_start_date;
                                    defaults.billing_end_date = v.billing_end_date;
                                }
                            });

                            callback(null, array_subscriptions);
                        });
                    },*/
                    charges: function(callback) {
                        THIS.transactions_get_charges(from, to, function(data_charges) {
                            var array_charges = [];

                            $.each(data_charges.data, function(k, v) {
                                v.type = 'charges';
                                v.amount = parseFloat(v.amount).toFixed(2);
                                v.created = winkstart.parse_date(v.created, 'short');
                                array_charges.push(v);

                                defaults.amount += parseFloat(v.amount);
                            });

                            callback(null, array_charges);
                        });
                    }
                },
                function(err, results) {
                    var render_data = defaults;

                    render_data.amount = parseFloat(render_data.amount).toFixed(2);

                    //render_data.list_transactions = ((results.charges).concat((results.subscriptions))).concat(results.monthly);
                    render_data.list_transactions = (results.charges).concat(results.monthly);

                    callback(render_data);
                }
            );
        },

        render: function() {
            var THIS = this,
                range = 90,
                now = new Date(),
                to = winkstart.date_to_gregorian(new Date(now.setDate(now.getDate() + 1))),//parseInt(((new Date()).getTime() / 1000) + 62167219200),
                from = to - (range * 60 * 60 * 24);

            THIS.list_transactions(from, to, function(data) {
                var $transactions_html = THIS.templates.transactions.tmpl(data);

                winkstart.init_range_datepicker(range, $transactions_html);

                $('.list-transactions', $transactions_html).append(THIS.templates.list_transactions(data));
                $('.expandable', $transactions_html).hide();

                $transactions_html.on('click', '.expand-box', function() {
                    var $expandable = $('.expandable', $(this).parents('.transaction').first()),
                        content = !$expandable.is(':visible') ? '-' : '+';

                    $('.expand', $(this)).html(content);
                    $expandable.slideToggle('fast');
                });

                $('#filter_transactions', $transactions_html).on('click', function() {
                    from = winkstart.date_to_gregorian(new Date($('#startDate', $transactions_html).val()));
                    to = winkstart.date_to_gregorian(new Date($('#endDate', $transactions_html).val()));

                    THIS.list_transactions(from, to, function(data) {
                        var $list_transactions = $('.list-transactions', $transactions_html).empty();

                        $list_transactions.append(THIS.templates.list_transactions(data));

                        $('.expandable', $transactions_html).hide();

                        $('.billing-date.start', $transactions_html).html(data.billing_start_date);
                        $('.billing-date.end', $transactions_html).html(data.billing_end_date);
                        $('.total-amount', $transactions_html).html(data.amount);
                    });

                });

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
