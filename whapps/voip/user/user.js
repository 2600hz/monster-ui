winkstart.module('voip', 'user', {
        css: [
            'css/user.css'
        ],

        templates: {
            user: 'tmpl/user.html',
            edit: 'tmpl/edit.html',
            user_callflow: 'tmpl/user_callflow.html',
            device_row: 'tmpl/device_row.html'
        },

        subscribe: {
            'user.activate': 'activate',
            'user.edit': 'edit_user',
            'callflow.define_callflow_nodes': 'define_callflow_nodes',
            'user.popup_edit': 'popup_edit_user'
        },

        validation : [
                { name: '#first_name',                regex: /^[0-9a-zA-Z\s\-\']+$/ },
                { name: '#last_name',                 regex: /^[0-9a-zA-Z\s\-\']+$/ },
                { name: '#username',                  regex: /^[0-9a-zA-Z+@._-]{3,256}$/ },
                { name: '#email',                     regex: /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/ },
                { name: '#caller_id_number_internal', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#caller_id_name_internal',   regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_external', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#caller_id_name_external',   regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_emergency',regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#caller_id_name_emergency',  regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#hotdesk_id',                regex: /^[0-9\+\#\*]*$/ },
                { name: '#hotdesk_pin',               regex: /^[0-9]*$/ },
                { name: '#queue_pin',                 regex: /^[0-9]*$/ },
                { name: '#call_forward_number',       regex: /^[\+]?[0-9]*$/ }
        ],

        resources: {
            'user.list': {
                url: '{api_url}/accounts/{account_id}/users',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user.list_no_loading': {
                url: '{api_url}/accounts/{account_id}/users',
                contentType: 'application/json',
                verb: 'GET',
                trigger_events: false
            },
            'user.get': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user.create': {
                url: '{api_url}/accounts/{account_id}/users',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'user.update': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'user.delete': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            },
            'hotdesk.list': {
                url: '{api_url}/accounts/{account_id}/users/hotdesks',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user.device_list': {
                url: '{api_url}/accounts/{account_id}/devices?filter_owner_id={owner_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user.device_new_user': {
                url: '{api_url}/accounts/{account_id}/devices?filter_new_user={owner_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user.account_get': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);

        //winkstart.publish('statistics.add_stat', THIS.define_stats());

        winkstart.publish('whappnav.subnav.add', {
            whapp: 'voip',
            module: THIS.__module,
            label: 'Users',
            icon: 'user',
            weight: '10',
            category: 'advanced'
        });
    },

    {
        random_id: false,

        save_user: function(form_data, data, success, error) {
            var THIS = this,
                normalized_data = THIS.normalize_data($.extend(true, {}, data.data, form_data));

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'user.update', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        user_id: data.data.id,
                        data: normalized_data
                    },
                    function(_data, status) {
                        if(typeof success == 'function') {
                            success(_data, status, 'update');
                        }
                    },
                    function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status, 'update');
                        }
                    }
                );
            }
            else {
                winkstart.request(true, 'user.create', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        data: normalized_data
                    },
                    function(_data, status) {
                        if(typeof success == 'function') {
                            success(_data, status, 'create');
                        }
                    },
                    function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status, 'create');
                        }
                    }
                );
            }
        },

        acquire_device: function(user_data, success, error) {
            var THIS = this,
                user_id = user_data.data.id;

            if(THIS.random_id) {
                winkstart.request(true, 'user.device_new_user', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        owner_id: THIS.random_id
                    },
                    function(_data, status) {
                        var device_id;
                        var array_length = _data.data.length;
                        if(array_length != 0) {
                            $.each(_data.data, function(k, v) {
                                device_id = this.id;
                                winkstart.request(false, 'device.get', {
                                        account_id: winkstart.apps['voip'].account_id,
                                        api_url: winkstart.apps['voip'].api_url,
                                        device_id: device_id
                                    },
                                    function(_data, status) {
                                        _data.data.owner_id = user_id;
                                        delete _data.data.new_user;
                                        winkstart.request(false, 'device.update', {
                                                account_id: winkstart.apps['voip'].account_id,
                                                api_url: winkstart.apps['voip'].api_url,
                                                device_id: _data.data.id,
                                                data: _data.data
                                            },
                                            function(_data, status) {
                                                if(k == array_length - 1) {
                                                    success({}, status, 'create');
                                                }
                                            }
                                        );
                                    }
                                );
                            });
                        }
                        else {
                            success({}, status, 'create');
                        }
                    }
                );
            }
            else {
                success({}, status, 'create');
            }
        },

        edit_user: function(data, _parent, _target, _callbacks, data_defaults) {
            var THIS = this,
                parent = _parent || $('#user-content'),
                target = _target || $('#user-view', parent),
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                        THIS.render_list(parent);

                        THIS.edit_user({ id: _data.data.id }, parent, target, callbacks);
                    },

                    save_error: _callbacks.save_error,

                    delete_success: _callbacks.delete_success || function() {
                        target.empty();

                        THIS.render_list(parent);
                    },

                    delete_error: _callbacks.delete_error,

                    after_render: _callbacks.after_render
                },
                defaults = {
                    data: $.extend(true, {
                        apps: {},
                        call_forward: {
                            substitute: true
                        },
                        caller_id: {
                            internal: {},
                            external: {},
                            emergency: {}
                        },
                        hotdesk: {},
                        music_on_hold: {}
                    }, data_defaults || {}),
                    field_data: {
                        device_types: {
                            sip_device: 'SIP Device',
                            cellphone: 'Cell Phone',
                            fax: 'Fax',
                            smartphone: 'Smartphone',
                            landline: 'landline',
                            softphone: 'Softphone',
                            sip_uri: 'SIP URI'
                        }
                    }
                };

            THIS.random_id = false;

            winkstart.request(true, 'media.list', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(_data, status) {
                    _data.data.unshift({
                        id: '',
                        name: '- Not set -'
                    });

                    defaults.field_data.media = _data.data;

                    if(typeof data == 'object' && data.id) {
                        winkstart.request(true, 'user.device_list', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url,
                                owner_id: data.id
                            },
                            function(_data, status) {
                                defaults.field_data.device_list = _data.data;

                                winkstart.request(true, 'user.get', {
                                        account_id: winkstart.apps['voip'].account_id,
                                        api_url: winkstart.apps['voip'].api_url,
                                        user_id: data.id
                                    },
                                    function(_data, status) {
                                        THIS.migrate_data(_data);

                                        THIS.format_data(_data);

                                        THIS.render_user($.extend(true, defaults, _data), target, callbacks);

                                        if(typeof callbacks.after_render == 'function') {
                                            callbacks.after_render();
                                        }
                                    }
                                );
                            }
                        );
                    }
                    else {
                        defaults.field_data.device_list = {};
                        THIS.random_id = $.md5(winkstart.random_string(10)+new Date().toString());
                        defaults.field_data.new_user = THIS.random_id;

                        THIS.render_user(defaults, target, callbacks);

                        if(typeof callbacks.after_render == 'function') {
                            callbacks.after_render();
                        }
                    }
                }
            );
        },

        delete_user: function(data, success, error) {
            var THIS = this;

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'user.delete', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        user_id: data.data.id
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
        },

        update_single_device: function($checkbox, parent) {
            $checkbox.attr('disabled', 'disabled');

            var device_id = $checkbox.dataset('device_id'),
                enabled = $checkbox.is(':checked');

            winkstart.request(false, 'device.get', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url,
                    device_id: device_id
                },
                function(_data, status) {
                    if($.inArray(_data.data.device_type, ['cellphone', 'smartphone', 'landline']) > -1) {
                        _data.data.call_forward.enabled = enabled;
                    }
                    _data.data.enabled = enabled;
                    winkstart.request(false, 'device.update', {
                            account_id: winkstart.apps['voip'].account_id,
                            api_url: winkstart.apps['voip'].api_url,
                            device_id: _data.data.id,
                            data: _data.data
                        },
                        function(_data, status) {
                            $checkbox.removeAttr('disabled');
                            if(_data.data.enabled === true) {
                                $('#'+ _data.data.id + ' .column.third', parent).removeClass('disabled');
                            }
                            else {
                                $('#'+ _data.data.id + ' .column.third', parent).addClass('disabled');
                            }
                        },
                        function(_data, status) {
                            $checkbox.removeAttr('disabled');
                            enabled ? $checkbox.removeAttr('checked') : $checkbox.attr('checked', 'checked');
                        }
                    );
                },
                function(_data, status) {
                    $checkbox.removeAttr('disabled');
                    enabled ? $checkbox.removeAttr('checked') : $checkbox.attr('checked', 'checked');
                }
            );
        },

        render_user: function(data, target, callbacks) {
            var THIS = this,
                user_html = THIS.templates.edit.tmpl(data),
                data_devices,
                enable_pin = $('#enable_pin', user_html),
                $queue_block = $('.queue_block', user_html);
                hotdesk_pin =   $('.hotdesk_pin', user_html),
                hotdesk_pin_require = $('#hotdesk_require_pin', user_html);

            THIS.render_device_list(data, user_html);

            winkstart.validate.set(THIS.config.validation, user_html);

            winkstart.timezone.populate_dropdown($('#timezone', user_html), data.data.timezone);

            $('*[rel=popover]:not([type="text"])', user_html).popover({
                trigger: 'hover'
            });

            $('*[rel=popover][type="text"]', user_html).popover({
                trigger: 'focus'
            });

            winkstart.tabs($('.view-buttons', user_html), $('.tabs', user_html));
            winkstart.link_form(user_html);

            enable_pin.is(':checked') ? $queue_block.show() : $queue_block.hide();
            hotdesk_pin_require.is(':checked') ? hotdesk_pin.show() : hotdesk_pin.hide();

            enable_pin.change(function() {
                $(this).is(':checked') ? $queue_block.show('blind') : $queue_block.hide('blind');
            });

            hotdesk_pin_require.change(function() {
                $(this).is(':checked') ? hotdesk_pin.show('bind') : hotdesk_pin.hide('bind');
            });

            $('.user-save', user_html).click(function(ev) {
                ev.preventDefault();

                if($('#pwd_mngt_pwd1', user_html).val() != $('#pwd_mngt_pwd2', user_html).val()) {
                    winkstart.alert('The passwords on the \'Password management\' tab do not match! Please re-enter the password.');
                    return true;
                }

                winkstart.validate.is_valid(THIS.config.validation, user_html, function() {
                        var form_data = form2object('user-form');

                        if(form_data.enable_pin === false) {
                            delete data.data.queue_pin;
                            delete data.data.record_call;
                        }

                        THIS.clean_form_data(form_data);

                        if('field_data' in data) {
                            delete data.field_data;
                        }

                        if(form_data.password === undefined || winkstart.is_password_valid(form_data.password)) {

                            winkstart.request('user.account_get', {
                                    api_url: winkstart.apps['voip'].api_url,
                                    account_id: winkstart.apps['voip'].account_id,
                                },
                                function(_data, status) {
                                    if(form_data.priv_level == 'admin') {
                                        form_data.apps = form_data.apps || {};
                                        if(!('voip' in form_data.apps) && $.inArray('voip', (_data.data.available_apps || [])) > -1) {
                                            form_data.apps['voip'] = {
                                                label: 'VoIP Services',
                                                icon: 'device',
                                                api_url: winkstart.apps['voip'].api_url
                                            }
                                        }
                                    }
                                    else if(form_data.priv_level == 'user' && $.inArray('userportal', (_data.data.available_apps || [])) > -1) {
                                        form_data.apps = form_data.apps || {};
                                        if(!('userportal' in form_data.apps)) {
                                            form_data.apps['userportal'] = {
                                                label: 'User Portal',
                                                icon: 'userportal',
                                                api_url: winkstart.apps['voip'].api_url
                                            }
                                        }
                                    }

                                    THIS.save_user(form_data, data, function(data, status, action) {
                                        if(action == 'create') {
                                            THIS.acquire_device(data, function() {
                                                if(typeof callbacks.save_success == 'function') {
                                                    callbacks.save_success(data, status, action);
                                                }
                                            }, function() {
                                                if(typeof callbacks.save_error == 'function') {
                                                    callbacks.save_error(data, status, action);
                                                }
                                            });
                                        }
                                        else {
                                            if(typeof callbacks.save_success == 'function') {
                                                callbacks.save_success(data, status, action);
                                            }
                                        }
                                    }, winkstart.error_message.process_error(callbacks.save_error));
                                }
                            );

                        }
                    },
                    function() {
                        winkstart.alert('There were errors on the form, please correct!');
                    }
                );
            });

            $('.user-delete', user_html).click(function(ev) {
                ev.preventDefault();

                winkstart.confirm('Are you sure you want to delete this user?', function() {
                    THIS.delete_user(data, callbacks.delete_success, callbacks.delete_error);
                });
            });

            if(!$('#music_on_hold_media_id', user_html).val()) {
                $('#edit_link_media', user_html).hide();
            }

            $('#music_on_hold_media_id', user_html).change(function() {
                !$('#music_on_hold_media_id option:selected', user_html).val() ? $('#edit_link_media', user_html).hide() : $('#edit_link_media', user_html).show();
            });

            $('.inline_action_media', user_html).click(function(ev) {
                var _data = ($(this).dataset('action') == 'edit') ? { id: $('#music_on_hold_media_id', user_html).val() } : {},
                    _id = _data.id;

                ev.preventDefault();

                winkstart.publish('media.popup_edit', _data, function(_data) {
                    /* Create */
                    if(!_id) {
                        $('#music_on_hold_media_id', user_html).append('<option id="'+ _data.data.id  +'" value="'+ _data.data.id +'">'+ _data.data.name +'</option>')
                        $('#music_on_hold_media_id', user_html).val(_data.data.id);

                        $('#edit_link_media', user_html).show();
                    }
                    else {
                        /* Update */
                        if('id' in _data.data) {
                            $('#music_on_hold_media_id #'+_data.data.id, user_html).text(_data.data.name);
                        }
                        /* Delete */
                        else {
                            $('#music_on_hold_media_id #'+_id, user_html).remove();
                            $('#edit_link_media', user_html).hide();
                        }
                    }
                });
            });

            $(user_html).delegate('.enabled_checkbox', 'click', function() {
                THIS.update_single_device($(this), user_html);
            });

            $(user_html).delegate('.action_device.edit', 'click', function() {
                var data_device = {
                    id: $(this).dataset('id'),
                    hide_owner: !data.data.id ? true : false
                };

                var defaults = {};

                if(!data.data.id) {
                    defaults.new_user = THIS.random_id;
                }
                else {
                    defaults.owner_id = data.data.id;
                }

                winkstart.publish('device.popup_edit', data_device, function(_data) {
                    data_devices = {
                        data: { },
                        field_data: {
                            device_types: data.field_data.device_types
                        }
                    };
                    data_devices.data = _data.data.new_user ? { new_user: true, id: THIS.random_id } : { id: data.data.id };

                    THIS.render_device_list(data_devices, user_html);
                }, defaults);
            });

            $(user_html).delegate('.action_device.delete', 'click', function() {
                var device_id = $(this).dataset('id');
                winkstart.confirm('Do you really want to delete this device?', function() {
                    winkstart.request(true, 'device.delete', {
                            account_id: winkstart.apps['voip'].account_id,
                            api_url: winkstart.apps['voip'].api_url,
                            device_id: device_id
                        },
                        function(_data, status) {
                            data_devices = {
                                data: { },
                                field_data: {
                                    device_types: data.field_data.device_types
                                }
                            };
                            data_devices.data = THIS.random_id ? { new_user: true, id: THIS.random_id } : { id: data.data.id };

                            THIS.render_device_list(data_devices, user_html);
                        }
                    );
                });
            });

            $('.add_device', user_html).click(function(ev) {
                var data_device = {
                        hide_owner: true
                    },
                    defaults = {};

                ev.preventDefault();

                if(!data.data.id) {
                    defaults.new_user = THIS.random_id;
                }
                else {
                    defaults.owner_id = data.data.id;
                }

                winkstart.publish('device.popup_edit', data_device, function(_data) {
                    var data_devices = {
                        data: { },
                        field_data: {
                            device_types: data.field_data.device_types
                        }
                    };
                    data_devices.data = THIS.random_id ? { new_user: true, id: THIS.random_id } : { id: data.data.id };

                    THIS.render_device_list(data_devices, user_html);
                }, defaults);
            });

            (target)
                .empty()
                .append(user_html);
        },

        render_device_list: function(data, parent) {
            var THIS = this;

            if(data.data.id) {
                var request_string = data.data.new_user ? 'user.device_new_user' : 'user.device_list';

                winkstart.request(true, request_string, {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        owner_id: data.data.id
                    },
                    function(_data, status) {
                        $('.rows', parent).empty();
                        if(_data.data.length > 0) {
                            $.each(_data.data, function(k, v) {
                                v.display_type = data.field_data.device_types[v.device_type];
                                v.not_enabled = this.enabled === false ? true : false;
                                $('.rows', parent).append(THIS.templates.device_row.tmpl(v));
                            });

                            winkstart.request(true, 'device.status', {
                                    account_id: winkstart.apps['voip'].account_id,
                                    api_url: winkstart.apps['voip'].api_url
                                },
                                function(_data, status) {
                                    $.each(_data.data, function(key, val) {
                                        $('#' + val.device_id + ' .column.third', parent).addClass('registered');
                                    });
                                }
                            );
                        }
                        else {
                            $('.rows', parent).append(THIS.templates.device_row.tmpl());
                        }
                    }
                );
            }
            else {
                $('.rows', parent).empty()
                                  .append(THIS.templates.device_row.tmpl());
            }
        },

        migrate_data: function(data) {
            if(!('priv_level' in data.data)) {
                if('apps' in data.data && 'voip' in data.data.apps) {
                    data.data.priv_level = 'admin';
                } else {
                    data.data.priv_level = 'user';
                }
            }

            return data;
        },

        format_data: function(data) {
            // Do work
            data.data.queue_pin === undefined ? data.data.enable_pin = false : data.data.enable_pin = true;

            return data;
        },

        clean_form_data: function(form_data){
            form_data.caller_id.internal.number = form_data.caller_id.internal.number.replace(/\s|\(|\)|\-|\./g,'');
            form_data.caller_id.external.number = form_data.caller_id.external.number.replace(/\s|\(|\)|\-|\./g,'');
            form_data.caller_id.emergency.number = form_data.caller_id.emergency.number.replace(/\s|\(|\)|\-|\./g,'');

            if(!form_data.hotdesk.require_pin) {
                delete form_data.hotdesk.pin;
            }

            if(form_data.pwd_mngt_pwd1 != 'fakePassword') {
                form_data.password = form_data.pwd_mngt_pwd1;
            }

            if(form_data.enable_pin === false) {
                delete form_data.queues;
                delete form_data.queue_pin;
                delete form_data.record_call;
            }

            delete form_data.pwd_mngt_pwd1;
            delete form_data.pwd_mngt_pwd2;

            return form_data;
        },

        normalize_data: function(data) {

            if($.isArray(data.directories)) {
                data.directories = {};
            }

            $.each(data.caller_id, function(key, val) {
                $.each(val, function(_key, _val) {
                    if(_val == '') {
                        delete val[_key];
                    }
                });

                if($.isEmptyObject(val)) {
                    delete data.caller_id[key];
                }
            });

            if($.isEmptyObject(data.caller_id)) {
                delete data.caller_id;
            }

            if(!data.hotdesk.enable) {
                delete data.hotdesk;
            }

            if(!data.music_on_hold.media_id) {
                delete data.music_on_hold.media_id;
            }

            if(typeof data.queues === 'undefined') {
                if(typeof data.queue_pin != 'undefined') {
                    data.queues = [];
                }
            }
            else {
                if(typeof data.queue_pin === 'undefined') {
                    delete data.queues;
                }
            }

            delete data.enable_pin;

            return data;
        },

        render_list: function(parent) {
            var THIS = this;

            winkstart.request(true, 'user.list', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(data, status) {
                    var map_crossbar_data = function(data) {
                        var new_list = [];

                        if(data.length > 0) {
                            $.each(data, function(key, val) {
                                new_list.push({
                                    id: val.id,
                                    title: (val.first_name && val.last_name) ?
                                               val.last_name + ', ' + val.first_name :
                                               '(no name)'
                                });
                            });
                        }

                        new_list.sort(function(a, b) {
                            return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
                        });

                        return new_list;
                    };

                    $('#user-listpanel', parent)
                        .empty()
                        .listpanel({
                            label: 'Users',
                            identifier: 'user-listview',
                            new_entity_label: 'Add User',
                            data: map_crossbar_data(data.data),
                            publisher: winkstart.publish,
                            notifyMethod: 'user.edit',
                            notifyCreateMethod: 'user.edit',
                            notifyParent: parent
                        });
                }
            );
        },

        activate: function(parent) {
            var THIS = this,
                user_html = THIS.templates.user.tmpl();

            (parent || $('#ws-content'))
                .empty()
                .append(user_html);

            THIS.render_list(user_html);
        },

        popup_edit_user: function(data, callback, data_defaults) {
            var popup, popup_html;

            popup_html = $('<div class="inline_popup"><div class="inline_content main_content"/></div>');

            popup_html.css({
                height: 500,
                'overflow-y': 'scroll'
            });

            winkstart.publish('user.edit', data, popup_html, $('.inline_content', popup_html), {
                save_success: function(_data) {
                    popup.dialog('close');

                    if(typeof callback == 'function') {
                        callback(_data);
                    }
                },
                delete_success: function() {
                    popup.dialog('close');

                    if(typeof callback == 'function') {
                        callback({ data: {} });
                    }
                },
                after_render: function() {
                    popup = winkstart.dialog(popup_html, {
                        title: (data.id) ? 'Edit User' : 'Create User'
                    });
                }
            }, data_defaults);
        },

        define_stats: function() {
            var THIS = this;

            var stats = {
                'users': {
                    icon: 'user',
                    get_stat: function(callback) {
                        winkstart.request('user.list_no_loading', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url
                            },
                            function(_data, status) {
                                var stat_attributes = {
                                    name: 'users',
                                    number: _data.data.length,
                                    active: _data.data.length > 0 ? true : false,
                                    color: _data.data.length < 1 ? 'red' : (_data.data.length > 1 ? 'green' : 'orange')
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
                        winkstart.publish('user.activate');
                    }
                }
            };

            return stats;
        },

        define_callflow_nodes: function(callflow_nodes) {
            var THIS = this;

            $.extend(callflow_nodes, {
                 'user[id=*]': {
                    name: 'User',
                    icon: 'user',
                    category: 'Basic',
                    module: 'user',
                    tip: 'Direct a caller to a specific user',
                    data: {
                        id: 'null'
                    },
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '1'
                        }
                    ],
                    isUsable: 'true',
                    caption: function(node, caption_map) {
                        var id = node.getMetadata('id');
                        return (id && id != '') ? caption_map[id].name : '';
                    },
                    edit: function(node, callback) {
                        winkstart.request(true, 'user.list', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url
                            },
                            function(data, status) {
                                var popup, popup_html;

                                $.each(data.data, function() {
                                    this.name = this.first_name + ' ' + this.last_name;
                                });

                                popup_html = THIS.templates.user_callflow.tmpl({
                                    can_call_self: node.getMetadata('can_call_self') || false,
                                    parameter: {
                                        name: 'timeout (s)',
                                        value: node.getMetadata('timeout') || '20'
                                    },
                                    objects: {
                                        items: data.data,
                                        selected: node.getMetadata('id') || ''
                                    }
                                });

                                if($('#user_selector option:selected', popup_html).val() == undefined) {
                                    $('#edit_link', popup_html).hide();
                                }

                                $('.inline_action', popup_html).click(function(ev) {
                                    var _data = ($(this).dataset('action') == 'edit') ?
                                                    { id: $('#user_selector', popup_html).val() } : {};

                                    ev.preventDefault();

                                    winkstart.publish('user.popup_edit', _data, function(_data) {
                                        node.setMetadata('id', _data.data.id || 'null');
                                        node.setMetadata('timeout', $('#parameter_input', popup_html).val());
                                        node.setMetadata('can_call_self', $('#user_can_call_self', popup_html).is(':checked'));

                                        node.caption = (_data.data.first_name || '') + ' ' + (_data.data.last_name || '');

                                        popup.dialog('close');
                                    });
                                });

                                $('#add', popup_html).click(function() {
                                    node.setMetadata('id', $('#user_selector', popup_html).val());
                                    node.setMetadata('timeout', $('#parameter_input', popup_html).val());
                                    node.setMetadata('can_call_self', $('#user_can_call_self', popup_html).is(':checked'));

                                    node.caption = $('#user_selector option:selected', popup_html).text();

                                    popup.dialog('close');
                                });

                                popup = winkstart.dialog(popup_html, {
                                    title: 'Select User',
                                    minHeight: '0',
                                    beforeClose: function() {
                                        if(typeof callback == 'function') {
                                            callback();
                                        }
                                    }
                                });
                            }
                        );
                    }
                },
                'hotdesk[action=login]': {
                    name: 'Hot Desk login',
                    icon: 'hotdesk_login',
                    category: 'Hotdesking',
                    module: 'hotdesk',
                    tip: 'Enable Hot desking',
                    data: {
                        action: 'login'
                    },
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '1'
                        }
                    ],
                    isUsable: 'true',
                    caption: function(node, caption_map) {
                        return '';
                    },
                    edit: function(node, callback) {
                        if(typeof callback == 'function') {
                            callback();
                        }
                    }
                },
                'hotdesk[action=logout]': {
                    name: 'Hot Desk logout',
                    icon: 'hotdesk_logout',
                    category: 'Hotdesking',
                    module: 'hotdesk',
                    tip: 'Disable Hot desking',
                    data: {
                        action: 'logout'
                    },
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '1'
                        }
                    ],
                    isUsable: 'true',
                    caption: function(node, caption_map) {
                        return '';
                    },
                    edit: function(node, callback) {
                        if(typeof callback == 'function') {
                            callback();
                        }
                    }
                },
                'hotdesk[action=toggle]': {
                    name: 'Hot Desk toggle',
                    icon: 'hotdesk_toggle',
                    category: 'Hotdesking',
                    module: 'hotdesk',
                    tip: 'Toggle Hot desking',
                    data: {
                        action: 'toggle'
                    },
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '1'
                        }
                    ],
                    isUsable: 'true',
                    caption: function(node, caption_map) {
                        return '';
                    },
                    edit: function(node, callback) {
                        if(typeof callback == 'function') {
                            callback();
                        }
                    }
                }
            });
        }
    }
);
