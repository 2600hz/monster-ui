winkstart.module('userportal', 'portal_manager', {
        css: [
            'css/portal_manager.css'
        ],

        templates: {
            portal_manager: 'tmpl/portal_manager.html',
            device_line: 'tmpl/device_line.html',
            general_edit: 'tmpl/phones/general_edit.html',
            smartphone: 'tmpl/phones/smartphone.html',
            landline: 'tmpl/phones/landline.html',
            cellphone: 'tmpl/phones/cellphone.html',
            softphone: 'tmpl/phones/softphone.html',
            sip_device: 'tmpl/phones/sip_device.html',
            fax: 'tmpl/phones/fax.html'
        },

        subscribe: {
            'portal_manager.activate' : 'activate'
        },

        validation_device: {
            landline: [
                { name: '#name',                regex: /^[a-zA-Z0-9\s_']+$/ },
                { name: '#call_forward_number', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ }
            ],
            smartphone: [
                { name: '#name',                regex: /^[a-zA-Z0-9\s_']+$/ },
                { name: '#call_forward_number', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ }
            ],
            sip_device : [
                { name: '#name',                      regex: /^[a-zA-Z0-9\s_'\-]+$/ },
                { name: '#mac_address',               regex: /^(((\d|([a-f]|[A-F])){2}:){5}(\d|([a-f]|[A-F])){2})$|^$|^(((\d|([a-f]|[A-F])){2}-){5}(\d|([a-f]|[A-F])){2})$|^(((\d|([a-f]|[A-F])){2}){5}(\d|([a-f]|[A-F])){2})$/ },
                { name: '#caller_id_name_internal',   regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_internal', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#caller_id_name_external',   regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_external', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#sip_username',              regex: /^[^\s]+$/ },
                { name: '#sip_expire_seconds',        regex: /^[0-9]+$/ }
            ],
            fax : [
                { name: '#name',                      regex: /^[a-zA-Z0-9\s_'\-]+$/ },
                { name: '#mac_address',               regex: /^(((\d|([a-f]|[A-F])){2}:){5}(\d|([a-f]|[A-F])){2})$|^$|^(((\d|([a-f]|[A-F])){2}-){5}(\d|([a-f]|[A-F])){2})$|^(((\d|([a-f]|[A-F])){2}){5}(\d|([a-f]|[A-F])){2})$/ },
                { name: '#caller_id_name_internal',   regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_internal', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#caller_id_name_external',   regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_external', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#sip_username',              regex: /^[^\s]+$/ },
                { name: '#sip_expire_seconds',        regex: /^[0-9]+$/ }
            ],
            cellphone: [
                { name: '#name',                regex: /^[a-zA-Z0-9\s_']+$/ },
                { name: '#call_forward_number', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ }
            ],
            softphone: [
                { name: '#name',                      regex: /^[a-zA-Z0-9\s_'\-]+$/ },
                { name: '#caller_id_name_internal',   regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_internal', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#caller_id_name_external',   regex: /^[0-9A-Za-z ,]{0,15}$/ },
                { name: '#caller_id_number_external', regex: /^[\+]?[0-9\s\-\.\(\)]*$/ },
                { name: '#sip_username',              regex: /^[^\s]+$/ },
                { name: '#sip_expire_seconds',        regex: /^[0-9]+$/ }
            ]
        },

        validation: [
            { name: '#vm-to-email-txt', regex: /^(([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+)?$/ },
            { name: '#ring-number-txt', regex: /^[\+]?[0-9\s\-\.\(\)]{7,20}$|(sip[s]?:[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+)$|^$/ }
        ],

        resources: {
            'portal_account.get': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'portal_user.list': {
                url: '{api_url}/accounts/{account_id}/users',
                contentType: 'application/json',
                verb: 'GET'
            },
            'portal_media.list': {
                url: '{api_url}/accounts/{account_id}/media',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user_device.get': {
                url: '{api_url}/accounts/{account_id}/devices/{device_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user_device.update': {
                url: '{api_url}/accounts/{account_id}/devices/{device_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'user_device.create': {
                url: '{api_url}/accounts/{account_id}/devices',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'user_device.delete': {
                url: '{api_url}/accounts/{account_id}/devices/{device_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            },
            'account_devices.status': {
                url: '{api_url}/accounts/{account_id}/devices/status',
                contentType: 'application/json',
                verb: 'GET'
            },
            'account_devices.list': {
                url: '{api_url}/accounts/{account_id}/devices',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user_device.list': {
                url: '{api_url}/accounts/{account_id}/devices?filter_owner_id={user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user_settings.get': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user_settings.post': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'user_vmbox.list': {
                url: '{api_url}/accounts/{account_id}/vmboxes',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user_vmbox.get': {
                url: '{api_url}/accounts/{account_id}/vmboxes/{vmbox_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'user_vmbox.update': {
                url: '{api_url}/accounts/{account_id}/vmboxes/{vmbox_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'user_cdr.list': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}/cdrs?created_from={created_from}&created_to={created_to}',
                contentType: 'application/json',
                verb: 'GET'
            }
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },

    {
        user_cdr_range: 7,

        get_registered_devices: function(success, error) {
            winkstart.request('account_devices.status', {
                    api_url: winkstart.apps['userportal'].api_url,
                    account_id: winkstart.apps['userportal'].account_id
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

        get_user_devices: function(success, error) {
            winkstart.request('user_device.list', {
                    api_url: winkstart.apps['userportal'].api_url,
                    account_id: winkstart.apps['userportal'].account_id,
                    user_id: winkstart.apps['userportal'].user_id
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

        get_vmbox_by_owner: function(owner_id, success, error) {
            winkstart.request('user_vmbox.list', {
                    api_url: winkstart.apps['userportal'].api_url,
                    account_id: winkstart.apps['userportal'].account_id
                },
                function(_data, status) {
                    var list_vmbox = [];
                    $.each(_data.data, function() {
                        if(this.owner_id === owner_id) {
                            list_vmbox.push(this);
                        }
                    });
                    if(typeof success === 'function') {
                        success({ data: list_vmbox });
                    }
                },
                function(_data, status) {
                    if(typeof error === 'function') {
                        error(_data);
                    }
                }
            );
        },

        get_vmbox: function(vmbox_id, success, error) {
            winkstart.request('user_vmbox.get', {
                    api_url: winkstart.apps['userportal'].api_url,
                    account_id: winkstart.apps['userportal'].account_id,
                    vmbox_id: vmbox_id
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

        update_vmbox: function(data, success, error) {
            winkstart.request('user_vmbox.update', {
                    api_url: winkstart.apps['userportal'].api_url,
                    account_id: winkstart.apps['userportal'].account_id,
                    vmbox_id: data.data.id,
                    data: data.data
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

        get_settings: function(success, error) {
            winkstart.request('user_settings.get', {
                    api_url: winkstart.apps['userportal'].api_url,
                    account_id: winkstart.apps['userportal'].account_id,
                    user_id: winkstart.apps['userportal'].user_id
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

        update_settings: function(data, success, error) {
            var THIS = this;

            THIS.get_settings(function(_data) {
                var normalized_data = THIS.normalize_data($.extend(true, {}, _data.data, data));

                winkstart.request('user_settings.post', {
                        api_url: winkstart.apps['userportal'].api_url,
                        account_id: winkstart.apps['userportal'].account_id,
                        user_id: winkstart.apps['userportal'].user_id,
                        data: normalized_data
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
            });
        },

        normalize_data: function(data) {
            /* Settings Part */
            if(data.call_forward != undefined) {
                data.call_forward.keep_caller_id = true;
                data.call_forward.require_keypress = true;
            }

            if(data.call_forward.number === '') {
                delete data.call_forward.number;
            }

            return data;
        },

        activate: function(parent) {
            var THIS = this;

            THIS.render_portal_manager();
        },

        render_portal_manager: function(parent) {
            var THIS = this,
                parent = parent || $('#ws-content');

            THIS.get_settings(function(_data_settings) {
                var portal_manager_html = THIS.templates.portal_manager.tmpl(_data_settings);

                THIS.refresh_list_devices(portal_manager_html);

                THIS.setup_page(portal_manager_html);

                /* Settings part */
                if(!_data_settings.data.vm_to_email_enabled) {
                    $('.email-field', portal_manager_html).hide();
                }

                if(!('call_forward' in _data_settings.data) || !_data_settings.data.call_forward.enabled) {
                    $('.device-field', portal_manager_html).hide();
                }

                (parent)
                    .empty()
                    .append(portal_manager_html);

                //Hack to display columns properly
                $('.dataTables_scrollHeadInner, .dataTables_scrollHeadInner table', portal_manager_html).attr('style', 'width:100%');
            });
        },

        setup_page: function(parent) {
            var THIS = this,
                portal_manager_html = parent;

            /* Settings Part */
            $('#ring-number-txt', portal_manager_html).keyup(function() {
                if($(this).val() === '') {
                    $('.device-field', portal_manager_html).slideUp();
                    $('#ring-device-checkbox', portal_manager_html).removeAttr('checked');
                } else {
                    $('.device-field', portal_manager_html).slideDown();
                    $('#ring-device-checkbox', portal_manager_html).attr('checked', 'checked');
                }
            });

            $('#vm-to-email-checkbox', portal_manager_html).change(function() {
                $('#vm-to-email-checkbox', portal_manager_html).attr('checked') ? $('.email-field', portal_manager_html).slideDown() : $('.email-field', portal_manager_html).slideUp();
            });

            $('#save-settings-link', portal_manager_html).click(function(e) {
                e.preventDefault();

                var replaced_number = $('#ring-number-txt', portal_manager_html).val();

                if(replaced_number.match(/^[\+]?[0-9\s\-\.\(\)]{7,20}$/)) {
                    replaced_number = replaced_number.replace(/\s|\(|\)|\-|\./g,'');
                }

                var data = {
                    vm_to_email_enabled: false,
                    call_forward: {
                        number: replaced_number,
                        enabled: replaced_number !== '' ? true : false,
                        substitute: $('#ring-device-checkbox', portal_manager_html).attr('checked') ? false : true
                        //Substitute equals true to enable real call forwarding, false in order to ring devices as well.
                    }
                };

                if($('#vm-to-email-checkbox', portal_manager_html).attr('checked')) {
                    data.vm_to_email_enabled = true;
                    data.email = $('#vm-to-email-txt', portal_manager_html).val();
                }

                THIS.update_settings(data, function() {
                    THIS.render_portal_manager();
                });
            });

            /* Voicemails part */
            THIS.setup_voicemail_table(parent);

            /*CDRs Part*/
            THIS.setup_cdr_table(parent);

            /* My devices part */
            $(parent).delegate('.edit_icon', 'click', function() {
                THIS.popup_edit_device({id: $(this).dataset('id')}, function() {
                    THIS.refresh_list_devices(parent);
                });
            });

            $('.add_device', parent).click(function() {
                THIS.popup_edit_device({}, function() {
                    THIS.refresh_list_devices(parent);
                });
            });
        },

        refresh_list_devices: function(parent) {
            var THIS = this,
                portal_manager_html = parent,
                friendly_types = {
                    'cellphone': 'Cell',
                    'smartphone': 'Smartphone',
                    'fax': 'Fax',
                    'sip_device': 'VoIP',
                    'softphone': 'Softphone',
                    'landline': 'Landline'
                };

            $('.list_devices', portal_manager_html).html('<div class="clear"/>');

            THIS.get_registered_devices(function(_data_registered) {
                THIS.get_user_devices(function(_data_devices) {
                    var data_device,
                        registered_data = {};

                    $.each(_data_registered.data, function(k, v) {
                        registered_data[v.device_id] = true;
                    });

                    $.each(_data_devices.data, function(k, v) {
                        v.registered = v.id in registered_data || $.inArray(v.device_type, ['cellphone', 'smartphone', 'landline']) > -1 ? 'registered' : 'unregistered';
                        data_device = {
                            status: v.registered,
                            name: v.name,
                            device_type: v.device_type,
                            friendly_type: friendly_types[v.device_type],
                            id: v.id
                        };

                        $('.list_devices', portal_manager_html).prepend(THIS.templates.device_line.tmpl(data_device));
                    });
                });
            });
        },

        setup_cdr_table: function(parent) {
            var user_cdr_html = parent,
                THIS = this,
                range = THIS.user_cdr_range,
                columns = [
                {
                    'sTitle': 'Date',
                    'sWidth': '250px'
                },

                {
                    'sTitle': 'From (Caller ID)',
                    'sWidth': '350px'
                },
                {
                    'sTitle': 'To (Dialed number)',
                    'sWidth': '350px'
                },
                {
                    'sTitle': 'Duration',
                    'sWidth': '160px'
                },
                {
                    'sTitle': 'billing_seconds',
                    'bVisible': false
                }
            ];

            winkstart.table.create('user_cdr', $('#user_cdr-grid', user_cdr_html), columns, {}, {
                sDom: '<"date">frtlip',
                sScrollY: '150px',
                aaSorting: [[0, 'desc']]
            });

            $.fn.dataTableExt.afnFiltering.pop();

            $('div.date', user_cdr_html).html('Start Date: <input id="startDate" readonly="readonly" type="text"/>&nbsp;&nbsp;End Date: <input id="endDate" readonly="readonly" type="text"/>&nbsp;&nbsp;&nbsp;&nbsp;<button class="button-search btn primary" id="searchLink" href="javascript:void(0);">Filter</button><label class="call_duration"/>');

            var $call_duration = $('#user_cdr-grid_wrapper .call_duration', user_cdr_html);
            $('#user_cdr-grid_wrapper #user_cdr-grid_filter input[type=text]', user_cdr_html).keyup(function() {
                $(this).val !== '' ? $call_duration.hide() : $call_duration.show();
            });

            $('#searchLink', user_cdr_html).click(function() {
                var start_date = $('#startDate', user_cdr_html).val(),
                    end_date = $('#endDate', user_cdr_html).val(),
                    regex = /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d$/;

                winkstart.table.user_cdr.fnClearTable();
                $('#user_cdr-grid_wrapper .call_duration', user_cdr_html).text('');

                if(start_date.match(regex) && end_date.match(regex)) {
                    var start_date_sec = (new Date(start_date).getTime()/1000) + 62167219200,
                        end_date_sec = (new Date(end_date).getTime()/1000) + 62167219200;

                    if((end_date_sec - start_date_sec) <= (range*24*60*60)) {
                        THIS.list_by_date(start_date_sec, end_date_sec);
                    }
                    else {
                        //TODO change hardcode
                        winkstart.alert('The range is bigger than 7 days, please correct it.');
                    }
                }
                else {
                    winkstart.alert('Dates in the filter are not in the proper format (mm/dd/yyyy)');
                }
            });

            THIS.init_datepicker(user_cdr_html);

            var tomorrow = new Date(THIS.to_string_date(new Date()));
            tomorrow.setDate(tomorrow.getDate() + 1);

            var end_date = Math.floor(tomorrow.getTime()/1000) + 62167219200,
                start_date = end_date - (range*24*60*60);

            THIS.list_by_date(start_date, end_date);
        },

        init_datepicker: function(parent) {
            var THIS = this,
                user_cdr_html = parent,
                $start_date = $('#startDate', user_cdr_html),
                $end_date = $('#endDate', user_cdr_html),
                start_date = new Date(),
                end_date,
                tomorrow = new Date(),
                range = THIS.user_cdr_range;

            tomorrow.setDate(tomorrow.getDate() + 1);

            $('#startDate, #endDate', user_cdr_html).datepicker(
                {
                    beforeShow: customRange,
                    onSelect: customSelect
                }
            );

            end_date = tomorrow;
            start_date.setDate(new Date().getDate() - range + 1);

            $start_date.datepicker('setDate', start_date);
            $end_date.datepicker('setDate', end_date);

            function customSelect(dateText, input) {
                var date_min,
                    date_max;

                if(input.id == 'startDate') {
                    date_min = $start_date.datepicker('getDate');
                    if($end_date.datepicker('getDate') == null) {
                        date_max = date_min;
                        date_max.setDate(date_min.getDate() + range);
                        $end_date.val(THIS.to_string_date(date_max));
                    }
                    else {
                        date_max = $end_date.datepicker('getDate');
                        if((date_max > (new Date(date_min).setDate(date_min.getDate() + range)) || (date_max <= date_min))) {
                            date_max = date_min;
                            date_max.setDate(date_max.getDate() + range);
                            date_max > tomorrow ? date_max = tomorrow : true;
                            $end_date.val(THIS.to_string_date(date_max));
                        }
                    }
                }
                else if(input.id == 'endDate') {
                    if($start_date.datepicker('getDate') == null) {
                        date_min = $end_date.datepicker('getDate');
                        date_min.setDate(date_min.getDate() - 1);
                        $start_date.val(THIS.to_string_date(date_min));
                    }
                }
            };

            function customRange(input) {
                var date_min = new Date(2011, 0, 0),
                    date_max,
                    range = THIS.user_cdr_range;

                if (input.id == 'endDate')
                {
                    date_max = tomorrow;
                    if ($start_date.datepicker('getDate') != null)
                    {
                        date_min = $start_date.datepicker('getDate');
                        /* Range of 1 day minimum */
                        date_min.setDate(date_min.getDate() + 1);
                        date_max = $start_date.datepicker('getDate');
                        date_max.setDate(date_max.getDate() + range);

                        if(date_max > tomorrow) {
                            date_max = tomorrow;
                        }
                    }
                }
                else if (input.id == 'startDate') {
                    date_max = new Date();
                }

                return {
                    minDate: date_min,
                    maxDate: date_max
                };
            }
        },

        to_string_date: function(date) {
           var day = date.getDate(),
                    month = date.getMonth()+1,
                    year = date.getFullYear();

            day < 10 ? day = '0' + day : true;
            month < 10 ? month = '0' + month : true;

            return month+'/'+day+'/'+year;
        },

        friendly_date: function(timestamp) {
            var parsed_date = '-';

            if(timestamp) {
                var today = new Date(),
                    today_year = today.getFullYear(),
                    today_month = today.getMonth() + 1 < 10 ? '0' + (today.getMonth() + 1) : today.getMonth() + 1,
                    today_day = today.getDate() < 10 ? '0' + today.getDate() : today.getDate(),
                    date = new Date((timestamp - 62167219200)*1000),
                    month = date.getMonth() +1,
                    year = date.getFullYear(),
                    day = date.getDate(),
                    hours = date.getHours(),
                    minutes = date.getMinutes();

                if(hours >= 12) {
                    hours-=12;
                    suffix = 'pm';
                }
                else {
                    suffix = 'am';
                }

                day = day < 10 ? '0' + day : day;
                month = month < 10 ? '0' + month : month;
                hours = hours < 10 ? '0'+ hours : hours;
                minutes = minutes < 10 ? '0'+ minutes : minutes;

                var humanDate = year != new Date().getFullYear() ? month+'/'+day+'/'+year : month+'/'+day,
                    humanTime = hours + ':' + minutes + suffix;

                if(today_year === year && today_month === month && today_day === day) {
                    humanDate = 'Today';
                }

                parsed_date = humanDate + ' ' + humanTime;
            }

            return parsed_date;
        },

        list_by_date: function(start_date, end_date) {
            var THIS = this,
                parse_duration = function(duration, type) {
                    var duration = parseFloat(duration);
                        seconds = duration % 60,
                        minutes = ((duration - seconds) / 60) % 60,
                        hours = Math.floor((duration-seconds)/3600),
                        type = type || 'numbers';

                    if(hours < 10 && type == 'numbers') {
                        hours = '0' + hours;
                    }
                    if(minutes < 10) {
                        minutes = '0' + minutes;
                    }
                    if(seconds < 10) {
                        seconds = '0' + seconds;
                    }

                    if(type == 'verbose') {
                        duration = hours+' hours '+minutes+' minutes and '+seconds+' seconds';
                    }
                    else {
                        duration = hours != '00' ? hours+':'+minutes+':'+seconds : minutes+':'+seconds;
                    }

                    return duration;
                };

            winkstart.request('user_cdr.list', {
                    account_id: winkstart.apps['userportal'].account_id,
                    api_url: winkstart.apps['userportal'].api_url,
                    user_id: winkstart.apps['userportal'].user_id,
                    created_from: start_date,
                    created_to: end_date
                },
                function(_data, status) {
                    var duration,
                        humanFullDate,
                        call_duration = 0;

                    var tab_data = [];

                    $.each(_data.data, function() {
                        if(this.duration_seconds > 0) {
                            duration = this.duration_seconds >= 0 ? parse_duration(this.duration_seconds) : '--';
                            humanFullDate = THIS.friendly_date(this.timestamp);
                            call_duration += this.duration_seconds >= 0 ? parseFloat(this.duration_seconds) : 0;

                            tab_data.push([
                                humanFullDate,
                                this.caller_id_number === this.caller_id_name ? this.caller_id_number || '(empty)' : this.caller_id_number + ' (' + this.caller_id_name+')',
                                this.callee_id_number === this.callee_id_name ? this.callee_id_number || this.to.substring(0, this.to.indexOf('@') != -1 ? this.to.indexOf('@') : this.to.length) || '(empty)' : this.callee_id_number + ' (' + this.callee_id_name+')',
                                duration || '-',
                                this.duration_seconds
                            ]);
                        }
                    });

                    call_duration = 'Total duration : ' + parse_duration(call_duration, 'verbose');

                    winkstart.table.user_cdr.fnAddData(tab_data);

                    $('.dataTables_scrollHeadInner, .dataTables_scrollHeadInner table').attr('style', 'width:100%');
                }
            );
        },

        setup_voicemail_table: function(parent) {
            var THIS = this,
                columns = [
                    {
                      'sTitle': '<input type="checkbox" id="select_all_voicemails"/>',
                      'sWidth': '40px',
                      'bSortable': false,
                      'fnRender': function(obj) {
                          var msg_uri = obj.aData[obj.iDataColumn];
                          return '<input type="checkbox" class="select-checkbox" msg_uri="'+ msg_uri  +'"/>';
                      }
                    },
                    {
                      'sTitle': 'Message Index',
                      'bSearchable': false,
                      'bVisible': false
                    },
                    {
                      'sTitle': 'Voicemail Box ID',
                      'bSearchable': false,
                      'bVisible': false
                    },
                    { 'sTitle': 'Date',
                      'sWidth': '220px'
                    },
                    {
                      'sTitle': 'Caller ID',
                      'sWidth': '150px'
                    },
                    { 'sTitle': 'Status',
                      'sWidth': '130px'
                    },
                    {
                      'sTitle': 'Listen',
                      'bSortable': false,
                      'sWidth': '200px',
                      'fnRender': function(obj) {
                          var msg_uri = obj.aData[obj.iDataColumn];
                          return '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="105" height="19">' +
                                 '<param name="quality" value="high" />' +
                                 '<param name="wmode" value="transparent">' +
                                 '<param name="menu" value="false" />' +
                                 '<embed src="whapps/userportal/portal_manager/assets/flash/xspf_player.swf?' +
                                 'player_mode=mini&skin_mode=on&song_url=' + THIS.voicemail_uri(msg_uri) +
                                 '&song_title=VM&autoload=1&bg_color=595959&txt_color=BCB5AB&button_color=BCB5AB"type="application/x-shockwave-flash" width="105" height="17"></embed>' +
                                 '</object><a style="position:relative; top: -10px;" href="' + THIS.voicemail_uri(msg_uri)  + '"><span class="icon medium download" alt="Download"/></a>';
                      }
                    }
                ];

            winkstart.table.create('voicemail', $('#voicemail-grid', parent), columns, {}, {
                sDom: '<"actions_voicemail">frtlip',
                sScrollY: '150px',
                aaSorting: [[3, 'desc']]
            });

            $.fn.dataTableExt.afnFiltering.pop();

            $('div.actions_voicemail', parent).html('<button id="new-voicemail-link" class="btn primary" data-action="new">Mark as New</button><button id="save-voicemail-link" class="btn success" data-action="saved">Mark as Saved</button><button id="delete-voicemail-link" class="btn danger" data-action="deleted">Delete</button>');

            $('#save-voicemail-link, #delete-voicemail-link, #new-voicemail-link', parent).click(function(e) {
                e.preventDefault();

                var vmboxes, action = $(this).dataset('action');
                if($('.select-checkbox:checked', parent).size()) {
                    var change_status = function() {
                        vmboxes = {};
                        $('.select-checkbox:checked', parent).each(function() {
                            var row = $(this).parents('tr')[0],
                                vmbox_id = winkstart.table.voicemail.fnGetData(row, 2);

                            vmboxes[vmbox_id] ? vmboxes[vmbox_id].push(row) : vmboxes[vmbox_id] = [row];
                        });

                        $.each(vmboxes, function(key, rows) {
                            THIS.get_vmbox(key, function(reply) {
                                var msg_index;

                                if(reply.data.messages == undefined) {
                                    return false;
                                }

                                $.each(rows, function(i, row) {
                                    msg_index = winkstart.table.voicemail.fnGetData(row, 1);

                                    if($.inArray(action, ['saved', 'deleted', 'new']) > -1) {
                                        reply.data.messages[msg_index].folder = action;
                                    }
                                });

                                THIS.update_vmbox(reply, function() {
                                    //TODO Redraw
                                    $.each(rows, function(i, row) {
                                        if($.inArray(action, ['saved', 'new']) > -1) {
                                            winkstart.table.voicemail.fnUpdate(action, row, 5);
                                        }
                                        else if(action == 'deleted') {
                                            winkstart.table.voicemail.fnDeleteRow(row);
                                        }
                                    });

                                    $('.select-checkbox, #select_all_voicemails', parent).prop('checked', false);
                                });
                            });
                        });
                    };

                    if(action === 'delete') {
                        winkstart.confirm('Are you sure that you want to delete the selected voicemail message(s)?', function() {
                            change_status();
                        });
                    }
                    else {
                        change_status();
                    }
                }
            });

            $('#select_all_voicemails', parent).change(function() {
                $('.select-checkbox', parent).prop('checked', $(this).is(':checked'));
            });

            THIS.get_vmbox_by_owner(winkstart.apps['userportal'].user_id, function(_data_list) {
                if(_data_list.data.length > 0) {
                    var vmbox_id = _data_list.data[0].id;
                    THIS.get_vmbox(vmbox_id, function(_data_vmbox) {
                        if(_data_vmbox.data.messages) {
                            var tab_messages = [];

                            $.each(_data_vmbox.data.messages, function(index, msg) {
                                if(this.folder != 'deleted') {
                                    var msg_id = msg.media_id,
                                        msg_uri = vmbox_id + '/messages/' + msg_id,
                                        date = new Date((msg.timestamp - 62167219200)*1000),
                                        month = date.getMonth() +1,
                                        year = (date.getFullYear())%100,
                                        day = date.getDate(),
                                        humanDate = month+'/'+day+'/'+year,
                                        humanTime = date.toLocaleTimeString(),
                                        humanFullDate = humanDate + ' ' + humanTime;

                                    humanFullDate = THIS.friendly_date(msg.timestamp);

                                    tab_messages.push(['0', index, vmbox_id, humanFullDate, msg.caller_id_number, msg.folder, msg_uri]);
                                }
                            });

                            winkstart.table.voicemail.fnAddData(tab_messages);

                            $('.dataTables_scrollHeadInner, .dataTables_scrollHeadInner table', parent).attr('style', 'width:100%');
                        }
                    });
                }
            });
        },

        voicemail_uri: function(msg_uri) {
            return winkstart.apps['userportal'].api_url + '/accounts/' +
                   winkstart.apps['userportal'].account_id + '/vmboxes/' +
                   msg_uri + '/raw?auth_token=' + winkstart.apps['userportal'].auth_token + '&folder=saved';
        },

        /* beginning copy and paste of device module */
        fix_codecs: function(data, data2) {
            //Comment it because we're currently hiding the codecs from the users.
            /*if(typeof data.media == 'object' && typeof data2.media == 'object') {
                (data.media.audio || {}).codecs = (data2.media.audio || {}).codecs;
                (data.media.video || {}).codecs = (data2.media.video || {}).codecs;
            }*/

            return data;
        },

        delete_device: function(data, success, error) {
            winkstart.request('user_device.delete', {
                    account_id: winkstart.apps['userportal'].account_id,
                    api_url: winkstart.apps['userportal'].api_url,
                    device_id: data.data.id,
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
        },

        save_device: function(form_data, data, success, error) {
            var THIS = this,
                id = (typeof data.data == 'object' && data.data.id) ? data.data.id : undefined,
                normalized_data = THIS.fix_codecs(THIS.normalize_data($.extend(true, {}, data.data, form_data)), form_data);

            if(id) {
                winkstart.request('user_device.update', {
                        account_id: winkstart.apps['userportal'].account_id,
                        api_url: winkstart.apps['userportal'].api_url,
                        device_id: id,
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
                winkstart.request('account_devices.list', {
                        account_id: winkstart.apps['userportal'].account_id,
                        api_url: winkstart.apps['userportal'].api_url
                    },
                    function(_data, status) {
                        var create_device = function() {
                            winkstart.request('user_device.create', {
                                    account_id: winkstart.apps['userportal'].account_id,
                                    api_url: winkstart.apps['userportal'].api_url,
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
                        };

                        if($.inArray(_data.data.length, winkstart.config.device_threshold || []) > -1) {
                            winkstart.alert('Your account has reached the limit of available devices. In order to add more devices, contact your administrator.');
                        }
                        else {
                            create_device();
                        }
                    }
                );
            }
        },

        edit_device: function(data, _parent, _target, _callbacks, data_defaults) {
            var THIS = this,
                parent = _parent || $('#device-content'),
                target = _target || $('#device-view', parent),
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                        THIS.edit_device({ id: _data.data.id }, parent, target, callbacks);
                    },

                    save_error: _callbacks.save_error || function(_data, status, type) {
                        if(status == 200 && type == 'mac_address') {
                            winkstart.alert('warning', 'This MAC Address is already in use, please verify that it is correct.');
                        }
                    },

                    delete_success: _callbacks.delete_success || function(_data) {
                        target.empty();
                    },

                    delete_error: _callbacks.delete_error,

                    after_render: _callbacks.after_render
                },
                defaults = {
                    data: $.extend(true, {
                        enabled: true,
                        owner_id: winkstart.apps['userportal'].user_id,
                        caller_id: {
                            external: {},
                            internal: {}
                        },
                        media: {
                            bypass_media: 'auto',
                            audio: {
                                codecs: ['PCMU', 'PCMA']
                            },
                            video: {
                                codecs: []
                            },
                            fax: {
                                option: 'auto'
                            }
                        },
                        sip: {
                            method: 'password',
                            invite_format: 'username',
                            username: 'user_' + winkstart.random_string(6),
                            password: winkstart.random_string(12),
                            expire_seconds: '360'
                        },
                        call_forward: {},
                        music_on_hold: {}
                    }, data_defaults || {}),

                    field_data: {
                        users: [],
                        sip: {
                            methods: {
                                'password': 'Password'
                            },
                            invite_formats: {
                                'username': 'Username',
                                'npan': 'NPA NXX XXXX',
                                'e164': 'E. 164'
                            }
                        },
                        media: {
                            bypass_media_options: {
                                'auto': 'Automatic',
                                'false': 'Always',
                                'true': 'Never'
                            },
                            fax: {
                                options: {
                                    'auto': 'Auto-detect',
                                    'true': 'Always Force',
                                    'false': 'Disabled'
                                }
                            },
                            audio: {
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
                            video: {
                                codecs: {
                                    'H261': 'H261',
                                    'H263': 'H263',
                                    'H264': 'H264'
                                }
                            }
                        },
                        hide_owner: true
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

            winkstart.request('portal_account.get', {
                    account_id: winkstart.apps['userportal'].account_id,
                    api_url: winkstart.apps['userportal'].api_url
                },
                function(_data, status) {
                    $.extend(defaults.field_data.sip, {
                        realm: _data.data.realm,
                    });

                    winkstart.request('portal_user.list', {
                            account_id: winkstart.apps['userportal'].account_id,
                            api_url: winkstart.apps['userportal'].api_url
                        },
                        function(_data, status) {
                            _data.data.unshift({
                                id: '',
                                first_name: '- No',
                                last_name: 'owner -',
                            });

                            defaults.field_data.users = _data.data;

                            winkstart.request('portal_media.list', {
                                    account_id: winkstart.apps['userportal'].account_id,
                                    api_url: winkstart.apps['userportal'].api_url
                                },
                                function(_data, status) {
                                    _data.data.unshift({
                                        id: '',
                                        name: '- Not set -'
                                    });

                                    defaults.field_data.music_on_hold = _data.data;

                                    if(typeof data == 'object' && data.id) {
                                        winkstart.request('user_device.get', {
                                                account_id: winkstart.apps['userportal'].account_id,
                                                api_url: winkstart.apps['userportal'].api_url,
                                                device_id: data.id
                                            },
                                            function(_data, status) {
                                                var render_data;
                                                defaults.data.device_type = 'sip_device';

                                                THIS.migrate_data(_data);

                                                render_data = $.extend(true, defaults, _data);

                                                render_data.data = THIS.fix_codecs(render_data.data, _data.data);

                                                THIS.render_device(render_data, target, callbacks);

                                                if(typeof callbacks.after_render == 'function') {
                                                    callbacks.after_render();
                                                }
                                            }
                                        );
                                    }
                                    else {
                                        THIS.render_device(defaults, target, callbacks);

                                        if(typeof callbacks.after_render == 'function') {
                                            callbacks.after_render();
                                        }
                                    }
                                }
                            );
                        }
                    );
                }
            );
        },

        render_device: function(data, target, callbacks){
            var THIS = this,
                device_html,
                render;

            if(typeof data.data == 'object' && data.data.device_type) {
                device_html = THIS.templates[data.data.device_type].tmpl(data);

                /* Do device type specific things here */
                if($.inArray(data.data.device_type, ['softphone', 'sip_device']) > -1) {
                    device_html.delegate('#sip_password[type="password"]', 'focus', function() {
                        var value = $(this).val();
                        $('<input id="sip_password" name="sip.password" type="text"/>').insertBefore($(this)).val(value).focus();
                        $(this).remove();
                    });

                    device_html.delegate('#sip_password[type="text"]', 'blur', function(ev) {
                        var value;
                        if($(this).attr('removing') != 'true') {
                            $(this).attr('removing', 'true');
                            value = $(this).val();
                            $('<input id="sip_password" name="sip.password" type="password"/>').insertBefore($(this)).val(value);
                            $(this).remove();
                        }
                    });
                }

                winkstart.validate.set(THIS.config.validation_device[data.data.device_type], device_html);

                if(!$('#owner_id', device_html).val()) {
                    $('#edit_link', device_html).hide();
                }

                $('#owner_id', device_html).change(function() {
                    !$('#owner_id option:selected', device_html).val() ? $('#edit_link', device_html).hide() : $('#edit_link', device_html).show();
                });

                $('.inline_action', device_html).click(function(ev) {
                    var _data = ($(this).dataset('action') == 'edit') ? { id: $('#owner_id', device_html).val() } : {},
                        _id = _data.id;

                    ev.preventDefault();

                    winkstart.publish('user.popup_edit', _data, function(_data) {
                        /* Create */
                        if(!_id) {
                            $('#owner_id', device_html).append('<option id="'+ _data.data.id  +'" value="' + _data.data.id +'">'+ _data.data.first_name + ' ' + _data.data.last_name  +'</option>');
                            $('#owner_id', device_html).val(_data.data.id);
                            $('#edit_link', device_html).show();
                        }
                        else {
                            /* Update */
                            if('id' in _data.data) {
                                $('#owner_id #'+_data.data.id, device_html).text(_data.data.first_name + ' ' + _data.data.last_name);
                            }
                            /* Delete */
                            else {
                                $('#owner_id #'+_id, device_html).remove();
                                $('#edit_link', device_html).hide();
                            }
                        }
                    });
                });

                $('.device-save', device_html).click(function(ev) {
                    ev.preventDefault();

                    winkstart.validate.is_valid(THIS.config.validation_device[data.data.device_type], device_html, function() {
                            var form_data = form2object('device-form');

                            THIS.clean_form_data(form_data);

                            if('field_data' in data) {
                                delete data.field_data;
                            }

                            THIS.save_device(form_data, data, callbacks.save_success, winkstart.error_message.process_error(callbacks.save_error));
                        },
                        function() {
                            winkstart.alert('There were errors on the form, please correct!');
                        }
                    );
                });

                $('.device-delete', device_html).click(function(ev) {
                    ev.preventDefault();

                    winkstart.confirm('Are you sure you want to delete this device?', function() {
                        THIS.delete_device(data, callbacks.delete_success, callbacks.delete_error);
                    });
                });

                if(!$('#music_on_hold_media_id', device_html).val()) {
                    $('#edit_link_media', device_html).hide();
                }

                $('#music_on_hold_media_id', device_html).change(function() {
                    !$('#music_on_hold_media_id option:selected', device_html).val() ? $('#edit_link_media', device_html).hide() : $('#edit_link_media', device_html).show();
                });

                $('.inline_action_media', device_html).click(function(ev) {
                    var _data = ($(this).dataset('action') == 'edit') ? { id: $('#music_on_hold_media_id', device_html).val() } : {},
                        _id = _data.id;

                    ev.preventDefault();

                    winkstart.publish('media.popup_edit', _data, function(_data) {
                        /* Create */
                        if(!_id) {
                            $('#music_on_hold_media_id', device_html).append('<option id="'+ _data.data.id  +'" value="'+ _data.data.id +'">'+ _data.data.name +'</option>');
                            $('#music_on_hold_media_id', device_html).val(_data.data.id);

                            $('#edit_link_media', device_html).show();
                        }
                        else {
                            /* Update */
                            if('id' in _data.data) {
                                $('#music_on_hold_media_id #'+_data.data.id, device_html).text(_data.data.name);
                            }
                            /* Delete */
                            else {
                                $('#music_on_hold_media_id #'+_id, device_html).remove();
                                $('#edit_link_media', device_html).hide();
                            }
                        }
                    });
                });
            }
            else {
                device_html = THIS.templates.general_edit.tmpl();

                $('.media_pane', device_html).hide();
                $('.media_tabs .buttons', device_html).click(function() {
                    $('.media_pane', device_html).show();

                    if(!$(this).hasClass('current')) {
                        $('.media_tabs .buttons').removeClass('current');
                        $(this).addClass('current');

                        data.data.device_type = $(this).attr('device_type');

                        THIS.format_data(data);

                        THIS.render_device(data, $('.media_pane', device_html), callbacks);
                    }
                });
            }

            $('*[rel=popover]:not([type="text"])', device_html).popover({
                trigger: 'hover'
            });

            $('*[rel=popover][type="text"]', device_html).popover({
                trigger: 'focus'
            });

            winkstart.tabs($('.view-buttons', device_html), $('.tabs', device_html));

            /* Awesome sauce for provisioning goodness */
            render = function() {
                (target)
                    .empty()
                    .append(device_html);
            };

            if(typeof data.data == 'object' && data.data.device_type == 'sip_device') {
                if(winkstart.publish('phone.render_fields', $('.provisioner', device_html), data.data.provision || (data.data.provision = {}), render)) {
                    render();
                }
            }
            else {
                render();

                $('.media_tabs .buttons[device_type="sip_device"]', device_html).trigger('click');
            }
        },

        format_data: function(data) {
            if($.inArray(data.data.device_type, ['cellphone', 'smartphone', 'landline']) > -1) {
                data.data.call_forward = {
                    enabled: true,
                    require_keypress: true,
                    keep_caller_id: true
                };
            }
            else {
                data.data.call_forward = {
                    enabled: false
                };
            }
        },

        migrate_data: function(data) {
            if(typeof data.data.caller_id == 'object') {
                if('default' in data.data.caller_id) {
                    data.data.caller_id.external = data.data.caller_id['default'];
                    delete data.data.caller_id['default'];
                }

                if('emergency' in data.data.caller_id) {
                    data.data.caller_id.internal = data.data.caller_id.emergency;
                    delete data.data.caller_id.emergency;
                }
            }

            if(data.data.device_type == 'cell_phone') {
                data.data.device_type = 'cellphone';
            }

            if(typeof data.data.media == 'object' && typeof data.data.media.fax == 'object' && 'codecs' in data.data.media.fax) {
                delete data.data.media.fax.codecs;
            }

            if('realm' in data.data.sip) {
                delete data.data.sip.realm;
            }

            if('status' in data.data) {
                data.data.enabled = data.data.status;
                delete data.data.status;
            }

            return data;
        },

        normalize_data: function(data) {
            if('caller_id' in data) {
                if(data.caller_id.internal && data.caller_id.internal.number == '' && data.caller_id.internal.name == '') {
                    delete data.caller_id.internal;
                }

                if(data.caller_id.external && data.caller_id.external.number == '' && data.caller_id.external.name == '') {
                    delete data.caller_id.external;
                }
            }

            if(!data.music_on_hold.media_id) {
                delete data.music_on_hold.media_id;
            }

            if(!data.owner_id) {
                delete data.owner_id;
            }

            if($.isEmptyObject(data.call_forward)) {
                delete data.call_forward;
            }

            if(!data.mac_address) {
                delete data.mac_address;
            }

            return data;
        },

        clean_form_data: function(form_data) {
            if(form_data.mac_address) {
                form_data.mac_address = form_data.mac_address.toLowerCase();

                if(form_data.mac_address.match(/^(((\d|([a-f]|[A-F])){2}-){5}(\d|([a-f]|[A-F])){2})$/)) {
                    form_data.mac_address = form_data.mac_address.replace(/-/g,':');
                }
                else if(form_data.mac_address.match(/^(((\d|([a-f]|[A-F])){2}){5}(\d|([a-f]|[A-F])){2})$/)) {
                    form_data.mac_address = form_data.mac_address.replace(/(.{2})/g,'$1:').slice(0, -1);
                }
            }

            if(form_data.caller_id) {
                form_data.caller_id.internal.number = form_data.caller_id.internal.number.replace(/\s|\(|\)|\-|\./g,'');
                form_data.caller_id.external.number = form_data.caller_id.external.number.replace(/\s|\(|\)|\-|\./g,'');
            }

            if(form_data.media.audio) {
                form_data.media.audio.codecs = $.map(form_data.media.audio.codecs, function(val) { return (val) ? val : null });
            }

            if(form_data.media.video) {
                form_data.media.video.codecs = $.map(form_data.media.video.codecs, function(val) { return (val) ? val : null });
            }

            if($.inArray(form_data.device_type, ['cellphone', 'smartphone', 'landline']) > -1) {
                form_data.call_forward.number = form_data.call_forward.number.replace(/\s|\(|\)|\-|\./g,'');
                form_data.enabled = form_data.call_forward.enabled;
            }

            if(form_data.extra.notify_unregister === true) {
                form_data.suppress_unregister_notifications = false;
            }
            else {
                form_data.suppress_unregister_notifications = true;
            }

            delete form_data.extra;

            return form_data;
        },

        popup_edit_device: function(data, callback, data_defaults) {
            var THIS = this,
                popup,
                popup_html;

            popup_html = $('<div class="inline_popup userportal_device"><div class="inline_content main_content"/></div>');

            THIS.edit_device(data, popup_html, $('.inline_content', popup_html), {
                save_success: function(_data) {
                    popup.dialog('close');

                    if(typeof callback == 'function') {
                        callback(_data);
                    }
                },
                delete_success: function(_data) {
                    popup.dialog('close');

                    if(typeof callback == 'function') {
                        callback({ data: {} });
                    }
                },
                after_render: function() {
                    popup = winkstart.dialog(popup_html, {
                        title: (data.id) ? 'Edit Device' : 'Create Device'
                    });
                }
            }, data_defaults);
        }
    }
);
