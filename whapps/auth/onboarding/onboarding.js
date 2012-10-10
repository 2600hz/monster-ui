winkstart.module('auth', 'onboarding', {
        css: [
            'css/onboarding.css'
        ],

        templates: {
            new_onboarding: 'tmpl/onboarding.html',
            step1: 'tmpl/step1.html',
            step2: 'tmpl/step2.html',
            step3: 'tmpl/step3.html',
            small_office: 'tmpl/small_office.html',
            reseller: 'tmpl/reseller.html'
        },

        subscribe: {
            'nav.get_started': 'render_onboarding',
            'onboard.register': 'render_onboarding',
            'onboard.error_handling': 'error_handling'
        },

        validation: {
            //phone_number
            step1: [
                { name: '#e911_street_address',     regex: /^.+$/ },
                { name: '#e911_extended_address',   regex: /^.*$/ },
                { name: '#e911_region',             regex: /^[a-zA-Z\_\-\s]+$/ },
                { name: '#e911_locality',           regex: /^[a-zA-Z\_\-\s]+$/ },
                { name: '#e911_country',            regex: /^[a-zA-Z\_\-\s]+$/ },
                { name: '#e911_postal_code',        regex: /^[0-9\-]{4,10}$/ }
            ],
            //braintree
            step2: [
                { name: '#cardholder_name',  regex: /^[a-zA-Z\s\-\']+$/ },
                { name: '#card_number',      regex: /^[0-9\s\-]{10,22}$/ },
                { name: '#cvv',              regex: /^[0-9]{2,6}$/ },
                { name: '#street_address',   regex: /^.+$/ },
                { name: '#extended_address', regex: /^.*/ },
                { name: '#region',           regex: /^[a-zA-Z0-9\_\-\.\s]+$/ },
                { name: '#locality',         regex: /^[a-zA-Z0-9\_\-\.\s]+$/ },
                { name: '#country',          regex: /^[a-zA-Z\_\-\s]+$/ },
                { name: '#postal_code',      regex: /^[0-9\-]{4,10}$/ }
            ],
            //account
            step3: [
                { name: '#password',         regex: /^.{3,16}$/ },
                { name: '#verify_password',  regex: /^.{3,16}$/ },
                { name: '#email',            regex: /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/ },
                { name: '#verify_email',     regex: /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/ },
                { name: '#company_name',     regex: /^.*$/ },
                { name: '#name',             regex: /^.*$/ }
            ],
        },

        resources: {
            'onboard.create': {
                url: '{api_url}/onboard',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'phone_number.get': {
                url: '{api_url}/phone_numbers?prefix={prefix}&quantity={quantity}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'phone_number.create': {
                url: '{api_url}/accounts/{account_id}/phone_numbers/{number}/activate',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'phone_number.update': {
                url: '{api_url}/accounts/{account_id}/phone_numbers/{number}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'braintree.create': {
                url: '{api_url}/accounts/{account_id}/braintree/customer',
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
        error_handling: function(data, number) {
            var THIS = this,
                wrapper = $('#onboarding-view'),
                formated_data = winkstart.print_r(data),
                msg = 'Errors: ',
                errors = data.data.errors;

            $.each(errors, function(key, v) {
                if(key == 'braintree') {
                    msg += errors.braintree.data.api_error.message;
                }
                if(key == 'phone_numbers') {
                    if(errors.phone_numbers[number].data.provider_fault) {
                        msg += 'Incorrect address';
                    }
                    if(errors.phone_numbers[number].data.carrier_fault) {
                        msg += 'Number already used! Please select another one.'
                    }
                    
                }
            });

            winkstart.alert('error', {
                'text': msg,
                data: formated_data
            });     
        },

        parse_username: function(username) {
            var response = {
                    first_name : '',
                    last_name : ''
                },
                index = username.indexOf(' ');

            response.first_name = username.substring(0, index);
            response.last_name = username.substring(index+1);
            if(response.first_name == '') {
                response.first_name = response.last_name;
                response.last_name = '';
            }

            return response;
        },

        //Transform the data from the form2object method to the data object expected by the onboarding API
        clean_form_data: function(form_data, target) {
            var THIS = this,
                number = form_data.extra.number,
                credentials = $.md5(form_data.extra.email + ':' + form_data.extra.password),
                username = THIS.parse_username(form_data.extra.name),
                cardholder_name = THIS.parse_username(form_data.braintree.credit_card.cardholder_name),
                extension;

            if(form_data.extra.braintree_country_other != '') {
                form_data.braintree.credit_card.billing_address.country = form_data.extra.braintree_country_other;
            }

            if(form_data.extra.e911_country_other != '') {
                form_data.e911.country = form_data.extra.e911_country_other;
            }

            form_data.braintree.credit_card.number = form_data.braintree.credit_card.number.replace(/\s\-/g,'');

            form_data.braintree.credit_card.expiration_date = form_data.extra.expiration_month + '/' + form_data.extra.expiration_year;

            /* Adding default fields for Braintree */
            form_data.braintree.first_name = cardholder_name.first_name;
            form_data.braintree.last_name = cardholder_name.last_name;
            form_data.braintree.credit_card.make_default = true;
            form_data.braintree.credit_card.billing_address.first_name = cardholder_name.first_name;
            form_data.braintree.credit_card.billing_address.last_name = cardholder_name.last_name;
            form_data.braintree.email = form_data.extra.email;
            form_data.braintree.company = form_data.account.name;

            //form2object fails to get radio values so here is a quick hack.
            form_data.account.role = $('input:radio[name=account.role]:checked', target).val();

            form_data.extensions = [
                {
                    user: {
                        credentials: credentials,
                        priv_level: 'admin',
                        first_name: username.first_name,
                        last_name: username.last_name,
                        email: form_data.extra.email,
                        apps: winkstart.config.onboard_roles ? winkstart.config.onboard_roles[form_data.account.role || 'default'].apps : winkstart.config.register_apps
                    },
                    callflow: {
                        numbers: [ number ]
                    }
                }
            ]

            if(form_data.account.role == 'api_developer' || form_data.account.role == 'voip_minutes') {
                delete form_data.extensions[0].callflow;
            }

            if(form_data.account.role == 'small_office' || form_data.account.role == 'reseller') {
                extension = $('#extension_1', target).val();
                form_data.extensions[0].callflow.numbers.push(extension);

                for(i=2; i<6; i++) {
                    username = THIS.parse_username($('#name_'+i, target).val());
                    extension = $('#extension_'+i, target).val();
                    if(username.first_name){
                        var user = {
                            user: {
                                first_name: username.first_name,
                                last_name: username.last_name,
                                priv_level: 'user'
                            },
                            callflow: {
                                numbers: [ extension ]
                            }
                        }
                        form_data.extensions.push(user);
                    }
                }
            }

            form_data.account.caller_id = {
                'default': {
                    number: number
                },
                emergency: {
                    number: number
                }
            };

            form_data.account.available_apps = winkstart.config.onboard_roles ? winkstart.config.onboard_roles[form_data.account.role || 'default'].available_apps : [];
            form_data.account.default_api_url = winkstart.config.onboard_roles ? winkstart.config.onboard_roles[form_data.account.role || 'default'].default_api_url : '' ;

            form_data.phone_numbers = {};
            form_data.phone_numbers[number] = { dash_e911: form_data.e911 };

            delete form_data.e911;
            delete form_data.field_data;
            delete form_data.extra;

            return form_data;
        },

        load_step1: function(data, parent) {
            var THIS = this,
                current_step = 1,
                area_code = '',
                number = '',
                prev_area_code,
                quantity = 15,
                nb_result,
                random = 0,
                prev_random,
                list_number,
                onboard_html = parent;

            $('.pick_number_right', onboard_html).hide();
            $('#e911_block', onboard_html).hide();
            $('#e911_country_block', onboard_html).hide();
            $('#e911_country', onboard_html).attr('disabled','disabled');

            $('#change_number, #change_number_link', onboard_html).click(function(ev) {
                ev.preventDefault();
                area_code = $('#area_code', onboard_html).val();
                $('#e911_block', onboard_html).hide();
                $('.pick_number_right', onboard_html).hide();
                $('.pick_number_left', onboard_html).css('float', 'none');

                if(area_code.match(/[0-9]{3}/)) {
                    var display_fields = function() {
                        $('.pick_number_left', onboard_html).css('float', 'left');
                        $('.pick_number_right', onboard_html).show();
                        $('#e911_block', onboard_html).show();
                        $('#e911_postal_code', onboard_html).focus();
                    };

                    //If the list of number is empty or the area code changed, then re-run the request.
                    if(!list_number || prev_area_code != area_code) {
                        winkstart.request(true, 'phone_number.get', {
                                api_url: winkstart.apps['auth'].api_url,
                                prefix: area_code,
                                quantity: quantity
                            },
                            function(_data, status) {
                                if(_data.data.length > 0) {
                                    nb_result = _data.data.length;
                                    list_number = _data.data;
                                    prev_random = 0;
                                    random = Math.floor(Math.random()*nb_result);
                                    prev_area_code = area_code;
                                    number = list_number[random];
                                    $('.pick_number_left', onboard_html).css('float', 'left');
                                    $('#picked_number', onboard_html).attr('data-number', number);
                                    $('#picked_number', onboard_html).show()
                                                                     .html(number.replace(/(\+1)([0-9]{3})([0-9]{3})([0-9]{4})/, '$1 ($2) $3-$4'));
                                    display_fields();
                                }
                                else {
                                    winkstart.alert('error','No DIDs were found with this Area Code, please try again or change the Area Code');
                                }
                            }
                        );
                    }
                    else {
                        if(nb_result > 1) {
                            random = Math.floor(Math.random()*nb_result);
                            random == prev_random ? (random != 0 ? random-- : random++) : true;
                            prev_random = random;
                            number = list_number[random];
                            $('#picked_number', onboard_html).attr('data-number', number);
                            $('#picked_number', onboard_html).show()
                                                             .html(number.replace(/(\+1)([0-9]{3})([0-9]{3})([0-9]{4})/, '$1 ($2) $3-$4'));
                            display_fields();
                        }
                        else {
                            winkstart.alert('This number is the only number available for this Area Code at the moment');
                        }
                    }
                }
                else {
                    winkstart.alert('You need to input a valid area code (eg: 415, 508, ...)');
                }
            });

            $('#e911_country', onboard_html).change(function() {
                if($(this).val() == 'Other') {
                   $('#e911_country_block', onboard_html).show();
                }
                else {
                   $('#e911_country_block', onboard_html).hide();
                }
            });

            $('#e911_postal_code', onboard_html).blur(function() {
                if($('#e911_country', onboard_html).val() != 'Other' && $(this).val() != '') {
                    $.getJSON('http://www.geonames.org/postalCodeLookupJSON?&country='+$('#e911_country', onboard_html).val()+'&callback=?', { postalcode: $(this).val() }, function(response) {
                        if (response && response.postalcodes.length && response.postalcodes[0].placeName) {
                            $('#e911_locality', onboard_html).val(response.postalcodes[0].placeName);
                            $('#e911_region', onboard_html).val(response.postalcodes[0].adminName1);
                        }
                    });
                }
            });
        },

        load_step2: function(data, parent) {
            var THIS = this,
                current_step = 2,
                onboard_html = parent;

            $('#country', onboard_html).attr('disabled','disabled');
            $('#billing_country_text', onboard_html).hide();

            $('#country', onboard_html).change(function() {
                $(this).val() === 'Other' ? $('#billing_country_text', onboard_html).show() : $('#billing_country_text', onboard_html).hide();
            });

            $('.cvv_help_icon', onboard_html).hover(
                function() {
                    $('.cvv_help', onboard_html).show();
                    $('.credit_card_help', onboard_html).hide();
                },
                function() {
                    $('.cvv_help', onboard_html).hide();
                    $('.credit_card_help', onboard_html).show();
                }
            );

            //Code in order to automatically fill State and City based on the Postal Code
            $('#postal_code', onboard_html).blur(function() {
                if($('#country', onboard_html).val() != 'Other' && $(this).val() != '') {
                    $.getJSON('http://www.geonames.org/postalCodeLookupJSON?&country='+$('#country', onboard_html).val()+'&callback=?', { postalcode: $(this).val() }, function(response) {
                        if (response && response.postalcodes.length && response.postalcodes[0].placeName) {
                            $('#locality', onboard_html).val(response.postalcodes[0].placeName);
                            $('#region', onboard_html).val(response.postalcodes[0].adminName1);
                        }
                    });
                }
            });

            $('#use_e911', onboard_html).change(function() {
                if($(this).is(':checked')) {
                    $('#street_address', onboard_html).val($('#e911_street_address', onboard_html).val());
                    $('#extended_address', onboard_html).val($('#e911_extended_address', onboard_html).val());
                    $('#country', onboard_html).val($('#e911_country', onboard_html).val());
                    $('#region', onboard_html).val($('#e911_region', onboard_html).val());
                    $('#locality', onboard_html).val($('#e911_locality', onboard_html).val());
                    $('#postal_code', onboard_html).val($('#e911_postal_code', onboard_html).val());
                }
                else {
                    $('#street_address', onboard_html).val('');
                    $('#extended_address', onboard_html).val('');
                    $('#region', onboard_html).val('');
                    $('#locality', onboard_html).val('');
                    $('#postal_code', onboard_html).val('');
                    $('#country', onboard_html).val('US');
                }
            });
        },

        load_step3: function(data, parent) {
            var THIS = this,
                current_step = 3,
                onboard_html = parent,
                same = function(arr) {
                    var e1 = arr[0],
                        e2 = arr[1],
                        valid = function() {
                            if(e1.val() != e2.val()) {
                                e2.parent('.validated')
                                    .removeClass('valid')
                                    .addClass('invalid');
                            } else {
                                e2.parent('.validated').removeClass('invalid');
                            }
                        };

                    e1.bind('keyup blur onchange', function() {
                        valid();
                    });

                    e2.bind('keyup blur onchange', function() {
                        valid();
                    });
                };

            same([$('#email', onboard_html), $('#verify_email', onboard_html)]);
            same([$('#password', onboard_html), $('#verify_password', onboard_html)]);

            $('#name', onboard_html).bind('keyup blur onchange', function() {
                $('.your_extension', onboard_html).text($(this).val());
            });

            $('.role_radio', onboard_html).click(function() {
                var role = $('input:radio[name=account.role]:checked').val(),
                    $container = $(this).parents('.role_div').first(),
                    tmpl_data = {};

                $('.role_content').slideUp().empty();

                if(role in THIS.templates) {
                    if(role === 'small_office' || role === 'reseller') {
                        tmpl_data.username = $('#name', onboard_html).val();
                    }
                    $('.role_content', $container).hide().append(THIS.templates[role].tmpl(tmpl_data)).slideDown();
                }
            });
        },

        move_to_step: function(step_number, parent, error) {
            var $form = $('#fast_onboarding_form', parent),
                max_step = parseFloat($form.dataset('maxstep'));

            $form.attr('data-step', step_number);

            /* Manage display of buttons */
            $('.step_buttons > button', parent).hide();

            if(error) {
                $('.onboarding_title', parent).empty().html(error);
                $('.steps_nav', parent).hide();
                $('#save_account', parent).show();
            }
            else {
                step_number === max_step ? $('#save_account', parent).show() : $('.next_step', parent).show();

                if(step_number > 1) {
                    $('.prev_step', parent).show();
                }

                /* Highlight current step title */
                $('.step_title').removeClass('current');
                $('#step_title_'+step_number, parent).addClass('current');
            }

            /* Show the right template */
            $('.step_content', parent).hide();

            $('#step'+ step_number, parent).show();

            switch(step_number) {
                case 1: $('#area_code', parent).focus();
                case 2: $('#cardholder_name', parent).focus();
                case 3: $('#name', parent).focus();
            }

            $('html, body').scrollTop(0);
        },

        load_step: function(step, parent, data) {
            var THIS = this;

            $('#fast_onboarding_form', parent).append(THIS.templates['step'+step].tmpl({}));

            switch(step) {
                case 1: THIS.load_step1(data, parent);
                        break;

                case 2: THIS.load_step2(data, parent);
                        break;

                case 3: THIS.load_step3(data, parent);
                        break;
            }
        },

        render_onboarding: function(args) {
            var THIS = this,
                onboard_html = THIS.templates.new_onboarding.tmpl({}),
                $form = $('#fast_onboarding_form', onboard_html),
                max_step = $form.dataset('max-step'),
                current_step = 1;

            THIS.load_step(1, onboard_html);
            THIS.load_step(2, onboard_html);
            THIS.load_step(3, onboard_html);

            THIS.move_to_step(current_step, onboard_html);

            /* Initialize validation for each step */
            $.each(THIS.config.validation, function() {
                winkstart.validate.set(this, onboard_html);
            });

            $('.next_step', onboard_html).click(function() {
                var next_step_fct = function() {
                    winkstart.validate.is_valid(THIS.config.validation['step'+current_step], onboard_html, function() {
                            THIS.move_to_step(++current_step, onboard_html);
                        },
                        function() {
                            winkstart.alert('You can\'t go to the next step because you inputted invalid values in the form.');
                        }
                    );
                };

                switch(current_step) {
                    case 1:
                        if($('#picked_number', onboard_html).attr('data-number').replace(/\-\+\(\)\s/g,'').match(/[0-9]{10}/)) {
                            next_step_fct();
                        }
                        else {
                            winkstart.alert('You need to give an area code and click on the Generate number button before going to next step.');
                            $('#area_code', onboard_html).focus();
                        }
                        break;

                    default:
                        next_step_fct();
                        break;
                }
            });

            $('.prev_step', onboard_html).click(function() {
                THIS.move_to_step(--current_step, onboard_html);
            });

            $('#save_account', onboard_html).click(function() {
                if($('#password', onboard_html).val() != $('#verify_password', onboard_html).val()) {
                    winkstart.alert('Passwords are not matching, please retype your password.' );
                    $('#password', onboard_html).val('');
                    $('#verify_password', onboard_html).val('');

                    //Display Validation Error next to password fields
                    winkstart.validate.is_valid(THIS.config.validation['step3'], onboard_html, function() {}, function() {});
                    return true;
                }
                if($('#email', onboard_html).val() != $('#verify_email', onboard_html).val()) {
                    winkstart.alert('Email addresses are not matching, please retype your email address.' );
                    $('#email', onboard_html).val('');
                    $('#verify_email', onboard_html).val('');

                    //Display Validation Error next to email fields
                    winkstart.validate.is_valid(THIS.config.validation['step3'], onboard_html, function() {}, function() {});
                    return true;
                }

                winkstart.validate.is_valid(THIS.config.validation['step3'], onboard_html, function() {
                        $('html, body').scrollTop(0);

                        var form_data = form2object('fast_onboarding_form');

                        number = $('#picked_number', onboard_html).dataset('number');
                        form_data.extra.number = number;

                        THIS.clean_form_data(form_data, onboard_html);

                        form_data.invite_code = args.invite_code;

                        winkstart.request(true, 'onboard.create', {
                                api_url: winkstart.apps['auth'].api_url,
                                data: form_data
                            },
                            function (_data, status) {
                                var callbacks = [],
                                    callback_fn;

                                if(_data && _data.data.owner_id && _data.data.account_id && _data.data.auth_token) {

                                    var success = function() {
                                        $('#ws-content').empty();
                                        winkstart.apps['auth'].user_id = _data.data.owner_id;
                                        winkstart.apps['auth'].account_id = _data.data.account_id;
                                        winkstart.apps['auth'].auth_token = _data.data.auth_token;

                                        $.cookie('c_winkstart_auth', JSON.stringify(winkstart.apps['auth']));

                                        winkstart.publish('auth.load_account');
                                    };

                                    success();
                                }
                                else {
                                    winkstart.alert('error', 'Error while creating your account, please verify information and try again.');
                                }
                            },
                            function (_data, status) {
                                _data.data.errors = _data.data.errors || {};

                                winkstart.publish('onboard.error_handling', _data, number);

                                current_step = 1;
                                THIS.move_to_step(1, onboard_html);
                            }
                        );
                    },
                    function() {
                        winkstart.alert('You can\'t finish the setup because you inputted invalid values in the form.');
                    }
                );
            });

            $('#ws-content')
                .empty()
                .append(onboard_html);
        }
    }
);

