winkstart.module('myaccount', 'trunks', {
        css: [
           'css/trunks.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           trunks: 'tmpl/trunks.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.trunks.render': 'render'
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

        update_menu: function(data) {
            var THIS = this;

            if(data) {
                $('.myaccount .' + THIS.__module + ' .badge').html(data);
            }
        },

        render: function() {
            var THIS = this;

            winkstart.publish('myaccount.select_menu', THIS.__module);

            THIS.limits_get(function(data) {
                var $trunks_html = THIS.templates.trunks.tmpl({
                    inbound: data.data.inbound_trunks || 0,
                    twoway: data.data.twoway_trunks || 0
                });

                $('#slider_twoway', $trunks_html).slider({
                    min: 0,
                    max: 100,
                    range: 'min',
                    value: data.data.twoway_trunks > 0 ? data.data.twoway_trunks : 0,
                    slide: function( event, ui ) {
                        $('.slider-value', $(this).parents('.trunk-container').first()).html(ui.value);
                    }
                });

                $('#slider_inbound', $trunks_html).slider({
                    min: 0,
                    max: 100,
                    range: 'min',
                    value: data.data.inbound_trunks > 0 ? data.data.inbound_trunks : 0,
                    slide: function( event, ui ) {
                        $('.slider-value', $(this).parents('.trunk-container').first()).html(ui.value);
                    }
                });

                $('.update-limits', $trunks_html).on('click', function(e) {
                    e.preventDefault();

                    if(confirm('Your on-file credit card will immediately be charged for any changes you make. If you have changed any recurring services, new charges will be pro-rated for your billing cycle.<br/><br/>Are you sure you want to continue?')) {
                         /*var limits_data = {
                            twoway_trunks: $('#twoway', $trunks_html).size() > 0 ? parseInt($('#twoway', $trunks_html).val() || 0) : -1,
                            inbound_trunks: $('#inbound', $trunks_html).size() > 0 ? parseInt($('#inbound', $trunks_html).val() || 0) : -1
                        };*/

                        var limits_data = {
                            twoway_trunks: $('#slider_twoway', $trunks_html).slider('value'),
                            inbound_trunks: $('#slider_inbound', $trunks_html).slider('value')
                        };

                        limits_data = $.extend({}, data.limits, limits_data);
                        console.log(limits_data);
                        /*THIS.limits_update(limits_data, function(_data) {
                            THIS.update_menu(limits_data.inbound_trunks + '/' + limits_data.twoway_trunks);
                            winkstart.publish('myaccount.trunks.render');
                            alert('Your changes have been saved!');
                        });*/
                    }
                });

                $('.myaccount .myaccount-content .container-fluid').html($trunks_html);
            });
        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this;

            THIS.limits_get(function(data) {
                var $trunks_menu_html = THIS.templates.menu.tmpl({
                    inbound: data.data.inbound_trunks || 0,
                    twoway: data.data.twoway_trunks || 0
                });

                winkstart.publish('myaccount.add_submodule', $trunks_menu_html, 3);
            });


        }
    }
);
