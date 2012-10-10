winkstart.module('voip', 'queue', {
        css: [
            'css/queue.css'
        ],

        templates: {
            queue: 'tmpl/queue.html',
            edit: 'tmpl/edit.html',
            queue_callflow: 'tmpl/queue_callflow.html',
            user_row: 'tmpl/user_row.html'
        },

        subscribe: {
            'queue.activate': 'activate',
            'queue.edit': 'edit_queue',
            'callflow.define_callflow_nodes': 'define_callflow_nodes',
            'queue.popup_edit': 'popup_edit_queue'
        },

        validation: [
            { name: '#name',      regex: /^.*/ },
            { name: '#connection_timeout',  regex: /^[0-9]+$/ },
            { name: '#member_timeout',  regex: /^[0-9]+$/ }
            /*{ name: '#caller_exit_key',  regex: /^.{1}/ }*/
        ],

        resources: {
            'queue.list': {
                url: '{api_url}/accounts/{account_id}/queues',
                contentType: 'application/json',
                verb: 'GET'
            },
            'queue.get': {
                url: '{api_url}/accounts/{account_id}/queues/{queue_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'queue.create': {
                url: '{api_url}/accounts/{account_id}/queues',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'queue.update': {
                url: '{api_url}/accounts/{account_id}/queues/{queue_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'queue.delete': {
                url: '{api_url}/accounts/{account_id}/queues/{queue_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            },
            'queue.user_list': {
                url: '{api_url}/accounts/{account_id}/users',
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
            label: 'Queue',
            icon: 'queue',
            weight: '65',
            category: 'advanced'
        });
    },

    {
        save_queue: function(form_data, data, success, error) {
            var THIS = this,
                normalized_data = THIS.normalize_data($.extend(true, {}, data.data, form_data));

            if (typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'queue.update', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        queue_id: data.data.id,
                        data: normalized_data
                    },
                    function(_data, status) {
                        if(typeof success == 'function') {
                            THIS.update_users(data.field_data.user_list, _data.data.id, function() {
                                success(_data, status, 'update');
                            });
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
                winkstart.request(true, 'queue.create', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        data: normalized_data
                    },
                    function (_data, status) {
                        if(typeof success == 'function') {
                            THIS.update_users(data.field_data.user_list, _data.data.id, function() {
                                success(_data, status, 'create');
                            });
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

        update_single_user: function(user_id, queue_id, action, callback) {
            var THIS = this;

            winkstart.request(false, 'user.get', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url,
                    user_id: user_id
                },
                function(_data, status) {
                    if(action =='add') {
                        if(!_data.data.queues || typeof _data.data.queues != 'object') {
                            _data.data.queues = [];
                        }
                        _data.data.queues.push(queue_id);

                        /* If a user is added to a queue, but is not enabled as an agent, we enable this user automatically */
                        if(!('queue_pin' in _data.data)) {
                            _data.data.queue_pin = '';
                        }
                    }
                    else { //remove
                        _data.data.queues.splice(_data.data.queues.indexOf(queue_id), 1);
                    }

                    winkstart.request(false, 'user.update', {
                            account_id: winkstart.apps['voip'].account_id,
                            api_url: winkstart.apps['voip'].api_url,
                            user_id: user_id,
                            data: _data.data
                        },
                        function(_data, status) {
                            if(typeof callback === 'function') {
                                callback(status);
                            }
                        },
                        function(_data, status) {
                            if(typeof callback === 'function') {
                                callback(status);
                            }
                        }
                    );
                }
            );
        },

        update_users: function(data, queue_id, success) {
            var old_queue_user_list = data.old_list,
                new_queue_user_list = data.new_list,
                THIS = this,
                users_updated_count = 0,
                users_count = 0,
                callback = function() {
                    users_updated_count++;
                    if(users_updated_count >= users_count) {
                        success();
                    }
                };


            if(old_queue_user_list) {
                $.each(old_queue_user_list, function(k, v) {
                    if(new_queue_user_list.indexOf(v) === -1) {
                        //Request to update user without this queue.
                        users_count++;
                        THIS.update_single_user(v, queue_id, 'remove', callback);
                    }
                });

                $.each(new_queue_user_list, function(k, v) {
                    if(old_queue_user_list.indexOf(v) === -1) {
                        users_count++;
                        THIS.update_single_user(v, queue_id, 'add', callback);
                    }
                });
            }
            else {
                if(new_queue_user_list) {
                    $.each(new_queue_user_list, function(k, v) {
                        users_count++;
                        THIS.update_single_user(v, queue_id, 'add', callback);
                    });
                }
            }

            /* If no users has been updated, we still need to refresh the view for the other attributes */
            if(users_count == 0) {
                success();
            }
        },

        edit_queue: function(data, _parent, _target, _callbacks, data_defaults){
            var THIS = this,
                parent = _parent || $('#queue-content'),
                target = _target || $('#queue-view', parent),
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                        THIS.render_list(parent);

                        THIS.edit_queue({ id: _data.data.id }, parent, target, callbacks);
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
                        connection_timeout: '300',
                        member_timeout: '5',
                        /* caller_exit_key: '#' */
                    }, data_defaults || {}),
                    field_data: {
                        sort_by: {
                            'first_name': 'First Name',
                            'last_name': 'Last Name'
                        }
                    }
                };

            winkstart.request(true, 'user.list', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(_data, status) {
                    defaults.field_data.users = _data.data;

                    if(typeof data == 'object' && data.id) {
                        winkstart.request(true, 'queue.get', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url,
                                queue_id: data.id
                            },
                            function(_data, status) {
                                var render_data = $.extend(true, defaults, _data);
                                render_data.field_data.old_list = [];
                                if('agents' in _data.data) {
                                    render_data.field_data.old_list = _data.data.agents;
                                }
                                THIS.render_queue(render_data, target, callbacks);

                                if(typeof callbacks.after_render == 'function') {
                                    callbacks.after_render();
                                }
                            }
                        );
                    }
                    else {
                        THIS.render_queue(defaults, target, callbacks);

                        if(typeof callbacks.after_render == 'function') {
                            callbacks.after_render();
                        }
                    }
                }
            );
        },

        delete_queue: function(data, success, error) {
            var THIS = this;

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'queue.delete', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        queue_id: data.data.id
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

        render_queue: function(data, target, callbacks){
            var THIS = this,
                queue_html = THIS.templates.edit.tmpl(data);

            THIS.render_user_list(data, queue_html);

            winkstart.validate.set(THIS.config.validation, queue_html);

            $('*[rel=popover]', queue_html).popover({
                trigger: 'focus'
            });

            winkstart.tabs($('.view-buttons', queue_html), $('.tabs', queue_html));

            $('.queue-save', queue_html).click(function(ev) {
                ev.preventDefault();

                winkstart.validate.is_valid(THIS.config.validation, queue_html, function() {
                        var form_data = form2object('queue-form');

                        THIS.clean_form_data(form_data);

                        var new_list = [];

                        $('.rows .row:not(#row_no_data)', queue_html).each(function() {
                            new_list.push($(this).dataset('id'));
                        });

                        data.field_data.user_list = {
                            old_list: data.data.agents || [],
                            new_list: new_list
                        };

                        THIS.save_queue(form_data, data, callbacks.save_success, winkstart.error_message.process_error(callbacks.save_error));
                    },
                    function() {
                        winkstart.alert('There were errors on the form, please correct!');
                    }
                );
            });

            $('.queue-delete', queue_html).click(function(ev) {
                ev.preventDefault();

                winkstart.confirm('Are you sure you want to delete this queue?', function() {
                    THIS.delete_queue(data, callbacks.delete_success, callbacks.delete_error);
                });
            });

            $('.add_user_div', queue_html).click(function() {
                var $user = $('#user_id', queue_html);

                if($user.val() != 'empty_option_user') {
                    var user_id = $user.val(),
                        user_data = {
                            user_id: user_id,
                            user_name: $('#option_user_'+user_id, queue_html).text()
                        };

                    if($('#row_no_data', queue_html).size() > 0) {
                        $('#row_no_data', queue_html).remove();
                    }

                    $('.rows', queue_html).prepend(THIS.templates.user_row.tmpl(user_data));
                    $('#option_user_'+user_id, queue_html).hide();

                    $user.val('empty_option_user');
                }
            });

            $(queue_html).delegate('.action_user.edit', 'click', function() {
                var _data = {
                    id: $(this).dataset('id')
                };

                winkstart.publish('user.popup_edit', _data, function(_data) {
                    $('#row_user_' + _data.data.id + ' .column.first', queue_html).html(_data.data.first_name + ' ' + _data.data.last_name);
                    $('#option_user_' + _data.data.id, queue_html).html(_data.data.first_name + ' ' + _data.data.last_name);
                });
            });

            $(queue_html).delegate('.action_user.delete', 'click', function() {
                var user_id = $(this).dataset('id');
                //removes it from the grid
                $('#row_user_'+user_id, queue_html).remove();
                //re-add it to the dropdown
                $('#option_user_'+user_id, queue_html).show();
                //if grid empty, add no data line
                if($('.rows .row', queue_html).size() == 0) {
                    $('.rows', queue_html).append(THIS.templates.user_row.tmpl());
                }
            });

            (target)
                .empty()
                .append(queue_html);
        },

        normalize_data: function(form_data) {
            delete form_data.users;
            return form_data;
        },

        clean_form_data: function(form_data) {
            delete form_data.user_id;
        },

        render_list: function(_parent){
            var THIS = this,
                parent = _parent || $('#queue-content');;

            winkstart.request(true, 'queue.list', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function (data, status) {
                    var map_crossbar_data = function(data) {
                       var new_list = [];

                        if(data.length > 0) {
                            $.each(data, function(key, val) {
                                new_list.push({
                                    id: val.id,
                                    title: val.name || '(no name)'
                                });
                            });
                        }

                        new_list.sort(function(a, b) {
                            return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
                        });

                        return new_list;
                    };

                    $('#queue-listpanel', parent)
                        .empty()
                        .listpanel({
                            label: 'Queues',
                            identifier: 'queue-listview',
                            new_entity_label: 'Add Queue',
                            data: map_crossbar_data(data.data),
                            publisher: winkstart.publish,
                            notifyMethod: 'queue.edit',
                            notifyCreateMethod: 'queue.edit',
                            notifyParent: parent
                        });
                }
            );
        },

        activate: function(parent) {
            var THIS = this,
                queue_html = THIS.templates.queue.tmpl();

            (parent || $('#ws-content'))
                .empty()
                .append(queue_html);

            THIS.render_list(queue_html);
        },

        render_user_list: function(data, parent) {
            var THIS = this;

            if(data.data.id) {
                if('agents' in data.data && data.data.agents.length > 0) {
                    var user_item;
                    $.each(data.field_data.users, function(k, v) {
                        if(data.data.agents.indexOf(v.id) >= 0) {
                            user_item = {
                                user_id: v.id,
                                user_name: v.first_name + ' ' + v.last_name
                            };

                            $('.rows', parent).append(THIS.templates.user_row.tmpl(user_item));
                            $('#option_user_'+v.id, parent).hide();
                        }
                    });
                }
                else {
                    $('.rows', parent).empty()
                                      .append(THIS.templates.user_row.tmpl());
                }
            }
            else {
                $('.rows', parent).empty()
                                  .append(THIS.templates.user_row.tmpl());
            }
        },

        popup_edit_queue: function(data, callback, data_defaults) {
            var popup, popup_html;

            popup_html = $('<div class="inline_popup"><div class="inline_content"/></div>');

            winkstart.publish('queue.edit', data, popup_html, $('.inline_content', popup_html), {
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
                        title: (data.id) ? 'Edit Queue' : 'Create Queue'
                    });
                }
            }, data_defaults);
        },

        define_callflow_nodes: function(callflow_nodes) {
            var THIS = this;

            $.extend(callflow_nodes, {
                'queue[id=*]': {
                    name: 'Queue',
                    icon: 'queue',
                    category: 'Call-Center',
                    module: 'queue',
                    tip: 'Ask the caller to input the first letters of the name of the person that he wants to reach.',
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

                        return (id) ? caption_map[id].name : '';
                    },
                    edit: function(node, callback) {
                        var _this = this;

                        winkstart.request(true, 'queue.list',  {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url
                            },
                            function(data, status) {
                                var popup, popup_html;

                                popup_html = THIS.templates.queue_callflow.tmpl({
                                    items: data.data,
                                    selected: node.getMetadata('id') || ''
                                });

                                if($('#queue_selector option:selected', popup_html).val() == undefined) {
                                    $('#edit_link', popup_html).hide();
                                }

                                $('.inline_action', popup_html).click(function(ev) {
                                    var _data = ($(this).dataset('action') == 'edit') ?
                                                    { id: $('#queue_selector', popup_html).val() } : {};

                                    ev.preventDefault();

                                    winkstart.publish('queue.popup_edit', _data, function(_data) {
                                        node.setMetadata('id', _data.data.id || 'null');

                                        node.caption = _data.data.name || '';

                                        popup.dialog('close');
                                    });
                                });

                                $('#add', popup_html).click(function() {
                                    node.setMetadata('id', $('#queue_selector', popup).val());

                                    node.caption = $('#queue_selector option:selected', popup).text();

                                    popup.dialog('close');
                                });

                                popup = winkstart.dialog(popup_html, {
                                    title: 'Queue',
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
                'agent[action=resume]': {
                    name: 'Agent Resume',
                    icon: 'rightarrow',
                    category: 'Call-Center',
                    module: 'agent',
                    tip: '',
                    data: {
                        action: 'resume',
                        retries: '3'
                    },
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '0'
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
                'agent[action=break]': {
                    name: 'Agent Break',
                    icon: 'rightarrow',
                    category: 'Call-Center',
                    module: 'agent',
                    tip: '',
                    data: {
                        action: 'break',
                        retries: '3'
                    },
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '0'
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
                'agent[action=logout]': {
                    name: 'Logout Agent',
                    icon: 'rightarrow',
                    category: 'Call-Center',
                    module: 'agent',
                    tip: '',
                    data: {
                        action: 'logout',
                        retries: '3'
                    },
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '0'
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
                'agent[action=login]': {
                    name: 'Login Agent',
                    icon: 'rightarrow',
                    category: 'Call-Center',
                    module: 'agent',
                    tip: '',
                    data: {
                        action: 'login',
                        retries: '3'
                    },
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '0'
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
                'agent[action=toggle]': {
                    name: 'Toggle Agent',
                    icon: 'rightarrow',
                    category: 'Call-Center',
                    module: 'agent',
                    tip: '',
                    data: {
                        action: 'toggle',
                        retries: '3'
                    },
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '0'
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
