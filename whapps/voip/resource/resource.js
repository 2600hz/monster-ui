winkstart.module('voip', 'resource', {
        css: [
            'css/resource.css'
        ],

        templates: {
            resource: 'tmpl/resource.html',
            edit: 'tmpl/edit.html',
            gateway: 'tmpl/gateway.html',
            landing_resource: 'tmpl/landing_resource.html'
        },

        subscribe: {
            'resource.activate': 'activate',
            'resource.edit': 'edit_resource',
            'callflow.define_callflow_nodes': 'define_callflow_nodes'
        },

        validation: [
            { name: '#name',                   regex: /^.+$/ },
            { name: '#weight_cost',            regex: /^[0-9]+$/ },
            { name: '#rules',                  regex: /^.*$/ },
            { name: '#caller_id_options_type', regex: /^\w*$/ },
            { name: '#gateways_username',      regex: /^.*$/ },
            { name: '#gateways_password',      regex: /^[^\s]*$/ },
            { name: '#gateways_prefix',        regex: /^[\+]?[\#0-9]*$/ },
            { name: '#gateways_suffix',        regex: /^[0-9]*$/ },
            { name: '#gateways_progress_timeout', regex: /^[0-9]*$/ }
        ],

        resources: {
            'local_resource.list': {
                url: '{api_url}/accounts/{account_id}/local_resources',
                contentType: 'application/json',
                verb: 'GET'
            },
            'local_resource.get': {
                url: '{api_url}/accounts/{account_id}/local_resources/{resource_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'local_resource.create': {
                url: '{api_url}/accounts/{account_id}/local_resources',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'local_resource.update': {
                url: '{api_url}/accounts/{account_id}/local_resources/{resource_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'local_resource.delete': {
                url: '{api_url}/accounts/{account_id}/local_resources/{resource_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            },
            'global_resource.list': {
                url: '{api_url}/accounts/{account_id}/global_resources',
                contentType: 'application/json',
                verb: 'GET'
            },
            'global_resource.get': {
                url: '{api_url}/accounts/{account_id}/global_resources/{resource_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'global_resource.create': {
                url: '{api_url}/accounts/{account_id}/global_resources',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'global_resource.update': {
                url: '{api_url}/accounts/{account_id}/global_resources/{resource_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'global_resource.delete': {
                url: '{api_url}/accounts/{account_id}/global_resources/{resource_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            },
            'account.get': {
                url: '{api_url}/accounts/{account_id}',
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
            label: 'Carriers',
            icon: 'resource',
            weight: '15',
            category: 'advanced'
        });
    },

    {
        save_resource: function(form_data, data, success, error) {
            var THIS = this,
                normalized_data = THIS.normalize_data($.extend(true, {}, data.data, form_data));

            if(typeof data.data == 'object' && data.data.id) {
                 winkstart.request(true, normalized_data.type + '_resource.update', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        resource_id: data.data.id,
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
                winkstart.request(true, normalized_data.type + '_resource.create', {
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

        edit_resource: function(data, _parent, _target, _callbacks, data_defaults) {
            var THIS = this,
                parent = _parent || $('#resource-content'),
                target = _target || $('#resource-view', parent),
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                            THIS.render_list(parent);

                            THIS.edit_resource({ id: _data.data.id, type: _data.data.type }, parent, target, callbacks);
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
                        weight_cost: 50,
                        enabled: true,
                        gateways: [
                            {
                                prefix: '+1',
                                codecs: ['PCMU', 'PCMA'],
                                progress_timeout: '6'
                            }
                        ],
                        rules: [
                            '^\\+{0,1}1{0,1}(\\d{10})$'
                        ],
                        caller_id_options: {
                            type: 'external'
                        },
                    }, data_defaults || {}),
                    field_data: {
                        caller_id_options: {
                            type: {
                                'external': 'external',
                                'internal': 'internal',
                                'emergency': 'emergency'
                            }
                        },
                        gateways: {
                            codecs: {
                                'G729': 'G729 - 8kbps (Requires License)',
                                'PCMU': 'G711u / PCMU - 64kbps (North America)',
                                'PCMA': 'G711a / PCMA - 64kbps (Elsewhere)',
                                'G722_16': 'G722 (HD) @ 16kHz',
                                'G722_32': 'G722.1 (HD) @ 32kHz',
                                'CELT_48': 'Siren (HD) @ 48kHz',
                                'CELT_64': 'Siren (HD) @ 64kHz'
                            }
                        },
                        rules: {
                            '^\\+{0,1}1{0,1}(\\d{10})$': 'US - 10 digits',
                            '^(\\d{7})$': 'US - 7 digits',
                            '.*': 'No match',
                            'custom': 'Custom'
                        }
                    },
                    functions: {
                        inArray: function(value, array) {
                            return ($.inArray(value, array) == -1) ? false : true;
                        }
                    }
                };

                if(typeof data == 'object' && data.id && data.type) {
                    winkstart.request(true, data.type + '_resource.get', {
                            account_id: winkstart.apps['voip'].account_id,
                            api_url: winkstart.apps['voip'].api_url,
                            resource_id: data.id
                        },
                        function(_data, status) {
                            _data.data.type = data.type;

                            THIS.render_resource($.extend(true, defaults, _data), target, callbacks);

                            if(typeof callbacks.after_render == 'function') {
                                callbacks.after_render();
                            }
                        }
                    );
                }
                else {
                    if(!('admin' in winkstart.apps['voip']) || !winkstart.apps['voip'].admin) {
                        defaults.data.type = 'local';
                    }
                    THIS.render_resource(defaults, target, callbacks);

                    if(typeof callbacks.after_render == 'function') {
                        callbacks.after_render();
                    }
                }
        },

        delete_resource: function(data, success, error) {
            var THIS = this;

            if(data.data.id) {
                winkstart.request(true, data.data.type + '_resource.delete', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        resource_id: data.data.id
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

        render_resource: function(data, target, callbacks) {
            var THIS = this,
                resource_html = THIS.templates.edit.tmpl(data),
                check_rule_and_hide = function() {
                    var rule = $('#rules_dropdown', resource_html).val()

                    if(rule != 'custom') {
                        $('#rules', resource_html).val('').hide();
                    }
                    else {
                        $('#rules', resource_html).val('').show();
                    }
                },
                _after_render;

            winkstart.validate.set(THIS.config.validation, resource_html);

            $('*[rel=popover]', resource_html).popover({
                trigger: 'focus'
            });

            winkstart.tabs($('.view-buttons', resource_html), $('.tabs', resource_html), true);

            $('.resource-save', resource_html).click(function(ev) {
                ev.preventDefault();

                winkstart.validate.is_valid(THIS.config.validation, resource_html, function() {
                        var form_data = form2object('resource-form');

                        THIS.clean_form_data(form_data);

                        if('field_data' in data) {
                            delete data.field_data;
                        }

                        THIS.save_resource(form_data, data, callbacks.save_success, winkstart.error_message.process_error(callbacks.save_error));
                    },
                    function() {
                        winkstart.alert('There were errors on the form, please correct!');
                    }
                );
            });

            $('.resource-delete', resource_html).click(function(ev) {
                ev.preventDefault();

                winkstart.confirm('Are you sure you want to delete this resource?', function() {
                    THIS.delete_resource(data, callbacks.delete_success, callbacks.delete_error);
                });
            });

            $('#gateways_server', resource_html).bind('keyup change blur', function() {
                var val = $(this).val(),
                    old_val = $(this).dataset('prev_value');

                if(old_val == $('#gateways_realm', resource_html).val()) {
                    $('#gateways_realm', resource_html).val(val);
                }

                $(this).dataset('prev_value', val);
            });

            $('#rules_dropdown', resource_html).change(function() {
                check_rule_and_hide();
            });

            if(data.data.rules[0] in data.field_data.rules) {
                $('#rules', resource_html).hide();
            }
            else {
                $('#rules_dropdown', resource_html).val('custom');
            }

            _after_render = callbacks.after_render;

            callbacks.after_render = function() {
                if(typeof _after_render == 'function') {
                    _after_render();
                }

                $('#weight_cost', resource_html).slider({
                    from: 0,
                    to: 100,
                    step: 1,
                    scale: ['Lowest', 'Low', 'Normal', 'High', 'Highest'],
                    limits: false
                });
            };

            (target)
                .empty()
                .append(resource_html);

        },

        normalize_data: function(data) {
            return data;
        },

        list_local_resources: function(callback) {
            winkstart.getJSON('local_resource.list', {
                    crossbar: true,
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(data, status) {
                    if(typeof callback == 'function') {
                        callback(data);
                    }
                }
            );
        },

        list_global_resources: function(callback) {
            winkstart.getJSON('global_resource.list', {
                    crossbar: true,
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(data, status) {
                    if(typeof callback == 'function') {
                        callback(data);
                    }
                }
            );
        },

        render_list: function(parent, callback){
            var THIS = this,
                setup_list = function (local_data, global_data) {
                    var resources;
                    function map_crossbar_data(crossbar_data, type){
                        var new_list = [];
                        if(crossbar_data.length > 0) {
                            _.each(crossbar_data, function(elem){
                                new_list.push({
                                    id: elem.id,
                                    title: elem.name,
                                    type: type
                                });
                            });
                        }

                        return new_list;
                    }

                    var options = {};
                    options.label = 'Carriers Module';
                    options.identifier = 'resource-listview';
                    options.new_entity_label = 'Add Carrier';

                    resources = [].concat(map_crossbar_data(local_data, 'local'), map_crossbar_data(global_data, 'global'));
                    resources.sort(function(a, b) {
                        var answer;
                        a.title.toLowerCase() < b.title.toLowerCase() ? answer = -1 : answer = 1;
                        return answer;
                    });

                    options.data = resources;
                    options.publisher = winkstart.publish;
                    options.notifyMethod = 'resource.edit';
                    options.notifyCreateMethod = 'resource.edit';

                    $('#resource-listpanel', parent).empty();
                    $('#resource-listpanel', parent).listpanel(options);

                    if(typeof callback === 'function') {
                        callback();
                    }
                };

            if('admin' in winkstart.apps['voip'] && winkstart.apps['voip'].admin === true) {
                THIS.list_global_resources(function(global_data) {
                    THIS.list_local_resources(function(local_data) {
                        setup_list(local_data.data, global_data.data);
                    });
                });
            }
            else {
                THIS.list_local_resources(function(local_data) {
                    setup_list(local_data.data, []);
                });
            }
        },

        clean_form_data: function(form_data) {
            if(form_data.rules_dropdown != 'custom') {
                form_data.rules[0] = form_data.rules_dropdown;
            }

            delete form_data.rules_dropdown;

            $.each(form_data.gateways, function(indexGateway, gateway) {
                var audioCodecs = [];

                $.each(gateway.codecs, function(indexCodec, codec) {
                    if(codec) {
                        audioCodecs.push(codec);
                    }
                });

                form_data.gateways[indexGateway].codecs = audioCodecs;
            });

            return form_data;
        },

        delete_nomatch_route: function(success, error) {
            winkstart.request('callflow.get_no_match', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(_data, status) {
                    if(_data.data.length > 0) {
                        winkstart.request('callflow.delete', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url,
                                callflow_id: _data.data[0].id
                            },
                            function(_data, status) {
                                success(_data, status);
                            }
                        );
                    }
                    else {
                        success(_data, status);
                    }
                },
                function(_data, status) {
                    error(_data, status);
                }
            );
        },

        update_nomatch_route: function(parent, module_name) {
            var THIS = this;

            THIS.delete_nomatch_route(function() {
                winkstart.request('callflow.create', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        data: {
                            featurecode: {},
                            numbers: ['no_match'],
                            flow: {
                                children: {},
                                data: {},
                                module: module_name
                            }
                        }
                    },
                    function(json) {
                        THIS.render_landing_resource(parent, module_name);
                    },
                    function(json, status) {
                        winkstart.alert('Error: ' + status);
                    }
                );
            });
        },

        render_landing_resource: function(parent, resource_type) {
            var THIS = this,
                resource_type = resource_type || 'none',
                module_name,
                init_events = function() {
                    $('.resource_btn', resource_html).click(function() {
                        if(!$(this).hasClass('pressed')) {
                            if($(this).hasClass('hosted_btn')) {
                                module_name = 'offnet';
                                THIS.update_nomatch_route(parent, module_name);
                            }
                            else {
                                winkstart.confirm('Are you sure you want to use a different carrier?', function() {
                                    module_name = 'resources';
                                    THIS.update_nomatch_route(parent, module_name);
                                });
                            }
                        }
                        else {
                            THIS.delete_nomatch_route(function() {
                                module_name = 'none';
                                THIS.render_landing_resource(parent, module_name);
                                $('.resource_btn', resource_html).removeClass('pressed');
                            });
                        }
                    });
                },
                display_page = function() {
                    resource_html = THIS.templates.landing_resource.tmpl({ company_name: winkstart.config.company_name || false, resource_type: resource_type });
                    init_events();
                    if(resource_type === 'resources') {
                        var list_resource_html = THIS.templates.resource.tmpl();

                        (parent || $('#ws-content'))
                            .empty()
                            .append(list_resource_html);

                        THIS.render_list(parent, function() {
                            $('#resource-view', parent).append(resource_html);
                        });
                    }
                    else {
                        (parent || $('#ws-content'))
                            .empty()
                            .append(resource_html);
                    }
                };

            if(resource_type === 'none') {
                winkstart.request('callflow.get_no_match', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url
                    },
                    function(_data, status) {
                        if(_data.data.length > 0) {
                            winkstart.request('callflow.get', {
                                    account_id: winkstart.apps['voip'].account_id,
                                    api_url: winkstart.apps['voip'].api_url,
                                    callflow_id: _data.data[0].id
                                },
                                function(_data, status) {
                                    resource_type = _data.data.flow.module;
                                    display_page();
                                }
                            );
                        }
                        else {
                            display_page();
                        }
                    }
                );
            }
            else {
                display_page();
            }
        },

        activate: function(parent) {
            var THIS = this;

            THIS.render_landing_resource(parent);
        },

        define_callflow_nodes: function(callflow_nodes) {
            var THIS = this;

            $.extend(callflow_nodes, {
                'offnet[]': {
                    name: 'Global Carrier',
                    icon: 'offnet',
                    category: 'Advanced',
                    module: 'offnet',
                    tip: 'Route calls to the phone network through pre-configured service providers',
                    data: {},
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
                'resources[]': {
                    name: 'Account Carrier',
                    icon: 'resource',
                    category: 'Advanced',
                    module: 'resources',
                    tip: 'Route calls to the phone network through a configured SIP provider, Google Voice or physical digital/analog line',
                    data: {},
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
