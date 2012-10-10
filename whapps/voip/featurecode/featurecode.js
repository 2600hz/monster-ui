winkstart.module('voip', 'featurecode', {
        css: [
            'css/featurecode.css'
        ],

        templates: {
            featurecode: 'tmpl/featurecode.html',
       },

        subscribe: {
            'featurecode.activate' : 'activate',
            'featurecode.define_featurecodes': 'define_featurecodes'
        },

        resources: {
            'featurecode.list': {
                url: '{api_url}/accounts/{account_id}/callflows',
                contentType: 'application/json',
                verb: 'GET'
            },
            'featurecode.get': {
                url: '{api_url}/accounts/{account_id}/callflows/{featurecode_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'featurecode.create': {
                url: '{api_url}/accounts/{account_id}/callflows',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'featurecode.update': {
                url: '{api_url}/accounts/{account_id}/callflows/{featurecode_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'featurecode.delete': {
                url: '{api_url}/accounts/{account_id}/callflows/{featurecode_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            }
        }
    },
    function (args) {
        winkstart.registerResources(this.__whapp, this.config.resources);

        winkstart.publish('whappnav.subnav.add', {
            whapp: 'voip',
            module: this.__module,
            label: 'Feature Codes',
            icon: 'sip',
            weight: '95'
        });
    },
    {
        actions: {},
        categories: {},

        activate: function () {
            var THIS = this,
                featurecode_html;

            $('#ws-content').empty();
            THIS.categories = {};
            THIS.actions = {};
            winkstart.publish('featurecode.define_featurecodes', THIS.actions);

            $.each(THIS.actions, function(i, data) {
                this.tag = i;
                this.number = data.number == undefined ? data.default_number : data.number;
                if('category' in data) {
                    data.category in THIS.categories ? true : THIS.categories[data.category] = [];
                    THIS.categories[data.category].push(data);
                }
            });

            winkstart.getJSON('featurecode.list', {
                    crossbar: true,
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(data, status) {
                    
                    $.each(data.data, function() {
                        if('featurecode' in this && this.featurecode != false) {
                            if(this.featurecode.name in THIS.actions) {
                                THIS.actions[this.featurecode.name].id = this.id;
                                THIS.actions[this.featurecode.name].enabled = true;
                                THIS.actions[this.featurecode.name].number = this.featurecode.number.replace('\\', '');
                            }
                        }
                    });

                    var data = {'categories': THIS.categories, 'label':'data' },
                        featurecode_html = THIS.templates.featurecode.tmpl(data);

                    winkstart.accordion(featurecode_html);

                    $('*[rel=popover]:not([type="text"])', featurecode_html).popover({
                        trigger: 'hover'
                    });

                    $('*[rel=popover][type="text"]', featurecode_html).popover({
                        trigger: 'focus'
                    });

                    $('.featurecode_number', featurecode_html).bind('blur keyup focus', function(){
                        var action_wrapper = $(this).parents('.action_wrapper');

                        action_wrapper.dataset('number', $(this).val());

                        if($(this).val() != THIS.actions[action_wrapper.dataset('action')].number) {
                            action_wrapper.addClass('changed');
                        } else {
                            action_wrapper.removeClass('changed');
                        }
                    });

                    $('.featurecode_enabled', featurecode_html).each(function() {
                            var action_wrapper = $(this).parents('.action_wrapper'),
                                number_field = action_wrapper.find('.featurecode_number');

                            !$(this).is(':checked') ? $(number_field).attr('disabled', '') : $(number_field).removeAttr('disabled');
                    });

                    $('.featurecode_enabled', featurecode_html).change(function() {
                        var action_wrapper = $(this).parents('.action_wrapper');
                        
                        if(!$(this).is(':checked') && action_wrapper.dataset('enabled') == 'true') {
                            action_wrapper.addClass('disabled');
                        } else if($(this).is(':checked') && action_wrapper.dataset('enabled') == 'false'){
                            action_wrapper.addClass('enabled');
                        } else {
                            action_wrapper.removeClass('enabled');
                            action_wrapper.removeClass('disabled');
                        }

                        var number_field = action_wrapper.find('.featurecode_number');
                        !$(this).is(':checked') ? $(number_field).attr('disabled', '') : $(number_field).removeAttr('disabled');

                    });

                    $('.featurecode-save', featurecode_html).click(function() {
                        var form_data = THIS.clean_form_data();

                        THIS.update_list_featurecodes(form_data);

                        return false;
                    });

                    $('#ws-content')
                        .empty()
                        .append(featurecode_html);
                }
            );
        },

        update_list_featurecodes: function(form_data) {
            var THIS = this,
                count = form_data.created_callflows.length + form_data.deleted_callflows.length + form_data.updated_callflows.length;

            if(count == 0) {
                winkstart.alert('info','Nothing to save');
                return;
            }

            $.each(form_data.created_callflows, function() {
                winkstart.putJSON('featurecode.create', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        featurecode_id: this.id,
                        data: {
                            flow: this.flow,
                            patterns: this.patterns,
                            numbers: this.numbers,
                            featurecode: {
                                name: this.action,
                                number: this.number
                            }
                        }
                    },
                    function(data, status) {
                        if(!--count) {
                            winkstart.publish('featurecode.activate');
                        }
                    }
                );
            });

            $.each(form_data.updated_callflows, function() {
                winkstart.postJSON('featurecode.update', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        featurecode_id: this.id,
                        data: {
                            flow: this.flow,
                            patterns: this.patterns,
                            numbers: this.numbers,
                            featurecode: {
                                name: this.action,
                                number: this.number
                            }
                        }
                    },
                    function(data, status) {
                        if(!--count) {
                            winkstart.publish('featurecode.activate');
                        }
                    }
                );
            });


            $.each(form_data.deleted_callflows, function() {
                winkstart.deleteJSON('featurecode.delete', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        featurecode_id: this.id
                    },
                    function() {
                        if(!--count) {
                            winkstart.publish('featurecode.activate');
                        }
                    }
                );
            });
        },

        render_featurecodes: function() {
            var THIS = this;

            winkstart.getJSON('featurecode.list', {
                    crossbar: true,
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(data, status) {
                    $.each(data.data, function() {
                        if('featurecode' in this && this.featurecode != false) {
                            if(this.featurecode.name in THIS.actions) {
                                THIS.actions[this.featurecode.name].id = this.id;
                                THIS.actions[this.featurecode.name].enabled = true;
                                THIS.actions[this.featurecode.name].number = this.featurecode.number.replace('\\', '');
                            }
                        }
                    });
                    var data = {'categories': THIS.categories, 'label':'data' },
                        featurecode_html = THIS.templates.featurecode.tmpl(data);

                    $('#ws-content')
                        .empty()
                        .append(featurecode_html);
                }
            );
        },

        clean_form_data: function() {
            var THIS = this;

            var form_data = {
                created_callflows: [],
                deleted_callflows: [],
                updated_callflows: []
            };

            $('.enabled', '#featurecode-view').each(function() {
                var callflow = $(this).dataset();

                callflow.flow = {
                    data: THIS.actions[callflow.action].data,
                    module: THIS.actions[callflow.action].module,
                    children: {}
                };

                callflow.type += 's';

                /* if a star is in the pattern, then we need to escape it */
                if(callflow.type === 'patterns') {
                    callflow.number = callflow.number.replace(/([*])/g,'\\$1');
                }

                callflow[callflow.type] = [THIS.actions[callflow.action].build_regex(callflow.number)];
                form_data.created_callflows.push(callflow);
            });

            $('.disabled', '#featurecode-view').each(function() {
                var callflow = $(this).dataset();
                form_data.deleted_callflows.push(callflow);
            });

            $('.changed:not(.enabled, .disabled)', '#featurecode-view').each(function() {
                if($(this).dataset('enabled') == 'true') {
                    var callflow = $(this).dataset();

                    callflow.flow = {
                        data: THIS.actions[callflow.action].data,
                        module: THIS.actions[callflow.action].module,
                        children: {}
                    };

                    //callflow.patterns = [THIS.actions[callflow.action].build_regex(callflow.number)];
                    callflow.type += 's';

                    /* if a star is in the pattern, then we need to escape it */
                    if(callflow.type === 'patterns') {
                        callflow.number = callflow.number.replace(/([*])/g,'\\$1');
                    }

                    callflow[callflow.type] = [THIS.actions[callflow.action].build_regex(callflow.number)];

                    form_data.updated_callflows.push(callflow);
                }
            });

            return form_data;
        },

        construct_action: function(json) {
            var action = [];

            if('data' in json) {
                if('action' in json.data) {
                    action += '{action=' + json.data.action + '}';
                }
            }

            return json.module + action;
        },

        define_featurecodes: function(featurecodes) {
            var THIS = this;

            $.extend(featurecodes, {
               'call_forward[action=activate]': {
                    name: 'Enable Call-Forward',
                    icon: 'phone',
                    category: 'Call-Forward',
                    module: 'call_forward',
                    number_type: 'number',
                    data: {
                        action: 'activate'
                    },
                    enabled: false,
                    default_number: '72',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'call_forward[action=deactivate]': {
                    name: 'Disable Call-Forward',
                    icon: 'phone',
                    category: 'Call-Forward',
                    module: 'call_forward',
                    number_type: 'number',
                    data: {
                        action: 'deactivate'
                    },
                    enabled: false,
                    default_number: '73',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'call_forward[action=toggle]': {
                    name: 'Toggle Call-Forward',
                    icon: 'phone',
                    category: 'Call-Forward',
                    module: 'call_forward',
                    number_type: 'pattern',
                    data: {
                        action: 'toggle'
                    },
                    enabled: false,
                    default_number: '74',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'call_forward[action=update]': {
                    name: 'Update Call-Forward',
                    icon: 'phone',
                    category: 'Call-Forward',
                    module: 'call_forward',
                    number_type: 'number',
                    data: {
                        action: 'update'
                    },
                    enabled: false,
                    default_number: '56',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },

                'hotdesk[action=login]': {
                    name: 'Enable Hot Desking',
                    icon: 'phone',
                    category: 'Hot-Desking',
                    module: 'hotdesk',
                    number_type: 'number',
                    data: {
                        action: 'login'
                    },
                    enabled: false,
                    default_number: '11',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'hotdesk[action=logout]': {
                    name: 'Disable Hot Desking',
                    icon: 'phone',
                    category: 'Hot-Desking',
                    module: 'hotdesk',
                    number_type: 'number',
                    data: {
                        action: 'logout'
                    },
                    enabled: false,
                    default_number: '12',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'hotdesk[action=toggle]': {
                    name: 'Toggle Hot Desking',
                    icon: 'phone',
                    category: 'Hot-Desking',
                    module: 'hotdesk',
                    number_type: 'number',
                    data: {
                        action: 'toggle'
                    },
                    enabled: false,
                    default_number: '13',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'voicemail[action=check]': {
                    name: 'Check Voicemail',
                    icon: 'phone',
                    category: 'Miscellaneous',
                    module: 'voicemail',
                    number_type: 'number',
                    data: {
                        action: 'check'
                    },
                    enabled: false,
                    default_number: '97',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'voicemail[action="direct"]': {
                    name: 'Direct to Voicemail',
                    category: 'Miscellaneous',
                    module: 'voicemail',
                    number_type: 'pattern',
                    data: {
                        action: 'compose'
                    },
                    enabled: false,
                    default_number: '*',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'intercom': {
                    name: 'Intercom',
                    icon: 'phone',
                    category: 'Miscellaneous',
                    module: 'intercom',
                    number_type: 'pattern',
                    data: {
                    },
                    enabled: false,
                    default_number: '0',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'park_and_retrieve': {
                    name: 'Park and Retrieve',
                    icon: 'phone',
                    category: 'Parking',
                    module: 'park',
                    number_type: 'pattern',
                    data: {
                        action: 'auto'
                    },
                    enabled: false,
                    default_number: '3',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'valet': {
                    name: 'Valet',
                    icon: 'phone',
                    category: 'Parking',
                    module: 'park',
                    number_type: 'number',
                    data: {
                        action: 'park'
                    },
                    enabled: false,
                    default_number: '4',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'retrieve': {
                    name: 'Retrieve',
                    icon: 'phone',
                    category: 'Parking',
                    module: 'park',
                    number_type: 'pattern',
                    data: {
                        action: 'retrieve'
                    },
                    enabled: false,
                    default_number: '5',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                }
                /*'call_forward[action=on_busy_enable]': {
                    name: 'Enable Call-Forward on Busy',
                    icon: 'phone',
                    category: 'Call-Forward',
                    module: 'call_forward',
                    number_type: 'pattern',
                    data: {
                        action: 'on_busy_enable'
                    },
                    enabled: false,
                    default_number: '90',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'call_forward[action=on_busy_disable]': {
                    name: 'Disable Call-Forward on Busy',
                    icon: 'phone',
                    category: 'Call-Forward',
                    module: 'call_forward',
                    number_type: 'number',
                    data: {
                        action: 'on_busy_disable'
                    },
                    enabled: false,
                    default_number: '91',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'call_forward[action=no_answer_enable]': {
                    name: 'Enable Call-Forward No Answer',
                    icon: 'phone',
                    category: 'Call-Forward',
                    module: 'call_forward',
                    number_type: 'pattern',
                    data: {
                        action: 'no_answer_enable'
                    },
                    enabled: false,
                    default_number: '53',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'call_forward[action=no_answer_disable]': {
                    name: 'Disable Call-Forward No Answer',
                    icon: 'phone',
                    category: 'Call-Forward',
                    module: 'call_forward',
                    number_type: 'number',
                    data: {
                        action: 'no_answer_disable'
                    },
                    enabled: false,
                    default_number: '52',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'donotdisturb[action="enable"]': {
                    name: 'Enable Do not disturb',
                    icon: 'phone',
                    category: 'Do not disturb',
                    module: 'do_not_disturb',
                    number_type: 'pattern',
                    data: {
                        action: 'enable'
                    },
                    enabled: false,
                    default_number: '78',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'donotdisturb[action="disable"]': {
                    name: 'Disable Do not disturb',
                    icon: 'phone',
                    category: 'Do not disturb',
                    module: 'do_not_disturb',
                    number_type: 'number',
                    data: {
                        action: 'disable'
                    },
                    enabled: false,
                    default_number: '79',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },
                'donotdisturb[action="toggle"]': {
                    name: 'Toggle Do not disturb',
                    icon: 'phone',
                    category: 'Do not disturb',
                    module: 'do_not_disturb',
                    number_type: 'pattern',
                    data: {
                        action: 'toggle'
                    },
                    enabled: false,
                    default_number: '76',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'directory': {
                    name: 'Directory',
                    icon: 'phone',
                    category: 'Miscellaneous',
                    module: 'directory',
                    number_type: 'pattern',
                    data: {
                        action: ''
                    },
                    enabled: false,
                    default_number: '411',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'time': {
                    name: 'Check Time',
                    icon: 'phone',
                    category: 'Miscellaneous',
                    module: 'time',
                    number_type: 'pattern',
                    data: {
                        action: ''
                    },
                    enabled: false,
                    default_number: '60',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'call_waiting[action=enable]': {
                    name: 'Enable Call-Waiting',
                    icon: 'phone',
                    category: 'Miscellaneous',
                    module: 'call_waiting',
                    number_type: 'pattern',
                    data: {
                        action: 'enable'
                    },
                    enabled: false,
                    default_number: '70',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },
                'call_waiting[action=disable]': {
                    name: 'Disable Call-Waiting',
                    icon: 'phone',
                    category: 'Miscellaneous',
                    module: 'call_waiting',
                    number_type: 'number',
                    data: {
                        action: 'disable'
                    },
                    enabled: false,
                    default_number: '71',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '*'+number;
                    }
                },

                'sound_test_service': {
                    name: 'Sound Test Service',
                    icon: 'phone',
                    category: 'Miscellaneous',
                    module: '',
                    number_type: 'pattern',
                    data: {
                        action: ''
                    },
                    enabled: false,
                    default_number: '43',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                },

                'call_recording': {
                    name: 'Call Recording',
                    icon: 'phone',
                    category: 'Miscellaneous',
                    module: 'call_recording',
                    number_type: 'pattern',
                    data: {
                        action: ''
                    },
                    enabled: false,
                    default_number: '1',
                    number: this.default_number,
                    build_regex: function(number) {
                        return '^\\*'+number+'([0-9]*)$';
                    }
                }*/
            });
        }
    }
);
