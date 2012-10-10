winkstart.module('myaccount', 'billing', {
        css: [
            'css/billing.css'
        ],

        templates: {
            billing: 'tmpl/billing.html'
        },

        subscribe: {
            'myaccount.nav.post_loaded': 'myaccount_loaded',
            'billing.popup': 'popup',
            'billing.ext_link': 'ext_link'
        },

        resources: {
            'past_purchases.get': {
                url: '{api_url}/accounts/{account_id}/braintree/transactions',
                contentType: 'application/json',
                verb: 'GET'
            },
            'past_purchases.list_accounts': {
                url: '{api_url}/accounts/{account_id}/descendants',
                contentType: 'application/json',
                verb: 'GET'
            },
            'billing.user_get': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'billing.user_update': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'billing.update': {
                url: '{api_url}/accounts/{account_id}/braintree/customer',
                contentType: 'application/json',
                verb: 'POST'
            },
            'billing.get': {
                url: '{api_url}/accounts/{account_id}/braintree/customer',
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
        addons: {},

        update_acct: function(data, new_data, success, error) {
            winkstart.request('billing.user_update', {
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

        list_accounts: function(success, error) {
            winkstart.request('past_purchases.list_accounts', {
                    api_url: winkstart.apps['myaccount'].api_url,
                    account_id: winkstart.apps['myaccount'].account_id
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

        myaccount_loaded: function(user_data) {
            if(winkstart.config.display_billing || (!user_data.priv_level || user_data.priv_level === 'admin')){
                winkstart.publish('nav.add_sublink', {
                    link: 'nav',
                    sublink: 'billing',
                    label: 'Billing',
                    weight: '15',
                    publish: (winkstart.config.nav.billing) ? 'billing.ext_link' : 'billing.popup'
                });
            }
        },

        ext_link: function() {
            window.open(winkstart.config.nav.billing);
        },

        render_billing: function(data, target) {
            var THIS = this,
                billing_html = THIS.templates.billing.tmpl(data);

            $('#save-billing', billing_html).click(function(ev) {
                ev.preventDefault();

                var form_data = form2object('billing-form');

                THIS.clean_billing_form_data(form_data);

                THIS.update_billing({}, form_data, function(_data) {
                        THIS.render_billing(_data, target);

                        winkstart.alert('info', 'Credit card updated!');
                    },
                    function(_data, status) {
                        if(status == 400 && _data.message) {
                            winkstart.alert('error', 'The following errors occurred:<br/><br/>' + _data.message.replace(/\./g, '<br/>'));
                        }
                        else {
                            winkstart.alert('error', 'There was an unspecified server error, please try again later.');
                        }
                    }
                );
            });

            $('#edit-billing', billing_html).click(function(ev) {
                ev.preventDefault();

                var arr = ['company', 'phone', 'postal_code', 'firstname', 'lastname']
                    billing_form_html = $('#billing-form');


                    billing_form_html
                        .find('input')
                        .each(function() {
                            var $this = $(this);

                            if($.inArray(this.id, arr) == -1 ) {
                                $this
                                    .val('')
                                    .empty();
                            }
                            $this
                                .removeClass("hide");
                        });

                billing_form_html
                    .find('.uneditable-input')
                    .each(function() {
                        $(this).remove();
                    });

                $('#save-billing', billing_html)
                    .removeClass("disabled")
                    .removeAttr("disabled");
            });


            $('#cardnbr', billing_html).change(function(){
                var re = new RegExp("^4"),
                    number = $(this).val();

                $('.card').css('opacity', 0.2);

                if (number.match(re) != null) {
                    $('#visa', billing_html).css('opacity', 1);
                }

                re = new RegExp("^(34|37)");
                if (number.match(re) != null){
                    $('#amex', billing_html).css('opacity', 1);
                }

                re = new RegExp("^5[1-5]");
                if (number.match(re) != null){
                    $('#mastercard', billing_html).css('opacity', 1);
                }
            });

            THIS.setup_transactions(billing_html);
            THIS.setup_subscriptions(data.past_purchases, billing_html);

            THIS.list_payments(data.past_purchases, billing_html);

            (target)
                .empty()
                .append(billing_html);
        },

        popup: function() {
            var THIS = this,
                popup_html = $('<div class="inline_popup billing"><div class="inline_content main_content"/></div>');

            winkstart.request('billing.get', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url
                },
                function(data, status) {
                    var defaults = {
                        data: {
                            credit_cards: [{
                                billing_address: {}
                            }]
                        }
                    };

                    winkstart.request('past_purchases.get', {
                            account_id: winkstart.apps['myaccount'].account_id,
                            api_url: winkstart.apps['myaccount'].api_url
                        },
                        function(data_pp, status) {
                            data.past_purchases = data_pp;
                            THIS.render_billing(data, $('.inline_content', popup_html));

                            winkstart.dialog(popup_html, {
                                modal: true,
                                title: 'Billing',
                                position: 'top',
                                width: '1000px'
                            });
                        }
                    );
                }
            );

        },

        setup_transactions: function(parent) {
            var THIS = this,
                columns = [
                {
                    'sTitle': 'Date'
                },
                {
                    'sTitle': 'Status'
                },
                {
                    'sTitle': 'Amount ($)'
                }
            ];

            winkstart.table.create('transactions', $('#transactions-grid', parent), columns, {}, {
                sDom: 'frtlip',
                aaSorting: [[0, 'desc']]
            });

            $('#transactions-grid_filter input[type=text]', parent).first().focus();

            $('.cancel-search', parent).click(function(){
                $('#transactions-grid_filter input[type=text]', parent).val('');
                winkstart.table.transactions.fnFilter('');
            });
        },

        setup_subscriptions: function(data, parent) {
            var THIS = this,
                columns = [
                    {
                        'sTitle': 'Date',
                        'sWidth': '10%'
                    },
                    {
                        'sTitle': 'Subscription',
                        'sWidth': '20%'
                    },
                    {
                        'sTitle': 'Status',
                        'sWidth': '10%'
                    }
                ],
                array_addons = [];

            /* We need to check the number of add-ons to display first */
            $.each(data.data, function() {
                $.each(this.add_ons, function(k ,v) {
                    if(array_addons.indexOf(v.id) < 0) {
                        array_addons.push(v.id);
                    }
                });
            });

            THIS.addons = array_addons;

            var column_width = (40 / array_addons.length) + '%';
            $.each(array_addons, function(k, v) {
                columns.push({'sTitle': v, 'sWidth': column_width });
            });

            columns.push({'sTitle': 'Discount ($)', 'sWidth': '10%'},{ 'sTitle': 'Amount ($)', 'sWidth': '10%' });

            winkstart.table.create('subscriptions', $('#subscriptions-grid', parent), columns, {}, {
                sDom: 'frtlip',
                aaSorting: [[0, 'desc']],
                bAutoWidth: false
            });

            $('#subscriptions-grid_filter input[type=text]', parent).first().focus();

            $('.cancel-search', parent).click(function(){
                $('#subscriptions-grid_filter input[type=text]', parent).val('');
                winkstart.table.subscriptions.fnFilter('');
            });
        },

        list_payments: function(data, parent) {
            var THIS = this,
                tab_transactions = [],
                tab_subscriptions = [],
                payment,
                account_name;

            THIS.list_accounts(function(_data_accounts) {
                var map_accounts = {};


                $.each(_data_accounts.data, function(k, v) {
                    map_accounts[v.id] = v;
                });

                $.each(data.data, function(k, v) {
                    v.created_at = v.created_at.replace(/-/g,'/').replace('T', ' - ').replace('Z', '');
                    v.created_at = v.created_at.substring(0, v.created_at.length - 11);

                    if(v.subscription_id) {
                        var account_id = v.subscription_id.split('_')[0];
                        account_name = account_id.length === 32 ? map_accounts[v.subscription_id.split('_')[0]].name : 'Account not found';
                        payment = [v.created_at, account_name, v.status];

                        $.each(THIS.addons, function() {
                            payment.push('0');
                        });

                        if(v.add_ons) {
                            $.each(v.add_ons, function(index_addon, addon) {
                                var indexof = THIS.addons.indexOf(addon.id);
                                if(indexof >= 0) {
                                    indexof += 3; //List of Add-ons start at column 3
                                    payment[indexof] = addon.quantity;
                                }
                            });
                        }

                        var total_discount = 0;
                        if(v.discounts) {
                            $.each(v.discounts, function(index_discount, discount) {
                                total_discount += (discount.quantity * discount.amount);
                            });
                        }

                        payment.push(total_discount.toFixed(2), v.amount);
                        tab_subscriptions.push(payment);
                    }
                    else {
                        payment = [v.created_at, v.status, v.amount];

                        tab_transactions.push(payment);
                    }
                });

                winkstart.table.transactions.fnClearTable();
                winkstart.table.subscriptions.fnClearTable();

                winkstart.table.transactions.fnAddData(tab_transactions);
                winkstart.table.subscriptions.fnAddData(tab_subscriptions);
            });
        },

        clean_billing_form_data: function(form_data) {
            if(form_data.credit_card.number.indexOf('*') != -1) {
                delete form_data.credit_card.number;
            }

            if(form_data.credit_card.cvv == '') {
                delete form_data.credit_card.cvv;
            }

            form_data.credit_card.expiration_date = form_data.credit_card.expiration_date.month + '/' + form_data.credit_card.expiration_date.year;

            return form_data;
        }
    }
);
