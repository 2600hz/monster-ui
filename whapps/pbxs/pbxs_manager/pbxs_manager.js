winkstart.module('pbxs', 'pbxs_manager', {
        css: [
            'css/pbxs_manager.css',
            'css/numbers_popup.css',
            'css/endpoints.css'
        ],

        locales: ['en', 'fr'],

        templates: {
            pbxs_manager: 'tmpl/pbxs_manager.handlebars',
            pbxs_list_element: 'tmpl/pbxs_list_element.handlebars',
            pbxs_unassigned_numbers: 'tmpl/pbxs_unassigned_numbers.handlebars',
            list_numbers: 'tmpl/list_numbers.handlebars',
            no_numbers: 'tmpl/no_numbers.handlebars',
            no_results: 'tmpl/no_results.handlebars',
            search_results: 'tmpl/search_results.handlebars',
            endpoint: 'tmpl/endpoint.handlebars',
            endpoint_numbers: 'tmpl/endpoint_numbers.handlebars',

            add_number_dialog: 'tmpl/add_number_dialog.handlebars',
            failover_dialog: 'tmpl/failover_dialog.handlebars',
            cnam_dialog: 'tmpl/cnam_dialog.handlebars',
            e911_dialog: 'tmpl/e911_dialog.handlebars',
            add_number_search_results: 'tmpl/add_number_search_results.handlebars',
            port_dialog: 'tmpl/port_dialog.handlebars',
            move_number_dialog: 'tmpl/move_number_dialog.handlebars'
        },

        subscribe: {
            'pbxs_manager.activate': 'activate',
            'pbxs_manager.edit': 'edit_server'
        },

        resources: {
            'pbxs_manager.list_callflows': {
                url: '{api_url}/accounts/{account_id}/callflows',
                contentType: 'application/json',
                verb: 'GET'
            },
            'pbxs_manager.get_account': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'pbxs_manager.list_numbers': {
                url: '{api_url}/accounts/{account_id}/phone_numbers',
                contentType: 'application/json',
                verb: 'GET'
            },
            'pbxs_manager.get': {
                url: '{api_url}/accounts/{account_id}/phone_numbers/{phone_number}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'pbxs_manager.update': {
                url: '{api_url}/accounts/{account_id}/phone_numbers/{phone_number}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'pbxs_manager.activate': {
                url: '{api_url}/accounts/{account_id}/phone_numbers/{phone_number}/activate',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'pbxs_manager.search': {
                url: '{api_url}/phone_numbers?prefix={prefix}&quantity={quantity}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'pbxs_manager.delete': {
                url: '{api_url}/accounts/{account_id}/phone_numbers/{phone_number}',
                contentType: 'application/json',
                verb: 'DELETE'
            },
            'pbxs_manager.create': {
                url: '{api_url}/accounts/{account_id}/phone_numbers/{phone_number}/docs/{file_name}',
                contentType: 'application/x-base64',
                verb: 'PUT'
            },
            'pbxs_manager.port': {
                url: '{api_url}/accounts/{account_id}/phone_numbers/{phone_number}/port',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'pbxs_manager.create_doc': {
                url: '{api_url}/accounts/{account_id}/phone_numbers/{phone_number}/docs/{file_name}',
                contentType: 'application/x-base64',
                verb: 'PUT'
            },
            'old_trunkstore.create': {
                url: '{api_url}/accounts/{account_id}/connectivity',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'old_trunkstore.list': {
                url: '{api_url}/accounts/{account_id}/connectivity',
                contentType: 'application/json',
                verb: 'GET'
            },
            'old_trunkstore.get': {
                url: '{api_url}/accounts/{account_id}/connectivity/{connectivity_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'old_trunkstore.update': {
                url: '{api_url}/accounts/{account_id}/connectivity/{connectivity_id}',
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
        list_available_pbxs: function() {
            return ['allworks', 'altigen', 'asterisk', 'avaya', 'bluebox', 'cisco', 'digium', 'epygi', 'freepbx', 'freeswitch', 'mitel', 'objectworld', 'other', 'pingtel', 'responsepoint', 'samsung', 'shoretel', 'sutus', 'talkswitch', 'threecom', 'taridium'];
        },

        list_all_numbers: function(success, error) {
            winkstart.request('pbxs_manager.list_numbers', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url
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

        list_callflows: function(success, error) {
            winkstart.request('pbxs_manager.list_callflows', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url
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

        create_account: function(success, error) {
            winkstart.request('pbxs_manager.get_account', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url
                },
                function(_data, status) {
                    var THIS = this,
                        account_data = {
                            account: {
                                credits: {
                                    prepay: '0.00'
                                },
                                trunks: '0',
                                inbound_trunks: '0',
                                auth_realm: _data.data.realm
                            },
                            billing_account_id: winkstart.apps['pbxs'].account_id,
                            DIDs_Unassigned: {},
                            servers: []
                        };

                    winkstart.request('old_trunkstore.create', {
                            account_id: winkstart.apps['pbxs'].account_id,
                            api_url: winkstart.apps['pbxs'].api_url,
                            data: account_data
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
                }
            );
        },

        list_accounts: function(success, error) {
            winkstart.request('old_trunkstore.list', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url
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

        get_account: function(success, error) {
            var THIS = this;

            winkstart.request('old_trunkstore.get', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url,
                    connectivity_id: winkstart.apps['pbxs'].connectivity_id
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

        list_servers: function(success, error) {
            var THIS = this,
                get_account = function() {
                    THIS.get_account(
                        function(_data, status) {
                            success(_data.data.servers, status);
                        }
                    );
                };

            if(winkstart.apps['pbxs'].connectivy_id) {
                get_account();
            }
            else {
                THIS.list_accounts(function(data, status) {
                    if(data.data.length) {
                        winkstart.apps['pbxs'].connectivity_id = data.data[0];

                        get_account();
                    }
                    else {
                        THIS.create_account(function(_data) {
                                THIS.list_accounts(function(data, status) {
                                    winkstart.apps['pbxs'].connectivity_id = data.data[0];

                                    get_account();
                                });
                            },
                            function(_data, status) {
                                winkstart.alert(i18n.t('pbxs.pbxs_manager.error_signup', {variable: status}));
                            }
                        );
                    }
                });
            }
        },

        edit_server: function(data, _parent, _target, _callbacks, data_defaults) {
            var THIS = this,
                //parent = _parent || $('#pbxs_manager-content'),
                parent = _parent || $('#ws-content'),
                target = _target || $('#pbxs_manager_view', parent),
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                        var saved_id = (data.id === 0 || data.id) ? data.id : _data.data.servers.length-1;
                        THIS.render_list(saved_id);

                        //todo index
                        THIS.edit_server({ id: saved_id }, parent, target, callbacks);
                    },

                    save_error: _callbacks.save_error,

                    delete_success: _callbacks.delete_success || function() {
                        target.empty();

                        THIS.render_list();
                    },

                    delete_error: _callbacks.delete_error,

                    after_render: _callbacks.after_render
                };

            THIS.get_account(function(_data, status) {
                 winkstart.request('pbxs_manager.get_account', {
                        account_id: winkstart.apps['pbxs'].account_id,
                        api_url: winkstart.apps['pbxs'].api_url
                    },
                    function(_data_account, status) {
                        var defaults = $.extend(true, {
                                auth: {
                                    auth_user: 'user_' + winkstart.random_string(8),
                                    auth_password: winkstart.random_string(12),
                                    auth_method: 'IP'
                                },
                                options: {
                                    e911_info: {}
                                },
                                cfg: {},
                                extra: {
                                    configure: 'manually',
                                    realm: _data_account.data.realm,
                                    id: data.id || (data.id === 0 ? 0 : 'new')
                                }
                            }, data_defaults || {});

                        if(typeof data === 'object' && (data.id || data.id === 0)) {
                            //THIS.render_endpoint(_data, $.extend(true, defaults, _data.data.servers[data.id]), target, callbacks);
                            THIS.list_numbers_by_pbx(data.id, function(data_DIDs) {
                                _data.data.servers[data.id].DIDs = data_DIDs;
                                THIS.render_pbxs_manager(_data, $.extend(true, defaults, _data.data.servers[data.id]), target, callbacks);
                            });
                        }
                        else {
                            THIS.render_endpoint(_data, defaults, target, callbacks, parent);
                        }
                    }
                );
            });
        },

        get_number: function(phone_number, success, error) {
            winkstart.request('pbxs_manager.get', {
                    api_url: winkstart.apps['pbxs'].api_url,
                    account_id: winkstart.apps['pbxs'].account_id,
                    phone_number: encodeURIComponent(phone_number)
                },
                function(_data, status) {
                    if(typeof success === 'function') {
                        success(_data);
                    }
                },
                function(_data, status) {
                    if(typeof error === 'function') {
                        error(_data);
                    }
                }
            );
        },

        update_number: function(phone_number, data, success, error) {
            winkstart.request('pbxs_manager.update', {
                    api_url: winkstart.apps['pbxs'].api_url,
                    account_id: winkstart.apps['pbxs'].account_id,
                    phone_number: encodeURIComponent(phone_number),
                    data: data
                },
                function(_data, status) {
                    if(typeof success === 'function') {
                        success(_data);
                    }
                },
                function(_data, status) {
                    if(typeof error === 'function') {
                        error(_data);
                    }
                }
            );
        },

        port_number: function(data, success, error) {
            var THIS = this;

            winkstart.request('pbxs_manager.port', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url,
                    phone_number: encodeURIComponent(data.phone_number),
                    data: data.options || {}
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

        create_number: function(phone_number, success, error) {
            var THIS = this;

            winkstart.request(false, 'pbxs_manager.create', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url,
                    phone_number: encodeURIComponent(phone_number),
                    data: {}
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

        activate_number: function(phone_number, success, error) {
            var THIS = this;

            winkstart.request(false, 'pbxs_manager.activate', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url,
                    phone_number: encodeURIComponent(phone_number),
                    data: {}
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

        delete_number: function(phone_number, success, error) {
            var THIS = this;

            winkstart.request('pbxs_manager.delete', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url,
                    phone_number: encodeURIComponent(phone_number)
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

        search_numbers: function(data, success, error) {
            var THIS = this;

            winkstart.request(true, 'pbxs_manager.search', {
                    api_url: winkstart.apps['pbxs'].api_url,
                    prefix: data.prefix,
                    quantity: data.quantity || 15
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

        create_number_doc: function(data, success, error) {
            var THIS = this;

            winkstart.request('pbxs_manager.create_doc', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url,
                    phone_number: encodeURIComponent(data.phone_number),
                    file_name: data.file_name,
                    data: data.file_data
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

        submit_port: function(port_data, number_data, callback) {
            var THIS = this,
                uploads_done = 0,
                put_port_data = function() {
                    number_data.options.port = port_data.port;

                    //todo phone nbr/data/cb
                    THIS.update_number(number_data.phone_number, number_data.options, function(data) {
                        if(typeof callback == 'function') {
                            callback(data);
                        }
                    });
                },
                put_port_doc = function(index) {
                    /* Add files */
                    THIS.create_number_doc({
                            phone_number: number_data.phone_number,
                            file_name: port_data.loa[0].file_name,
                            file_data: port_data.loa[0].file_data
                        },
                        function(_data, status) {
                            THIS.create_number_doc({
                                    phone_number: number_data.phone_number,
                                    file_name: port_data.files[index].file_name,
                                    file_data: port_data.files[index].file_data
                                },
                                function(_data, status) {
                                    put_port_data();
                                }
                            );
                        }
                    );
                };

            if(port_data.port.main_number === number_data.phone_number) {
                put_port_doc(0);
            }
            else{
                put_port_data();
            }
        },

        add_freeform_numbers: function(numbers_data, callback) {
            var THIS = this,
                number_data;

            if(numbers_data.length > 0) {
                var phone_number = numbers_data[0].phone_number.match(/^\+?1?([2-9]\d{9})$/),
                    error_function = function() {
                        winkstart.confirm(i18n.t('pbxs.pbxs_manager.error_acquire', {variable: numbers_data[0].phone_number}),
                            function() {
                                THIS.add_freeform_numbers(numbers_data, callback);
                            },
                            function() {
                                THIS.add_freeform_numbers(numbers_data.slice(1), callback);
                            }
                        );
                    };

                if(phone_number && phone_number[1]) {
                    THIS.create_number(phone_number[1],
                        function() {
                            THIS.activate_number(phone_number[1],
                                function(_data, status) {
                                    THIS.add_freeform_numbers(numbers_data.slice(1), callback);
                                },
                                function(_data, status) {
                                    error_function();
                                }
                            );
                        },
                        function() {
                            error_function();
                        }
                    );
                }
                else {
                    error_function();
                }
            }
            else {
                if(typeof callback === 'function') {
                    callback();
                }
            }
        },

        add_numbers: function(global_data, index, numbers_data, callback) {
            var THIS = this,
                number_data;

            if(numbers_data.length > 0) {
                var phone_number = numbers_data[0].phone_number.match(/^\+?1?([2-9]\d{9})$/),
                    error_function = function() {
                        winkstart.confirm(i18n.t('pbxs.pbxs_manager.error_acquire', {variable: numbers_data[0].phone_number}),
                            function() {
                                THIS.add_numbers(global_data, index, numbers_data, callback);
                            },
                            function() {
                                THIS.add_numbers(global_data, index, numbers_data.slice(1), callback);
                            }
                        );
                    };

                if(phone_number[1]) {
                    THIS.activate_number(phone_number[1],
                        function(_data, status) {
                            global_data.data.servers[index].DIDs[_data.data.id] = { failover: false, cnam: false, dash_e911: false };
                            THIS.add_numbers(global_data, index, numbers_data.slice(1), callback);
                        },
                        function(_data, status) {
                            error_function();
                        }
                    );
                }
                else {
                    error_function();
                }
            }
            else {
                THIS.update_old_trunkstore(global_data.data, function() {
                    if(typeof callback === 'function') {
                        callback();
                    }
                });
            }
        },

        clean_phone_number_data: function(data) {
            /* Clean Failover */
            if('failover' in data && 'sip' in data.failover && data.failover.sip === '') {
                delete data.failover.sip;
            }

            if('failover' in data && 'e164' in data.failover && data.failover.e164 === '') {
                delete data.failover.e164;
            }

            if(data.failover && $.isEmptyObject(data.failover)) {
                delete data.failover;
            }

            /* Clean Caller-ID */
            if('cnam' in data && 'display_name' in data.cnam && data.cnam.display_name === '') {
                delete data.cnam.display_name;
            }

            if(data.cnam && $.isEmptyObject(data.cnam)) {
                delete data.cnam;
            }
        },

        normalize_endpoint_data: function(data) {
            if(data.server_name === '' || !('server_name' in data)) {
                data.server_name = "PBX " + data.extra.serverid;
            }

            delete data.extra;

            return data;
        },

        save_endpoint: function(endpoint_data, data, success, error) {
            var THIS = this,
                index = endpoint_data.extra.serverid,
                new_data = $.extend(true, {}, data.data);

            THIS.normalize_endpoint_data(endpoint_data);

            if(endpoint_data.server_name) {
                if((index || index === 0) && index != 'new') {
                    $.extend(true, new_data.servers[index], endpoint_data);
                }
                else {
                    new_data.servers.push($.extend(true, {
                        DIDs: {},
                        options: {
                            enabled: true,
                            inbound_format: 'e.164',
                            international: false,
                            caller_id: {},
                            e911_info: {},
                            failover: {}
                        },
                        permissions: {
                            users: []
                        },
                        monitor: {
                            monitor_enabled: false
                        }
                    }, endpoint_data));
                }

                winkstart.request('old_trunkstore.update', {
                        account_id: winkstart.apps['pbxs'].account_id,
                        api_url: winkstart.apps['pbxs'].api_url,
                        connectivity_id: winkstart.apps['pbxs'].connectivity_id,
                        data: new_data
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
            }
            else {
                winkstart.alert('formatting_error');
            }
        },

        update_old_trunkstore: function(data, success, error) {
            winkstart.request('old_trunkstore.update', {
                    account_id: winkstart.apps['pbxs'].account_id,
                    api_url: winkstart.apps['pbxs'].api_url,
                    connectivity_id: winkstart.apps['pbxs'].connectivity_id,
                    data: data
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

        popup_endpoint_settings: function(data, endpoint_data, callbacks, step) {
            var THIS = this,
                popup = winkstart.dialog($('<div></div>'), {
                    position: ['center', 50],
                    width: '700px',
                    title: i18n.t('pbxs.pbxs_manager.edit_settings', {variable: endpoint_data.server_name})
                });

            endpoint_data.load_step = step;

            THIS.render_endpoint(data, endpoint_data, $(popup), {
                save_success: function(_data) {
                    popup.dialog('destroy').remove();

                    if(callbacks && typeof callbacks.save_success == 'function') {
                        callbacks.save_success(_data);
                    }
                },
                render_popup: function() {
                    winkstart.dialog($(container), {
                        title: i18n.t('pbxs.pbxs_manager.edit_settings', {variable: endpoint_data.server_name})
                    });
                },
                cancel_success: function() {
                    popup.dialog('destroy').remove();
                },
                delete_success: function() {
                    popup.dialog('destroy').remove();

                    if(callbacks && typeof callbacks.delete_success == 'function') {
                        callbacks.delete_success();
                    }
                }
            });
        },

        load_specific_step: function(step_index, callbacks, parent) {
            $('.wizard-top-bar', parent).hide();
            $('.wizard-content-step', parent).hide();
            $('.wizard-content-step[data-step="'+ step_index +'"]', parent).show();

            $('.wizard-buttons button', parent).hide();
            $('.cancel', parent).show();
            $('.submit-btn', parent).show();

            $('.cancel', parent).off()
                                .on('click', function(ev) {
                ev.preventDefault();

                if(typeof callbacks.cancel_success === 'function') {
                    callbacks.cancel_success();
                }
            });
        },

        initialize_wizard: function(parent, callback_submit) {
            var THIS = this,
                max_step = parseInt($('.wizard-top-bar', parent).attr('data-max_step'));

            $('.wizard-top-bar', parent).attr('data-active_step', '1');

            $('.wizard-content-step', parent).hide();
            $('.wizard-content-step[data-step="1"]', parent).show();

            $('.wizard-top-bar', parent).attr('data-active_step', '1');

            if(max_step !== 1) {
                $('.submit-btn', parent).hide();
            }
            else {
                $('.next-step', parent).hide();
            }

            $('.prev-step', parent).hide();

            $('.step', parent).on('click', function() {
                var step = $(this).data('step');
                if($(this).hasClass('completed')) {
                    THIS.validate_step($('.wizard-top-bar', parent).attr('data-active_step'), parent, function() {
                        THIS.change_step(step, max_step, parent);
                    });
                }
            });

            $('.next-step', parent).on('click', function(ev) {
                ev.preventDefault();

                current_step = parseInt($('.wizard-top-bar', parent).attr('data-active_step'));
                THIS.validate_step(current_step, parent, function() {
                    THIS.change_step(++current_step, max_step, parent);
                });
            });

            $('.prev-step', parent).on('click', function(ev) {
                ev.preventDefault();

                current_step = parseInt($('.wizard-top-bar', parent).attr('data-active_step'));
                THIS.change_step(--current_step, max_step, parent);
            });

            $('.cancel', parent).on('click', function(ev) {
                ev.preventDefault();

                winkstart.publish('pbxs_manager.activate');
            });

            $('.submit-btn', parent).on('click', function(ev) {
                ev.preventDefault();

                if(typeof callback_submit === 'function') {
                    callback_submit();
                }
            });
        },

        change_step: function(step_index, max_step, parent) {
            var THIS = this;

            $('.step', parent).removeClass('active');
            $('.step[data-step="'+step_index+'"]', parent).addClass('active');

            for(var i = step_index; i >= 1; --i) {
                $('.step[data-step="'+i+'"]', parent).addClass('completed');
            }

            $('.wizard-content-step', parent).hide();
            $('.wizard-content-step[data-step="'+ step_index +'"]', parent).show();

            $('.cancel', parent).hide();
            $('.prev-step', parent).show();
            $('.next-step', parent).show();
            $('.submit-btn', parent).hide();

            if(step_index === max_step) {
                $('.next-step', parent).hide();
                $('.submit-btn', parent).show();
            }

            if(step_index === 1) {
                $('.prev-step', parent).hide();
                $('.cancel', parent).show();
            }

            $('.wizard-top-bar', parent).attr('data-active_step', step_index);
        },

        validate_step: function(step, parent, callback) {
            var validated = true,
                step = parseInt(step),
                error_message = i18n.t('pbxs.pbxs_manager.please_correct');

            if(step === 1) {
                if($('.pbx-brand-list .pbx.selected', parent).size() === 0) {
                    error_message += '<br/>- ' + i18n.t('pbxs.pbxs_manager.no_pbx_selected');
                    validated = false;
                }
            }
            else if(step === 2) {
                if(!($('#auth_ip', parent).val().match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/) !== null)) {
                    validated = false;
                    error_message += '<br/>- ' + i18n.t('pbxs.pbxs_manager.not_valid_ip');
                }
            }
            else if(step === 3) {
                validated = true;
            }

            if(validated === true) {
                if(typeof callback === 'function') {
                    callback();
                }
            }
            else {
                winkstart.alert(error_message);
            }
        },

        render_endpoint: function(data, endpoint_data, target, callbacks, parent) {
            if(!endpoint_data.server_name) {
                endpoint_data.server_name = null;
            }

            var THIS = this,
                max_step = 3,
                endpoint_html = THIS.templates.endpoint.tmpl(endpoint_data),
                submit_wizard_callback = function() {
                    var form_data = form2object('endpoint');
                    form_data.server_type = $('.pbx-brand-list .pbx.selected', endpoint_html).data('pbx_name'),
                    form_data.cfg = $.extend(true, {
                        opening_pings: $('button.btn-primary', $('.btn-group[data-type="opening_pings"]', endpoint_html)).data('value'),
                        caller_id_header: $('button.btn-primary', $('.btn-group[data-type="caller_id_header"]', endpoint_html)).data('value'),
                        supported_codecs: $('button.btn-primary', $('.btn-group[data-type="supported_codecs"]', endpoint_html)).data('value'),
                        signaling_type: $('button.btn-primary', $('.btn-group[data-type="signaling_type"]', endpoint_html)).data('value'),
                        allow_refer: $('button.btn-primary', $('.btn-group[data-type="allow_refer"]', endpoint_html)).data('value'),
                        use_t38: $('button.btn-primary', $('.btn-group[data-type="use_t38"]', endpoint_html)).data('value')
                    }, form_data.cfg);

                    console.log(form_data);

                    THIS.get_account(function(global_data) {
                        THIS.save_endpoint(form_data, global_data, function(_data) {
                            if(typeof callbacks.save_success == 'function') {
                                callbacks.save_success(_data);
                            }
                        });
                    });
                };

            $('button[data-value="'+endpoint_data.cfg.opening_pings+'"]', $('.btn-group[data-type="opening_pings"]', endpoint_html)).addClass('btn-primary');
            $('button[data-value="'+endpoint_data.cfg.caller_id_header+'"]', $('.btn-group[data-type="caller_id_header"]', endpoint_html)).addClass('btn-primary');
            $('button[data-value="'+endpoint_data.cfg.supported_codecs+'"]', $('.btn-group[data-type="supported_codecs"]', endpoint_html)).addClass('btn-primary');
            $('button[data-value="'+endpoint_data.cfg.signaling_type+'"]', $('.btn-group[data-type="signaling_type"]', endpoint_html)).addClass('btn-primary');
            $('button[data-value="'+endpoint_data.cfg.allow_refer+'"]', $('.btn-group[data-type="allow_refer"]', endpoint_html)).addClass('btn-primary');
            $('button[data-value="'+endpoint_data.cfg.use_t38+'"]', $('.btn-group[data-type="use_t38"]', endpoint_html)).addClass('btn-primary');

            THIS.initialize_wizard(endpoint_html, submit_wizard_callback);

            $('.static-ip-block', endpoint_html).hide();
            $('.testing-block', endpoint_html).hide();
            $('.static-ip-block[data-value="'+ endpoint_data.auth.auth_method +'"]', endpoint_html).show();
            $('.testing-block[data-value="'+ endpoint_data.extra.configure +'"]', endpoint_html).show();

            $('input[type="radio"][name="extra.configure"]', endpoint_html).on('click', function() {
                $('.testing-block', endpoint_html).hide();
                $('.testing-block[data-value="'+$(this).val()+'"]', endpoint_html).slideDown();
            });

            $('input[type="radio"][name="auth.auth_method"]', endpoint_html).on('click', function() {
                $('.static-ip-block', endpoint_html).hide();
                $('.static-ip-block[data-value="'+$(this).val()+'"]', endpoint_html).slideDown();
            });

            $('.btn-group .btn', endpoint_html).on('click', function(ev) {
                ev.preventDefault();

                if($(this).hasClass('btn-primary')) {
                    $(this).removeClass('btn-primary');
                }
                else {
                    $('.btn', $(this).parent()).removeClass('btn-primary');
                    $(this).toggleClass('btn-primary');
                }
            });

            $.each($('.pbx-brand-list .pbx', endpoint_html), function() {
                if($(this).data('pbx_name') === endpoint_data.server_type) {
                    $(this).addClass('selected');
                    $('.pbx-brand-list .pbx:not(.selected)', endpoint_html).css('opacity', '0.2');
                    return false;
                }
            });

            if(endpoint_data.server_type && $('.pbx-brand-list .pbx.selected', endpoint_html).size() === 0) {
                $('.pbx-brand-list .pbx.other', endpoint_html).addClass('selected');
                $('.pbx-brand-list .pbx:not(.selected)', endpoint_html).css('opacity', '0.2');
            }

            if(!endpoint_data.server_type) {
                $('.info_pbx', endpoint_html).hide();
            }

            $('.pbx-brand-list .pbx', endpoint_html).click(function() {
                $('.pbx-brand-list .pbx', endpoint_html).removeClass('selected').css('opacity', '0.2');
                $(this).addClass('selected');

                $('.selected-pbx', endpoint_html).html($('.pbx-brand-list .selected', endpoint_html).data('pbx_name'));
                $('.info_pbx', endpoint_html).slideDown();
            });

            if(endpoint_data.load_step && endpoint_data.load_step > 0) {
                THIS.load_specific_step(endpoint_data.load_step, callbacks, endpoint_html);
            }
            else {
                $('#list_pbxs_navbar', parent).hide();
            }

            (target)
                .empty()
                .append(endpoint_html);
        },

        refresh_list_numbers: function(DIDs_list, _parent) {
            var parent = _parent || $('#pbx_connector_container'),
                THIS = this,
                count_DIDs = 0;

            $('#numbers_wrapper', parent).empty();

            if($.isEmptyObject(DIDs_list)) {
                $('#numbers_wrapper', parent).append(THIS.templates.no_numbers.tmpl());
            }
            else {
                $('#numbers_wrapper', parent).append(THIS.templates.list_numbers.tmpl({ DIDs: DIDs_list }));

                $.each(DIDs_list, function() {
                    count_DIDs++;
                });
            }

            $('#count_phones', parent).html(count_DIDs);
            $('#trigger_links', parent).hide();
        },

        render_pbxs_manager: function(data, endpoint_data, target, callbacks) {
            var THIS = this,
                server_id = endpoint_data.extra.id,
                img_link = endpoint_data.server_type ? endpoint_data.server_type.replace('.','').toLowerCase() : 'other';

            $.inArray(img_link, THIS.list_available_pbxs()) < 0 ? img_link = 'other' : true;
            endpoint_data.img_link = img_link;

            endpoint_data.servers_list = [];

            $.each(data.data.servers, function(k, v) {
                if(k !== server_id) {
                    var temp_img_link = v.server_type ? v.server_type.replace('.','').toLowerCase() : 'other';
                    $.inArray(temp_img_link, THIS.list_available_pbxs()) < 0 ? temp_img_link = 'other' : true;

                    endpoint_data.servers_list.push({
                        index: k,
                        server_name: v.server_name,
                        img_link: temp_img_link
                    });
                }
            });

            var pbxs_manager_html = THIS.templates.endpoint_numbers.tmpl(endpoint_data),
                callback_listing = function(data_cb) {
                    THIS.refresh_list_numbers(data_cb, pbxs_manager_html);
                };

            THIS.refresh_list_numbers(endpoint_data.DIDs, pbxs_manager_html);

            $('#search_results', pbxs_manager_html).hide();

            $('.search-query', pbxs_manager_html).keyup(function() {
                var input = $(this),
                    rows = $('#numbers_wrapper .number-wrapper', pbxs_manager_html),
                    search_string = $.trim(input.val().toLowerCase()),
                    matches = [],
                    cache = {};

                $.each(rows, function(k, v) {
                    var data = $(this).data(),
                        key = data.phone_number;

                    cache[key] = $(this);
                });

                if (!search_string) {
                    $('#numbers_wrapper', pbxs_manager_html).show();
                    $('#search_results', pbxs_manager_html).empty()
                                                           .hide();
                }
                else {
                    $('#search_results', pbxs_manager_html).empty();

                    $.each(cache, function(phone_number, row_array) {
                        if (phone_number.indexOf(search_string)>-1) {
                            matches.push({phone_number: phone_number, selected: $(row_array).hasClass('selected')});
                        }
                    });

                    if(matches.length > 0) {
                        $('#search_results', pbxs_manager_html).append(THIS.templates.search_results.tmpl({matches: matches, count: matches.length}));
                    }
                    else {
                        $('#search_results', pbxs_manager_html).append(THIS.templates.no_results.tmpl());
                    }

                    $('#numbers_wrapper', pbxs_manager_html).hide();
                    $('#search_results', pbxs_manager_html).show();
                }
            });

            $(pbxs_manager_html).on('click', '.number-wrapper', function(event) {
                if($(event.target).closest('.number-options').size() < 1) {
                    var toggle_number_selected = function($element, update_cb) {
                        var $current_cb = $('input[type="checkbox"]', $element),
                            cb_value = $current_cb.prop('checked');

                        if(update_cb) {
                            $current_cb.prop('checked', !cb_value);
                        }

                        $element.toggleClass('selected');
                    };

                    toggle_number_selected($(this), !$(event.target).is('input:checkbox'));

                    if($(this).parents('#search_results').size() > 0) {
                        var $wrapper = $('#numbers_wrapper .number-wrapper[data-phone_number="'+$(this).data('phone_number')+'"]', pbxs_manager_html);

                        toggle_number_selected($wrapper, true);
                    }

                    if($('.number-wrapper.selected', pbxs_manager_html).size() > 0) {
                        $('#trigger_links', pbxs_manager_html).show('fast');
                    }
                    else {
                        $('#trigger_links', pbxs_manager_html).hide();
                    }
                }
            });

            $('#delete_pbx', pbxs_manager_html).click(function() {
                winkstart.confirm(i18n.t('pbxs.pbxs_manager.delete_pbx_confirmation'), function() {
                    THIS.get_account(function(_global_data) {
                        _global_data.data.servers.splice(endpoint_data.extra.id, 1);

                        THIS.update_old_trunkstore(_global_data.data, callbacks.delete_success);
                    });
                });
            });
            /*$('#select_all_numbers', pbxs_manager_html).click(function() {
                $('.select_number', pbxs_manager_html).prop('checked', $(this).is(':checked'));
            });
            */
            $('.settings-pbx-link', pbxs_manager_html).click(function() {
                THIS.popup_endpoint_settings(data, endpoint_data, callbacks, parseInt($(this).data('step')));
            });

            $('#buy_numbers', pbxs_manager_html).click(function() {
                THIS.render_add_number_dialog(data, server_id, function() {
                    THIS.list_numbers_by_pbx(server_id, callback_listing);
                });
            });

            /*$('#add_number', pbxs_manager_html).click(function() {
                THIS.render_freeform_number_dialog(function() {
                    THIS.list_numbers_by_pbx(server_id);
                });
            });*/

            $('.pbx-dropdown:not(.empty)', pbxs_manager_html).on('click', function(ev) {
                ev.preventDefault();

                var list_numbers = [];
                $('.number-wrapper.selected', pbxs_manager_html).each(function() {
                    list_numbers.push($(this).data('phone_number'));
                });

                if(list_numbers.length > 0) {
                    var new_index = $(this).data('index');

                    THIS.get_account(function(global_data) {
                        winkstart.confirm(i18n.t('pbxs.pbxs_manager.confirm_move', {variable: global_data.data.servers[new_index].server_name}), function() {
                            $.each(list_numbers, function(k, v) {
                                global_data.data.servers[new_index].DIDs[v] = global_data.data.servers[server_id].DIDs[v];
                                delete global_data.data.servers[server_id].DIDs[v];
                            });

                            THIS.update_old_trunkstore(global_data.data, function() {
                                THIS.list_numbers_by_pbx(server_id, callback_listing);
                            });
                        });
                    });
                }
                else {
                    winkstart.alert(i18n.t('pbxs.pbxs_manager.no_number_selected'));
                }
            });

            $('#port_numbers', pbxs_manager_html).click(function(ev) {
                ev.preventDefault();

                THIS.render_port_dialog(function(port_data, popup) {
                    winkstart.confirm(i18n.t('pbxs.pbxs_manager.charge_reminder_line1') + '<br/><br/>' + i18n.t('pbxs.pbxs_manager.charge_reminder_line2'),
                        function() {
                            THIS.get_account(function(global_data) {
                                var ports_done = 0;

                                $.each(port_data.phone_numbers, function(i, val) {
                                    var number_data = {
                                        phone_number: val
                                    };

                                    var check_update_trunkstore = function() {
                                        if(++ports_done > port_data.phone_numbers.length - 1) {
                                            THIS.update_old_trunkstore(global_data.data, function(_data) {
                                                _data.data.servers[server_id].extra = { id: server_id };

                                                if(callbacks && 'save_success' in callbacks && typeof callbacks.save_success == 'function') {
                                                    callbacks.save_success(_data);
                                                }

                                                popup.dialog('close');
                                            });
                                        }
                                    };

                                    THIS.port_number(number_data, function(_number_data) {
                                            number_data.options = _number_data.data;

                                            if('id' in number_data.options) {
                                                delete number_data.options.id;
                                            }

                                            THIS.submit_port(port_data, number_data, function(_data) {
                                                global_data.data.servers[server_id].DIDs[val] = { failover: false, cnam: false, dash_e911: false };

                                                check_update_trunkstore();
                                            });
                                        },
                                        function(_number_data) {
                                            check_update_trunkstore();
                                        }
                                    );
                                });
                            });
                        }
                    );
                });
            });

            $(pbxs_manager_html).on('click', '.failover-number', function() {
                var $failover_cell = $(this),
                    data_phone_number = $failover_cell.parents('.number-wrapper').first().data('phone_number'),
                    phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                if(phone_number[1]) {
                    THIS.get_number(phone_number[1], function(_data) {
                        THIS.render_failover_dialog(_data.data.failover || {}, function(failover_data) {
                            //_data.data.failover = $.extend({}, _data.data.failover, failover_data);
                            _data.data.failover = $.extend({}, failover_data);

                            THIS.clean_phone_number_data(_data.data);

                            winkstart.confirm(i18n.t('pbxs.pbxs_manager.charge_reminder_line1') + '<br/><br/>' + i18n.t('pbxs.pbxs_manager.charge_reminder_line2'),
                                function() {
                                    THIS.update_number(phone_number[1], _data.data, function(_data_update) {
                                            //TODO add lil icons for failover e911 cnam
                                            !($.isEmptyObject(_data.data.failover)) ? $failover_cell.removeClass('inactive').addClass('active') : $failover_cell.removeClass('active').addClass('inactive');
                                            toastr.success(i18n.t('pbxs.pbxs_manager.success_failover', {variable: winkstart.format_phone_number(phone_number[1])}));
                                        },
                                        function(_data_update) {
                                            winkstart.alert(i18n.t('pbxs.pbxs_manager.failed_update_failover') + '<br/>' + _data_update.message);
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });

            $(pbxs_manager_html).on('click', '.cnam-number', function() {
                var $cnam_cell = $(this),
                    data_phone_number = $cnam_cell.parents('.number-wrapper').first().data('phone_number'),
                    phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                if(phone_number[1]) {
                    THIS.get_number(phone_number[1], function(_data) {
                        THIS.render_cnam_dialog(_data.data.cnam || {}, function(cnam_data) {
                            _data.data.cnam = $.extend({}, _data.data.cnam, cnam_data);

                            THIS.clean_phone_number_data(_data.data);

                            winkstart.confirm(i18n.t('pbxs.pbxs_manager.charge_reminder_line1') + '<br/><br/>' + i18n.t('pbxs.pbxs_manager.charge_reminder_line2'),
                                function() {
                                    THIS.update_number(phone_number[1], _data.data, function(_data_update) {
                                            !($.isEmptyObject(_data.data.cnam)) ? $cnam_cell.removeClass('inactive').addClass('active') : $cnam_cell.removeClass('active').addClass('inactive');
                                            toastr.success(i18n.t('pbxs.pbxs_manager.success_cnam', {variable: winkstart.format_phone_number(phone_number[1])}));
                                        },
                                        function(_data_update) {
                                            winkstart.alert(i18n.t('pbxs.pbxs_manager.error_update_caller_id') + '' + _data_update.message);
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });

            $(pbxs_manager_html).on('click', '.e911-number', function() {
                var $e911_cell = $(this),
                    data_phone_number = $e911_cell.parents('.number-wrapper').first().data('phone_number'),
                    phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                if(phone_number[1]) {
                    THIS.get_number(phone_number[1], function(_data) {
                        THIS.render_e911_dialog(_data.data.dash_e911 || {}, function(e911_data) {
                            _data.data.dash_e911 = $.extend({}, _data.data.dash_e911, e911_data);

                            THIS.clean_phone_number_data(_data.data);

                            winkstart.confirm(i18n.t('pbxs.pbxs_manager.charge_reminder_line1') + '<br/><br/>' + i18n.t('pbxs.pbxs_manager.charge_reminder_line2'),
                                function() {
                                    THIS.update_number(phone_number[1], _data.data, function(_data_update) {
                                            !($.isEmptyObject(_data.data.dash_e911)) ? $e911_cell.removeClass('inactive').addClass('active') : $e911_cell.removeClass('active').addClass('inactive');
                                            toastr.success(i18n.t('pbxs.pbxs_manager.success_e911', {variable: winkstart.format_phone_number(phone_number[1])}));
                                        },
                                        function(_data_update) {
                                            winkstart.alert(i18n.t('pbxs.pbxs_manager.error_update_e911') + '' + _data_update.message);
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });

            $('#remove_numbers', pbxs_manager_html).click(function() {
                var data_phone_number,
                    phone_number,
                    $selected_numbers = $('.number-wrapper.selected', pbxs_manager_html),
                    nb_numbers = $selected_numbers.size();

                if(nb_numbers > 0) {
                    winkstart.confirm(i18n.t('pbxs.pbxs_manager.remove_number_confirmation'), function() {
                            var array_DIDs = [];

                            $selected_numbers.each(function() {
                                data_phone_number = $(this).data('phone_number'),
                                phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                                if(phone_number[1]) {
                                    array_DIDs.push('+1' + phone_number[1]);
                                }
                            });

                            THIS.get_account(function(_global_data) {
                                $.each(array_DIDs, function(i, k) {
                                    if(k in _global_data.data.servers[server_id].DIDs) {
                                        delete _global_data.data.servers[server_id].DIDs[k]
                                    }
                                });

                                THIS.update_old_trunkstore(_global_data.data,
                                    function() {
                                        THIS.refresh_unassigned_list();
                                        THIS.list_numbers_by_pbx(server_id, callback_listing);

                                        $('#trigger_links', pbxs_manager_html).hide();
                                    },
                                    function() {
                                        THIS.list_numbers_by_pbx(server_id, callback_listing);
                                    }
                                );
                            });
                        },
                        function() {

                        }
                    );
                }
                else {
                    winkstart.alert(i18n.t('pbxs.pbxs_manager.no_number_selected'));
                }
            });

            (target || $('#ws-content'))
                .empty()
                .append(pbxs_manager_html);
        },

        render_cnam_dialog: function(cnam_data, callback) {
            var THIS = this,
                popup_html = THIS.templates.cnam_dialog.tmpl(cnam_data || {}),
                popup;

            $('button.btn.btn-success', popup_html).click(function(ev) {
                ev.preventDefault();

                var cnam_form_data = form2object('cnam');

                if(typeof callback === 'function') {
                    callback(cnam_form_data);
                }

                popup.dialog('destroy').remove();
            });

            popup = winkstart.dialog(popup_html, {
                title: i18n.t('pbxs.pbxs_manager.caller_id_dialog_title')
            });
        },

        render_failover_dialog: function(failover_data, callback) {
            var THIS = this,
                radio = (failover_data || {}).e164 ? 'number' : ((failover_data || {}).sip ? 'sip' : ''),
                tmpl_data = {
                    radio: radio,
                    failover: (failover_data || {}).e164 || (failover_data || {}).sip || '',
                    phone_number: failover_data.phone_number || ''
                },
                popup_html = THIS.templates.failover_dialog.tmpl(tmpl_data),
                popup,
                result,
                popup_title = i18n.t('pbxs.pbxs_manager.failover_title');

            $('.failover-block input', popup_html).on('keyup', function() {
                $('.failover-block', popup_html).removeClass('selected');
                $('.failover-block:not([data-type="'+$(this).parents('.failover-block').first().data('type')+'"]) input[type="text"]', popup_html).val('');

                $(this).parents('.failover-block').addClass('selected');
            });

            $('.failover-block[data-type="'+radio+'"]', popup_html).addClass('selected');
            $('.failover-block:not([data-type="'+radio+'"]) input', popup_html).val('');

            $('.submit_btn', popup_html).click(function(ev) {
                ev.preventDefault();

                var failover_form_data = {},
                    type = $('.failover-block.selected', popup_html).data('type');

                if(type === 'number' || type === 'sip') {
                    failover_form_data.raw_input = $('.failover-block[data-type="'+type+'"] input', popup_html).val();

                    if(failover_form_data.raw_input.match(/^sip:/)) {
                        failover_form_data.sip = failover_form_data.raw_input;
                    }
                    else if(result = failover_form_data.raw_input.replace(/-|\(|\)|\s/g,'').match(/^\+?1?([2-9]\d{9})$/)) {
                        failover_form_data.e164 = '+1' + result[1];
                    }
                    else {
                        failover_form_data.e164 = '';
                    }

                    delete failover_form_data.raw_input;

                    if(failover_form_data.e164 || failover_form_data.sip) {
                        if(typeof callback === 'function') {
                            callback(failover_form_data);
                        }

                        popup.dialog('destroy').remove();
                    }
                    else {
                        winkstart.alert(i18n.t('pbxs.pbxs_manager.invalid_failover_number'));
                    }
                }
                else {
                    winkstart.alert(i18n.t('pbxs.pbxs_manager.no_data_failover'));
                }
            });

            $('.remove_failover', popup_html).click(function(ev) {
                ev.preventDefault();
                if(typeof callback === 'function') {
                    callback({ e164: '', sip: '' });
                }

                popup.dialog('destroy').remove();
            });

            popup = winkstart.dialog(popup_html, {
                title: popup_title,
                width: '540px'
            });
        },

        render_e911_dialog: function(e911_data, callback) {
            var THIS = this,
                popup_html = THIS.templates.e911_dialog.tmpl(e911_data || {}),
                popup;

            $('#postal_code', popup_html).blur(function() {
                $.getJSON('http://www.geonames.org/postalCodeLookupJSON?&country=US&callback=?', { postalcode: $(this).val() }, function(response) {
                    if (response && response.postalcodes.length && response.postalcodes[0].placeName) {
                        $('#locality', popup_html).val(response.postalcodes[0].placeName);
                        $('#region', popup_html).val(response.postalcodes[0].adminName1);
                    }
                });
            });

            $('.inline_field > input', popup_html).keydown(function() {
                $('.gmap_link_div', popup_html).hide();
            });

            if(e911_data.latitude && e911_data.longitude) {
                var href = 'http://maps.google.com/maps?q='+ e911_data.latitude + ',+' + e911_data.longitude + '+(' + i18n.t('pbxs.pbxs_manager.gmap_pin_label') + ')&iwloc=A&hl=en';
                $('#gmap_link', popup_html).attr('href', href);
                $('.gmap_link_div', popup_html).show();
            }

            $('.submit_btn', popup_html).click(function(ev) {
                ev.preventDefault();

                var e911_form_data = form2object('e911');

                if(typeof callback === 'function') {
                    callback(e911_form_data);
                }

                popup.dialog('destroy').remove();
            });

            popup = winkstart.dialog(popup_html, {
                title: i18n.t('pbxs.pbxs_manager.e911_dialog_title')
            });
        },

        render_add_number_dialog: function(global_data, index, callback) {
            var THIS = this,
                numbers_data = [],
                popup_html = THIS.templates.add_number_dialog.tmpl(),
                popup;

            $('.toggle_div', popup_html).hide();

            $('#search_numbers_button', popup_html).click(function(ev) {
                $('.toggle_div', popup_html).hide();

                var npa_data = {},
                    npa = $('#sdid_npa', popup_html).val();
                    //nxx = $('#sdid_nxx', popup_html).val();

                ev.preventDefault();

                npa_data.prefix = npa;// + nxx;

                THIS.search_numbers(npa_data, function(results_data) {
                    var results_html = THIS.templates.add_number_search_results.tmpl({numbers: results_data.data});

                    $('#foundDIDList', popup_html)
                        .empty()
                        .append(results_html);

                    $('.selected_numbers', popup_html).html('0');
                    $('.cost_numbers', popup_html).html('$0.00');

                    $('.toggle_div', popup_html).show();
                });
            });

            $('#add_numbers_button', popup_html).click(function(ev) {
                ev.preventDefault();

                winkstart.confirm(i18n.t('pbxs.pbxs_manager.charge_reminder_line1') + '<br/><br/>' + i18n.t('pbxs.pbxs_manager.charge_reminder_line2'),
                    function() {
                        $('#foundDIDList .number-box.selected', popup_html).each(function() {
                            numbers_data.push($(this).data());
                        });

                        THIS.get_account(function(global_data) {
                            THIS.add_numbers(global_data, index, numbers_data, function() {
                                if(typeof callback === 'function') {
                                    callback();
                                }

                                popup.dialog('close');
                            });
                        });
                    }
                );
            });

            $(popup_html).delegate('.number-box', 'click', function(event) {
                $(this).toggleClass('selected');

                if(!$(event.target).is('input:checkbox')) {
                    var $current_cb = $('input[type="checkbox"]', $(this)),
                        cb_value = $current_cb.prop('checked');

                    $current_cb.prop('checked', !cb_value);
                }

                var selected_numbers =  $('.number-box.selected', popup_html).size(),
                    sum_price = 0;

                $.each($('.number-box.selected', popup_html), function() {
                    sum_price += parseFloat($(this).data('price'));
                });

                sum_price = '$'+sum_price+'.00';

                $('.selected_numbers', popup_html).html(selected_numbers);
                $('.cost_numbers', popup_html).html(sum_price);
            });

            popup = winkstart.dialog(popup_html, {
                title: i18n.t('pbxs.pbxs_manager.buy_dialog_title'),
                width: '600px',
                position: ['center', 20]
            });
        },

        render_port_dialog: function(callback) {
            var THIS = this,
                port_form_data = {},
                popup_html = THIS.templates.port_dialog.tmpl({
                    company_name: winkstart.config.company_name || '2600hz',
                    support_email: (winkstart.config.port || {}).support_email || 'support@2600hz.com',
                    support_file_upload: (File && FileReader)
                }),
                popup,
                files,
                loa,
                phone_numbers,
                current_step = 1,
                max_steps = 4,
                $prev_step = $('.prev_step', popup_html),
                $next_step = $('.next_step', popup_html),
                $submit_btn = $('.submit_btn', popup_html);

            /* White label links, have to do it in JS because template doesn't eval variables in href :( */
            $('#loa_link', popup_html).attr('href', ((winkstart.config.port || {}).loa) || 'http://www.2600hz.com/loa');
            $('#resporg_link', popup_html).attr('href', ((winkstart.config.port || {}).resporg) || 'http://www.2600hz.com/resporg');
            $('#features_link', popup_html).attr('href', ((winkstart.config.port || {}).features) || 'http://www.2600hz.com/features');
            $('#terms_link', popup_html).attr('href', ((winkstart.config.port || {}).terms) || 'http://www.2600hz.com/terms');

            $('.step_div:not(.first)', popup_html).hide();
            $prev_step.hide();
            $submit_btn.hide();

            $('.other_carrier', popup_html).hide();

            $('.carrier_dropdown', popup_html).change(function() {
                if($(this).val() === 'Other') {
                    $('.other_carrier', popup_html).show();
                }
                else {
                    $('.other_carrier', popup_html).empty().hide();
                }
            });

            $('#postal_code', popup_html).blur(function() {
                $.getJSON('http://www.geonames.org/postalCodeLookupJSON?&country=US&callback=?', { postalcode: $(this).val() }, function(response) {
                    if (response && response.postalcodes.length && response.postalcodes[0].placeName) {
                        $('#locality', popup_html).val(response.postalcodes[0].placeName);
                        $('#region', popup_html).val(response.postalcodes[0].adminName1);
                    }
                });
            });

            $('.prev_step', popup_html).click(function() {
                $next_step.show();
                $submit_btn.hide();
                $('.step_div', popup_html).hide();
                $('.step_div:nth-child(' + --current_step + ')', popup_html).show();
                $('.wizard_nav .steps_text li, .wizard_nav .steps_image .round_circle').removeClass('current');
                $('#step_title_'+current_step +', .wizard_nav .steps_image .round_circle:nth-child('+ current_step +')', popup_html).addClass('current');

                current_step === 1 ? $('.prev_step', popup_html).hide() : true;
            });

            $('.next_step', popup_html).click(function() {
                $prev_step.show();
                $('.step_div', popup_html).hide();
                $('.step_div:nth-child(' + ++current_step + ')', popup_html).show();
                $('.wizard_nav .steps_text li, .wizard_nav .steps_image .round_circle').removeClass('current');
                $('#step_title_'+current_step +', .wizard_nav .steps_image .round_circle:nth-child('+ current_step +')', popup_html).addClass('current');
                if(current_step === max_steps) {
                    $next_step.hide();
                    $submit_btn.show();
                }
            });

            $('.loa', popup_html).change(function(ev) {
                var slice = [].slice,
                    raw_files = slice.call(ev.target.files, 0),
                    file_reader = new FileReader(),
                    file_name,
                    read_file = function(file) {
                        file_name = file.fileName || file.name || 'noname';
                        file_reader.readAsDataURL(file);
                    };

                loa = [];

                file_reader.onload = function(ev) {
                    loa.push({
                        file_name: file_name,
                        file_data: ev.target.result
                    });

                    if(raw_files.length > 1) {
                        raw_files = raw_files.slice(1);
                        read_file(raw_files[0]);
                    }
                };

                read_file(raw_files[0]);
            });

            $('.files', popup_html).change(function(ev) {
                var slice = [].slice,
                    raw_files = slice.call(ev.target.files, 0),
                    file_reader = new FileReader(),
                    file_name,
                    read_file = function(file) {
                        file_name = file.fileName || file.name || 'noname';
                        file_reader.readAsDataURL(file);
                    };

                files = [];

                file_reader.onload = function(ev) {
                    files.push({
                        file_name: file_name,
                        file_data: ev.target.result
                    });

                    if(raw_files.length > 1) {
                        raw_files = raw_files.slice(1);
                        read_file(raw_files[0]);
                    }
                    else {
                        $('.number_of_docs', popup_html).html(files.length);
                    }
                };

                read_file(raw_files[0]);
            });

            $('.submit_btn', popup_html).click(function(ev) {
                ev.preventDefault();
                port_form_data = form2object('port');

                var string_alert = '';

                if($('.carrier_dropdown', popup_html).val() === 'Other') {
                    port_form_data.port.service_provider = $('.other_carrier', popup_html).val();
                }

                if(!port_form_data.extra.agreed) {
                    string_alert += i18n.t('pbxs.pbxs_manager.agree_to_the_terms') + '<br/>';
                }

                $.each(port_form_data.extra.cb, function(k, v) {
                    if(v === false) {
                        string_alert += i18n.t('pbxs.pbxs_manager.confirm_conditions') + '<br/>';
                        return false;
                    }
                });

                port_form_data.phone_numbers = $('.numbers_text', popup_html).val().replace(/\n/g,',');
                port_form_data.phone_numbers = port_form_data.phone_numbers.replace(/[\s-\(\)\.]/g, '').split(',');

                port_form_data.port.main_number = port_form_data.port.main_number.replace(/[\s-\(\)\.]/g, '');

                var res = port_form_data.port.main_number.match(/^\+?1?([2-9]\d{9})$/);
                res ? port_form_data.port.main_number = '+1' + res[1] : string_alert += i18n.t('pbxs.pbxs_manager.enter_main_number') + '<br/>';

                port_form_data.phone_numbers.push(port_form_data.port.main_number);

                phone_numbers = [];
                $.each(port_form_data.phone_numbers, function(i, val) {
                    var result = val.match(/^\+?1?([2-9]\d{9})$/);

                    if(result) {
                        phone_numbers.push('+1' + result[1]);
                    }
                    else {
                        if(val !== '') {
                            string_alert += val + ' : '+ i18n.t('pbxs.pbxs_manager.invalid_number') + '<br/>';
                        }
                    }
                });
                port_form_data.phone_numbers = phone_numbers;

                files ? port_form_data.files = files : string_alert += i18n.t('pbxs.pbxs_manager.upload_bill') + '<br/>';
                loa ? port_form_data.loa = loa : string_alert += i18n.t('pbxs.pbxs_manager.upload_loa') + '<br/>';

                if(string_alert === '') {
                    delete port_form_data.extra;

                    if(typeof callback === 'function') {
                        callback(port_form_data, popup);
                    }
                }
                else {
                    winkstart.alert(string_alert);
                }
            });

            popup = winkstart.dialog(popup_html, {
                title: i18n.t('pbxs.pbxs_manager.port_dialog_title')
            });
        },

        refresh_unassigned_list: function(_parent, _callback) {
            var THIS = this,
                parent = _parent || $('#list_pbxs_navbar');

            THIS.list_available_numbers(function(unassigned_numbers) {
                $('#unassigned_numbers_wrapper', parent).empty()
                                                        .append(THIS.templates.pbxs_unassigned_numbers.tmpl({ unassigned_numbers: unassigned_numbers}));

                $('#unassigned_numbers_count', parent).empty()
                                                      .html(unassigned_numbers.length);

                if(typeof _callback === 'function') {
                    _callback();
                }
            });

        },

        bind_events: function(parent) {
            var THIS = this,
                server_id;

            //$('#unassigned_numbers_wrapper .unassigned-number', parent).draggable();
            $('.link-box.assign', parent).click(function() {
                var numbers_data = [];

                $('#unassigned_numbers .unassigned-number.selected', parent).each(function(k, v) {
                    if($(v).data('phone_number')) {
                        numbers_data.push($(this).data('phone_number'));
                    }
                });

                if(server_id >= 0) {
                    THIS.get_account(function(global_data) {
                        $.each(numbers_data, function(k, v) {
                            global_data.data.servers[server_id].DIDs[v] = {};
                        });

                        THIS.update_old_trunkstore(global_data.data, function() {
                            THIS.refresh_unassigned_list();
                            THIS.list_numbers_by_pbx(server_id, function(cb_data) {
                                THIS.refresh_list_numbers(cb_data, parent);
                            });
                        });
                    });
                }
                else {
                    winkstart.alert(i18n.t('pbxs.pbxs_manager.no_pbx_selected'));
                }
            });

            $('#unassigned_numbers_header', parent).on('click', function() {
                $('#unassigned_numbers', parent).toggleClass('open');
            });

            $('#unassigned_numbers', parent).on('click', '.unassigned-number', function(event) {
                $(this).toggleClass('selected');

                if(!$(event.target).is('input:checkbox')) {
                    var $current_cb = $('input[type="checkbox"]', $(this)),
                        cb_value = $current_cb.prop('checked');

                    $current_cb.prop('checked', !cb_value);
                }
            });

            $(parent).on('click', '#pbxs_manager_listpanel .pbx-wrapper', function() {
                $('#pbxs_manager_listpanel .pbx-wrapper', parent).removeClass('selected');
                server_id = $(this).data('id');
                winkstart.publish('pbxs_manager.edit', { id: server_id });
                $(this).addClass('selected');
            });

            $('#add_pbx', parent).on('click', function() {
                winkstart.publish('pbxs_manager.edit', {});
            });

            $('.link-box.delete', parent).on('click', function() {
                var data_phone_number,
                    phone_number,
                    $selected_numbers = $('.unassigned-number.selected', parent),
                    nb_numbers = $selected_numbers.size(),
                    refresh_list = function() {
                        nb_numbers--;
                        if(nb_numbers === 0) {
                            THIS.refresh_unassigned_list(parent);
                        }
                    };

                if(nb_numbers > 0) {
                    winkstart.confirm(i18n.t('pbxs.pbxs_manager.delete_numbers_confirmation'), function() {
                            $selected_numbers.each(function() {
                                data_phone_number = $(this).data('phone_number'),
                                phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                                if(phone_number[1]) {
                                    THIS.delete_number(phone_number[1],
                                        function() {
                                            refresh_list();
                                        },
                                        function() {
                                            refresh_list();
                                        }
                                    );
                                }
                            });
                        },
                        function() {
                        }
                    );
                }
                else {
                    winkstart.alert(i18n.t('pbxs.pbxs_manager.no_number_selected'));
                }
            });

            $('#unassigned_numbers .search-query', parent).keyup(function() {
                var input = $(this),
                    rows = $('#unassigned_numbers .content .unassigned-number', parent),
                    search_string = $.trim(input.val().toLowerCase()),
                    matches = [],
                    cache = {};

                $.each(rows, function(k, v) {
                    var data = $(this).data(),
                        key = data.phone_number;

                    cache[key] = $(this);
                });

                $('#empty_search', parent).hide();

                if (!search_string) {
                    rows.show();
                }
                else {
                    rows.hide();
                    $.each(cache, function(phone_number, row_array) {
                        if (phone_number.indexOf(search_string)>-1) {
                            matches.push(row_array);
                        }
                    });

                    if(matches.length > 0) {
                        $.each(matches, function(k, v) {
                            $(v).show();
                        });
                    }
                    else {
                        $('#empty_search', parent).show();
                    }
                }
            });
        },

        render_list: function(_id, _parent, _callback) {
            var THIS = this,
                callback = _callback,
                parent = _parent || $('#ws-content'),
                id = _id || -1;

            THIS.list_servers(function(data, status) {
                THIS.refresh_unassigned_list(parent, function() {
                    $('#list_pbxs_navbar', parent).show();
                    $('#unassigned_numbers', parent).show();

                    var map_crossbar_data = function(data) {
                        var new_list = [];

                        if(data.length > 0) {
                            var i = 0;
                            $.each(data, function(key, val) {
                                new_list.push({
                                    id: i,
                                    name: val.server_name || '(no name)'
                                });
                                i++;
                            });
                        }

                        new_list.sort(function(a, b) {
                            return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
                        });

                        return new_list;
                    };

                    $('#list_pbxs_navbar #pbxs_manager_listpanel', parent).empty()
                                                                          .append(THIS.templates.pbxs_list_element.tmpl({numbers: map_crossbar_data(data)}))
                                                                          .show();

                    if(id && id > -1) {
                        $('#list_pbxs_navbar #pbxs_manager_listpanel .pbx-wrapper[data-id='+id+']', parent).addClass('selected');
                    }

                    $.each(data, function(k, v) {
                        var img_link = v.server_type ? v.server_type.replace('.','').toLowerCase() : 'other';

                        $.inArray(img_link, THIS.list_available_pbxs()) < 0 ? img_link = 'other' : true;

                        $('#pbxs_manager_listpanel .pbx-wrapper[data-id="'+k+'"] .img-wrapper', parent).append('<img class="img_style" src="whapps/pbxs/pbxs_manager/css/images/endpoints/'+ img_link +'.png" height="49" width=72"/>');
                    });

                    if(typeof callback === 'function') {
                        callback(data);
                    }
                });
            });
        },

        activate: function(_parent) {
            var THIS = this,
                pbxs_manager_html = THIS.templates.pbxs_manager.tmpl(),
                parent = _parent || $('#ws-content');

            (parent)
                .empty()
                .append(pbxs_manager_html);

            THIS.render_list(-1, parent, function(data) {
                THIS.bind_events(parent);

                if(data.length === 0) {
                    winkstart.publish('pbxs_manager.edit', {});
                }
                else if(data.length === 1) {
                    winkstart.publish('pbxs_manager.edit', { id: 0 });

                    $('.pbx-wrapper', parent).addClass('selected');
                }
            });

        },

        list_numbers_by_pbx: function(id, callback) {
            var THIS = this;

            if(id || id > -1) {
                THIS.list_all_numbers(function(_data_numbers) {
                    THIS.get_account(function(_data) {
                            var json_data = {};
                            /*var tab_data = [],
                                cnam,
                                dash_e911,
                                failover;*/

                            $.each(_data.data.servers[id].DIDs, function(k, v) {
                                if(_data_numbers.data[k]) {
                                    /*cnam = $.inArray('cnam', _data_numbers.data[k].features) > -1 ? true : false;
                                    failover = $.inArray('failover', _data_numbers.data[k].features) > -1 ? true : false;
                                    dash_e911 = $.inArray('dash_e911', _data_numbers.data[k].features) > -1 ? true : false;*/
                                    if(k != 'id' && _data_numbers.data[k]) {
                                        //tab_data.push(['lol', k/*, failover, cnam, dash_e911*/, _data_numbers.data[k].state]);
                                        json_data[k] = _data_numbers.data[k].state;
                                    }
                                }
                            });

                            if(typeof callback === 'function') {
                                callback(json_data);
                            }
                        }
                    );
                });
            }
        },

        list_available_numbers: function(callback) {
            var THIS = this;

            THIS.list_all_numbers(function(_data_numbers) {
                THIS.get_account(function(_data) {
                    THIS.list_callflows(function(_data_callflows) {
                        var tab_data = [];

                        //Remove numbers used in trunkstore
                        $.each(_data.data.servers, function(k, v) {
                            $.each(this.DIDs, function(k2, v2) {
                                delete _data_numbers.data[k2];
                            });
                        });

                        //Remove numbers used in callflows
                        $.each(_data_callflows.data, function(k, v) {
                            if(this.numbers) {
                                $.each(this.numbers, function(k2, v2) {
                                    delete _data_numbers.data[v2];
                                });
                            }
                        });

                        //Build available numbers list
                        $.each(_data_numbers.data, function(k, v) {
                            if(k !== 'id') {
                                tab_data.push(k);
                            }
                        });

                        if(typeof callback === 'function') {
                            callback(tab_data);
                        }
                    });
                });
            });
        }
    }
);
