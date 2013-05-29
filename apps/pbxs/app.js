define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
        toastr = require('toastr'),

		templates = {
            pbxsManager: 'pbxsManager',
            pbxsListElement: 'pbxsListElement',
            pbxsUnassignedNumbers: 'pbxsUnassignedNumbers',
            listNumbers: 'listNumbers',
            noNumbers: 'noNumbers',
            noResults: 'noResults',
            searchResults: 'searchResults',
            endpoint: 'endpoint',
            endpointNumbers: 'endpointNumbers',

            addNumberDialog: 'addNumberDialog',
            failoverDialog: 'failoverDialog',
            cnamDialog: 'cnamDialog',
            e911Dialog: 'e911Dialog',
            addNumberSearchResults: 'addNumberSearchResults',
            portDialog: 'portDialog'
		};

	var app = {

		name: "pbxs",

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
            'pbxs_manager.list_callflows': {
                url: 'accounts/{account_id}/callflows',
                verb: 'GET'
            },
            'pbxs_manager.get_account': {
                url: 'accounts/{account_id}',
                verb: 'GET'
            },
            'pbxs_manager.list_numbers': {
                url: 'accounts/{account_id}/phone_numbers',
                verb: 'GET'
            },
            'pbxs_manager.get': {
                url: 'accounts/{account_id}/phone_numbers/{phone_number}',
                verb: 'GET'
            },
            'pbxs_manager.update': {
                url: 'accounts/{account_id}/phone_numbers/{phone_number}',
                verb: 'POST'
            },
            'pbxs_manager.activate': {
                url: 'accounts/{account_id}/phone_numbers/{phone_number}/activate',
                verb: 'PUT'
            },
            'pbxs_manager.search': {
                url: 'phone_numbers?prefix={prefix}&quantity={quantity}',
                verb: 'GET'
            },
            'pbxs_manager.delete': {
                url: 'accounts/{account_id}/phone_numbers/{phone_number}',
                verb: 'DELETE'
            },
            'pbxs_manager.create': {
                url: 'accounts/{account_id}/phone_numbers/{phone_number}/docs/{file_name}',
                verb: 'PUT'
            },
            'pbxs_manager.port': {
                url: 'accounts/{account_id}/phone_numbers/{phone_number}/port',
                verb: 'PUT'
            },
            'pbxs_manager.create_doc': {
                url: 'accounts/{account_id}/phone_numbers/{phone_number}/docs/{file_name}',
                verb: 'PUT'
            },
            'old_trunkstore.create': {
                url: 'accounts/{account_id}/connectivity',
                verb: 'PUT'
            },
            'old_trunkstore.list': {
                url: 'accounts/{account_id}/connectivity',
                verb: 'GET'
            },
            'old_trunkstore.get': {
                url: 'accounts/{account_id}/connectivity/{connectivity_id}',
                verb: 'GET'
            },
            'old_trunkstore.update': {
                url: 'accounts/{account_id}/connectivity/{connectivity_id}',
                verb: 'POST'
            }
		},

		subscribe: {
            'pbxsManager.activate': '_render',
            'pbxsManager.edit': 'editServer',
            'auth.landing': '_render'
		},

		load: function(callback){
			var self = this;

            self.whappAuth(function() {
                callback && callback(self);
            });
		},

        whappAuth: function(callback) {
            var self = this;

            monster.pub('auth.sharedAuth', {
                appName: self.name,
                callback: callback
            });
        },

		render: function(container){
            var self = this;

            self._render(container);
		},

		// subscription handlers
        _render: function(container) {
            var self = this,
                pbxsManager = $(monster.template(self, templates.pbxsManager)),
                parent = container || $('#ws-content');

            (parent)
                .empty()
                .append(pbxsManager);

            self.renderList(-1, parent, function(data) {
                self.refreshUnassignedList(function() {
                    self.bindEvents(pbxsManager);

                    if(data.length === 0) {
                        monster.pub('pbxsManager.edit', {});
                    }
                    else if(data.length >= 1) {
                        monster.pub('pbxsManager.edit', { id: 0 });

                        pbxsManager.find('.pbx-wrapper[data-id="0"]').addClass('selected');
                    }
                });
            });

            /*pbxsManager.find('#pbxs_manager_listpanel').niceScroll({
                cursorcolor:"#333",
                autohidemode:false,
                cursorborder:"1px solid #666"
            }).railh.addClass('pbx-fixed-hscroll');

            pbxsManager.find('#unassigned_numbers_wrapper').niceScroll({
                cursorcolor:"#333",
                cursoropacitymin:0.5,
                hidecursordelay:1000
            }).rail.addClass('unassigned-number-fixed-vscroll');*/
        },

        editServer: function(args) {
            var self = this;

            monster.parallel({
                realm: function(callback){
                     monster.request({
                        resource: 'pbxs_manager.get_account',
                        data: {
                            account_id: monster.apps['pbxs'].account_id,
                        },
                        success: function(_data_account, status) {

                            callback(null, _data_account.data.realm);
                        }
                    });
                },
                account: function(callback){
                    self.getAccount(function(_data) {
                        callback(null, _data);
                    });
                },
                numbers: function(callback) {
                    self.listAllNumbers(function(_data) {
                        callback(null, _data);
                    });
                }
            },
            function(err, results){
                var parent = args.parent || $('#ws-content'),
                    target = args.target || parent.find('#pbxs_manager_view'),
                    _callbacks = args.callbacks || {},
                    callbacks = {
                        save_success: _callbacks.save_success || function(_data) {
                            var saved_id = (args.id === 0 || args.id) ? args.id : _data.data.servers.length-1;
                            self.renderList(saved_id, parent, function() {
                                self.renderPbxsManager(_data, $.extend(true, defaults, _data.data.servers[args.id]), target, callbacks);
                            }, _data.data.servers);
                        },

                        save_error: _callbacks.save_error,

                        delete_success: _callbacks.delete_success || function() {
                            target.empty();

                             self.renderList();
                        },

                        cancel_success: _callbacks.cancel_success || function() {
                            monster.pub('pbxsManager.edit', {
                                id: args.id,
                                parent: parent,
                                target: target,
                                callbacks: callbacks
                            });
                        },

                        delete_error: _callbacks.delete_error,

                        after_render: _callbacks.after_render
                    },
                    defaults = $.extend(true, {
                        auth: {
                            auth_user: 'user_' + monster.ui.randomString(8),
                            auth_password: monster.ui.randomString(12),
                            auth_method: 'IP'
                        },
                        options: {
                            e911_info: {}
                        },
                        cfg: {
                            register_time: '360',
                            opening_pings: true,
                            caller_id_header: 'p-asserted',
                            supported_codecs: 'g722',
                            signaling_type: 'rfc_2833',
                            allow_refer: true,
                            use_t38: true
                        },
                        extra: {
                            support_email: (monster.config.port || {}).support_email || 'support@trunking.io',
                            pbx_help_link: monster.config.pbx_help_link || 'https://2600hz.atlassian.net/wiki/display/docs/Trunking.io',
                            pbx_help_configuration_link: monster.config.pbx_help_configuration_link || 'https://2600hz.atlassian.net/wiki/display/docs/Trunking_config.io',
                            configure: 'manually',
                            realm: results.realm,
                            id: args.id || (args.id === 0 ? 0 : 'new')
                        }
                    }, args.data_defaults || {});

                if(results.account.data.servers) {
                    $.each(results.account.data.servers, function(k, server) {
                        $.each(server.DIDs, function(did, v) {
                            if(did in results.numbers.data) {
                                results.account.data.servers[k].DIDs[did].features = results.numbers.data[did].features;
                            }
                        });
                    });
                }

                if(typeof args === 'object' && (args.id || args.id === 0)) {
                    self.renderPbxsManager(results.account, $.extend(true, defaults, results.account.data.servers[args.id]), target, callbacks);
                }
                else {
                    self.renderEndpoint(results.accounts, defaults, target, callbacks, parent);
                }
            });
        },

        listAvailablePbxs: function() {
            return ['allworks', 'altigen', 'asterisk', 'avaya', 'bluebox', 'cisco', 'digium', 'epygi', 'freepbx', 'freeswitch', 'mitel', 'objectworld', 'other', 'pingtel', 'responsepoint', 'samsung', 'shoretel', 'sutus', 'talkswitch', 'threecom', 'taridium'];
        },

        listAllNumbers: function(success, error) {
            monster.request({
                resource: 'pbxs_manager.list_numbers',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                },
                success: function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                error: function(data, status) {
                    if(typeof error == 'function') {
                        error(data, status);
                    }
                }
            });
        },

        listCallflows: function(success, error) {
            monster.request({
                resource: 'pbxs_manager.list_callflows',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                },
                success: function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                error: function(data, status) {
                    if(typeof error == 'function') {
                        error(data, status);
                    }
                }
            });
        },

        createAccount: function(success, error) {
            monster.request({
                resource: 'pbxs_manager.get_account',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                },
                success: function(_data, status) {
                    var self = this,
                        account_data = {
                            account: {
                                credits: {
                                    prepay: '0.00'
                                },
                                trunks: '0',
                                inbound_trunks: '0',
                                auth_realm: _data.data.realm
                            },
                            billing_account_id: monster.apps['pbxs'].account_id,
                            DIDs_Unassigned: {},
                            servers: []
                        };

                    monster.request({
                        resource: 'old_trunkstore.create',
                        data: {
                            account_id: monster.apps['pbxs'].account_id,
                            data: account_data
                        },
                        success: function(data, status) {
                            if(typeof success == 'function') {
                                success(data, status);
                            }
                        },
                        error: function(data, status) {
                            if(typeof error == 'function') {
                                error(data, status);
                            }
                        }
                    });
                }
            });
        },

        listAccounts: function(success, error) {
            monster.request({
                resource: 'old_trunkstore.list',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                },
                success: function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                error: function(data, status) {
                    if(typeof error == 'function') {
                        error(data, status);
                    }
                }
            });
        },

        getAccount: function(success, error) {
            var self = this;

            monster.request({
                resource: 'old_trunkstore.get',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                    connectivity_id: monster.apps['pbxs'].connectivity_id
                },
                success: function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                error: function(data, status) {
                    if(typeof error == 'function') {
                        error(data, status);
                    }
                }
            });
        },

        getAutomaticStatus: function(data) {
            var list_steps = [
                    'init',
                    'registration',
                    'options',
                    'options_period',
                    'outbound_call',
                    'inbound_call',
                    'dtmf_test',
                    'reset_dtmf',
                    'fax_test',
                    'settings'
                ],
                sip_id = monster.config.sip_id ? monster.config.sip_id : (monster.config.sip_id = monster.ui.randomString(20));

            var step = list_steps.indexOf(data.step) > -1 ? data.step : 'init';

            monster.request({
                resource: 'pbxs_manager.get_automatic_status',
                data: {
                    sip_id: sip_id,
                    settings_step: step
                },
                success: function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                error: function(data, status) {
                    if(typeof error == 'function') {
                        error(data, status);
                    }
                }
            });
        },

        listServers: function(success, error) {
            var self = this,
                getAccount = function() {
                    self.getAccount(
                        function(_data, status) {
                            success(_data.data.servers, status);
                        }
                    );
                };

            if(monster.apps['pbxs'].connectivity_id) {
                getAccount();
            }
            else {
                self.listAccounts(function(data, status) {
                    if(data.data.length) {
                        monster.apps['pbxs'].connectivity_id = data.data[0];

                        getAccount();
                    }
                    else {
                        self.createAccount(function(_data) {
                                self.listAccounts(function(data, status) {
                                    monster.apps['pbxs'].connectivity_id = data.data[0];

                                    getAccount();
                                });
                            },
                            function(_data, status) {
                                monster.alert(monster.i18n(self, 'error_signup', { status: status }));
                            }
                        );
                    }
                });
            }
        },

        getNumber: function(phone_number, success, error) {
            monster.request({
                resource: 'pbxs_manager.get',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                    phone_number: encodeURIComponent(phone_number)
                },
                success: function(_data, status) {
                    if(typeof success === 'function') {
                        success(_data);
                    }
                },
                error: function(_data, status) {
                    if(typeof error === 'function') {
                        error(_data);
                    }
                }
            });
        },

        updateNumber: function(phone_number, data, success, error) {
            monster.request({
                resource: 'pbxs_manager.update',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                    phone_number: encodeURIComponent(phone_number),
                    data: data
                },
                success: function(_data, status) {
                    if(typeof success === 'function') {
                        success(_data);
                    }
                },
                error: function(_data, status) {
                    if(typeof error === 'function') {
                        error(_data);
                    }
                }
            });
        },

        portNumber: function(data, success, error) {
            var self = this;

            monster.request({
                resource: 'pbxs_manager.port',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                    phone_number: encodeURIComponent(data.phone_number),
                    data: data.options || {}
                },
                success: function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                error: function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            });
        },

        createNumber: function(phone_number, success, error) {
            var self = this;

            //TODO flag request Check to avoid multiple creation
            monster.request({
                resource: 'pbxs_manager.create',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                    phone_number: encodeURIComponent(phone_number),
                    data: {}
                },
                success: function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                error: function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            });
        },

        activateNumber: function(phone_number, success, error) {
            var self = this;

            //TODO flag request Check to avoid multiple creation
            monster.request({
                resource: 'pbxs_manager.activate',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                    phone_number: encodeURIComponent(phone_number),
                    data: {}
                },
                success: function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                error: function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            });
        },

        deleteNumber: function(phone_number, success, error) {
            var self = this;

            monster.request({
                resource: 'pbxs_manager.delete',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                    phone_number: encodeURIComponent(phone_number)
                },
                success: function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                error: function(data, status) {
                    if(typeof error == 'function') {
                        error(data, status);
                    }
                }
            });
        },

        searchNumbers: function(data, success, error) {
            var self = this;

            monster.request({
                resource: 'pbxs_manager.search',
                data: {
                    prefix: data.prefix,
                    quantity: data.quantity || 15
                },
                success: function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                error: function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            });
        },

        createNumberDoc: function(data, success, error) {
            var self = this;

            monster.request({
                resource: 'pbxs_manager.create_doc',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                    phone_number: encodeURIComponent(data.phone_number),
                    file_name: data.file_name,
                    data: data.file_data
                },
                success: function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                error: function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            });
        },

        submitPort: function(port_data, number_data, callback) {
            var self = this,
                uploads_done = 0,
                put_port_data = function() {
                    number_data.options.port = port_data.port;

                    //todo phone nbr/data/cb
                    self.updateNumber(number_data.phone_number, number_data.options, function(data) {
                        if(typeof callback == 'function') {
                            callback(data);
                        }
                    });
                },
                put_port_doc = function(index) {
                    /* Add files */
                    self.createNumberDoc({
                            phone_number: number_data.phone_number,
                            file_name: port_data.loa[0].file_name,
                            file_data: port_data.loa[0].file_data
                        },
                        function(_data, status) {
                            self.createNumberDoc({
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

        addFreeformNumbers: function(numbers_data, callback) {
            var self = this,
                number_data;

            if(numbers_data.length > 0) {
                var phone_number = numbers_data[0].phone_number.match(/^\+?1?([2-9]\d{9})$/),
                    error_function = function() {
                        monster.ui.confirm(monster.i18n(self, 'error_acquire', {phoneNumber: numbers_data[0].phone_number}),
                            function() {
                                self.addFreeformNumbers(numbers_data, callback);
                            },
                            function() {
                                self.addFreeformNumbers(numbers_data.slice(1), callback);
                            }
                        );
                    };

                if(phone_number && phone_number[1]) {
                    self.createNumber(phone_number[1],
                        function() {
                            self.activateNumber(phone_number[1],
                                function(_data, status) {
                                    self.addFreeformNumbers(numbers_data.slice(1), callback);
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

        addNumbers: function(global_data, index, numbers_data, callback) {
            var self = this,
                number_data;

            if(numbers_data.length > 0) {
                var phone_number = numbers_data[0].phone_number.match(/^\+?1?([2-9]\d{9})$/),
                    error_function = function() {
                        monster.ui.confirm(monster.i18n(self, 'error_acquire', {phoneNumber: numbers_data[0].phone_number}),
                            function() {
                                self.addNumbers(global_data, index, numbers_data, callback);
                            },
                            function() {
                                self.addNumbers(global_data, index, numbers_data.slice(1), callback);
                            }
                        );
                    };

                if(phone_number[1]) {
                    self.activateNumber(phone_number[1],
                        function(_data, status) {
                            global_data.data.servers[index].DIDs[_data.data.id] = { failover: false, cnam: false, dash_e911: false };
                            self.addNumbers(global_data, index, numbers_data.slice(1), callback);
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
                self.updateOldTrunkstore(global_data.data, function() {
                    if(typeof callback === 'function') {
                        callback();
                    }
                });
            }
        },

        cleanPhoneNumberData: function(data) {
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

        normalizeEndpointData: function(data) {
            if(data.server_name === '' || !('server_name' in data)) {
                data.server_name = "PBX " + data.extra.serverid;
            }

            delete data.extra;

            return data;
        },

        saveEndpoint: function(endpoint_data, data, success, error) {
            var self = this,
                index = endpoint_data.extra.serverid,
                new_data = $.extend(true, {}, data.data);

            self.normalizeEndpointData(endpoint_data);

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

                monster.request({
                    resource: 'old_trunkstore.update',
                    data: {
                        account_id: monster.apps['pbxs'].account_id,
                        connectivity_id: monster.apps['pbxs'].connectivity_id,
                        data: new_data
                    },
                    success: function(_data, status) {
                        if(typeof success == 'function') {
                            success(_data, status);
                        }
                    },
                    error: function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status);
                        }
                    }
                });
            }
            else {
                monster.alert('formatting_error');
            }
        },

        updateOldTrunkstore: function(data, success, error) {
            monster.request({
                resource: 'old_trunkstore.update',
                data: {
                    account_id: monster.apps['pbxs'].account_id,
                    connectivity_id: monster.apps['pbxs'].connectivity_id,
                    data: data
                },
                success: function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                error: function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            });
        },

        loadSpecificStep: function(step_index, callbacks, parent) {
            $('.wizard-top-bar', parent).hide();
            $('.wizard-content-step', parent).hide();
            $('.wizard-content-step[data-step="'+ step_index +'"]', parent).show();

            $('.wizard-buttons button', parent).hide();
            $('.cancel', parent).show();
            $('.submit-btn', parent).show();

            if(step_index === 3) {
                $('#list_pbxs_navbar').hide();
            }

            $('.cancel', parent).off()
                                .on('click', function(ev) {
                ev.preventDefault();

                if(typeof callbacks.cancel_success === 'function') {
                    callbacks.cancel_success();
                }
            });
        },

        initializeWizard: function(parent, callback_submit) {
            var self = this,
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
                    self.validate_step($('.wizard-top-bar', parent).attr('data-active_step'), parent, function() {
                        self.change_step(step, max_step, parent);
                    });
                }
            });

            $('.next-step', parent).on('click', function(ev) {
                ev.preventDefault();

                current_step = parseInt($('.wizard-top-bar', parent).attr('data-active_step'));
                self.validate_step(current_step, parent, function() {
                    self.change_step(++current_step, max_step, parent);
                });
            });

            $('.prev-step', parent).on('click', function(ev) {
                ev.preventDefault();

                current_step = parseInt($('.wizard-top-bar', parent).attr('data-active_step'));
                self.change_step(--current_step, max_step, parent);
            });

            $('.cancel', parent).on('click', function(ev) {
                ev.preventDefault();

                monster.pub('pbxsManager.activate');
            });

            $('.submit-btn', parent).on('click', function(ev) {
                ev.preventDefault();

                if(typeof callback_submit === 'function') {
                    callback_submit();
                }
            });
        },

        change_step: function(step_index, max_step, parent) {
            var self = this;

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
                error_message = monster.i18n(self, 'please_correct');

            var form_data = form2object('endpoint');

            if(step === 1) {
                if($('.pbx-brand-list .pbx.selected', parent).size() === 0) {
                    error_message += '<br/>- ' + monster.i18n(self, 'pbxs.pbxs_manager.no_pbx_selected');
                    validated = false;
                }
            }
            else if(step === 2) {
                /* IP */
                if($('input[type="radio"][name="auth.auth_method"]:checked', parent).val() === 'IP') {
                    if(!($('#auth_ip', parent).val().match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/) !== null)) {
                        validated = false;
                        error_message += '<br/>- ' + monster.i18n(self, 'not_valid_ip');
                    }
                }
                /* Auth */
                else {

                }
            }
            else if(step === 3) {
            }

            if(validated === true) {
                if(typeof callback === 'function') {
                    callback();
                }
            }
            else {
                monster.alert(error_message);
            }
        },

        renderEndpoint: function(data, endpoint_data, target, callbacks, parent) {
            if(!endpoint_data.server_name) {
                endpoint_data.server_name = null;
            }

            var self = this,
                interval,
                interval_bar,
                current_automatic_step = 1,
                pause_polling = false,
                submit_wizard_callback = function() {
                    var form_data = form2object('endpoint');

                    form_data.auth.auth_method = $('input[type="radio"][name="auth.auth_method"]:checked', endpoint_html).val(),
                    form_data.server_type = $('.pbx-brand-list .pbx.selected', endpoint_html).data('pbx_name'),
                    form_data.cfg = $.extend(true, cfg, form_data.cfg);

                    self.getAccount(function(global_data) {
                        self.saveEndpoint(form_data, global_data, function(_data) {
                            if(typeof callbacks.save_success == 'function') {
                                callbacks.save_success(_data);
                            }
                        });
                    });
                },
                automatic_wizard_success = function() {
                    array_substep[current_automatic_step - 2].current_step++;
                    var i = current_automatic_step - 2;
                    if(array_substep[i].current_step <= array_substep[i].total_step) {
                        var step_success = array_substep[i].current_step - 1,
                            total_step = array_substep[i].total_step,
                            displayed_pct = (step_success / total_step)*100;

                        array_substep[i].displayed_pct = displayed_pct;

                        $('.wizard-automatic-step[data-value='+ current_automatic_step +'] tr:nth-child('+ step_success +') .icon-ok-sign', endpoint_html).show();
                        $('.wizard-automatic-step[data-value='+ current_automatic_step +'] .progress .bar', endpoint_html).css('width', displayed_pct + '%');
                        return;
                    }
                    else if(i+2 >= current_automatic_step) {
                        $('.wizard-automatic-step[data-value='+ current_automatic_step +'] tr .icon-ok-sign', endpoint_html).show();
                        $('.wizard-automatic-step[data-value='+ current_automatic_step +'] .progress .bar', endpoint_html).css('width', '100%');
                        array_substep[i].displayed_pct = 100;
                        setTimeout(function() {
                            $('.wizard-automatic-step[data-value="' + current_automatic_step + '"]', endpoint_html).hide();
                            $('.wizard-automatic-step[data-value="' + ++current_automatic_step +'"]', endpoint_html).show();
                            $('.testing-progress .testing-step[data-step="' + (current_automatic_step - 2) + '"] .icon-ok-sign', endpoint_html).show();
                        }, 2000);

                        return;
                    }
                },
                reset_auto_step = function() {
                    clear_intervals();
                    $('.wizard-automatic-step[data-value='+ current_automatic_step +'] .progress .bar', endpoint_html).css('width', '0%');
                    $('td .icon-ok-sign:not(.result)', endpoint_html).hide();
                    $.each(array_substep, function(k, v) {
                        v.current_step = 1;
                    });
                },
                clear_intervals = function(_interval) {
                    if(typeof _interval !== 'undefined') {
                        clearInterval(_interval);
                    }
                    else {
                        clearInterval(interval);
                        clearInterval(interval_bar);
                    }
                },
                move_bar = function() {
                    var array_index = array_substep[current_automatic_step-2],
                        current_step = array_index.current_step,
                        total_step = array_index.total_step;

                    if(!('displayed_pct' in array_substep[current_automatic_step-2])) {
                        array_substep[current_automatic_step-2].displayed_pct = ((current_step - 1) / total_step) * 100;
                    }

                    array_index = array_substep[current_automatic_step-2];

                    var next_pct = ((current_step) / total_step) * 100,
                        current_pct = array_index.displayed_pct,
                        new_pct = current_pct + ((next_pct - current_pct) / 10);

                    array_substep[current_automatic_step-2].displayed_pct = new_pct;

                    $('.wizard-automatic-step[data-value='+ current_automatic_step +'] .progress .bar', endpoint_html).css('width', new_pct + '%');
                },
                array_substep = [
                    { current_step: 1, total_step: 3, api: ['registration', 'options', 'options_period']},
                    { current_step: 1, total_step: 4, api: ['outbound_call', 'inbound_call', 'dtmf_test']},
                    { current_step: 1, total_step: 4, api: []},
                    { current_step: 1, total_step: 2, api: []},
                    { current_step: 1, total_step: 1, api: []},
                    { current_step: 1, total_step: 2, api: []}
                ],
                cfg = {},
                endpoint_html = $(monster.template(self, templates.endpoint, _.extend({ i18n: { supportEmail: endpoint_data.extra.support_email }}, endpoint_data)));

            $('.icon-question-sign[data-toggle="tooltip"]', endpoint_html).tooltip();

            $.each(endpoint_data.cfg, function(k, v) {
                if(typeof v === 'object') {
                    $.each(v, function(k2, v2) {
                        $('button[data-value="'+v2+'"]', $('.btn-group[data-type="'+k+'"]', endpoint_html)).addClass('btn-primary');
                    });
                }
                else {
                    $('button[data-value="'+v+'"]', $('.btn-group[data-type="'+k+'"]', endpoint_html)).addClass('btn-primary');
                }
            });

            self.initializeWizard(endpoint_html, submit_wizard_callback);

            $('.static-ip-block', endpoint_html).hide();
            $('.testing-block', endpoint_html).hide();
            $('.static-ip-block[data-value="'+ endpoint_data.auth.auth_method +'"]', endpoint_html).show();
            $('.testing-block[data-value="'+ endpoint_data.extra.configure +'"]', endpoint_html).show();

            $('#stop_tests', endpoint_html).on('click', function() {
                pause_polling = true;
                monster.ui.confirm(monster.i18n(self, 'pbxs.pbxs_manager.stop_test_warning'), function() {
                    reset_auto_step();
                    $('.testing-block', endpoint_html).hide();
                    $('.testing-block[data-value="manually"]', endpoint_html).slideDown();
                    $('.wizard-automatic-step', endpoint_html).hide();
                    $('input[type="radio"][value="manually"]', endpoint_html).prop('checked', true);

                    current_automatic_step = 1;
                    $('.wizard-buttons', endpoint_html).show();
                }, function() {
                    pause_polling = false;
                });
            });

            $('.skip_test', endpoint_html).on('click', function() {
                array_substep[current_automatic_step - 2].current_step = array_substep[current_automatic_step - 2].total_step + 1;
                $('.wizard-automatic-step[data-value="' + current_automatic_step + '"]', endpoint_html).hide();

                var $automatic_step = $('.wizard-automatic-step[data-value='+ ++current_automatic_step +']', endpoint_html);
                $automatic_step.show();
                $('tr .icon-ok-sign', $automatic_step).hide();
                $('.progress .bar', $automatic_step).css('width', '0%');
            });

            $('.btn-group .btn', endpoint_html).on('click', function(ev) {
                ev.preventDefault();

                var $btn_group = $(this).parent('.btn-group');
                if($btn_group.data('select') === 'multi') {
                    $(this).toggleClass('btn-primary');

                    cfg[$btn_group.data('type')] = [];
                    $('.btn', $btn_group).each(function(k, v) {
                        if($(v).hasClass('btn-primary')) {
                            cfg[$btn_group.data('type')].push($(v).data('value'));
                        }
                    });
                }
                else {
                    if(!($(this).hasClass('btn-primary'))) {
                        $('.btn', $(this).parent()).removeClass('btn-primary');
                        $(this).addClass('btn-primary');
                    }

                    cfg[$btn_group.data('type')] = $(this).data('value');
                }
            });

            $('#submit_settings', endpoint_html).on('click', function(ev) {
                ev.preventDefault();

                submit_wizard_callback();
            });

            $('input[type="radio"][name="extra.configure"]', endpoint_html).on('click', function() {
                reset_auto_step();
                $('.testing-block', endpoint_html).hide();
                $('.testing-block[data-value="'+$(this).val()+'"]', endpoint_html).slideDown();
                $('.wizard-automatic-step', endpoint_html).hide();

                if($(this).val() === 'automatically') {
                    $('.wizard-automatic-step[data-value="'+ current_automatic_step +'"]', endpoint_html).show();
                    $('.header-step', endpoint_html).hide();
                    $('.wizard-buttons', endpoint_html).hide();
                }
                else {
                    current_automatic_step = 1;
                    $('.wizard-buttons', endpoint_html).show();
                }
            });

            $('#phone_number_test', endpoint_html).on('click', function() {
                automatic_wizard_success();
            });

            $('#start_test', endpoint_html).click(function(ev) {
                ev.preventDefault();
                if(!('sip_id' in monster.config)) {
                    monster.config.sip_id = monster.ui.randomString(32);
                }

                reset_auto_step();
                pause_polling = false;

                var polling_interval = 2,
                    move_bar_interval = 0.5,
                    stop_polling = false,
                    function_move_bar = function() {
                        if(Math.floor((Math.random()*10)+1) > 3) {
                            move_bar();
                        }
                    },
                    function_polling = function() {
                        if($('.testing-block[data-value="automatically"]:visible', endpoint_html).size() > 0) {
                            if(pause_polling === false) {
                                var api_name = '',
                                    v = array_substep[current_automatic_step - 2];

                                if(v.current_step <= v.total_step) {
                                    if(v.api[v.current_step - 1] !== undefined) {
                                        api_name = v.api[v.current_step-1];
                                    }
                                    else {
                                        stop_polling = true;
                                    }
                                }

                                if(stop_polling) {
                                    clear_intervals();
                                }
                                else {
                                    monster.request({
                                        resource: 'pbxs_manager.get_automatic_status',
                                        data: {
                                            sip_id: monster.config.sip_id,
                                            settings_step: api_name
                                        },
                                        success: function(_data) {
                                            if(_data.status === 'success' || _data.status === 'succes') {
                                                automatic_wizard_success();
                                            }
                                        },
                                        error: function(_data) {

                                        }
                                    });
                                }
                            }
                        }
                        else {
                            clear_intervals();
                        }
                    };

                interval = setInterval(function_polling, polling_interval * 1000);
                interval_bar = setInterval(function_move_bar, move_bar_interval * 1000);

                $('#phone_number_test', endpoint_html).html(monster.ui.formatPhoneNumber($('#test_number', endpoint_html).val()));
                $('.wizard-automatic-step', endpoint_html).hide();
                $('.wizard-automatic-step[data-value="'+ ++current_automatic_step +'"]', endpoint_html).show();
                $('.header-step', endpoint_html).show();
            });

            $('#cancel_test', endpoint_html).click(function(ev) {
                ev.preventDefault();

                if('cancel_success' in callbacks && typeof callbacks.cancel_success === 'function') {
                    callbacks.cancel_success();
                }
            });

            $('input[type="radio"][name="auth.auth_method"]', endpoint_html).on('click', function() {
                $('.static-ip-block', endpoint_html).hide();
                $('.static-ip-block[data-value="'+$(this).val()+'"]', endpoint_html).slideDown();
            });

            $('.pbx-brand-list .pbx', endpoint_html).each(function() {
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
                self.loadSpecificStep(endpoint_data.load_step, callbacks, endpoint_html);
            }
            else {
                $('#list_pbxs_navbar', parent).hide();
            }

            (target)
                .empty()
                .append(endpoint_html);
        },

        refreshListNumbers: function(didsList, _parent) {
            var parent = _parent || $('#pbx_connector_container'),
                self = this,
                countDids = 0,
                numberWrapper = parent.find('#numbers_wrapper');

            numberWrapper.empty();

            if($.isEmptyObject(didsList)) {
                numberWrapper.append(monster.template(self, templates.noNumbers));
            }
            else {
                numberWrapper.append(monster.template(self, templates.listNumbers, { DIDs: didsList }));

                $.each(didsList, function() {
                    countDids++;
                });
            }

            $('#count_phones', parent).html(countDids);
            $('#trigger_links', parent).hide();
        },

        renderPbxsManager: function(data, endpoint_data, target, callbacks) {
            var self = this,
                server_id = endpoint_data.extra.id,
                img_link = endpoint_data.server_type ? endpoint_data.server_type.replace('.','').toLowerCase() : 'other';

            $.inArray(img_link, self.listAvailablePbxs()) < 0 ? img_link = 'other' : true;
            endpoint_data.img_link = img_link;

            endpoint_data.servers_list = [];

            $.each(data.data.servers, function(k, v) {
                if(k !== server_id) {
                    var temp_img_link = v.server_type ? v.server_type.replace('.','').toLowerCase() : 'other';
                    $.inArray(temp_img_link, self.listAvailablePbxs()) < 0 ? temp_img_link = 'other' : true;

                    endpoint_data.servers_list.push({
                        index: k,
                        server_name: v.server_name,
                        img_link: temp_img_link
                    });
                }
            });

            var pbxsManager = $(monster.template(self, templates.endpointNumbers, endpoint_data)),
                callback_listing = function(data_cb) {
                    self.refreshListNumbers(data_cb, pbxsManager);
                };

            self.refreshListNumbers(endpoint_data.DIDs, pbxsManager);

            $('#list_pbxs_navbar').show();

            var searchResults = pbxsManager.find('#search_results'),
                numbersWrapper = pbxsManager.find('#numbers_wrapper');

            searchResults.hide();

            pbxsManager.find('.search-query').on('keyup', function() {
                var input = $(this),
                    rows = numbersWrapper.find('.number-wrapper'),
                    search_string = $.trim(input.val().toLowerCase().replace(/[^0-9]/g, '')),
                    matches = [],
                    cache = {};

                $.each(rows, function(k, v) {
                    var data = $(this).data(),
                        key = data.phone_number;

                    cache[key] = $(this);
                });

                if (!search_string) {
                    numbersWrapper.show();
                    searchResults.empty().hide();
                }
                else {
                    searchResults.show().empty();

                    $.each(cache, function(phone_number, row_array) {
                        if (phone_number.indexOf(search_string)>-1) {
                            matches.push({phone_number: phone_number, selected: $(row_array).hasClass('selected')});
                        }
                    });

                    if(matches.length > 0) {
                        searchResults.append(monster.template(self, templates.searchResults, _.extend({ i18n: { amountNumbers: matches.length }}, {matches: matches})));
                    }
                    else {
                        searchResults.append(monster.template(self, templates.noResults));
                    }

                    numbersWrapper.hide();
                }
            });

            pbxsManager.on('click', '.number-wrapper', function(event) {
                if($(event.target).closest('.number-options').size() < 1) {
                    var toggleNumberSelected = function(element, updateCb) {
                            var currentCb = element.find('input[type="checkbox"]'),
                                cbValue = currentCb.prop('checked');

                            if(updateCb) {
                                currentCb.prop('checked', !cbValue);
                            }

                            element.toggleClass('selected');
                        },
                        currentNumberWrapper = $(this);

                    toggleNumberSelected(currentNumberWrapper, !$(event.target).is('input:checkbox'));

                    if(currentNumberWrapper.parents('#search_results').size() > 0) {
                        var $wrapper = pbxsManager.find('#numbers_wrapper .number-wrapper[data-phone_number="'+currentNumberWrapper.data('phone_number')+'"]');

                        toggleNumberSelected($wrapper, true);
                    }

                    var links = pbxsManager.find('#trigger_links');

                    pbxsManager.find('.number-wrapper.selected').size() > 0 ? links.show('fast') : links.hide();
                }
            });

            pbxsManager.find('#delete_pbx').on('click', function() {
                monster.ui.confirm(monster.i18n(self, 'delete_pbx_confirmation'), function() {
                    self.getAccount(function(_global_data) {
                        _global_data.data.servers.splice(endpoint_data.extra.id, 1);

                        self.updateOldTrunkstore(_global_data.data, callbacks.delete_success);
                    });
                });
            });

            pbxsManager.find('.settings-pbx-link').on('click', function() {
                endpoint_data.load_step = parseInt($(this).data('step'));
                self.renderEndpoint(data, endpoint_data, target, callbacks, pbxsManager);
            });

            pbxsManager.find('#buy_numbers').on('click', function() {
                self.renderAddNumberDialog(data, server_id, function() {
                    self.listNumbersByPbx(server_id, callback_listing);
                });
            });

            pbxsManager.find('.pbx-dropdown:not(.empty)').on('click', function(ev) {
                ev.preventDefault();

                var list_numbers = [];
                pbxsManager.find('.number-wrapper.selected').each(function() {
                    list_numbers.push($(this).data('phone_number'));
                });

                if(list_numbers.length > 0) {
                    var new_index = $(this).data('index');

                    self.getAccount(function(global_data) {
                        monster.ui.confirm(monster.i18n(self, 'confirm_move', { serverName: global_data.data.servers[new_index].server_name}), function() {
                            $.each(list_numbers, function(k, v) {
                                global_data.data.servers[new_index].DIDs[v] = global_data.data.servers[server_id].DIDs[v];
                                delete global_data.data.servers[server_id].DIDs[v];
                            });

                            self.updateOldTrunkstore(global_data.data, function(data_trunkstore) {
                                self.listNumbersByPbx(server_id, callback_listing, data_trunkstore.data);
                            });
                        });
                    });
                }
                else {
                    monster.alert(monster.i18n(self, 'pbxs.pbxs_manager.no_number_selected'));
                }
            });

            pbxsManager.find('#port_numbers').on('click', function(ev) {
                ev.preventDefault();

                self.renderPortDialog(function(port_data, popup) {
                    monster.ui.confirm(monster.i18n(self, 'chargeReminder.line1') + '<br/><br/>' + monster.i18n(self, 'chargeReminder.line2'),
                        function() {
                            self.getAccount(function(global_data) {
                                var ports_done = 0;

                                $.each(port_data.phone_numbers, function(i, val) {
                                    var number_data = {
                                        phone_number: val
                                    };

                                    var check_update_trunkstore = function() {
                                        if(++ports_done > port_data.phone_numbers.length - 1) {
                                            self.updateOldTrunkstore(global_data.data, function(_data) {
                                                _data.data.servers[server_id].extra = { id: server_id };

                                                if(callbacks && 'save_success' in callbacks && typeof callbacks.save_success == 'function') {
                                                    callbacks.save_success(_data);
                                                }

                                                popup.dialog('close');
                                            });
                                        }
                                    };

                                    self.portNumber(number_data, function(_number_data) {
                                            number_data.options = _number_data.data;

                                            if('id' in number_data.options) {
                                                delete number_data.options.id;
                                            }

                                            self.submitPort(port_data, number_data, function(_data) {
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

            pbxsManager.on('click', '.failover-number', function() {
                var $failover_cell = $(this),
                    data_phone_number = $failover_cell.parents('.number-wrapper').first().data('phone_number'),
                    phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                if(phone_number[1]) {
                    self.getNumber(phone_number[1], function(_data) {
                        self.renderFailoverDialog(_data.data.failover || {}, function(failover_data) {
                            //_data.data.failover = $.extend({}, _data.data.failover, failover_data);
                            _data.data.failover = $.extend({}, failover_data);

                            self.cleanPhoneNumberData(_data.data);

                            monster.ui.confirm(monster.i18n(self, 'chargeReminder.line1') + '<br/><br/>' + monster.i18n(self, 'chargeReminder.line2'),
                                function() {
                                    self.updateNumber(phone_number[1], _data.data, function(_data_update) {
                                            //TODO add lil icons for failover e911 cnam
                                            !($.isEmptyObject(_data.data.failover)) ? $failover_cell.removeClass('inactive').addClass('active') : $failover_cell.removeClass('active').addClass('inactive');
                                            toastr.success(monster.i18n(self, 'success_failover', {phoneNumber: monster.ui.formatPhoneNumber(phone_number[1])}));
                                        },
                                        function(_data_update) {
                                            monster.alert(monster.i18n(self, 'failed_update_failover') + '<br/>' + _data_update.message);
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });

            pbxsManager.on('click', '.cnam-number', function() {
                var $cnam_cell = $(this),
                    data_phone_number = $cnam_cell.parents('.number-wrapper').first().data('phone_number'),
                    phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                if(phone_number[1]) {
                    self.getNumber(phone_number[1], function(_data) {
                        self.renderCnamDialog(_data.data.cnam || {}, function(cnam_data) {
                            _data.data.cnam = $.extend({}, _data.data.cnam, cnam_data);

                            self.cleanPhoneNumberData(_data.data);

                            monster.ui.confirm(monster.i18n(self, 'chargeReminder.line1') + '<br/><br/>' + monster.i18n(self, 'chargeReminder.line2'),
                                function() {
                                    self.updateNumber(phone_number[1], _data.data, function(_data_update) {
                                            !($.isEmptyObject(_data.data.cnam)) ? $cnam_cell.removeClass('inactive').addClass('active') : $cnam_cell.removeClass('active').addClass('inactive');
                                            toastr.success(monster.i18n(self, 'success_cnam', {phoneNumber: monster.ui.formatPhoneNumber(phone_number[1])}));
                                        },
                                        function(_data_update) {
                                            monster.alert(monster.i18n(self, 'error_update_caller_id') + '' + _data_update.message);
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });

            pbxsManager.on('click', '.e911-number', function() {
                var $e911_cell = $(this),
                    data_phone_number = $e911_cell.parents('.number-wrapper').first().data('phone_number'),
                    phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                if(phone_number[1]) {
                    self.getNumber(phone_number[1], function(_data) {
                        self.renderE911Dialog(_data.data.dash_e911 || {}, function(e911_data) {
                            _data.data.dash_e911 = $.extend({}, _data.data.dash_e911, e911_data);

                            self.cleanPhoneNumberData(_data.data);

                            monster.ui.confirm(monster.i18n(self, 'chargeReminder.line1') + '<br/><br/>' + monster.i18n(self, 'chargeReminder.line2'),
                                function() {
                                    self.updateNumber(phone_number[1], _data.data, function(_data_update) {
                                            !($.isEmptyObject(_data.data.dash_e911)) ? $e911_cell.removeClass('inactive').addClass('active') : $e911_cell.removeClass('active').addClass('inactive');
                                            toastr.success(monster.i18n(self, 'success_e911', { phoneNumber: monster.ui.formatPhoneNumber(phone_number[1])}));
                                        },
                                        function(_data_update) {
                                            monster.alert(monster.i18n(self, 'error_update_e911') + '' + _data_update.message);
                                        }
                                    );
                                }
                            );
                        });
                    });
                }
            });

            pbxsManager.find('#remove_numbers').on('click', function() {
                var data_phone_number,
                    phone_number,
                    $selected_numbers = pbxsManager.find('.number-wrapper.selected'),
                    nb_numbers = $selected_numbers.size();

                if(nb_numbers > 0) {
                    monster.ui.confirm(monster.i18n(self, 'remove_number_confirmation'), function() {
                            var array_DIDs = [];

                            $selected_numbers.each(function() {
                                data_phone_number = $(this).data('phone_number'),
                                phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                                if(phone_number[1]) {
                                    array_DIDs.push('+1' + phone_number[1]);
                                }
                            });

                            self.getAccount(function(_global_data) {
                                $.each(array_DIDs, function(i, k) {
                                    if(k in _global_data.data.servers[server_id].DIDs) {
                                        delete _global_data.data.servers[server_id].DIDs[k]
                                    }
                                });

                                self.updateOldTrunkstore(_global_data.data,
                                    function(data_trunkstore) {
                                        self.refreshUnassignedList(function() {
                                            self.listNumbersByPbx(server_id, callback_listing, data_trunkstore.data);
                                        });
                                    },
                                    function() {
                                        self.listNumbersByPbx(server_id, callback_listing);
                                    }
                                );
                            });
                        },
                        function() {

                        }
                    );
                }
                else {
                    monster.alert(monster.i18n(self, 'no_number_selected'));
                }
            });

            (target || $('#ws-content'))
                .empty()
                .append(pbxsManager);
        },

        renderCnamDialog: function(cnam_data, callback) {
            var self = this,
                popup_html = $(monster.template(self, templates.cnamDialog, cnam_data || {})),
                popup;

            $('button.btn.btn-success', popup_html).click(function(ev) {
                ev.preventDefault();

                var cnam_form_data = form2object('cnam');

                if(typeof callback === 'function') {
                    callback(cnam_form_data);
                }

                popup.dialog('destroy').remove();
            });

            popup = monster.ui.dialog(popup_html, {
                title: monster.i18n(self, 'caller_id_dialog_title')
            });
        },

         renderFailoverDialog: function(failover_data, callback) {
            var self = this,
                radio = (failover_data || {}).e164 ? 'number' : ((failover_data || {}).sip ? 'sip' : ''),
                tmpl_data = {
                    radio: radio,
                    failover: (failover_data || {}).e164 || (failover_data || {}).sip || '',
                    phone_number: failover_data.phone_number || ''
                },
                popup_html = $(monster.template(self, templates.failoverDialog, tmpl_data)),
                popup,
                result,
                popup_title = monster.i18n(self, 'failover_title');

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
                        monster.alert(monster.i18n(self, 'invalid_failover_number'));
                    }
                }
                else {
                    monster.alert(monster.i18n(self, 'no_data_failover'));
                }
             });

            $('.remove_failover', popup_html).click(function(ev) {
                ev.preventDefault();
                if(typeof callback === 'function') {
                    callback({ e164: '', sip: '' });
                }

                popup.dialog('destroy').remove();
            });

            popup = monster.ui.dialog(popup_html, {
                title: popup_title,
                width: '540px'
            });
        },

        renderE911Dialog: function(e911_data, callback) {
            var self = this,
                popup_html = $(monster.template(self, templates.e911Dialog, e911_data || {})),
                popup;

            $('.icon-question-sign[data-toggle="tooltip"]', popup_html).tooltip();

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
                var href = 'http://maps.google.com/maps?q='+ e911_data.latitude + ',+' + e911_data.longitude + '+(' + monster.i18n(self, 'gmap_pin_label') + ')&iwloc=A&hl=en';
                $('#gmap_link', popup_html).attr('href', href);
                $('.gmap_link_div', popup_html).show();
            }

            $('#submit_btn', popup_html).click(function(ev) {
                ev.preventDefault();

                var e911_form_data = form2object('e911');

                if(typeof callback === 'function') {
                    callback(e911_form_data);
                }

                popup.dialog('destroy').remove();
            });

            popup = monster.ui.dialog(popup_html, {
                title: monster.i18n(self, 'e911_dialog_title')
            });

            // Fixing the position of the rotated text using its width
            var $rotated_text = $('#e911_rotated_text', popup_html),
                rotated_text_offset = $rotated_text.width()/2;

            $rotated_text.css({'top': 40+rotated_text_offset +'px', 'left': 25-rotated_text_offset +'px'});
        },

        renderAddNumberDialog: function(global_data, index, callback) {
            var self = this,
                numbers_data = [],
                popup_html = $(monster.template(self, templates.addNumberDialog)),
                popup;

            $('.toggle_div', popup_html).hide();

            $('#search_numbers_button', popup_html).click(function(ev) {
                $('.toggle_div', popup_html).hide();

                var npa_data = {},
                    npa = $('#sdid_npa', popup_html).val();
                    //nxx = $('#sdid_nxx', popup_html).val();

                ev.preventDefault();

                npa_data.prefix = npa;// + nxx;

                self.searchNumbers(npa_data, function(results_data) {
                    var results_html = $(monster.template(self, templates.addNumberSearchResults, {numbers: results_data.data}));

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

                monster.ui.confirm(monster.i18n(self, 'chargeReminder.line1') + '<br/><br/>' + monster.i18n(self, 'chargeReminder.line2'),
                    function() {
                        $('#foundDIDList .number-box.selected', popup_html).each(function() {
                            numbers_data.push($(this).data());
                        });

                        self.getAccount(function(global_data) {
                            self.addNumbers(global_data, index, numbers_data, function() {
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

            popup = monster.ui.dialog(popup_html, {
                title: monster.i18n(self, 'buy_dialog_title'),
                width: '600px',
                position: ['center', 20]
            });
        },

        renderPortDialog: function(callback) {
            var self = this,
                port_form_data = {},
                popup_html = $(monster.template(self, templates.portDialog, {
                    company_name: monster.config.company_name || '2600hz',
                    support_email: (monster.config.port || {}).support_email || 'support@trunking.io',
                    support_file_upload: (File && FileReader)
                })),
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
            $('#loa_link', popup_html).attr('href', ((monster.config.port || {}).loa) || 'http://2600hz.com/porting/2600hz_loa.pdf');
            $('#resporg_link', popup_html).attr('href', ((monster.config.port || {}).resporg) || 'http://2600hz.com/porting/2600hz_resporg.pdf');
            $('#features_link', popup_html).attr('href', ((monster.config.port || {}).features) || 'http://www.2600hz.com/features');
            $('#terms_link', popup_html).attr('href', ((monster.config.port || {}).terms) || 'http://www.2600hz.com/terms');

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
                    string_alert += monster.i18n(self, 'agree_to_the_terms') + '<br/>';
                }

                $.each(port_form_data.extra.cb, function(k, v) {
                    if(v === false) {
                        string_alert += monster.i18n(self, 'confirm_conditions') + '<br/>';
                        return false;
                    }
                });

                port_form_data.phone_numbers = $('.numbers_text', popup_html).val().replace(/\n/g,',');
                port_form_data.phone_numbers = port_form_data.phone_numbers.replace(/[\s-\(\)\.]/g, '').split(',');

                port_form_data.port.main_number = port_form_data.port.main_number.replace(/[\s-\(\)\.]/g, '');

                var res = port_form_data.port.main_number.match(/^\+?1?([2-9]\d{9})$/);
                res ? port_form_data.port.main_number = '+1' + res[1] : string_alert += monster.i18n(self, 'enter_main_number') + '<br/>';

                var is_toll_free_main = self.checkTollFree(port_form_data.port.main_number);

                port_form_data.phone_numbers.push(port_form_data.port.main_number);

                phone_numbers = [];
                var error_toll_free = [];
                $.each(port_form_data.phone_numbers, function(i, val) {
                    var result = val.match(/^\+?1?([2-9]\d{9})$/);

                    if(result) {
                        if(self.checkTollFree(result[1]) === is_toll_free_main) {
                            phone_numbers.push('+1' + result[1]);
                        }
                        else {
                            error_toll_free.push(result[1]);
                        }
                    }
                    else {
                        if(val !== '') {
                            string_alert += val + ' : '+ monster.i18n(self, 'invalid_number') + '<br/>';
                        }
                    }
                });

                if(error_toll_free.length > 0) {
                    $.each(error_toll_free, function(k, v) {
                        string_alert += v + ', ';
                    });

                    if(is_toll_free_main) {
                        string_alert += monster.i18n(self, 'error_not_toll_free');
                    }
                    else {
                        string_alert += monster.i18n(self, 'error_toll_free');
                    }
                }

                port_form_data.phone_numbers = phone_numbers;

                files ? port_form_data.files = files : string_alert += monster.i18n(self, 'upload_bill') + '<br/>';
                loa ? port_form_data.loa = loa : string_alert += monster.i18n(self, 'upload_loa') + '<br/>';

                if(string_alert === '') {
                    delete port_form_data.extra;

                    if(typeof callback === 'function') {
                        callback(port_form_data, popup);
                    }
                    }
                else {
                    monster.alert(string_alert);
                }
            });

            popup = monster.ui.dialog(popup_html, {
                title: monster.i18n(self, 'port_dialog_title')
            });
        },

        checkTollFree: function(number) {
            var toll_free = false,
                toll_free_number = number.match(/^(\+?1)?(8(00|55|66|77|88)[2-9]\d{6})$/);

            if(toll_free_number && toll_free_number[0]) {
                toll_free = true;
            }

            return toll_free;
        },

        refreshUnassignedList: function(_callback) {
            var self = this;

            self.listAvailableNumbers(function(unassignedNumbers) {
                var data = {
                    unassignedNumbers: unassignedNumbers
                };

                $('#unassigned_numbers_wrapper').empty()
                                                .append(monster.template(self, templates.pbxsUnassignedNumbers, data));

                $('#unassigned_numbers_count').empty()
                                              .html(unassignedNumbers.length);

                if(typeof _callback === 'function') {
                    _callback();
                }
            });
        },

        bindEvents: function(parent) {
            var self = this,
                server_id;

            parent.find('.icon-question-sign[data-toggle="tooltip"]').tooltip();

            parent.find('.link-box.assign').on('click', function() {
                var numbersData = [];

                parent.find('#unassigned_numbers .unassigned-number.selected').each(function(k, v) {
                    if($(v).data('phone_number')) {
                        numbersData.push($(this).data('phone_number'));
                    }
                });

                server_id = parseInt(parent.find('#pbx_connector_container').data('id'));

                if(server_id >= 0) {
                    self.getAccount(function(global_data) {
                        $.each(numbersData, function(k, v) {
                            global_data.data.servers[server_id].DIDs[v] = {};
                        });

                        self.updateOldTrunkstore(global_data.data, function(data_trunkstore) {
                            self.refreshUnassignedList(function() {
                                self.listNumbersByPbx(server_id, function(cb_data) {
                                    self.refreshListNumbers(cb_data, parent);
                                }, data_trunkstore.data);
                            });
                        });
                    });
                }
                else {
                    monster.alert(monster.i18n(self, 'no_pbx_selected'));
                }
            });

            parent.find('#unassigned_numbers_header').on('click', function() {
                var $this = $(this),
                    $content = parent.find('#unassigned_numbers .content');/*,
                    nice_scrollbar = $('#unassigned_numbers_wrapper', parent).getNiceScroll()[0];*/

                if($this.hasClass('open')) {
                    $this.removeClass('open');
                    $content.hide();
                    //nice_scrollbar.resize();
                }
                else {
                    $this.addClass('open');
                    $content.slideDown(/*nice_scrollbar.resize*/);
                }
            });

            parent.on('click', '.unassigned-number', function(event) {
                var $this = $(this);
                $this.toggleClass('selected');

                if(!$(event.target).is('input:checkbox')) {
                    var $current_cb = $this.find('input[type="checkbox"]'),
                        cb_value = $current_cb.prop('checked');

                    $current_cb.prop('checked', !cb_value);
                }
            });

            parent.on('click', '#pbxs_manager_listpanel .pbx-wrapper', function() {
                $('#pbxs_manager_listpanel .pbx-wrapper', parent).removeClass('selected');
                server_id = $(this).data('id');
                monster.pub('pbxsManager.edit', { id: server_id });
                $(this).addClass('selected');
            });

            parent.find('#add_pbx').on('click', function() {
                monster.pub('pbxsManager.edit', {});
            });

            parent.find('.link-box.delete').on('click', function() {
                var data_phone_number,
                    phone_number,
                    $selected_numbers = $('.unassigned-number.selected', parent),
                    nb_numbers = $selected_numbers.size(),
                    refresh_list = function() {
                        nb_numbers--;
                        if(nb_numbers === 0) {
                            self.refreshUnassignedList();
                        }
                    };

                if(nb_numbers > 0) {
                    monster.ui.confirm(monster.i18n(self, 'delete_numbers_confirmation'), function() {
                            $selected_numbers.each(function() {
                                data_phone_number = $(this).data('phone_number'),
                                phone_number = data_phone_number.match(/^\+?1?([2-9]\d{9})$/);

                                if(phone_number[1]) {
                                    self.deleteNumber(phone_number[1],
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
                    monster.alert(monster.i18n(self, 'no_number_selected'));
                }
            });

            parent.find('#unassigned_numbers .search-query').on('keyup', function() {
                var input = $(this),
                    rows = $('#unassigned_numbers .content .unassigned-number', parent),
                    search_string = $.trim(input.val().toLowerCase().replace(/[^0-9]/g, '')),
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

        renderList: function(_id, _parent, _callback, _data) {
            var self = this,
                callback = _callback,
                parent = _parent || $('#ws-content'),
                id = _id || -1,
                refreshList = function(data) {
                    $('#list_pbxs_navbar', parent).show();
                    $('#unassigned_numbers', parent).show();

                    var mapCrossbarData = function(data) {
                            var newList = [];

                            if(data.length > 0) {
                                var i = 0;
                                $.each(data, function(key, val) {
                                    newList.push({
                                        id: i,
                                        name: val.server_name || '(no name)'
                                    });
                                    i++;
                                });
                            }

                            return newList;
                        },
                        dataTemplate = {
                            numbers: mapCrossbarData(data)
                        };

                    $('#list_pbxs_navbar #pbxs_manager_listpanel', parent).empty()
                                                                          .append(monster.template(self, templates.pbxsListElement, dataTemplate))
                                                                          .show();

                    if(id && id > -1) {
                        $('#list_pbxs_navbar #pbxs_manager_listpanel .pbx-wrapper[data-id='+id+']', parent).addClass('selected');
                    }

                    $.each(data, function(k, v) {
                        var imgLink = v.server_type ? v.server_type.replace('.','').toLowerCase() : 'other';

                        $.inArray(imgLink, self.listAvailablePbxs()) < 0 ? imgLink = 'other' : true;

                        $('#pbxs_manager_listpanel .pbx-wrapper[data-id="'+k+'"] .img-wrapper', parent).append('<img class="img_style" src="apps/pbxs/static/images/endpoints/'+ imgLink +'.png" height="49" width=72"/>');
                    });

                    if(typeof callback === 'function') {
                        callback(data);
                    }
                };

            if(_data) {
                refreshList(_data);
            }
             else {
                self.listServers(function(data, status) {
                    refreshList(data);
                });
            }
        },

        listNumbersByPbx: function(id, _callback, _optional_data) {
            var self = this;

            if(id || id > -1) {
                monster.parallel({
                    list_numbers: function(callback){
                        self.listAllNumbers(function(_data_numbers) {
                            callback(null, _data_numbers.data);
                        });
                    },
                    account: function(callback){
                        if(_optional_data) {
                            callback(null, _optional_data);
                        }
                        else {
                            self.getAccount(function(_data) {
                                callback(null, _data.data);
                            });
                        }
                    }
                },
                function(err, results){
                    var json_data = {};

                    $.each(results.account.servers[id].DIDs, function(k, v) {
                        if(k in results.list_numbers) {
                            json_data[k] = results.list_numbers[k];
                        }
                    });

                    _callback && _callback(json_data);
                });
            }
        },

        listAvailableNumbers: function(_callback) {
            var self = this;

            monster.parallel({
                listNumbers: function(callback){
                    self.listAllNumbers(function(_dataNumbers) {
                        callback(null, _dataNumbers.data);
                    });
                },
                account: function(callback){
                    self.getAccount(function(_data) {
                        callback(null, _data.data);
                    });
                },
                listCallflows: function(callback) {
                    self.listCallflows(function(_dataCallflows) {
                        callback(null, _dataCallflows.data);
                    });
                }
            },
            function(err, results){
                var tabData = [];

                //Remove numbers used in trunkstore
                $.each(results.account.servers, function(k, v) {
                    $.each(this.DIDs, function(k2, v2) {
                        delete results.listNumbers[k2];
                    });
                });

                //Remove numbers used in callflows
                $.each(results.listCallflows, function(k, v) {
                    if(this.numbers) {
                        $.each(this.numbers, function(k2, v2) {
                            delete results.listNumbers[v2];
                        });
                    }
                });

                //Build available numbers list
                $.each(results.listNumbers, function(k, v) {
                    if(k !== 'id') {
                        tabData.push(k);
                    }
                });

                _callback && _callback(tabData);
            });
        }
	};

	return app;
});
