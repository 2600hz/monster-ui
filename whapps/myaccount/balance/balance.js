winkstart.module('myaccount', 'balance', {
        css: [
           'css/balance.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           balance: 'tmpl/balance.handlebars',
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
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        transactions_range: 30,

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
                        var icon = '<i class="icon-arrow-right icon-orange"></i>';
                        if(obj.aData[obj.iDataColumn] === 'inbound') {
                            icon = '<i class="icon-arrow-left icon-green"></i>'
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

        refresh_transactions_table: function(parent, from_timestamp, to_timestamp) {
            var THIS = this,
                params = {
                    from: from_timestamp,
                    to: to_timestamp,
                };

            THIS.transactions_get(params, function(_data_transactions) {
                var data = THIS.transactions_to_table_data(_data_transactions.data);

                winkstart.table.transactions.fnAddData(data.tab_data);

                $('#call_charges', parent).html(data.total_charges.toFixed(2));
                $('#minutes_used', parent).html(data.total_minutes);
            });
        },

        transactions_to_table_data: function(data_request) {
            var data = {
                tab_data: [],
                total_minutes: 0,
                total_charges: 0.00
            };

            $.each(data_request, function(k, v) {
                v.metadata = v.metadata || {
                    to: '-',
                    from: '-',
                    account_id: '1234',
                    direction: 'inbound'
                };

                if(v.reason === 'per_minute_call') {
                    var duration = i18n.t('myaccount.balance.active_call'),
                        friendly_date = winkstart.parse_date(v.created);

                    if('end' in v) {
                        console.log(v.end, v.created, v.end - v.created);
                        duration = Math.ceil((v.end - v.created)/60),
                        data.total_minutes += duration;
                    }

                    data.total_charges += v.amount;

                    data.tab_data.push([
                        v.created,
                        v.call_id,
                        v.metadata.direction,
                        friendly_date,
                        winkstart.format_phone_number(v.metadata.from),
                        winkstart.format_phone_number(v.metadata.to),
                        v.metadata.account_id,
                        duration,
                        i18n.t('core.layout.currency_used') + v.amount
                    ]);
                }
            });

            return data;
        },

        render: function() {
            var THIS = this;

            THIS.transactions_get(function(_data_transactions) {
                THIS.balance_get(function(data) {
                    var data_table = THIS.transactions_to_table_data(_data_transactions.data),
                        parsed_amount = parseFloat(data.data.amount).toFixed(2),
                        $balance_html = THIS.templates.balance.tmpl({
                            amount: parsed_amount,
                            minutes_used: data_table.total_minutes,
                            call_charges: data_table.total_charges.toFixed(2)
                        });

                    winkstart.publish('myaccount.update_menu', THIS.__module, '$ ' + parsed_amount);

                    $('#add_credits', $balance_html).on('click', function() {
                        THIS.render_add_credits_dialog($balance_html, function(amount) {
                            var new_amount = parseFloat(amount).toFixed(2);
                            winkstart.publish('myaccount.update_menu', THIS.__module, '$ ' + new_amount);
                            $('#amount', $balance_html).html(new_amount);
                        });
                    });

                    winkstart.publish('myaccount.render_submodule', $balance_html);

                    THIS.init_table($balance_html);

                    $.fn.dataTableExt.afnFiltering.pop();

                    $('div.table-custom-actions', $balance_html).html(i18n.t('myaccount.balance.start_date') + ': <input id="startDate" readonly="readonly" type="text"/>&nbsp;&nbsp;'+i18n.t('myaccount.balance.end_date')+': <input id="endDate" readonly="readonly" type="text"/>&nbsp;&nbsp;<button class="btn btn-primary button-search" id="filter_transactions">'+i18n.t('myaccount.balance.filter')+'</button>');

                    winkstart.init_range_datepicker(THIS.transactions_range, $balance_html);

                    $('#filter_transactions', $balance_html).on('click', function() {
                        var start_date = $('#startDate', $balance_html).val(),
                            end_date = $('#endDate', $balance_html).val(),
                            regex = /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d$/,
                            start_date_sec = (new Date(start_date).getTime()/1000) + 62167219200,
                            end_date_sec = (new Date(end_date).getTime()/1000) + 62167219200;

                        /* Bug because of Infinite scrolling... we need to manually remove tr */
                        $('tbody tr', winkstart.table.transactions).remove();
                        winkstart.table.transactions.fnClearTable();

                        THIS.refresh_transactions_table($balance_html, start_date_sec, end_date_sec);
                    });

                    winkstart.table.transactions.fnAddData(data_table.tab_data);
                });
            });
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
