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
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        limits_get: function(success, error) {
            var THIS = this;

            winkstart.request('limits.get', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
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

        limits_update: function(limits, success, error) {
            var THIS = this;

                console.log('update');

            winkstart.request('limits.update', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    data: limits
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

        update_recharge: function(data, success, error) {
            var THIS = this;

            winkstart.request('balance.update', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    billing_provider: winkstart.apps['myaccount'].billing_provider,
                    data: data
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

            THIS.balance_get(function(data) {
                THIS.limits_get(function(_data_limits) {
                    console.log(_data_limits);
                    var amount = data.data.amount.toFixed(2) || '0.00',
                        $balance_html = THIS.templates.balance.tmpl({
                            amount: amount,
                            limits: _data_limits.data
                        }),
                        state_switch = 'manual';

                    winkstart.publish('myaccount.update_menu', THIS.__module, parseFloat(amount).toFixed(0));

                    $('.switch', $balance_html).bootstrapSwitch()
                                               .on('switch-change', function (e, data) {
                        if(state_switch === 'manual') {
                            state_switch = 'event';
                        }
                        else {
                            if(data.value === true) {
                                $('#recharge_content', $balance_html).slideDown('fast')
                            }
                            else {
                                $('#recharge_content', $balance_html).slideUp();

                                //TODO only if it wasnt like this before
                                winkstart.confirm(i18n.t('myaccount.balance.turnoff_recharge_confirm'),
                                    function() {
                                        THIS.limits_get(function(_data_limits) {
                                            _data_limits.data.auto_recharge = false;
                                            delete _data_limits.data.threshold_recharge;
                                            delete _data_limits.data.recharge_amount;

                                            THIS.limits_update(_data_limits.data, function() {
                                                toastr.success('Auto recharge cancelled');
                                            });
                                        });
                                    },
                                    function() {
                                        $('#recharge_content', $balance_html).slideDown();
                                        state_switch = 'manual';
                                        $('.switch', $balance_html).bootstrapSwitch('setState', true);
                                    }
                                );
                            }
                        }
                    }).bootstrapSwitch('setState', _data_limits.data.auto_recharge || false);

//                    $('.switch', $balance_html).bootstrapSwitch('setState', _data_limits.data.auto_recharge || false);

                    $('.icon-question-sign[data-toggle="tooltip"]', $balance_html).tooltip();

                    $('.add-credit', $balance_html).on('click', function(ev) {
                        ev.preventDefault();

                        var credits_to_add = parseFloat($('#amount', $balance_html).val().replace(',','.'));

                        if(credits_to_add) {
                            winkstart.confirm(i18n.t('core.layout.charge_reminder_line1') + '<br/><br/>' + i18n.t('core.layout.charge_reminder_line2'),
                                function() {

                                    THIS.balance_add(credits_to_add,
                                        function() {
                                            var amount = (parseFloat($('#amount', $balance_html).val()) + credits_to_add).toFixed(2);
                                            winkstart.publish('myaccount.update_menu', THIS.__module, amount.toFixed(0));
                                            winkstart.publish('myaccount.balance.render');
                                            //TODO toastr saved
                                        },
                                        winkstart.error_message.process_error()
                                    );
                                }
                            );
                        }
                        else{
                            winkstart.alert(i18n.t('myaccount.balance.invalid_amount'));
                        }
                    });

                    $('#confirm_recharge', $balance_html).on('click', function() {
                        var data_form = {
                            auto_recharge: true,
                            threshold_recharge: parseFloat($('#threshold_recharge', $balance_html).val()),
                            recharge_amount: parseFloat($('#recharge_amount', $balance_html).val())
                        };

                        if(data_form.threshold_recharge && data_form.recharge_amount) {
                            THIS.limits_get(function(_data_limits) {
                                console.log(_data_limits);
                                var data_limits = $.extend(true, _data_limits.data, data_form);

                                THIS.limits_update(data_limits, function() {
                                    console.log(data_limits);
                                    toastr.success('limits updated!');
                                });
                            });
                        }
                        else{
                            winkstart.alert(i18n.t('myaccount.balance.invalid_amount'));
                        }
                    });

                    winkstart.publish('myaccount.render_submodule', $balance_html);
                });
            });
        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this;

            THIS.balance_get(function(data) {
                var $balance_menu_html = THIS.templates.menu.tmpl({
                    'amount': data.data.amount.toFixed(0) || '0'
                });

                winkstart.publish('myaccount.add_submodule', $balance_menu_html, 20, 'billing_category');
            });
        }
    }
);
