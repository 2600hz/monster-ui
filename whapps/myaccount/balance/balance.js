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
            'transactions.get': {
                url: '{api_url}/accounts/{account_id}/transactions',
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

        transactions_get: function(success, error) {
            var THIS = this;

            winkstart.request('transactions.get', {
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
                    'sTitle': 'test',
                },
                {
                    'sTitle': 'Name'
                },
                {
                    'sTitle': 'Endpoint Type',
                },
                {
                    'sTitle': 'bulk_id'
                },
            ];

            winkstart.table.create('transactions', $('#transactions_grid', transactions_html), columns, {}, {
                sDom: '<"date">frtlip',
                aaSorting: [[7, 'desc']]
            });

            $('.cancel-search', transactions_html).click(function(){
                $('#registration-grid_filter input[type=text]', transactions_html).val('');
                winkstart.table.bulk.fnFilter('');
            });
        },

        render: function() {
            var THIS = this;

            THIS.transactions_get(function(_data_transactions) {
                THIS.balance_get(function(data) {
                    var $balance_html = THIS.templates.balance.tmpl({
                        amount: parseFloat(data.data.amount).toFixed(2),
                        minutes_used: 12,
                        call_charges: 45.55
                    });

                    $('#add_credits', $balance_html).on('click', function() {
                        THIS.render_add_credits_dialog($balance_html, function(amount) {
                            winkstart.publish('myaccount.update_menu', THIS.__module, '$ ' + parseFloat(amount).toFixed(0));
                            $('#amount', $balance_html).html(parseFloat(amount).toFixed(2));
                        });
                    });

                    winkstart.publish('myaccount.render_submodule', $balance_html);

                    var tab_data = [
                        ["nyw2cx3352","y7x79je2qu","yas72p3cgr","y5u6h7k8b5"],
                        ["w2jy2nuhj8","k6bxastj42","k98qs5m4nc","dmmpf5ham7"],
                        ["xdzutg5x5m","as5q3pw98p","6bwwk6cg6q","fgdh9bcdyr"],
                        ["wy86mdyzwe","3hhcx4fdxq","mpdgezftcw","hx73nnkyfx"],
                        ["94n27mb6kn","vxfy6q8mbw","udzgyzxw84","5sx3m7esqz"],
                        ["chzggfutvs","83bpkd665d","d3233gq8r7","n6w73cfkv5"],
                        ["vypweqx243","z2vr859rgu","66tc4s7bst","z3zpqzejgc"],
                        ["xdeeuxepv3","sfjhvmk38q","sj356auu9e","hgk95wgq9q"],
                        ["n3twwa4gfe","ravb9ppc5z","m9prnwh87b","fspn77ewnh"],
                        ["s6phbzemx5","gpc9pmvfsa","hycfh4vmbe","vykt6qygye"],
                        ["vbac6wc7n3","d5u7vtdj53","9yxz4teycj","gpb56rj4xu"],
                        ["u3na3bdn3m","7purmm4n3w","7y9bwg54ug","czurp8g55f"],
                        ["m6xmbwhenw","ntruarvkwm","sa7bx4g94x","nuhkt9rwe7"],
                        ["3nh6v6hmkm","g334j2subd","4ptf453f72","u36dp6zu3c"],
                        ["qsyya5bkbt","jqkmjn5k72","b8wkgp4pkj","5kcjnn4jph"],
                        ["rj8yfuesq2","nw65j99pbf","jas2n9dpn8","vmyzg7pd5n"],
                        ["e6tv3ard5b","5ecz6jft4r","5k26ztvwuf","57nh457t72"],
                        ["g5qeu7xddj","rgwwppxfv9","ssxec9nus5","86u7q2tbyr"],
                        ["4u6rggxtwu","2kkh8hqwtw","72v9kaxvgz","6qqap2ynjb"],
                        ["f9v9t7gcfm","76sw62te3s","dmu6nmhasb","kk3cenzsv7"],
                        ["7hum7dveke","nqg9w6jpqt","gfw62eudbe","3ky9r3z4as"],
                        ["52tv4beur2","6fp28v4r9p","6z4qp9j37c","v84akyvkh4"],
                        ["t6ake9v774","2caz34nh4r","vgeab2x2rh","ty9tqx2qmh"],
                        ["ynzy24dgb6","g8e3b4np2a","qzz2agpkqp","wk6ec24jtz"],
                        ["n425a4u7h6","zfk58z3hkr","uphbz36meh","z5vv4m24vg"],
                        ["mjmct5w878","hymk5eqdmr","ms9dpn43d7","ehz86uaf65"],
                        ["n9t8p7jexu","gyeccvuyuz","n4d29xc5ha","68s5yk3wwr"],
                        ["tgt8gtmjmy","u86dctzkt6","58y7k2vyjt","a7z4xvh7b4"],
                        ["wyb9ectntq","jbe4f7ex34","yrfr4kk6ey","8wfy6vvmks"],
                        ["wpxja9mkpy","gu3xz96kfp","vek84s46gc","gbsxmcewwr"],
                        ["xudrcngvte","t9736tq3ak","7pc9cfzdrr","778watg579"],
                        ["56g3bnkkvy","6dw639zfq7","y3kynwnfjy","sh726y2u2m"],
                        ["dm89fp35dk","h2pnqa4nau","zhcun4qzk4","zdc9nazp2e"],
                        ["v3c99gbagc","fgdhw2j3yd","gfgc7bgzpa","r5s6pqj6sd"],
                        ["vjswu9mkjh","njf5dmcxmw","b8cue32f9y","ac85unapwm"],
                        ["b9ncur2vqm","pzsarwwuzn","6z274qsqdw","bs2vcxyf2u"],
                        ["r7guxv86jn","3xykpvp62w","dzvadtj76r","hkh4chqwgq"],
                        ["6d4rxy3h9g","srduqhpa4a","gscbdpy7kt","qu4ax3g7bq"],
                        ["pv3gugqm6u","gpdzvfdydp","s72hy47h3a","x77zh85mpe"],
                        ["qwyrwxqqgn","depw9u46ac","bpdpfkbps6","mspqfun4vt"],
                        ["eavgfhrvw3","v5jxuxzact","ffaq3ef4sh","43knp8rvkn"],
                        ["ufb9cj2cms","gumbyfvh92","9zjd6kmnvw","yn3tp6g7s9"],
                        ["by8n5kjzpf","cxh6mpsssj","9u364xma55","35cqt78xtn"],
                        ["nf8tzc36v5","xjtgq8ydun","7w8ehj5btq","y7gu7dgzb6"],
                        ["w3ef2tqk99","nnz8j5pr6t","w8hr27rn74","97gc62wv84"],
                        ["v4tu93sarq","rmca9hp7w6","a4t4rytvbv","g9fdmc78gy"],
                        ["hkcfrvk7ec","25usbn2cdh","qjq2vr47wy","ua7x9ht428"],
                        ["v9nbqrt6zs","4tvr9ttzv4","3tjttyykph","4mpvrmwujm"]
                    ];

                    THIS.init_table($balance_html);
                    $.fn.dataTableExt.afnFiltering.pop();

                    winkstart.table.transactions.fnAddData(tab_data);
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

                    winkstart.publish('myaccount.update_menu', THIS.__module, '$ ' + parseFloat(amount).toFixed(0));

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
                    'amount': data.data.amount.toFixed(0) || '0'
                });

                winkstart.publish('myaccount.add_submodule', $balance_menu_html, 30, 'billing_category');
            });
        }
    }
);
