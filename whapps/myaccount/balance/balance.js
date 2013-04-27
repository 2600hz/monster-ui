winkstart.module('myaccount', 'balance', {
        css: [
           'css/balance.css'
        ],

        templates: {
            menu: 'tmpl/menu.handlebars',
            balance: 'tmpl/balance.handlebars',
            table_action_bar: 'tmpl/table_action_bar.handlebars',
            add_credits_dialog: 'tmpl/add_credits.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.balance.render': 'render',
            'myaccount.balance.add_credits_dialog': 'render_add_credits_dialog'
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
            'filtered_transactions.get': {
                url: '{api_url}/accounts/{account_id}/transactions?created_from={from}&created_to={to}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'transactions.get_accounts': {
                url: '{api_url}/accounts/{account_id}/descendants',
                contentType: 'application/json',
                verb: 'GET'
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        transactions_range: 30,

        get_accounts: function(success, error) {
            var THIS = this;

            winkstart.request('transactions.get_accounts', {
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

        transactions_get: function(params, success, error) {
            var THIS = this;

            if(typeof params === 'function') {
                success = params;
                error = success;

                var tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);

                var params = {};
                params.to = Math.floor(tomorrow.getTime()/1000) + 62167219200;
                params.from = params.to - (THIS.transactions_range*24*60*60);
            }

            winkstart.request('filtered_transactions.get', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    from: params.from,
                    to: params.to
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

        init_table: function(parent) {
            var transactions_html = parent,
                columns = [
                {
                    'sTitle': 'timestamp',
                    'bVisible': false
                },
                {
                    'sTitle': 'call_id',
                    'bVisible': false
                },
                {
                    'sTitle': i18n.t('myaccount.balance.direction_column'),
                    'fnRender': function(obj) {
                        var icon = '<i class="icon-arrow-right icon-orange popup-marker" data-placement="right" data-original-title="Call ID" data-content="'+obj.aData[obj.iDataColumn].call_id+'"></i>';
                        if(obj.aData[obj.iDataColumn].direction === 'inbound') {
                            icon = '<i class="icon-arrow-left icon-green popup-marker" data-placement="right" data-original-title="Call ID" data-content="'+obj.aData[obj.iDataColumn].call_id+'"></i>'
                        }
                        return icon;
                    },
                    'sWidth': '5%'

                },
                {
                    'sTitle': i18n.t('myaccount.balance.date_column'),
                    'sWidth': '20%'

                },
                {
                    'sTitle': i18n.t('myaccount.balance.from_column'),
                    'sWidth': '20%'
                },
                {
                    'sTitle': i18n.t('myaccount.balance.to_column'),
                    'sWidth': '20%'
                },
                {
                    'sTitle': i18n.t('myaccount.balance.account_column'),
                    'sWidth': '25%'
                },
                {
                    'sTitle': i18n.t('myaccount.balance.duration_column'),
                    'sWidth': '5%'

                },
                {
                    'sTitle': i18n.t('myaccount.balance.amount_column'),
                    'sWidth': '5%'
                }
            ];

            winkstart.table.create('transactions', $('#transactions_grid', transactions_html), columns, {}, {
                sDom: '<"table-custom-actions">frtlip',
                aaSorting: [[0, 'desc']]
            });

            $('.cancel-search', transactions_html).click(function(){
                $('#registration-grid_filter input[type=text]', transactions_html).val('');
                winkstart.table.bulk.fnFilter('');
            });
        },

        refresh_transactions_table: function(parent, from_timestamp, to_timestamp, map_accounts) {
            var THIS = this,
                params = {
                    from: from_timestamp,
                    to: to_timestamp,
                };

            THIS.transactions_get(params, function(_data_transactions) {
                var data = THIS.transactions_to_table_data(_data_transactions.data, map_accounts);

                winkstart.table.transactions.fnAddData(data.tab_data);

                $('#call_charges', parent).html(data.total_charges.toFixed(2));
                $('#minutes_used', parent).html(data.total_minutes);
            });
        },

        transactions_to_table_data: function(data_request, map_accounts) {
            var data = {
                tab_data: [],
                total_minutes: 0,
                total_charges: 0.00
            };

            $.each(data_request, function(k, v) {
                v.metadata = v.metadata || {
                    to: '-',
                    from: '-'
                };

                v.metadata.call = { direction: v.metadata.direction || 'inbound', call_id: v.call_id }

                if(v.reason === 'per_minute_call') {
                    var duration = i18n.t('myaccount.balance.active_call'),
                        friendly_date = winkstart.parse_date(v.created),
                        account_name = '-';

                    if('duration' in v.metadata) {
                        duration = Math.ceil((parseInt(v.metadata.duration))/60),
                        data.total_minutes += duration;
                    }

                    if('account_id' in v.metadata) {
                        account_name = map_accounts[v.metadata.account_id].name;
                    }

                    data.total_charges += v.amount;

                    data.tab_data.push([
                        v.created,
                        v.call_id,
                        v.metadata.call,
                        friendly_date,
                        winkstart.format_phone_number(v.metadata.from),
                        winkstart.format_phone_number(v.metadata.to),
                        account_name,
                        duration,
                        i18n.t('core.layout.currency_used') + v.amount
                    ]);
                }
            });

            return data;
        },

        render: function() {
            var THIS = this,
                defaults = {
                    field_data: {
                        accounts: {}
                    }
                };

            winkstart.parallel({
                    accounts: function(callback) {
                        THIS.get_accounts(function(_data_accounts) {
                            $.each(_data_accounts.data, function(k, v) {
                                defaults.field_data.accounts[v.id] = v;
                            });

                            callback(null, defaults);
                        });
                    },
                    balance: function(callback) {
                        THIS.balance_get(function(data) {
                            defaults.amount = parseFloat(data.data.amount).toFixed(2);

                            callback(null, data)
                        });
                    },
                    transactions: function(callback) {
                        THIS.transactions_get(function(_data_transactions) {
                            callback(null, _data_transactions)
                        });
                    }
                },
                function(err, results) {
                    var render_data = $.extend(true, {}, defaults, THIS.transactions_to_table_data(results.transactions.data, defaults.field_data.accounts)),
                        $balance_html = THIS.templates.balance.tmpl(render_data);

                    $('#add_credits', $balance_html).on('click', function() {
                        THIS.render_add_credits_dialog($balance_html, function(amount) {
                            var new_amount = parseFloat(amount).toFixed(2);
                            winkstart.publish('myaccount.update_menu', THIS.__module, '$ ' + new_amount);
                            $('#amount', $balance_html).html(new_amount);
                        });
                    });

                    winkstart.publish('myaccount.update_menu', THIS.__module, '$ ' + render_data.amount);
                    winkstart.publish('myaccount.render_submodule', $balance_html);

                    THIS.init_table($balance_html);

                    $.fn.dataTableExt.afnFiltering.pop();

                    $('div.table-custom-actions', $balance_html).html(THIS.templates.table_action_bar.tmpl());

                    winkstart.init_range_datepicker(THIS.transactions_range, $balance_html);

                    var start_date = $('#startDate', $balance_html).val(),
                        end_date = $('#endDate', $balance_html).val(),
                        created_from = (new Date(start_date).getTime()/1000) + 62167219200,
                        created_to = (new Date(end_date).getTime()/1000) + 62167219200;

                    $('#filter_transactions', $balance_html).on('click', function() {
                        start_date = $('#startDate', $balance_html).val();
                        end_date = $('#endDate', $balance_html).val();
                        created_from = (new Date(start_date).getTime()/1000) + 62167219200;
                        created_to = (new Date(end_date).getTime()/1000) + 62167219200;

                        /* Bug because of Infinite scrolling... we need to manually remove tr */
                        $('tbody tr', winkstart.table.transactions).remove();
                        winkstart.table.transactions.fnClearTable();

                        THIS.refresh_transactions_table($balance_html, created_from, created_to, defaults.field_data.accounts);
                    });

                    $('#get_csv', $balance_html).on('click', function() {
                        window.location.href = winkstart.apps['myaccount'].api_url+'/accounts/'+winkstart.apps['myaccount'].account_id+'/transactions?created_from='+created_from+'&created_to='+created_to+'&depth=2&identifier=metadata&accept=csv&auth_token=' + winkstart.apps['myaccount'].auth_token;
                    });

                    winkstart.table.transactions.fnAddData(render_data.tab_data);

                    $('.popup-marker', $balance_html).clickover();
                }
            );
        },

        render_add_credits_dialog: function(parent, callback) {
            var THIS = this,
                popup;

            THIS.balance_get(function(data) {
                THIS.limits_get(function(_data_limits) {
                    var amount = data.data.amount.toFixed(2) || '0.00',
                        recharge_default = { enabled: false };

                    _data_limits.data.recharge = $.extend(true, {}, recharge_default, _data_limits.data.recharge);

                    var $popup_html = THIS.templates.add_credits_dialog.tmpl({
                            amount: amount,
                            limits: _data_limits.data
                        }),
                        state_switch = 'manual',
                        auto_recharge = 'recharge' in _data_limits.data ? _data_limits.data.recharge.enabled || false : false;

                    winkstart.publish('myaccount.update_menu', THIS.__module, '$ ' + parseFloat(amount).toFixed(2));

                    $('.switch', $popup_html).bootstrapSwitch()
                                             .on('switch-change', function (e, data) {
                        if(state_switch === 'manual') {
                            state_switch = 'event';
                        }
                        else {
                            if(data.value === true) {
                                $('#recharge_content', $popup_html).slideDown('fast')
                            }
                            else {
                                $('#recharge_content', $popup_html).slideUp();

                                if(auto_recharge === true) {
                                    winkstart.confirm(i18n.t('myaccount.balance.turnoff_recharge_confirm'),
                                        function() {
                                            THIS.limits_get(function(_data_limits) {
                                                _data_limits.data.recharge = { enabled: false };

                                                THIS.limits_update(_data_limits.data, function() {
                                                    auto_recharge = 'recharge' in _data_limits.data ? _data_limits.data.recharge.enabled || false : false;
                                                    toastr.success(i18n.t('myaccount.balance.auto_recharge_cancelled'));
                                                });
                                            });
                                        },
                                        function() {
                                            $('#recharge_content', $popup_html).slideDown();
                                            state_switch = 'manual';
                                            $('.switch', $popup_html).bootstrapSwitch('setState', true);
                                        }
                                    );
                                }
                            }
                        }
                    }).bootstrapSwitch('setState', auto_recharge);

                    $('.icon-question-sign[data-toggle="tooltip"]', $popup_html).tooltip();

                    $('.add-credit', $popup_html).on('click', function(ev) {
                        ev.preventDefault();

                        var credits_to_add = parseFloat($('#amount', $popup_html).val().replace(',','.'));

                        if(credits_to_add) {
                            winkstart.confirm(i18n.t('core.layout.charge_reminder_line1') + '<br/><br/>' + i18n.t('core.layout.charge_reminder_line2'),
                                function() {
                                    THIS.balance_add(credits_to_add,
                                        function() {
                                            toastr.success(i18n.t('myaccount.balance.credits_added', {variable: i18n.t('core.layout.currency_used') + credits_to_add}));

                                            if(typeof callback === 'function') {
                                                THIS.balance_get(function(data) {
                                                    callback(data.data.amount);
                                                    popup.dialog('close');
                                                });
                                            }
                                            else {
                                                popup.dialog('close');
                                            }
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

                    $('#confirm_recharge', $popup_html).on('click', function() {
                        var data_form = {
                            enabled: true,
                            threshold: parseFloat($('#threshold_recharge', $popup_html).val()),
                            amount: parseFloat($('#recharge_amount', $popup_html).val())
                        };

                        if(data_form.threshold && data_form.amount) {
                            THIS.limits_get(function(_data_limits) {
                                _data_limits.data.recharge = data_form;

                                THIS.limits_update(_data_limits.data, function() {
                                    toastr.success(i18n.t('myaccount.balance.auto_recharge_enabled'));
                                });
                            });
                        }
                        else{
                            winkstart.alert(i18n.t('myaccount.balance.invalid_amount'));
                        }
                    });

                    popup = winkstart.dialog($popup_html, {
                        width: '600px',
                        title: i18n.t('myaccount.balance.add_credit_dialog_title')
                    });
                });
            });
        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this;

            THIS.balance_get(function(data) {
                var $balance_menu_html = THIS.templates.menu.tmpl({
                    'amount': data.data.amount.toFixed(2) || '0.00'
                });

                winkstart.publish('myaccount.add_submodule', $balance_menu_html, 30, 'billing_category');
            });
        }
    }
);
