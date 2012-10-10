winkstart.module('pbxs', 'pbxs_manager', {
        css: [
            'css/pbxs_manager.css',
            'css/numbers_popup.css',
            'css/endpoints.css'
        ],

        templates: {
            pbxs_manager: 'tmpl/pbxs_manager.html',
            failover_dialog: 'tmpl/failover_dialog.html',
            cnam_dialog: 'tmpl/cnam_dialog.html',
            e911_dialog: 'tmpl/e911_dialog.html',
            assign_number_dialog: 'tmpl/assign_number_dialog.html',
            move_number_dialog: 'tmpl/move_number_dialog.html',
            add_number_dialog: 'tmpl/add_number_dialog.html',
            add_number_search_results: 'tmpl/add_number_search_results.html',
            endpoint: 'tmpl/endpoint.html',
            endpoint_numbers: 'tmpl/endpoint_numbers.html'
        },

        subscribe: {
            'pbxs_manager.activate' : 'activate',
            'pbxs_manager.edit' : 'edit_server'
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
                            if(status == 400 && _data.message.match(/credit\ card/)) {
                                alert('Whoops! It appears you have no credit card on file. ' +
                                      'You must have a credit card on file before signing up.\n\n' +
                                      'To enter a credit card:\n' +
                                      '1) Click on your account name in the upper righthand corner of Winkstart.\n' +
                                      '2) Click on the Billing Account tab.\n' +
                                      '3) Fill out your credit card information, then press save.');
                            }
                            else {
                                alert('An error occurred during the signup process,' +
                                      ' please try again later! (Error: ' + status + ')');
                            }
                        }
                    );
                }
            });
        },

        edit_server: function(data, _parent, _target, _callbacks, data_defaults) {
            var THIS = this,
                parent = _parent || $('#pbxs_manager-content'),
                target = _target || $('#pbxs_manager-view', parent),
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                        THIS.render_list(parent);

                        //todo index
                        THIS.edit_server({ id: (data.id === 0 || data.id) ? data.id : _data.data.servers.length-1 }, parent, target, callbacks);
                    },

                    save_error: _callbacks.save_error,

                    delete_success: _callbacks.delete_success || function() {
                        target.empty();

                        THIS.render_list(parent);
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
                                auth: {},
                                options: {
                                    e911_info: {}
                                },
                                extra: {
                                    realm: _data_account.data.realm,
                                    id: data.id || (data.id === 0 ? 0 : 'new')
                                }
                            }, data_defaults || {});

                        if(typeof data === 'object' && (data.id || data.id === 0)) {
                            //THIS.render_endpoint(_data, $.extend(true, defaults, _data.data.servers[data.id]), target, callbacks);
                            THIS.render_pbxs_manager(_data, $.extend(true, defaults, _data.data.servers[data.id]), target, callbacks);
                        }
                        else {
                            THIS.render_endpoint(_data, defaults, target, callbacks);
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

            /* Clean e911 */
        },

        normalize_endpoint_data: function(data) {
            delete data.serverid;
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
                winkstart.alert('You need to specify a name for this PBX.');
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

        popup_endpoint_settings: function(data, endpoint_data, callbacks) {
            var THIS = this,
                popup = winkstart.dialog($('<div class="inline_popup"><div class="inline_content main_content"/></div>'), {
                    title: 'Edit Settings of '+ endpoint_data.server_name,
                    position: ['center', 100]
                });

            THIS.render_endpoint(data, endpoint_data, $('.main_content', popup), {
                save_success: function(_data) {
                    popup.dialog('close');

                    if(callbacks && typeof callbacks.save_success == 'function') {
                        callbacks.save_success(_data);
                    }
                },
                delete_success: function() {
                    popup.dialog('close');

                    if(callbacks && typeof callbacks.delete_success == 'function') {
                        callbacks.delete_success();
                    }
                }
            });
        },

        render_endpoint: function(data, endpoint_data, target, callbacks) {

            if(!endpoint_data.server_name) {
                endpoint_data.server_name = null;
            }

            var THIS = this,
                endpoint_html = THIS.templates.endpoint.tmpl(endpoint_data);

            $.each($('.pbxs .pbx', endpoint_html), function() {
                if($(this).dataset('pbx_name') === endpoint_data.server_type) {
                    $(this).addClass('selected');
                    $('.pbxs .pbx:not(.selected)', endpoint_html).css('opacity', '0.5');
                    return false;
                }
            });

            if(endpoint_data.server_type && $('.pbxs .pbx.selected', endpoint_html).size() === 0) {
                $('.pbxs .pbx.other', endpoint_html).addClass('selected');
                $('.pbxs .pbx:not(.selected)', endpoint_html).css('opacity', '0.5');
            }

            if(!endpoint_data.server_type) {
                $('.info_pbx', endpoint_html).hide();
            }

            $('.endpoint.edit', endpoint_html).click(function(ev) {
                ev.preventDefault();
                var form_data = form2object('endpoint');
                form_data.server_type = $('.pbxs .selected', endpoint_html).dataset('pbx_name');
                if(form_data.server_type === 'other') {
                    form_data.server_type = $('#other_name', endpoint_html).val();
                }

                THIS.get_account(function(global_data) {
                    THIS.save_endpoint(form_data, global_data, function(_data) {
                        if(typeof callbacks.save_success == 'function') {
                            callbacks.save_success(_data);
                        }
                    });
                });
            });

            $('.endpoint.delete', endpoint_html).click(function(ev) {
                ev.preventDefault();

                data.data.servers.splice(endpoint_data.extra.id, 1);

                THIS.update_old_trunkstore(data.data, callbacks.delete_success);
            });

            $('.pbxs .pbx', endpoint_html).click(function() {
                $('.info_pbx', endpoint_html).show();
                $('.pbxs .pbx', endpoint_html).removeClass('selected').css('opacity', '0.5');
                $(this).addClass('selected');

                $('.selected_pbx_block', endpoint_html).slideDown('fast');
                $('.selected_pbx', endpoint_html).html($('.pbxs .selected', endpoint_html).dataset('pbx_name'));

                if($(this).hasClass('other')) {
                    $('.selected_pbx_block', endpoint_html).hide();
                    $('.other_name_wrapper', endpoint_html).slideDown();
                    $('#other_name', endpoint_html).focus();
                }
                else {
                    $('.other_name_wrapper', endpoint_html).hide();
                    $('.selected_pbx_block', endpoint_html).slideDown();
                    $('input[name="auth.auth_user"]', endpoint_html).focus();
                }
            });

            (target)
                .empty()
                .append(endpoint_html);

            /* Hack to display the selected PBX first in the list
               Or if new, scroll to the first pbx */
            $('.pbxs', endpoint_html).animate({ scrollLeft: 0 }, 0);

            var pbx_type = (endpoint_data.server_type || 'other').replace(/\.|\s/g, '').toLowerCase();

            $.inArray(pbx_type, THIS.list_available_pbxs()) < 0 ? pbx_type = 'other' : true;

            var a = $('.pbxs', endpoint_html).offset().left,
                b = endpoint_data.server_type ? $('.pbxs .' + pbx_type, endpoint_html).offset().left : a;

            $('.pbxs', endpoint_html).animate({ scrollLeft: b-a }, 0);
        },

        render_pbxs_manager: function(data, endpoint_data, target, callbacks) {
            var THIS = this,
                pbxs_manager_html = THIS.templates.endpoint_numbers.tmpl(endpoint_data),
                server_id = endpoint_data.extra.id;

            THIS.setup_table(pbxs_manager_html);

            $('#select_all_numbers', pbxs_manager_html).click(function() {
                $('.select_number', pbxs_manager_html).prop('checked', $(this).is(':checked'));
            });

            $('.detail_pbx', pbxs_manager_html).click(function() {
                THIS.popup_endpoint_settings(data, endpoint_data, callbacks);
            });

            $('#assign_number', pbxs_manager_html).click(function() {
                THIS.render_assign_number_dialog(server_id, function() {
                    THIS.list_numbers_by_pbx(server_id);
                });
            });

            $('#move_numbers', pbxs_manager_html).click(function(ev) {
                var list_numbers = [];
                $('.select_number:checked', pbxs_manager_html).each(function() {
                    list_numbers.push($(this).parents('tr').attr('id'));
                });

                THIS.get_account(function(_global_data) {
                    THIS.render_move_number_dialog(list_numbers, _global_data, server_id, function() {
                        THIS.list_numbers_by_pbx(server_id);
                    });
                });
            });

            $(pbxs_manager_html).delegate('.failover', 'click', function() {
                var $failover_cell = $(this),
                    data_phone_number = $failover_cell.parents('tr').first().attr('id'),
                    phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                if(phone_number[1]) {
                    THIS.get_number(phone_number[1], function(_data) {
                        THIS.render_failover_dialog(_data.data.failover || {}, function(failover_data) {
                            _data.data.failover = $.extend({}, _data.data.failover, failover_data);

                            THIS.clean_phone_number_data(_data.data);

                            winkstart.confirm('Your on-file credit card will immediately be charged for any changes you make. If you have changed any recurring services, new charges will be pro-rated for your billing cycle.<br/><br/>Are you sure you want to continue?',
                                function() {
                                    THIS.update_number(phone_number[1], _data.data, function(_data_update) {
                                            !($.isEmptyObject(_data.data.failover)) ? $failover_cell.removeClass('inactive').addClass('active') : $failover_cell.removeClass('active').addClass('inactive');
                                        },
                                        function(_data_update) {
                                            winkstart.alert('Failed to update the Failover for this phone number<br/>Error: '+_data_update.message);
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });

            $(pbxs_manager_html).delegate('.cid', 'click', function() {
                var $cnam_cell = $(this),
                    data_phone_number = $cnam_cell.parents('tr').first().attr('id'),
                    phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                if(phone_number[1]) {
                    THIS.get_number(phone_number[1], function(_data) {
                        THIS.render_cnam_dialog(_data.data.cnam || {}, function(cnam_data) {
                            _data.data.cnam = $.extend({}, _data.data.cnam, cnam_data);

                            THIS.clean_phone_number_data(_data.data);

                            winkstart.confirm('Your on-file credit card will immediately be charged for any changes you make. If you have changed any recurring services, new charges will be pro-rated for your billing cycle.<br/><br/>Are you sure you want to continue?',
                                function() {
                                    THIS.update_number(phone_number[1], _data.data, function(_data_update) {
                                            !($.isEmptyObject(_data.data.cnam)) ? $cnam_cell.removeClass('inactive').addClass('active') : $cnam_cell.removeClass('active').addClass('inactive');
                                        },
                                        function(_data_update) {
                                            winkstart.alert('Failed to update the Caller-ID for this phone number<br/>Error: '+_data_update.message);
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });

            $(pbxs_manager_html).delegate('.e911', 'click', function() {
                var $e911_cell = $(this),
                    data_phone_number = $e911_cell.parents('tr').first().attr('id'),
                    phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                if(phone_number[1]) {
                    THIS.get_number(phone_number[1], function(_data) {
                        THIS.render_e911_dialog(_data.data.dash_e911 || {}, function(e911_data) {
                            _data.data.dash_e911 = $.extend({}, _data.data.dash_e911, e911_data);

                            THIS.clean_phone_number_data(_data.data);

                            winkstart.confirm('Your on-file credit card will immediately be charged for any changes you make. If you have changed any recurring services, new charges will be pro-rated for your billing cycle.<br/><br/>Are you sure you want to continue?',
                                function() {
                                    THIS.update_number(phone_number[1], _data.data, function(_data_update) {
                                            !($.isEmptyObject(_data.data.dash_e911)) ? $e911_cell.removeClass('inactive').addClass('active') : $e911_cell.removeClass('active').addClass('inactive');
                                        },
                                        function(_data_update) {
                                            winkstart.alert('Failed to update the e911 for this phone number<br/>Error: '+_data_update.message);
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });

            $('#delete_number', pbxs_manager_html).click(function() {
                var data_phone_number,
                    phone_number,
                    $selected_checkboxes = $('.select_number:checked', pbxs_manager_html),
                    nb_numbers = $selected_checkboxes.size();

                if(nb_numbers > 0) {
                    winkstart.confirm('Are you sure you want to remove the '+nb_numbers+' number(s) selected from this PBX?', function() {
                            var array_DIDs = [];

                            $selected_checkboxes.each(function() {
                                data_phone_number = $(this).parents('tr').attr('id'),
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
                                    function() {;
                                        THIS.list_numbers_by_pbx(server_id);
                                    },
                                    function() {
                                        THIS.list_numbers_by_pbx(server_id);
                                    }
                                );
                            });
                        },
                        function() {

                        }
                    );
                }
                else {
                    winkstart.alert('You didn\'t select any number to delete');
                }
            });

            THIS.list_numbers_by_pbx(server_id, function() {
                (target || $('#pbxs_manager-content'))
                    .empty()
                    .append(pbxs_manager_html);
            });
        },

        render_cnam_dialog: function(cnam_data, callback) {
            var THIS = this,
                popup_html = THIS.templates.cnam_dialog.tmpl(cnam_data || {}),
                popup;

            $('.submit_btn', popup_html).click(function(ev) {
                ev.preventDefault();

                var cnam_form_data = form2object('cnam');

                if(typeof callback === 'function') {
                    callback(cnam_form_data);
                }

                popup.dialog('close');
            });

            popup = winkstart.dialog(popup_html, {
                title: 'Edit CID'
            });
        },

        render_move_number_dialog: function(list_numbers, data, index, callback) {
            var THIS = this,
                popup,
                servers = {};

            $.each(data.data.servers, function(k, v) {
                if(k != index) {
                    servers[k] = v;
                }
            });

            var popup_html = THIS.templates.move_number_dialog.tmpl({ servers: servers });

            $('.move', popup_html).click(function(ev) {
                ev.preventDefault();

                var new_index = parseInt($('#select_pbxs option:selected', popup_html).val());

                THIS.get_account(function(global_data) {
                    $.each(list_numbers, function(k, v) {
                        global_data.data.servers[new_index].DIDs[v] = global_data.data.servers[index].DIDs[v];
                        delete global_data.data.servers[index].DIDs[v];
                    });

                    THIS.update_old_trunkstore(global_data.data, function() {
                        if(typeof callback === 'function') {
                            callback();
                        }

                        popup.dialog('close');
                    });
                });
            });

            popup = winkstart.dialog(popup_html, {
                title: 'Move selected numbers to another PBX'
            });
        },

        render_assign_number_dialog: function(index, callback) {
            var THIS = this,
                popup_html = THIS.templates.assign_number_dialog.tmpl(),
                popup;

            THIS.setup_assign_number_table(popup_html);

            $('.submit_btn', popup_html).click(function(ev) {
                ev.preventDefault();
                var numbers_data = [];

                $('#assign_number-grid .select_number:checked', popup_html).each(function() {
                    numbers_data.push($(this).parents('tr').first().attr('id'));
                });

                THIS.get_account(function(global_data) {
                    $.each(numbers_data, function(k, v) {
                        global_data.data.servers[index].DIDs[v] = {};
                    });

                    THIS.update_old_trunkstore(global_data.data, function() {
                        if(typeof callback === 'function') {
                            callback();
                        }

                        popup.dialog('close');
                    });
                });
            });

            THIS.list_available_numbers(function() {
                popup = winkstart.dialog(popup_html, {
                    title: 'Assign your available phone numbers to this PBX'
                });
            });
        },

        render_failover_dialog: function(failover_data, callback) {
            var THIS = this,
                tmpl_data = {
                    radio: (failover_data || {}).e164 ? 'number' : ((failover_data || {}).sip ? 'sip' : ''),
                    failover: (failover_data || {}).e164 || (failover_data || {}).sip || '',
                    phone_number: failover_data.phone_number || ''
                },
                popup_html = THIS.templates.failover_dialog.tmpl(tmpl_data),
                popup,
                result,
                popup_title = failover_data.phone_number ? 'Setup Failover for ' + failover_data.phone_number : 'Setup Failover';

            $('.radio_block input[type="radio"]', popup_html).click(function() {
                $('.radio_block input[type="text"]', popup_html).hide();

                $(this).siblings('input[type="text"]').show('fast');

                $('.header', popup_html).removeClass('number sip').addClass($('.radio_block input[type="radio"]:checked', popup_html).val());
            });

            $('.submit_btn', popup_html).click(function(ev) {
                ev.preventDefault();

                var failover_form_data = {};

                failover_form_data.raw_input = $('input[name="failover_type"]:checked', popup_html).val() === 'number' ? $('.failover_number', popup_html).val() : $('.failover_sip', popup_html).val();

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

                    popup.dialog('close');
                }
                else {
                    winkstart.alert('Invalid Failover Number, please type it again.');
                }
            });

            $('.remove_failover', popup_html).click(function(ev) {
                ev.preventDefault();
                if(typeof callback === 'function') {
                    callback({ e164: '', sip: '' });
                }

                popup.dialog('close');
            });

            popup = winkstart.dialog(popup_html, {
                title: popup_title,
                width: '640px'
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
                var href = 'http://maps.google.com/maps?q='+ e911_data.latitude + ',+' + e911_data.longitude + '+(Your+E911+Location)&iwloc=A&hl=en';
                $('#gmap_link', popup_html).attr('href', href);
                $('.gmap_link_div', popup_html).show();
            }

            $('.submit_btn', popup_html).click(function(ev) {
                ev.preventDefault();

                var e911_form_data = form2object('e911');

                if(typeof callback === 'function') {
                    callback(e911_form_data);
                }

                popup.dialog('close');
            });

            popup = winkstart.dialog(popup_html, {
                title: e911_data.phone_number ? 'Edit Location for ' + e911_data.phone_number : 'Edit 911 Location',
                width: '465px'
            });
        },

        render_list: function(parent) {
            var THIS = this,
                parent = parent || $('#ws-content');

            THIS.list_servers(function(data, status) {
                var map_crossbar_data = function(data) {
                    var new_list = [];

                    if(data.length > 0) {
                        var i = 0;
                        $.each(data, function(key, val) {
                            new_list.push({
                                id: i,
                                title: val.server_name || '(no name)'
                            });
                            i++;
                        });
                    }

                    new_list.sort(function(a, b) {
                        return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
                    });

                    return new_list;
                };

                $('#pbxs_manager-listpanel', parent)
                    .empty()
                    .listpanel({
                        label: 'PBXs',
                        identifier: 'pbxs_manager-listview',
                        new_entity_label: 'Add Server',
                        data: map_crossbar_data(data),
                        publisher: winkstart.publish,
                        notifyMethod: 'pbxs_manager.edit',
                        notifyCreateMethod: 'pbxs_manager.edit',
                        notifyParent: parent
                    });

                $.each(data, function(k, v) {
                    var img_link = v.server_type ? v.server_type.replace('.','').toLowerCase() : 'other';

                    $.inArray(img_link, THIS.list_available_pbxs()) < 0 ? img_link = 'other' : true;

                    $('#' + k, $('#pbxs_manager-listpanel', parent)).prepend('<span><img class="img_style" src="whapps/pbxs/pbxs_manager/css/images/endpoints/'+ img_link +'.png" height="44" width=62"/></span>');
                });
            });
        },

        activate: function(parent) {
            var THIS = this,
                pbxs_manager_html = THIS.templates.pbxs_manager.tmpl();

            (parent || $('#ws-content'))
                .empty()
                .append(pbxs_manager_html);

            THIS.render_list(pbxs_manager_html);
        },

        list_numbers_by_pbx: function(id, callback) {
            var THIS = this;

            if(id || id > -1) {
                THIS.list_all_numbers(function(_data_numbers) {
                    THIS.get_account(function(_data) {
                            winkstart.table.pbxs_manager.fnClearTable();

                            var tab_data = [],
                                cnam,
                                dash_e911,
                                failover;

                            $.each(_data.data.servers[id].DIDs, function(k, v) {
                                if(_data_numbers.data[k]) {
                                    cnam = $.inArray('cnam', _data_numbers.data[k].features) > -1 ? true : false;
                                    failover = $.inArray('failover', _data_numbers.data[k].features) > -1 ? true : false;
                                    dash_e911 = $.inArray('dash_e911', _data_numbers.data[k].features) > -1 ? true : false;
                                    if(k != 'id' && _data_numbers.data[k]) {
                                        tab_data.push(['lol', k, failover, cnam, dash_e911, _data_numbers.data[k].state]);
                                    }
                                }
                            });

                            winkstart.table.pbxs_manager.fnAddData(tab_data);

                            if(typeof callback === 'function') {
                                callback();
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
                        winkstart.table.assign_number.fnClearTable();

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
                                tab_data.push(['lol', k]);
                            }
                        });

                        winkstart.table.assign_number.fnAddData(tab_data);

                        if(typeof callback === 'function') {
                            callback();
                        }
                    });
                });
            });
        },

        setup_assign_number_table: function(parent) {
            var THIS = this,
                assign_number_html = parent,
                columns = [
                    {
                        'sTitle': '<input type="checkbox" id="select_all_numbers"/>',
                        'fnRender': function(obj) {
                            return '<input type="checkbox" class="select_number"/>';
                        },
                        'bSortable': false
                    },
                    {
                        'sTitle': 'Phone Number'
                    }
                ];

            winkstart.table.create('assign_number', $('#assign_number-grid', assign_number_html), columns, {}, {
                sDom: 'frtlip',
                aaSorting: [[1, 'desc']],
                fnRowCallback: function(nRow, aaData, iDisplayIndex) {
                    $(nRow).attr('id', aaData[1]);
                    return nRow;
                }
            });

            $('#assign_number-grid_filter input[type=text]', assign_number_html).first().focus();

            $('.cancel-search', assign_number_html).click(function(){
                $('#assign_number-grid_filter input[type=text]', assign_number_html).val('');
                winkstart.table.assign_number.fnFilter('');
            });

            $('#select_all_numbers', assign_number_html).click(function() {
                $('.select_number', assign_number_html).prop('checked', $(this).is(':checked'));
            });
        },

        setup_table: function(parent) {
            var THIS = this,
                pbxs_manager_html = parent,
                columns = [
                {
                    'sTitle': '<input type="checkbox" id="select_all_numbers"/>',
                    'fnRender': function(obj) {
                        return '<input type="checkbox" class="select_number"/>';
                    },
                    'bSortable': false
                },
                {
                    'sTitle': 'Phone Number'
                },
                {
                    'sTitle': 'Failover',
                    'fnRender': function(obj) {
                        var failover = 'failover ' + (obj.aData[obj.iDataColumn] ? 'active' : 'inactive');
                        return '<a class="'+ failover  +'">Failover</a>';
                    },
                    'bSortable': false
                },
                {
                    'sTitle': 'Caller-ID',
                    'fnRender': function(obj) {
                        var cid = 'cid ' + (obj.aData[obj.iDataColumn] ? 'active' : 'inactive');
                        return '<a class="'+ cid  +'">CID</a>';
                    },
                    'bSortable': false
                },
                {
                    'sTitle': 'E911',
                    'fnRender': function(obj) {
                        var e911 = 'e911 ' + (obj.aData[obj.iDataColumn] ? 'active' : 'inactive');
                        return '<a class="'+ e911  +'">E911</a>';
                    },
                    'bSortable': false
                },
                {
                    'sTitle': 'State',
                    'fnRender': function(obj) {
                        var state = obj.aData[obj.iDataColumn].replace('_',' ');
                        return state.charAt(0).toUpperCase() + state.substr(1);
                    }
                }
            ];

            winkstart.table.create('pbxs_manager', $('#pbxs_manager-grid', pbxs_manager_html), columns, {}, {
                sDom: '<"action_number">frtlip',
                aaSorting: [[1, 'desc']],
                fnRowCallback: function(nRow, aaData, iDisplayIndex) {
                    $(nRow).attr('id', aaData[1]);
                    return nRow;
                }
            });

            $('#pbxs_manager-grid_filter input[type=text]', pbxs_manager_html).first().focus();

            $('.cancel-search', pbxs_manager_html).click(function(){
                $('#pbxs_manager-grid_filter input[type=text]', pbxs_manager_html).val('');
                winkstart.table.pbxs_manager.fnFilter('');
            });
        }
    }
);
