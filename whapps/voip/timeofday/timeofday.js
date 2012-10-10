winkstart.module('voip', 'timeofday', {
        css: [
            'css/timeofday.css'
        ],

        templates: {
            timeofday: 'tmpl/timeofday.html',
            edit: 'tmpl/edit.html',
            timeofday_callflow: 'tmpl/timeofday_callflow.html',
            timeofday_key_dialog: 'tmpl/timeofday_key_dialog.html',
            two_column: 'tmpl/two_column.html'
        },

        subscribe: {
            'timeofday.activate': 'activate',
            'timeofday.edit': 'edit_timeofday',
            'callflow.define_callflow_nodes': 'define_callflow_nodes',
            'timeofday.popup_edit': 'popup_edit_timeofday'
        },

        validation: [
            { name: '#name', regex: /^[a-zA-Z0-9\s_']+$/ }
        ],

        resources: {
            'timeofday.list': {
                url: '{api_url}/accounts/{account_id}/temporal_rules',
                contentType: 'application/json',
                verb: 'GET'
            },
            'timeofday.get': {
                url: '{api_url}/accounts/{account_id}/temporal_rules/{timeofday_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'timeofday.create': {
                url: '{api_url}/accounts/{account_id}/temporal_rules',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'timeofday.update': {
                url: '{api_url}/accounts/{account_id}/temporal_rules/{timeofday_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'timeofday.delete': {
                url: '{api_url}/accounts/{account_id}/temporal_rules/{timeofday_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);

        winkstart.publish('whappnav.subnav.add', {
            whapp: 'voip',
            module: THIS.__module,
            label: 'Time Of Day',
            icon: 'timeofday',
            weight: '25',
            category: 'advanced'
        });
    },

    {
        save_timeofday: function(form_data, data, success, error) {
            var THIS = this,
                normalized_data = THIS.normalize_data($.extend(true, {}, data.data, form_data));

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'timeofday.update', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        timeofday_id: data.data.id,
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
                winkstart.request(true, 'timeofday.create', {
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

        edit_timeofday: function(data, _parent, _target, _callbacks, data_defaults) {
            var THIS = this,
                parent = _parent || $('#timeofday-content'),
                target = _target || $('#timeofday-view', parent)
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                            THIS.render_list(parent);

                            THIS.edit_timeofday({ id: _data.data.id }, parent, target, callbacks);
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
                        time_window_start: 32400,
                        time_window_stop: 61200,
                        wdays: [],
                        days: [],
                        interval: 1
                    }, data_defaults || {}),
                    field_data: {
                        wdays: [
                            'Sunday',
                            'Monday',
                            'Tuesday',
                            'Wednesday',
                            'Thursday',
                            'Friday',
                            'Saturday'
                        ],

                        day: [
                            '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16',
                            '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'
                        ],

                        cycle: [
                            { id: 'weekly', value: 'Weekly' },
                            { id: 'monthly', value:'Monthly' },
                            { id: 'yearly', value:'Yearly' }
                        ],

                        ordinals: [
                            { id: 'first', value: 'First' },
                            { id: 'second', value: 'Second' },
                            { id: 'third', value: 'Third' },
                            { id: 'fourth', value: 'Fourth' },
                            { id: 'fifth', value: 'Fifth' },
                            { id: 'last', value: 'Last' },
                            { id: 'every', value: 'Day' }
                        ],

                        months: [
                            { id: 1, value: 'January' },
                            { id: 2, value: 'February' },
                            { id: 3, value: 'March' },
                            { id: 4, value: 'April' },
                            { id: 5, value: 'May' },
                            { id: 6, value: 'June' },
                            { id: 7, value: 'July' },
                            { id: 8, value: 'August' },
                            { id: 9, value: 'September' },
                            { id: 10, value: 'October' },
                            { id: 11, value: 'November' },
                            { id: 12, value: 'December' }
                        ]
                    }
                };


            if(typeof data == 'object' && data.id) {
                winkstart.request(true, 'timeofday.get', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        timeofday_id: data.id
                    },
                    function(_data, status) {
                        THIS.migrate_data(_data);

                        THIS.format_data(_data);

                        THIS.render_timeofday($.extend(true, defaults, _data), target, callbacks);

                        if(typeof callbacks.after_render == 'function') {
                            callbacks.after_render();
                        }
                    }
                );
            }
            else {
                THIS.render_timeofday(defaults, target, callbacks);

                if(typeof callbacks.after_render == 'function') {
                    callbacks.after_render();
                }
            }
        },

        delete_timeofday: function(data, success, error) {
            var THIS = this;

            if(data.data.id) {
                winkstart.request(true, 'timeofday.delete', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        timeofday_id: data.data.id
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

        render_timeofday: function(data, target, callbacks){
            var THIS = this,
                wday,
                timeofday_html = THIS.templates.edit.tmpl(data),
                _after_render;

            winkstart.validate.set(THIS.config.validation, timeofday_html);

            $('*[rel=popover]', timeofday_html).popover({
                trigger: 'focus'
            });

            winkstart.tabs($('.view-buttons', timeofday_html), $('.tabs', timeofday_html));

            $('#start_date', timeofday_html).datepicker();

            $('#yearly_every', timeofday_html).hide();
            $('#monthly_every', timeofday_html).hide();
            $('#weekly_every', timeofday_html).hide();
            $('#ordinal', timeofday_html).hide();
            $('#days_checkboxes', timeofday_html).hide();
            $('#weekdays', timeofday_html).hide();
            $('#specific_day', timeofday_html).hide();

            if(data.data.id == undefined) {
                $('#weekly_every', timeofday_html).show();
                $('#days_checkboxes', timeofday_html).show();
            } else {
                if(data.data.cycle == 'monthly') {
                    $('#monthly_every', timeofday_html).show();
                    $('#ordinal', timeofday_html).show();
                    if(data.data.days != undefined && data.data.days[0] != undefined) {
                        $('#specific_day', timeofday_html).show();
                    } else {
                        $('#weekdays', timeofday_html).show();
                    }
                } else if(data.data.cycle == 'yearly') {
                    $('#yearly_every', timeofday_html).show();
                    $('#ordinal', timeofday_html).show();
                    if(data.data.days != undefined && data.data.days[0] != undefined) {
                        $('#specific_day', timeofday_html).show();
                    } else {
                        $('#weekdays', timeofday_html).show();
                    }
                } else if(data.data.cycle = 'weekly') {
                    $('#weekly_every', timeofday_html).show();
                    $('#days_checkboxes', timeofday_html).show();
                }
            }

            $('.fake_checkbox', timeofday_html).click(function() {
                $(this).toggleClass('checked');
            });

            $('#ordinal', timeofday_html).change(function() {
                if($(this).val() == 'every') {
                    $('#weekdays', timeofday_html).hide();
                    $('#specific_day', timeofday_html).show();
                } else {
                    $('#weekdays', timeofday_html).show();
                    $('#specific_day', timeofday_html).hide();
                }
            });

            $('#cycle', timeofday_html).change(function() {
                $('#yearly_every', timeofday_html).hide();
                $('#monthly_every', timeofday_html).hide();
                $('#weekly_every', timeofday_html).hide();
                $('#ordinal', timeofday_html).hide();
                $('#days_checkboxes', timeofday_html).hide();
                $('#weekdays', timeofday_html).hide();
                $('#specific_day', timeofday_html).hide();

                switch($(this).val()) {
                    case 'yearly':
                        $('#yearly_every', timeofday_html).show();
                        $('#ordinal', timeofday_html).show();
                        if($('#ordinal', timeofday_html).val() == 'every') {
                            //$('#weekdays', timeofday_html).hide();
                            $('#specific_day', timeofday_html).show();
                        } else {
                            $('#weekdays', timeofday_html).show();
                            //$('#specific_day', timeofday_html).hide();
                        }
                        break;

                    case 'monthly':
                        $('#monthly_every', timeofday_html).show();
                        $('#ordinal', timeofday_html).show();
                        if($('#ordinal', timeofday_html).val() == 'every') {
                            //$('#weekdays', timeofday_html).hide();
                            $('#specific_day', timeofday_html).show();
                        } else {
                            $('#weekdays', timeofday_html).show();
                            //$('#specific_day', timeofday_html).hide();
                        }
                        break;

                    case 'weekly':
                        $('#weekly_every', timeofday_html).show();
                        $('#days_checkboxes', timeofday_html).show();
                        break;
                }
            });

            $('.timeofday-save', timeofday_html).click(function(ev) {
                ev.preventDefault();

                winkstart.validate.is_valid(THIS.config.validation, timeofday_html, function() {
                        var form_data = form2object('timeofday-form');

                        form_data.wdays = [];
                        data.data.wdays = [];

                        $('.fake_checkbox.checked', timeofday_html).each(function() {
                            form_data.wdays.push($(this).dataset('value'));
                        });

                        form_data.interval = $('#cycle', timeofday_html).val() == 'monthly' ? $('#interval_month', timeofday_html).val() : $('#interval_week', timeofday_html).val();

                        form_data = THIS.clean_form_data(form_data);

                        THIS.save_timeofday(form_data, data, callbacks.save_success, winkstart.error_message.process_error(callbacks.save_error));
                    },
                    function() {
                        winkstart.alert('There were errors on the form, please correct!');
                    }
                );
            });

            $('.timeofday-delete', timeofday_html).click(function(ev) {
                ev.preventDefault();

                winkstart.confirm('Are you sure you want to delete this time of day rule?', function() {
                    THIS.delete_timeofday(data, callbacks.delete_success, callbacks.delete_error);
                });
            });

            _after_render = callbacks.after_render;

            callbacks.after_render = function() {
                if(typeof _after_render == 'function') {
                    _after_render();
                }

                $('#time', timeofday_html).slider({
                    from: 0,
                    to: 86400,
                    step: 900,
                    dimension: '',
                    scale: ['12:00am', '1:00am', '2:00am', '3:00am', '4:00am', '5:00am',
                            '6:00am', '7:00am', '8:00am',  '9:00am', '10:00am', '11:00am',
                            '12:00pm', '1:00pm', '2:00pm', '3:00pm', '4:00pm', '5:00pm',
                            '6:00pm', '7:00pm', '8:00pm', '9:00pm', '10:00pm', '11:00pm', '12:00am'],
                    limits: false,
                    calculate: function(val) {
                        var hours = Math.floor(val / 3600),
                            mins = (val - hours * 3600) / 60,
                            meridiem = (hours < 12) ? 'am' : 'pm';

                        hours = hours % 12;

                        if (hours == 0) {
                            hours = 12;
                        }

                        return hours + ':' + (mins ? mins : '0' + mins)  + meridiem;
                    },
                    onstatechange: function () {}
                });
            };

            (target)
                .empty()
                .append(timeofday_html);
        },

        clean_form_data: function(form_data) {
            var wdays = [],
                times = form_data.time.split(';');

            if(form_data.cycle != 'weekly' && form_data.weekday != undefined) {
                form_data.wdays = [];
                form_data.wdays.push(form_data.weekday);
            }

            $.each(form_data.wdays, function(i, val) {
                if(val) {
                    if(val == 'wednesday') {
                        val = 'wensday';
                    }
                    wdays.push(val);
                }
            });

            if(wdays.length > 0 && wdays[0] == 'sunday') {
                wdays.push(wdays.shift());
            }

            form_data.wdays = wdays;

            form_data.start_date = new Date(form_data.start_date).getTime()/1000 + 62167219200;

            form_data.time_window_start = times[0];
            form_data.time_window_stop = times[1];

            return form_data;
        },

        normalize_data: function(form_data) {
            if(form_data.cycle == 'weekly') {
                delete form_data.ordinal;
                delete form_data.days;
                delete form_data.month;
            }
            else {
                form_data.cycle == 'yearly' ? delete form_data.interval : delete form_data.month;
                form_data.ordinal != 'every' ? delete form_data.days : delete form_data.wdays;
            }

            delete form_data.time;
            delete form_data.weekday;

            return form_data;
        },

        format_data: function(data) {
            var tmp_date = data.data.start_date == undefined ? new Date() : new Date((data.data.start_date - 62167219200)* 1000);
            var month = tmp_date.getMonth()+1 < 10 ? '0'+(tmp_date.getMonth()+1) : tmp_date.getMonth()+1;
            var day = tmp_date.getDate() < 10 ? '0'+tmp_date.getDate() : tmp_date.getDate();
            tmp_date = month + '/' + day + '/'  + tmp_date.getFullYear();

            data.data.start_date = tmp_date;

            if(data.data.wdays != undefined && data.data.cycle != 'weekly') {
                data.data.weekday = data.data.wdays[0];
            }

            return data;
        },

        migrate_data: function(data) {
            // Check for spelling ;)
            if('wdays' in data.data && (wday = $.inArray('wensday', data.data.wdays)) > -1) {
                data.data.wdays[wday] = 'wednesday';
            }

            return data;
        },

        render_list: function(parent){
            var THIS = this;

            winkstart.request(true, 'timeofday.list', {
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
                                    title: val.name || '(no name)'
                                });
                            });
                        }

                        new_list.sort(function(a, b) {
                            return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
                        });

                        return new_list;
                    };

                    $('#timeofday-listpanel', parent)
                        .empty()
                        .listpanel({
                            label: 'Time of Day',
                            identifier: 'timeofday-listview',
                            new_entity_label: 'Add Time of Day',
                            data: map_crossbar_data(data.data),
                            publisher: winkstart.publish,
                            notifyMethod: 'timeofday.edit',
                            notifyCreateMethod: 'timeofday.edit',
                            notifyParent: parent
                        });
                }
            );
        },

        activate: function(parent) {
            var THIS = this,
                timeofday_html = THIS.templates.timeofday.tmpl();

            (parent || $('#ws-content'))
                .empty()
                .append(timeofday_html);

            THIS.render_list(timeofday_html);
        },

        popup_edit_timeofday: function(data, callback, data_defaults) {
            var popup, popup_html;

            popup_html = $('<div class="inline_popup"><div class="main_content inline_content"/></div>');

            winkstart.publish('timeofday.edit', data, popup_html, $('.inline_content', popup_html), {
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
                        title: (data.id) ? 'Edit Time of Day' : 'Create Time of Day'
                    });
                }
            }, data_defaults);
        },

        define_callflow_nodes: function(callflow_nodes) {
            var THIS = this;

            $.extend(callflow_nodes, {
                'temporal_route[]': {
                    name: 'Time of Day',
                    icon: 'temporal_route',
                    category: 'Time Of Day',
                    module: 'temporal_route',
                    data: {},
                    rules: [
                        {
                            type: 'quantity',
                            maxSize: '9'
                        }
                    ],
                    isUsable: 'true',
                    key_caption: function(child_node, caption_map) {
                        var key = child_node.key;

                        return (key != '_') ? caption_map[key].name : 'All other times';
                    },
                    key_edit: function(child_node, callback) {
                        var _this = this;

                        winkstart.request(true, 'timeofday.list', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url
                            },
                            function(data, status) {
                                var popup, popup_html;

                                data.data.push({ id: '_', name: 'All other times' });

                                popup_html = THIS.templates.timeofday_key_dialog.tmpl({
                                    items: data.data,
                                    selected: child_node.key
                                });

                                $('.inline_action', popup_html).click(function(ev) {
                                    var _data = ($(this).dataset('action') == 'edit') ?
                                                    { id: $('#timeofday_selector', popup_html).val() } : {};

                                    ev.preventDefault();

                                    winkstart.publish('timeofday.popup_edit', _data, function(_data) {
                                        child_node.key = _data.data.id || 'null';

                                        child_node.key_caption = _data.data.name || '';

                                        popup.dialog('close');
                                    });
                                });

                                if($('#timeofday_selector option:selected', popup_html).val() == '_') {
                                    $('#edit_link', popup_html).hide();
                                }

                                $('#timeofday_selector', popup_html).change(function() {
                                    $('#timeofday_selector option:selected', popup_html).val() == '_' ? $('#edit_link', popup_html).hide() : $('#edit_link', popup_html).show();
                                });

                                $('#add', popup_html).click(function() {
                                    child_node.key = $('#timeofday_selector', popup_html).val();

                                    child_node.key_caption = $('#timeofday_selector option:selected', popup_html).text();

                                    popup.dialog('close');
                                });

                                popup = winkstart.dialog(popup_html, {
                                    title: 'Time of Day',
                                    minHeight: '0',
                                    beforeClose: function() {
                                        if(typeof callback == 'function') {
                                            callback();
                                        }
                                    }
                                });
                            }
                        );
                    },
                    caption: function(node, caption_map) {
                        return node.getMetadata('timezone') || '';
                    },
                    edit: function(node, callback) {
                        var popup, popup_html;

                        popup_html = THIS.templates.timeofday_callflow.tmpl({
                            items: {},
                            selected: {}
                        });

                        winkstart.timezone.populate_dropdown($('#timezone_selector', popup_html), node.getMetadata('timezone'));

                        $('#add', popup_html).click(function() {
                            node.setMetadata('timezone', $('#timezone_selector', popup_html).val());

                            node.caption = $('#timezone_selector option:selected', popup_html).text();

                            popup.dialog('close');
                        });

                        popup = winkstart.dialog(popup_html, {
                            title: 'Select a Timezone',
                            minHeight: '0',
                            beforeClose: function() {
                                if(typeof callback == 'function') {
                                    callback();
                                }
                            }
                        });
                    }
                },
                'temporal_route[action=disable]': {
                    name: 'Disable Time of Day',
                    icon: 'temporal_route',
                    category: 'Time Of Day',
                    module: 'temporal_route',
                    data: {
                        action: 'disable',
                        rules: []
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
                        winkstart.request(true, 'timeofday.list', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url
                            },
                            function(data, status) {
                                var popup, popup_html, rules,
                                    unselected_rules = [],
                                    selected_rules = [];

                                if(rules = node.getMetadata('rules')) {
                                    $.each(data.data, function(i, obj) {
                                        if($.inArray(obj.id, rules) != -1) {
                                            selected_rules.push(obj);
                                        }
                                        else {
                                            unselected_rules.push(obj);
                                        }
                                    });
                                }
                                else {
                                    unselected_rules = data.data;
                                }

                                 popup_html = THIS.templates.two_column.tmpl({
                                    left: {
                                        title: 'Unselected time of day rules',
                                        items: unselected_rules
                                    },
                                    right: {
                                        title: 'Selected time of day rules',
                                        items: selected_rules
                                    }
                                });

                                $('#add', popup_html).click(function() {
                                    var _rules = [];

                                    $('.right .connect li', popup_html).each(function() {
                                        _rules.push($(this).dataset('id'));
                                    });

                                    node.setMetadata('rules', _rules);

                                    popup.dialog('close');
                                });

                                popup = winkstart.dialog(popup_html, {
                                    title: 'Disable Time of Day rules',
                                    minHeight: '0',
                                    beforeClose: function() {
                                        if(typeof callback == 'function') {
                                            callback();
                                        }
                                    }
                                });

                                /* Initialize the scrollpane AFTER it has rendered */

                                $('.scrollable', popup).jScrollPane();

                                $('.connect', popup).sortable({
                                    connectWith: $('.connect', popup),
                                    zIndex: 2000,
                                    helper: 'clone',
                                    appendTo: $('.wrapper', popup),
                                    scroll: false,
                                    receive: function() {
                                        $('.scrollable', popup).data('jsp').reinitialise();
                                    },
                                    remove: function() {
                                        $('.scrollable', popup).data('jsp').reinitialise();
                                    }
                                });
                            }
                        );
                    }
                },
                'temporal_route[action=enable]': {
                    name: 'Enable Time of Day',
                    icon: 'temporal_route',
                    category: 'Time Of Day',
                    module: 'temporal_route',
                    data: {
                        action: 'enable',
                        rules: []
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
                        winkstart.request(true, 'timeofday.list', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url
                            },
                            function(data, status) {
                                var popup, popup_html, rules,
                                    unselected_rules = [],
                                    selected_rules = [];

                                if(rules = node.getMetadata('rules')) {
                                    $.each(data.data, function(i, obj) {
                                        if($.inArray(obj.id, rules) != -1) {
                                            selected_rules.push(obj);
                                        }
                                        else {
                                            unselected_rules.push(obj);
                                        }
                                    });
                                }
                                else {
                                    unselected_rules = data.data;
                                }

                                popup_html = THIS.templates.two_column.tmpl({
                                    left: {
                                        title: 'Unselected time of day rules',
                                        items: unselected_rules
                                    },
                                    right: {
                                        title: 'Selected time of day rules',
                                        items: selected_rules
                                    }
                                });

                                $('#add', popup_html).click(function() {
                                    var _rules = [];

                                    $('.right .connect li', popup_html).each(function() {
                                        _rules.push($(this).dataset('id'));
                                    });

                                    node.setMetadata('rules', _rules);

                                    popup.dialog('close');
                                });

                                popup = winkstart.dialog(popup_html, {
                                    title: 'Enable Time of Day rules',
                                    minHeight: '0',
                                    beforeClose: function() {
                                        if(typeof callback == 'function') {
                                            callback();
                                        }
                                    }
                                });

                                /* Initialize the scrollpane AFTER it has rendered */

                                $('.scrollable', popup).jScrollPane();

                                $('.connect', popup).sortable({
                                    connectWith: $('.connect', popup),
                                    zIndex: 2000,
                                    helper: 'clone',
                                    appendTo: $('.wrapper', popup),
                                    scroll: false,
                                    receive: function() {
                                        $('.scrollable', popup).data('jsp').reinitialise();
                                    },
                                    remove: function() {
                                        $('.scrollable', popup).data('jsp').reinitialise();
                                    }
                                });
                            }
                        );
                    }
                },
                'temporal_route[action=reset]': {
                    name: 'Reset Time of Day',
                    icon: 'temporal_route',
                    category: 'Time Of Day',
                    module: 'temporal_route',
                    data: {
                        action: 'reset',
                        rules: []
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
                        winkstart.request(true, 'timeofday.list', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url
                            },
                            function(data, status) {
                                var popup, popup_html, rules,
                                    unselected_rules = [],
                                    selected_rules = [];

                                if(rules = node.getMetadata('rules')) {
                                    $.each(data.data, function(i, obj) {
                                        if($.inArray(obj.id, rules) != -1) {
                                            selected_rules.push(obj);
                                        }
                                        else {
                                            unselected_rules.push(obj);
                                        }
                                    });
                                }
                                else {
                                    unselected_rules = data.data;
                                }
                                popup_html = THIS.templates.two_column.tmpl({
                                    left: {
                                        title: 'Unselected time of day rules',
                                        items: unselected_rules
                                    },
                                    right: {
                                        title: 'Selected time of day rules',
                                        items: selected_rules
                                    }
                                });

                                $('#add', popup_html).click(function() {
                                    var _rules = [];

                                    $('.right .connect li', popup_html).each(function() {
                                        _rules.push($(this).dataset('id'));
                                    });

                                    node.setMetadata('rules', _rules);

                                    popup.dialog('close');
                                });

                                popup = winkstart.dialog(popup_html, {
                                    title: 'Reset Time of Day rules',
                                    minHeight: '0',
                                    beforeClose: function() {
                                        if(typeof callback == 'function') {
                                            callback();
                                        }
                                    }
                                });

                                /* Initialize the scrollpane AFTER it has rendered */

                                $('.scrollable', popup).jScrollPane();

                                $('.connect', popup).sortable({
                                    connectWith: $('.connect', popup),
                                    zIndex: 2000,
                                    helper: 'clone',
                                    appendTo: $('.wrapper', popup),
                                    scroll: false,
                                    receive: function() {
                                        $('.scrollable', popup).data('jsp').reinitialise();
                                    },
                                    remove: function() {
                                        $('.scrollable', popup).data('jsp').reinitialise();
                                    }
                                });
                            }
                        );
                    }
                }
            });
        }
    }
);
