winkstart.module('voip', 'account', {
        css: [
        ],

        templates: {
            account: 'tmpl/account.html',
            edit: 'tmpl/edit.html'
        },

        subscribe: {
            'account.activate' : 'activate',
            'account.edit' : 'edit_account'
        },

        validation: [
                { name: '#caller_id_name_external',      regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_external',    regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#caller_id_name_internal',      regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_internal',    regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#caller_id_name_emergency',     regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_emergency',   regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
        ],

        resources: {
            'account.get': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'account.update': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'account.list_descendants': {
                url: '{api_url}/accounts/{account_id}/descendants',
                contentType: 'application/json',
                verb: 'GET'
            },
            'account.list': {
                url: '{api_url}/accounts/{account_id}/children',
                contentType: 'application/json',
                verb: 'GET'
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);

        winkstart.publish('whappnav.subnav.add', {
            whapp: 'voip',
            module: THIS.__module,
            label: 'Account Details',
            icon: 'account',
            weight: '0'
        });
    },

    {
        save_account: function(form_data, data, success, error) {
            var THIS = this,
                normalized_data = THIS.normalize_data($.extend(true, {}, data.data, form_data));

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'account.update', {
                        account_id: data.data.id,
                        api_url: winkstart.apps['voip'].api_url,
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
        },

        edit_account: function(data, _parent, _target, _callback, data_defaults) {
            var THIS = this,
                parent = _parent || $('#account-content'),
                target = _target || $('#account-view', parent),
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                        THIS.edit_account({ id: _data.data.id }, parent, target, callbacks);
                    },

                    save_error: _callbacks.save_error,

                    delete_success: _callbacks.delete_success || function() {
                        target.empty();
                    },

                    delete_error: _callbacks.delete_error,

                    after_render: _callbacks.after_render
                },
                defaults = {
                    data: $.extend(true, {
                        caller_id: {
                            internal: {},
                            external: {},
                            emergency: {}
                        },
                        music_on_hold: {}
                    }, data_defaults || {}),
                    field_data: {}
                };

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
                        winkstart.request(true, 'account.get', {
                                account_id: data.id,
                                api_url: winkstart.apps['voip'].api_url
                            },
                            function(_data, status) {
                                THIS.migrate_data(_data);

                                THIS.format_data(_data);

                                THIS.render_account($.extend(true, defaults, _data), target, callbacks);

                                if(typeof callbacks.after_render == 'function') {
                                    callbacks.after_render();
                                }
                            }
                        );
                    }
                    else {
                        THIS.render_account(defaults, target, callbacks);

                        if(typeof callbacks.after_render == 'function') {
                            callbacks.after_render();
                        }
                    }
                }
            );
        },

        delete_account: function(data, success, error) {
            var THIS = this;

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'account.delete', {
                        account_id: data.data.id,
                        api_url: winkstart.apps['voip'].api_url
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

        migrate_data: function(data) {
        },

        format_data: function(data) {
            if(!data.field_data) {
                data.field_data = {};
            }

            if(data.data.music_on_hold && 'media_id' in data.data.music_on_hold) {
                data.data.music_on_hold.media_id = data.data.music_on_hold.media_id.split('/')[2];
            }
        },

        clean_form_data: function(form_data) {
            form_data.caller_id.internal.number = form_data.caller_id.internal.number.replace(/\s|\(|\)|\-|\./g, '');
            form_data.caller_id.emergency.number = form_data.caller_id.emergency.number.replace(/\s|\(|\)|\-|\./g, '');
            form_data.caller_id.external.number = form_data.caller_id.external.number.replace(/\s|\(|\)|\-|\./g, '');

            if(form_data.music_on_hold && form_data.music_on_hold.media_id) {
                form_data.music_on_hold.media_id = '/' + winkstart.apps['voip'].account_id + '/' + form_data.music_on_hold.media_id;
            }

            delete form_data.extra;

            return form_data;
        },

        normalize_data: function(data) {
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

            if(!data.music_on_hold.media_id) {
                delete data.music_on_hold.media_id;
            }

            return data;
        },

        render_account: function(data, target, callbacks) {
            var THIS = this,
                account_html = THIS.templates.edit.tmpl(data);

            winkstart.validate.set(THIS.config.validation, account_html);

            $('*[rel=popover]:not([type="text"])', account_html).popover({
                trigger: 'hover'
            });

            $('*[rel=popover][type="text"]', account_html).popover({
                trigger: 'focus'
            });

            winkstart.tabs($('.view-buttons', account_html), $('.tabs', account_html));

            $('.account-save', account_html).click(function(ev) {
                ev.preventDefault();

                winkstart.validate.is_valid(THIS.config.validation, account_html, function() {
                        var form_data = form2object('account-form');

                        THIS.clean_form_data(form_data);

                        if('field_data' in data) {
                            delete data.field_data;
                        }

                        THIS.save_account(form_data, data, callbacks.save_success, winkstart.error_message.process_error(callbacks.save_error));
                    },
                    function() {
                        winkstart.alert('There were errors on the form, please correct!');
                    }
                );
            });

            $('.account-delete', account_html).click(function(ev) {
                ev.preventDefault();

                winkstart.confirm('Are you sure you want to delete this account?<br>WARNING: This can not be undone', function() {
                    THIS.delete_account(data, callbacks.delete_success, callbacks.delete_error);
                });
            });

            if(!$('#music_on_hold_media_id', account_html).val()) {
                $('#edit_link_media', account_html).hide();
            }

            $('#music_on_hold_media_id', account_html).change(function() {
                !$('#music_on_hold_media_id option:selected', account_html).val() ? $('#edit_link_media', account_html).hide() : $('#edit_link_media', account_html).show();
            });

            $('.inline_action_media', account_html).click(function(ev) {
                var _data = ($(this).dataset('action') == 'edit') ? { id: $('#music_on_hold_media_id', account_html).val() } : {},
                    _id = _data.id;

                ev.preventDefault();

                winkstart.publish('media.popup_edit', _data, function(_data) {
                    /* Create */
                    if(!_id) {
                        $('#music_on_hold_media_id', account_html).append('<option id="'+ _data.data.id  +'" value="'+ _data.data.id +'">'+ _data.data.name +'</option>')
                        $('#music_on_hold_media_id', account_html).val(_data.data.id);

                        $('#edit_link_media', account_html).show();
                    }
                    else {
                        /* Update */
                        if('id' in _data.data) {
                            $('#music_on_hold_media_id #'+_data.data.id, account_html).text(_data.data.name);
                        }
                        /* Delete */
                        else {
                            $('#music_on_hold_media_id #'+_id, account_html).remove();
                            $('#edit_link_media', account_html).hide();
                        }
                    }
                });
            });

            winkstart.link_form(account_html);

            (target)
                .empty()
                .append(account_html);
        },

        activate: function(parent) {
            var THIS = this,
                account_html = THIS.templates.account.tmpl();

            (parent || $('#ws-content'))
                .empty()
                .append(account_html);

            THIS.edit_account({id: winkstart.apps['voip'].account_id});
        }
    }
);
