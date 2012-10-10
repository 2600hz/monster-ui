winkstart.module('myaccount', 'credits', {
        css: [
            'css/credits.css'
        ],

        subscribe: {
            'nav.activate': 'nav_activate'
        },

        templates: {
            credits: 'tmpl/credits.html',
            stat_credits: 'tmpl/stat_credits.html'
        },

        resources: {
            'myaccount_credits.get_user': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'myaccount_credits.update': {
                url: '{api_url}/accounts/{account_id}/{billing_provider}/credits',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'myaccount_credits.get_no_loading': {
                url: '{api_url}/accounts/{account_id}/{billing_provider}/credits',
                contentType: 'application/json',
                trigger_events: false,
                verb: 'GET'
            },
            'myaccount_credits.get': {
                url: '{api_url}/accounts/{account_id}/{billing_provider}/credits',
                contentType: 'application/json',
                verb: 'GET'
            },
            'myaccount_limits.get': {
                url: '{api_url}/accounts/{account_id}/limits',
                contentType: 'application/json',
                verb: 'GET'
            },
            'myaccount_limits.update': {
                url: '{api_url}/accounts/{account_id}/limits',
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
        nav_activate: function() {
            var THIS = this;

            winkstart.request('myaccount_credits.get_user', {
                    api_url: winkstart.apps['myaccount'].api_url,
                    account_id: winkstart.apps['myaccount'].account_id,
                    user_id: winkstart.apps['myaccount'].user_id
                },
                function(_data, status) {
                    if(!_data.data.priv_level || _data.data.priv_level === 'admin') {
                        winkstart.publish('statistics.add_stat', THIS.define_stats());
                    }
                }
            );
        },

        get_credits: function(success, error) {
            var THIS = this;

            winkstart.request('myaccount_credits.get', {
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

        get_credits_no_loading: function(success, error) {
            var THIS = this;

            winkstart.request('myaccount_credits.get_no_loading', {
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

        add_credits: function(credits, success, error) {
            var THIS = this;

            winkstart.request('myaccount_credits.update', {
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
                winkstart.error_message.process_error()
            );
        },

        get_limits: function(success, error) {
            var THIS = this;

            winkstart.request('myaccount_limits.get', {
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

        update_limits: function(limits, success, error) {
            var THIS = this;

            winkstart.request('myaccount_limits.update', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    data: limits
                },
                function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                winkstart.error_message.process_error()
            );
        },

        render_credits_dialog: function(data) {
            var THIS = this,
                data_tmpl = {
                    credits: data.credits.amount,
                    limits: data.limits,
                    extra: {
                        inbound_trunks_price: winkstart.config.inbound_trunks_price || '$6.99',
                        twoway_trunks_price: winkstart.config.twoway_trunks_price || '$29.99'
                    }
                },
                credits_html = THIS.templates.credits.tmpl(data_tmpl),
                popup;

            $('ul.settings1 > li', credits_html).click(function(item) {
                $('.pane_content', credits_html).hide();

                $('ul.settings1 > li', credits_html).removeClass('current');

                var tab_id = $(this).attr('id');

                if(tab_id  === 'flat_rate_link') {
                    $('#flat_rate', credits_html).show();
                }
                else if(tab_id === 'per_minute_link') {
                    $('#per_minute', credits_html).show();
                }

                $(this).addClass('current');
            });

            $('.purchase_credits', credits_html).click(function(ev) {
                ev.preventDefault();
                winkstart.confirm('Your on-file credit card will immediately be charged for any changes you make. If you have changed any recurring services, new charges will be pro-rated for your billing cycle.<br/><br/>Are you sure you want to continue?',
                    function() {
                        var credits_to_add = parseFloat($('#add_credits', credits_html).val().replace(',','.'));

                        THIS.add_credits(credits_to_add, function() {
                            $('.current_balance', credits_html).html((parseFloat($('.current_balance', credits_html).html()) + credits_to_add).toFixed(2));

                            winkstart.publish('statistics.update_stat', 'credits');
                        });
                    }
                );
            });

            $('.submit_channels', credits_html).click(function(ev) {
                ev.preventDefault();

                winkstart.confirm('Your on-file credit card will immediately be charged for any changes you make. If you have changed any recurring services, new charges will be pro-rated for your billing cycle.<br/><br/>Are you sure you want to continue?',
                    function() {
                        var limits_data = {
                            twoway_trunks: $('#outbound_calls', credits_html).size() > 0 ? parseInt($('#outbound_calls', credits_html).val() || 0) : -1,
                            inbound_trunks: $('#inbound_calls', credits_html).size() > 0 ? parseInt($('#inbound_calls', credits_html).val() || 0) : -1
                        };

                        limits_data = $.extend({}, data.limits, limits_data);

                        THIS.update_limits(limits_data, function(_data) {
                            popup.dialog('close');

                            winkstart.alert('info', 'Your changes have been saved!');
                        });
                    }
                );
            });

            popup = winkstart.dialog(credits_html, { title: 'Manage your credits and limits.' });
        },

        define_stats: function() {
            var THIS = this;

            var stats = {
                'credits': {
                    number: 'loading',
                    color: 'green',
                    get_stat: function(callback) {
                        THIS.get_credits_no_loading(
                            function(_data, status) {
                                var stat_attributes = {
                                    number: _data.data.amount,
                                    color: _data.data.amount < 1 ? 'red' : (_data.data.amount > 10 ? 'green' : 'orange')
                                };

                                if(typeof callback === 'function') {
                                    callback(stat_attributes);
                                }
                            },
                            function(_data, status) {
                                callback({error: true});
                            }
                        );
                    },
                    click_handler: function() {
                        THIS.get_limits(function(_data_limits, status) {
                            THIS.get_credits(function(_data, status) {
                                THIS.render_credits_dialog({limits: _data_limits.data, credits: _data.data});
                            });
                        });
                    },
                    container: function(stat) {
                        return THIS.templates.stat_credits.tmpl(stat);
                    },
                    update_container: function(html) {
                        $('#credits_label', html).removeClass('green orange red')
                                                 .addClass(this.color)
                                                 .html('$ '+ this.number.toFixed(2));
                    }
                }
            };

            return stats;
        }
    }
);
