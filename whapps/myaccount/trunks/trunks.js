winkstart.module('myaccount', 'trunks', {
        css: [
           'css/trunks.css'
        ],

        templates: {
           menu_inbound: 'tmpl/menu_inbound.handlebars',
           menu_outbound: 'tmpl/menu_outbound.handlebars',
           trunks_inbound: 'tmpl/trunks_inbound.handlebars',
           trunks_outbound: 'tmpl/trunks_outbound.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.trunks_inbound.render': 'render_inbound',
            'myaccount.trunks_outbound.render': 'render_outbound'
        },

        resources: {
            'limits.get': {
                url: '{api_url}/accounts/{account_id}/limits',
                contentType: 'application/json',
                verb: 'GET'
            },
            'limits.update': {
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

        render_inbound: function() {
            var THIS = this;

            THIS.limits_get(function(data) {
                var amount_inbound = winkstart.config.amount_inbound || 6.99,
                    inbound = data.data.inbound_trunks || 0,
                    total_amount_inbound = amount_inbound * inbound,
                    $trunks_inbound_html = THIS.templates.trunks_inbound.tmpl({
                        inbound: inbound,
                        amount_inbound: amount_inbound.toFixed(2),
                        total_amount_inbound: total_amount_inbound.toFixed(2)
                    });

                $('.icon-question-sign[data-toggle="tooltip"]', $trunks_inbound_html).tooltip();

                $('#slider_inbound', $trunks_inbound_html).slider({
                    min: 0,
                    max: winkstart.config.max_inbound_trunks || 100,
                    range: 'min',
                    value: data.data.inbound_trunks > 0 ? data.data.inbound_trunks : 0,
                    slide: function( event, ui ) {
                        $('.slider-value', $trunks_inbound_html).html(ui.value);
                        total_amount_inbound = ui.value*amount_inbound;
                        $('.total-amount .total-amount-value', $trunks_inbound_html).html(total_amount_inbound.toFixed(2));
                        $('.slider-value-wrapper', $trunks_inbound_html).css('left', $('#slider_inbound .ui-slider-handle', $trunks_inbound_html).css('left'));
                    },
                    change: function(event, ui) {
                        $('.slider-value-wrapper', $trunks_inbound_html).css('left', $('#slider_inbound .ui-slider-handle', $trunks_inbound_html).css('left'));
                    }
                });

                $('.update-limits', $trunks_inbound_html).on('click', function(e) {
                    e.preventDefault();

                    winkstart.confirm(i18n.t('core.layout.charge_reminder_line1') + '<br/><br/>' + i18n.t('core.layout.charge_reminder_line2'),
                        function() {
                            THIS.limits_get(function(_data_limits) {
                                var limits_data = {
                                    inbound_trunks: $('#slider_inbound', $trunks_inbound_html).slider('value'),
                                    twoway_trunks: 'data' in data ? data.data.twoway_trunks || 0 : 0
                                };

                                limits_data = $.extend(true, _data_limits.data, limits_data);

                                THIS.limits_update(limits_data, function(_data) {
                                    winkstart.publish('myaccount.update_menu', THIS.__module, limits_data.inbound_trunks, 'inbound_title');
                                    winkstart.publish('myaccount.trunks_inbound.render');
                                    //TODO toastr saved
                                });
                            });
                        }
                    );
                });

                winkstart.publish('myaccount.render_submodule', $trunks_inbound_html);

                $('.slider-value-wrapper', $trunks_inbound_html).css('left', $('#slider_inbound .ui-slider-handle', $trunks_inbound_html).css('left'));
            });
        },

        render_outbound: function() {
            var THIS = this;

            THIS.limits_get(function(data) {
                var amount_twoway = winkstart.config.amount_twoway || 29.99,
                    twoway = data.data.twoway_trunks || 0,
                    total_amount_twoway = amount_twoway * twoway;
                    $trunks_outbound_html = THIS.templates.trunks_outbound.tmpl({
                        twoway: twoway,
                        amount_twoway: amount_twoway.toFixed(2),
                        total_amount_twoway: total_amount_twoway.toFixed(2)
                    });

                $('.icon-question-sign[data-toggle="tooltip"]', $trunks_outbound_html).tooltip();

                $('#slider_twoway', $trunks_outbound_html).slider({
                    min: 0,
                    max: winkstart.config.max_twoway_trunks || 20,
                    range: 'min',
                    value: data.data.twoway_trunks > 0 ? data.data.twoway_trunks : 0,
                    slide: function( event, ui ) {
                        $('.slider-value', $trunks_outbound_html).html(ui.value);
                        total_amount_twoway = ui.value*amount_twoway;
                        $('.total-amount .total-amount-value', $trunks_outbound_html).html(total_amount_twoway.toFixed(2));
                        $('.slider-value-wrapper', $trunks_outbound_html).css('left', $('#slider_twoway .ui-slider-handle', $trunks_outbound_html).css('left'));
                    },
                    change: function(event, ui) {
                        $('.slider-value-wrapper', $trunks_outbound_html).css('left', $('#slider_twoway .ui-slider-handle', $trunks_outbound_html).css('left'));
                    }
                });

                $('.update-limits', $trunks_outbound_html).on('click', function(e) {
                    e.preventDefault();

                    winkstart.confirm(i18n.t('core.layout.charge_reminder_line1') + '<br/><br/>' + i18n.t('core.layout.charge_reminder_line2'),
                        function() {
                            THIS.limits_get(function(_data_limits) {
                                var limits_data = {
                                    twoway_trunks: $('#slider_twoway', $trunks_outbound_html).slider('value'),
                                    inbound_trunks: 'data' in data ? data.data.inbound_trunks || 0 : 0
                                };

                                limits_data = $.extend(true, _data_limits.data, limits_data);

                                THIS.limits_update(limits_data, function(_data) {
                                    winkstart.publish('myaccount.update_menu', THIS.__module, limits_data.twoway_trunks, 'outbound_title');
                                    winkstart.publish('myaccount.trunks_outbound.render');
                                    //TODO biscotte saved
                                });
                            });
                        }
                    );
                });

                winkstart.publish('myaccount.render_submodule', $trunks_outbound_html);

                $('.slider-value-wrapper', $trunks_outbound_html).css('left', $('#slider_twoway .ui-slider-handle', $trunks_outbound_html).css('left'));
            });

        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this;

            THIS.limits_get(function(data) {
                var $trunks_menu_outbound_html = THIS.templates.menu_outbound.tmpl({
                    inbound: data.data.inbound_trunks || 0,
                    twoway: data.data.twoway_trunks || 0
                });

                var $trunks_menu_inbound_html = THIS.templates.menu_inbound.tmpl({
                    inbound: data.data.inbound_trunks || 0,
                    twoway: data.data.twoway_trunks || 0
                });

                winkstart.publish('myaccount.add_submodule', $trunks_menu_inbound_html, 20, 'trunking_category');
                winkstart.publish('myaccount.add_submodule', $trunks_menu_outbound_html, 40, 'trunking_category');
            });
        }
    }
);
