winkstart.module('accounts', 'accounts_manager', {
        css: [
            'css/accounts_manager.css'
        ],

        templates: {
            accounts_manager: 'tmpl/accounts_manager.html',
            edit: 'tmpl/edit.html',
            'switch_tmpl': 'tmpl/switch.html',
            'credits': 'tmpl/credits.html'
        },

        subscribe: {
            'accounts_manager.activate' : 'activate',
            'accounts_manager.edit' : 'edit_accounts_manager',
            'accounts_manager.switch_account': 'switch_account',
            'accounts_manager.trigger_masquerade': 'trigger_masquerade',
            'nav.company_name_click': 'restore_masquerading',
        },

        validation: [
                { name: '#vm_to_email_support_number',   regex: /^[\+]?[0-9\s\-\x\(\)]*$/ },
                { name: '#vm_to_email_support_email',    regex: /^(([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+)*$/ },
                { name: '#vm_to_email_send_from',        regex: /^.*$/ },
                { name: '#vm_to_email_service_url',      regex: /^.*$/ },
                { name: '#vm_to_email_service_provider', regex: /^.*$/ },
                { name: '#vm_to_email_service_name',     regex: /^.*$/ },
                { name: '#deregister_email',             regex: /^(([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+)*$/ }
        ],

        resources: {
            'accounts_manager.list': {
                url: '{api_url}/accounts/{account_id}/children',
                contentType: 'application/json',
                verb: 'GET'
            },
            'accounts_manager.get': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'accounts_manager.create': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'accounts_manager.update': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'accounts_manager.delete': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            },
            'whitelabel.get': {
                url: '{api_url}/accounts/{account_id}/whitelabel',
                contentType: 'application/json',
                verb: 'GET'
            },
            'whitelabel.create': {
                url: '{api_url}/accounts/{account_id}/whitelabel',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'whitelabel.update': {
                url: '{api_url}/accounts/{account_id}/whitelabel',
                contentType: 'application/json',
                verb: 'POST'
            },
            'whitelabel.update_logo': {
                url: '{api_url}/accounts/{account_id}/whitelabel/logo',
                contentType: 'application/x-base64',
                verb: 'POST'
            },
            'accounts_manager.credits.get': {
                url: '{api_url}/accounts/{account_id}/{billing_provider}/credits',
                contentType: 'application/json',
                verb: 'GET'
            },
            'accounts_manager.limits.get': {
                url: '{api_url}/accounts/{account_id}/limits',
                contentType: 'application/json',
                verb: 'GET'
            },
            'accounts_manager.credits.update': {
                url: '{api_url}/accounts/{account_id}/{billing_provider}/credits',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'accounts_manager.limits.update': {
                url: '{api_url}/accounts/{account_id}/limits',
                contentType: 'application/json',
                verb: 'POST'
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.publish('nav.add_sublink', {
            link: 'nav',
            sublink: 'switch_account',
            label: 'Switch Account',
            weight: '05',
            publish: 'accounts_manager.switch_account'
        });

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },

    {
        billing_provider: 'braintree',

        save_accounts_manager: function(form_data, data, success, error) {
            delete data.data.available_apps;

            var THIS = this,
                normalized_data = THIS.normalize_data($.extend(true, {}, data.data, form_data));

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'accounts_manager.update', {
                        account_id: data.data.id,
                        api_url: winkstart.apps['accounts'].api_url,
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
                winkstart.request(true, 'accounts_manager.create', {
                        account_id: winkstart.apps['accounts'].account_id,
                        api_url: winkstart.apps['accounts'].api_url,
                        data: normalized_data
                    },
                    function(_data, status) {
                        THIS.update_billing_account(_data, function() {
                            if(typeof success == 'function') {
                                success(_data, status, 'create');
                            }
                        });
                    },
                    function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status, 'create');
                        }
                    }
                );
            }
        },

        update_billing_account: function(data, callback) {
            if(data.data.billing_id === 'self') {
                data.data.billing_id = data.data.id;
                winkstart.request('accounts_manager.update', {
                        account_id: data.data.id,
                        api_url: winkstart.apps['accounts'].api_url,
                        data: data.data
                    },
                    function(_data, status) {
                        if(typeof callback == 'function') {
                            callback();
                        }
                    }
                );
            }
            else {
                if(typeof callback == 'function') {
                    callback();
                }
            }
        },

        edit_accounts_manager: function(data, _parent, _target, _callback, data_defaults) {
            var THIS = this,
                parent = _parent || $('#accounts_manager-content'),
                target = _target || $('#accounts_manager-view', parent),
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                        THIS.render_list(parent);

                        THIS.edit_accounts_manager({ id: _data.data.id }, parent, target, callbacks);
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
                        notifications: {
                            voicemail_to_email: {}
                        }
                    }, data_defaults || {}),
                    field_data: {
                        billing_account: 'parent',
                        whitelabel: {
                            nav: {},
                            port: {}
                        },
                        available_apps: []
                    },
                    functions: {
                        inArray: function(value, array) {
                            if(array) {
                                return ($.inArray(value, array) == -1) ? false : true;
                            }
                            else return false;
                        }
                    }
                };


            winkstart.request(true, 'accounts_manager.get', {
                    account_id: winkstart.apps['accounts'].account_id,
                    api_url: winkstart.apps['accounts'].api_url
                },
                function(_data_account, status) {
                    _data_account.data.available_apps = _data_account.data.available_apps || ((winkstart.config.onboard_roles || {})['default'] || {}).available_apps || [];
                    if(typeof data == 'object' && data.id) {
                        var render = function() {
                            winkstart.request('accounts_manager.get', {
                                    account_id: data.id,
                                    api_url: winkstart.apps['accounts'].api_url
                                },
                                function(_data, status) {
                                    THIS.migrate_data(_data);
                                    THIS.format_data(_data);

                                    var render_data = $.extend(true, defaults, _data);

                                    $.each(_data_account.data.available_apps, function(k, v) {
                                        var tmp = {},
                                            available = $.inArray(v, _data.data.available_apps || []);

                                        if(available > -1){
                                            tmp.enabled = true;
                                        } else {
                                            tmp.enabled = false;
                                        }

                                        if(winkstart.config.available_apps[v]) {
                                            $.extend(true, tmp, winkstart.config.available_apps[v]);
                                        }

                                        render_data.field_data.available_apps.push(tmp);
                                    });

                                    winkstart.request('accounts_manager.credits.get', {
                                            account_id: data.id,
                                            api_url: winkstart.apps['accounts'].api_url,
                                            billing_provider: THIS.billing_provider,
                                        },
                                        function(_data_c, status) {
                                            render_data.credits = _data_c.data;

                                            winkstart.request('accounts_manager.limits.get', {
                                                    account_id: data.id,
                                                    api_url: winkstart.apps['accounts'].api_url
                                                },
                                                function(_data_l, status) {
                                                    var limits = {
                                                        inbound_trunks: 0,
                                                        twoway_trunks: 0
                                                    };
                                                    $.extend(true, limits, _data_l.data);
                                                    render_data.limits = limits;

                                                    THIS.render_accounts_manager(render_data, target, callbacks);

                                                    if(typeof callbacks.after_render == 'function') {
                                                        callbacks.after_render();
                                                    }
                                                }
                                            );
                                        }
                                    );
                                },
                                winkstart.error_message.process_error()
                            );
                        };

                        winkstart.request('whitelabel.get', {
                                account_id: data.id,
                                api_url: winkstart.apps['accounts'].api_url
                            },
                            function(_data_wl, status) {
                                defaults.field_data.whitelabel = $.extend(true, defaults.field_data.whitelabel, _data_wl.data);
                                defaults.field_data.whitelabel.logo_url = winkstart.apps['accounts'].api_url + '/accounts/'+data.id+'/whitelabel/logo?auth_token='+winkstart.apps['accounts'].auth_token;

                                render();
                            },
                            function(_data_wl, status) {
                                if(status === 404) {
                                    render();
                                }
                            }
                        );

                    } else {
                        defaults.field_data.available_apps = [];

                        $.each(_data_account.data.available_apps, function(k, v) {
                            if(winkstart.config.available_apps[v]) {
                                defaults.field_data.available_apps.push(winkstart.config.available_apps[v]);
                            }
                        });

                        defaults.limits = {
                            inbound_trunks: 0,
                            twoway_trunks: 0
                        };

                        defaults.credits = {
                            amount: 0
                        };

                        THIS.render_accounts_manager(defaults, target, callbacks);

                        if(typeof callbacks.after_render == 'function') {
                            callbacks.after_render();
                        }
                    }
                }
            );
        },

        delete_accounts_manager: function(data, success, error) {
            var THIS = this;

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'accounts_manager.delete', {
                        account_id: data.data.id,
                        api_url: winkstart.apps['accounts'].api_url
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
            if('vm_to_email' in data.data) {
                data.data.notifications = data.data.notifications || {};
                data.data.notifications.voicemail_to_email = data.data.notifications.voicemail_to_email || {};
                data.data.notifications.voicemail_to_email.support_number = data.data.vm_to_email.support_number;
                data.data.notifications.voicemail_to_email.support_email = data.data.vm_to_email.support_email;

                delete data.data.vm_to_email;
            }
        },

        format_data: function(data) {
            if(!data.field_data) {
                data.field_data = {};
            }

            if(data.data.notifications && 'deregister' in data.data.notifications && data.data.notifications.deregister.send_to && data.data.notifications.deregister.send_to != '') {
                data.field_data.deregister = true;
            }
            else {
                data.field_data.deregister = false;
            }

            if(data.data.billing_id === winkstart.apps['accounts'].account_id) {
               data.field_data.billing_account = 'parent';
            }
            else if(data.data.billing_id === data.data.id) {
                data.field_data.billing_account = 'self'
            }
            else {
                data.field_data.billing_account = 'other'
            }
        },

        clean_form_data: function(form_data) {
            var available_apps = [];

            $.each(form_data.available_apps, function(k, v) {
                if(v){
                    available_apps.push(v);
                }
            });

            form_data.available_apps = available_apps;

            if(form_data.extra.deregistration_notify === false) {
                form_data.notifications.deregister.send_to = '';
            }

            if(form_data.extra.billing_account === 'self') {
                form_data.billing_id = 'self';
            }
            else if(form_data.extra.billing_account === 'parent') {
                form_data.billing_id = winkstart.apps['accounts'].account_id;
            }

            if(form_data.apps) {
                form_data.apps = $.map(form_data.apps, function(val) { return (val) ? val : null });
            }

            form_data.whitelabel.description = form_data.extra.upload_media;

            if(form_data.whitelabel.description === '') {
                delete form_data.whitelabel.description;
            }

            delete form_data.extra;

            return form_data;
        },

        normalize_data: function(data) {
            $.each(data.notifications.voicemail_to_email, function(key, val) {
                if(val == '') {
                    delete data.notifications.voicemail_to_email[key];
                }
            });

            if($.isEmptyObject(data.vm_to_email)) {
                delete data.vm_to_email;
            }

            if(data.notifications.deregister) {
                if(data.notifications.deregister.send_to === '') {
                    delete data.notifications.deregister.send_to;
                }
            }

            if(data.billing_id === 'self' && data.id) {
                data.billing_id = data.id;
            }

            return data;
        },

        upload_file: function(data, account_id, callback) {
            winkstart.request('whitelabel.update_logo', {
                    account_id: account_id,
                    api_url: winkstart.apps['accounts'].api_url,
                    data: data
                },
                function(_data, status) {
                    if(typeof callback === 'function') {
                        callback();
                    }
                },
                winkstart.error_message.process_error()
            );
        },

        update_limits: function(limits, account_id, success, error) {
            var THIS = this;

            winkstart.request('accounts_manager.limits.update', {
                    account_id: account_id,
                    api_url: winkstart.apps['accounts'].api_url,
                    data: limits
                },
                function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                winkstart.error_message.process_error()
            );
        },

        add_credits: function(credits, account_id, success, error) {
            var THIS = this;

            winkstart.request('accounts_manager.credits.update', {
                    account_id: account_id,
                    api_url: winkstart.apps['accounts'].api_url,
                    billing_provider: THIS.billing_provider,
                    data: {
                        'amount': credits
                    }
                },
                function(data, status) {
                    if(typeof success == 'function') {
                        success(data, status);
                    }
                },
                winkstart.error_message.process_error()
            );
        },

        render_credits_limits_popup: function(data) {
            var THIS = this,
                data_tmpl = {
                    credits: data.credits.amount,
                    limits: data.limits,
                    extra: {
                        inbound_trunks_price: winkstart.config.inbound_trunks_price || '$6.99',
                        twoway_trunks_price: winkstart.config.twoway_trunks_price || '$29.99'
                    }
                },
                credits_html = THIS.templates.credits.tmpl(data_tmpl),
                popup;

            $('ul.settings1 > li', credits_html).click(function(item) {
                $('.pane_content', credits_html).hide();

                $('ul.settings1 > li', credits_html).removeClass('current');

                var tab_id = $(this).attr('id');

                if(tab_id  === 'flat_rate_link') {
                    $('#flat_rate', credits_html).show();
                }
                else if(tab_id === 'per_minute_link') {
                    $('#per_minute', credits_html).show();
                }

                $(this).addClass('current');
            });

            $('.purchase_credits', credits_html).click(function(ev) {
                ev.preventDefault();
                winkstart.confirm('Your on-file credit card will immediately be charged for any changes you make. If you have changed any recurring services, new charges will be pro-rated for your billing cycle.<br/><br/>Are you sure you want to continue?',
                    function() {
                        var credits_to_add = parseFloat($('#add_credits', credits_html).val().replace(',','.'));

                        THIS.add_credits(credits_to_add, data.account_id, function() {
                            $('.current_balance', credits_html).html((parseFloat($('.current_balance', credits_html).html()) + credits_to_add).toFixed(2));

                            winkstart.publish('statistics.update_stat', 'credits');
                            THIS.edit_accounts_manager({id: data.account_id});
                        });
                    }
                );
            });

            $('.submit_channels', credits_html).click(function(ev) {
                ev.preventDefault();

                winkstart.confirm('Your on-file credit card will immediately be charged for any changes you make. If you have changed any recurring services, new charges will be pro-rated for your billing cycle.<br/><br/>Are you sure you want to continue?',
                    function() {
                        var limits_data = {
                            twoway_trunks: $('#outbound_calls', credits_html).size() > 0 ? parseInt($('#outbound_calls', credits_html).val() || 0) : -1,
                            inbound_trunks: $('#inbound_calls', credits_html).size() > 0 ? parseInt($('#inbound_calls', credits_html).val() || 0) : -1
                        };

                        limits_data = $.extend({}, data.limits, limits_data);

                        THIS.update_limits(limits_data, data.account_id, function(_data) {
                            popup.dialog('close');

                            winkstart.alert('info', 'Your changes have been saved!');

                            THIS.edit_accounts_manager({id: data.account_id});
                        });
                    }
                );
            });

            popup = winkstart.dialog(credits_html, { title: 'Add Credits' });
        },

        render_accounts_manager: function(data, target, callbacks) {
            var THIS = this,
                account_html = THIS.templates.edit.tmpl(data),
                deregister = $('#deregister', account_html),
                deregister_email = $('.deregister_email', account_html),
                file;

            winkstart.validate.set(THIS.config.validation, account_html);

            $('*[rel=popover]:not([type="text"])', account_html).popover({
                trigger: 'hover'
            });

            $('*[rel=popover][type="text"]', account_html).popover({
                trigger: 'focus'
            });

            winkstart.tabs($('.view-buttons', account_html), $('.tabs', account_html), true);

            $('.logo_div', account_html).css('background-image', 'url('+data.field_data.whitelabel.logo_url+ '&_=' + new Date().getTime()+')');

            if(data.field_data.whitelabel.description) {
                $('#upload_div', account_html).hide();
                $('.player_file', account_html).show();
            }

            $('#change_link', account_html).click(function(ev) {
                ev.preventDefault();
                $('#upload_div', account_html).show();
                $('.player_file', account_html).hide();
            });

            $('#download_link', account_html).click(function(ev) {
                ev.preventDefault();
                window.location.href = winkstart.apps['accounts'].api_url + '/accounts/' +
                                       data.data.id + '/whitelabel/logo?auth_token=' +
                                       winkstart.apps['accounts'].auth_token;
            });

            $('#file', account_html).bind('change', function(evt){
                var files = evt.target.files;

                if(files.length > 0) {
                    var reader = new FileReader();

                    file = 'updating';
                    reader.onloadend = function(evt) {
                        var data = evt.target.result;

                        file = data;
                    }

                    reader.readAsDataURL(files[0]);
                }
            });

            deregister.is(':checked') ? deregister_email.show() : deregister_email.hide();

            deregister.change(function() {
                $(this).is(':checked') ? deregister_email.show('blind') : deregister_email.hide('blind');
            });

            $('#manage', account_html).click(function(e) {
                e.preventDefault();

                var account_id = data.data.id;

                winkstart.request('accounts_manager.credits.get', {
                        account_id: account_id,
                        api_url: winkstart.apps['accounts'].api_url,
                        billing_provider: THIS.billing_provider,
                    },
                    function(_data_c, status) {
                        winkstart.request('accounts_manager.limits.get', {
                                account_id: account_id,
                                api_url: winkstart.apps['accounts'].api_url,
                            },
                            function(_data_l, status) {

                                var tmp = {
                                    account_id: account_id,
                                    limits: _data_l.data,
                                    credits: _data_c.data
                                };

                                THIS.render_credits_limits_popup(tmp);
                            }
                        );
                    }
                );
            });

            $('.accounts_manager-save', account_html).click(function(ev) {
                ev.preventDefault();

                winkstart.validate.is_valid(THIS.config.validation, account_html, function() {
                        var form_data = form2object('accounts_manager-form'),
                            whitelabel_data = {};

                        THIS.clean_form_data(form_data);

                        if('field_data' in data) {
                            delete data.field_data;
                        }

                        if('whitelabel' in form_data) {
                            var whitelabel_data = form_data.whitelabel;
                            delete form_data.whitelabel;
                        }

                        data.data.apps = [];

                        THIS.save_accounts_manager(form_data, data,
                            function(_data_account, status) {
                                var account_id = _data_account.data.id,
                                    upload_file = function() {
                                        if($('#upload_div', account_html).is(':visible') && $('#file', account_html).val() != '') {
                                            THIS.upload_file(file, account_id, function() {
                                                if(typeof callbacks.save_success == 'function') {
                                                    callbacks.save_success(_data_account, status);
                                                }
                                            });
                                        }
                                        else {
                                            if(typeof callbacks.save_success == 'function') {
                                                callbacks.save_success(_data_account, status);
                                            }
                                        }
                                    };

                                /*
                                * We check if the whitelabel exist for this account,
                                * If yes, then we check if it has been updated and if it was, we update the whitelabel document.
                                * If it doesn't exist, we check if data is not empty before creating a whitelabel document
                                */
                                winkstart.request('whitelabel.get', {
                                        account_id: account_id,
                                        api_url: winkstart.apps['accounts'].api_url
                                    },
                                    function(_data, status) {
                                        whitelabel_data = $.extend(true, {}, _data.data, whitelabel_data);

                                        winkstart.request('whitelabel.update', {
                                                account_id: account_id,
                                                api_url: winkstart.apps['accounts'].api_url,
                                                data: whitelabel_data
                                            },
                                            function(_data, status) {
                                                upload_file();
                                            },
                                            winkstart.error_message.process_error()
                                        );
                                    },
                                    function(_data, status) {
                                        if(status === 404 && (whitelabel_data.domain != '' || whitelabel_data.company_name != '')) {
                                            winkstart.request('whitelabel.create', {
                                                    account_id: account_id,
                                                    api_url: winkstart.apps['accounts'].api_url,
                                                    data: whitelabel_data
                                                },
                                                function(_data, status) {
                                                    upload_file();
                                                },
                                                winkstart.error_message.process_error()
                                            );
                                        }
                                        else {
                                            if(typeof callbacks.save_success == 'function') {
                                                callbacks.save_success(_data_account, status);
                                            }
                                        }
                                    }
                                );
                            },
                            function() {
                                winkstart.alert('There were errors on the form, please correct!');
                            }
                        );
                    }
                );
            });

            $('.accounts_manager-delete', account_html).click(function(ev) {
                ev.preventDefault();

                winkstart.confirm('Are you sure you want to delete this account?<br>WARNING: This can not be undone', function() {
                    THIS.delete_accounts_manager(data, callbacks.delete_success, callbacks.delete_error);
                });
            });

            $('.accounts_manager-switch', account_html).click(function(ev) {
                ev.preventDefault();

                var account = {
                    name: data.data.name,
                    id: data.data.id
                };

                winkstart.confirm('Do you really want to use ' + account.name + '\'s account?', function() {
                    winkstart.publish('accounts_manager.trigger_masquerade', { account: account }, function() {
                        winkstart.publish('accounts_manager.activate');
                    });
                });
            });

            winkstart.link_form(account_html);

            (target)
                .empty()
                .append(account_html);
        },

        render_list: function(parent) {
            var THIS = this;

            winkstart.request('accounts_manager.list', {
                    account_id: winkstart.apps['accounts'].account_id,
                    api_url: winkstart.apps['accounts'].api_url
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

                    $('#accounts_manager-listpanel', parent)
                        .empty()
                        .listpanel({
                            label: 'Accounts',
                            identifier: 'accounts_manager-listview',
                            new_entity_label: 'Add Account',
                            data: map_crossbar_data(data.data),
                            publisher: winkstart.publish,
                            notifyMethod: 'accounts_manager.edit',
                            notifyCreateMethod: 'accounts_manager.edit',
                            notifyParent: parent
                        }
                    );
                }
            );
        },

        switch_account: function() {
            var THIS = this;
            winkstart.request('accounts_manager.list', {
                    account_id: winkstart.apps['accounts'].account_id,
                    api_url: winkstart.apps['accounts'].api_url
                },
                function(_data, status) {
                    if(_data.data.length > 0) {
                        switch_html = winkstart.dialog(THIS.templates.switch_tmpl.tmpl({ 'accounts': _data.data }), {
                            title: 'Account Masquerading'
                        });

                        $('.masquerade', switch_html).click(function() {
                            var account = {
                                    name: $('#sub_accounts option:selected', switch_html).text(),
                                    id: $('#sub_accounts', switch_html).val()
                                };

                            winkstart.confirm('Do you really want to use ' + account.name + '\'s account?', function() {
                                THIS.trigger_masquerade({account: account}, function() {
                                    $(switch_html).dialog('close');

                                    winkstart.publish('accounts_manager.activate');
                                });
                            });
                        });
                    }
                    else {
                        winkstart.alert('This account doesn\'t have any sub-accounts.');
                    }
                }
            );
        },

        trigger_masquerade: function(data, callback) {
            var account = data.account,
                THIS = this;

            if(!('masquerade' in winkstart.apps['accounts'])) {
                winkstart.apps['accounts'].masquerade = [];
                winkstart.publish('nav.company_name', function(name) {
                    winkstart.apps['accounts'].account_name = name;
                });
            }

            winkstart.apps['accounts'].masquerade.push(winkstart.apps['accounts'].account_id);

            THIS.update_apps(account.id);

            THIS.masquerade_account(account.name);

            if(typeof callback === 'function') {
                callback();
            }
        },

        update_apps: function(account_id) {
            winkstart.apps['accounts'].account_id = account_id;

            if(winkstart.apps['accounts'].masquerade) {
                $.each(winkstart.apps, function(k, v) {
                    if(k != 'accounts' && this.is_masqueradable && this.api_url === winkstart.apps['accounts'].api_url) {
                        this.account_id = winkstart.apps['accounts'].account_id;
                        winkstart.publish('whappnav.subnav.enable', k);
                    }
                    else if(k != 'accounts') {
                        winkstart.publish('whappnav.subnav.disable', k);
                    }
                });
            }
            else {
                $.each(winkstart.apps, function(k, v) {
                    winkstart.publish('whappnav.subnav.enable', k);
                    if(this.is_masqueradable && this.api_url === winkstart.apps['accounts'].api_url) {
                        this.account_id = winkstart.apps['accounts'].account_id;
                    }
                });
            }
        },

        restore_masquerading: function() {
            var THIS = this,
                id = winkstart.apps['accounts'].masquerade.pop();

            if(winkstart.apps['accounts'].masquerade.length) {
                winkstart.request('accounts_manager.get', {
                        api_url: winkstart.apps['accounts'].api_url,
                        account_id: id
                    },
                    function(data, status) {
                        THIS.update_apps(data.data.id);

                        THIS.masquerade_account(data.data.name);

                        winkstart.publish('accounts_manager.activate');
                    }
                );
            }
            else {
                delete winkstart.apps['accounts'].masquerade;

                THIS.update_apps(id);

                winkstart.publish('nav.company_name', function() { return winkstart.apps['accounts'].account_name });
                winkstart.alert('info', 'Masquerading finished, you\'re now using your root account.');

                winkstart.publish('accounts_manager.activate');
            }

        },

        masquerade_account: function(account_name) {
            var THIS = this;

            winkstart.alert('info', 'You are now using ' + account_name + '\'s account');
            winkstart.publish('nav.company_name', function() { return 'as ' + account_name + ' (restore)' });
        },

        activate: function(parent) {
            var THIS = this,
                accounts_manager_html = THIS.templates.accounts_manager.tmpl();

            (parent || $('#ws-content'))
                .empty()
                .append(accounts_manager_html);

            THIS.render_list(accounts_manager_html);
        }
    }
);
