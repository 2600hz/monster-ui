winkstart.module('myaccount', 'profile', {
        css: [
           'css/profile.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           profile: 'tmpl/profile.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.profile.render': 'render'
        },

        resources: {
            'profile.user_get': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'profile.user_update': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'profile.account_get': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'profile.account_update': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'profile.billing_get': {
                url: '{api_url}/accounts/{account_id}/braintree/customer',
                contentType: 'application/json',
                verb: 'GET'
            },
            'profile.billing_update': {
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
        update_data: function(type, data, new_data, success, error) {
            var params = {
                account_id: winkstart.apps['myaccount'].account_id,
                api_url: winkstart.apps['myaccount'].api_url,
                data: $.extend(true, {}, data, new_data)
            };

            if(type === 'user') {
                params.user_id = winkstart.apps['myaccount'].user_id;
            }
            else if(type === 'billing') {
                params.data = new_data;
            }

            winkstart.request('profile.'+type+'_update', params,
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
        },

        format_data: function(data) {
            if('billing' in data) {
                data.billing.credit_card = data.billing.credit_cards[0] || {};

                /* If There is a credit card stored, we fill the fields with * */
                if(data.billing.credit_card.last_four) {
                    data.billing.credit_card.fake_number = '************'+data.billing.credit_card.last_four;
                    data.billing.credit_card.fake_cvv = '***';
                    data.billing.credit_card.type = data.billing.credit_card.card_type.toLowerCase();
                }
            }

            console.log(data);

            return data;
        },

        clean_form_data: function(module, data) {
            console.log(data);
            if(module === 'billing') {
                data.credit_card.expiration_date = data.extra.expiration_date.month + '/' + data.extra.expiration_date.year;
            }

            delete data.extra;

            return data;
        },

        bind_events_profile: function(parent, data) {
            var THIS = this,
                $profile_html = parent;

            var $li_settings = $('li.settings-item', $profile_html),
                $li_content = $('.settings-item-content', $li_settings),
                $a_settings = $('a.settings-link', $li_settings),
                $uneditable = $('.uneditable', $li_settings),
                $editable = $('.edition', $li_settings),
                close_content = function() {
                    $li_settings.removeClass('open');
                    $li_content.hide();
                    $a_settings.show();

                    $uneditable.show();
                    $editable.hide();
                },
                success_updating = function(key, parent) {
                    $profile_html = parent;
                    var $link = $('a[data-name='+key+']', $profile_html);

                    if(key === 'credit_card') {
                        $('.edition', $profile_html).hide();
                        $('.uneditable', $profile_html).show();
                    }

                    $('.update', $link).hide();
                    $('.changes-saved', $link).show()
                                              .fadeOut(1500, function() {
                                                  $('.update', $link).fadeIn(500);
                                              });

                    $link.css('background-color', '#22ccff')
                           .animate({
                            backgroundColor: '#f6f6f6'
                        }, 2000
                    );

                    $li_content.hide();
                    $a_settings.show();
                },
                settings_validate = function(field_name, data_form, callback_success, callback_error) {
                    var validate = true,
                        error = false;

                    if(field_name === 'password') {
                        if(!(data_form.password === data_form.confirm_password)) {
                            error = i18n.t('myaccount.profile.passwords_not_matching');
                        }
                        else if(!winkstart.is_password_valid(data_form.password)) {
                            /* No need to display error since the password mechanism already does that for us */
                            validate = false;
                        }
                    }

                    if(error && typeof callback_error === 'function') {
                        callback_error(error);
                    }
                    else if(validate === true && error === false && typeof callback_success === 'function') {
                        callback_success();
                    }
                },
                get_card_type = function(number) {
                    var reg_visa = new RegExp('^4[0-9]{12}(?:[0-9]{3})?$'),
                        reg_mastercard = new RegExp('^5[1-5][0-9]{14}$'),
                        reg_amex = new RegExp('^3[47][0-9]{13}$'),
                        reg_discover = new RegExp('^6(?:011|5[0-9]{2})[0-9]{12}$');
                        //regDiners = new RegExp('^3(?:0[0-5]|[68][0-9])[0-9]{11}$'),
                        //regJSB= new RegExp('^(?:2131|1800|35\\d{3})\\d{11}$');


                    if(reg_visa.test(number))
                        return 'visa';
                    if (reg_mastercard.test(number))
                        return 'mastercard';
                    if (reg_amex.test(number))
                        return 'amex';
                    if (reg_discover.test(number))
                        return 'discover';
                    /*if (reg_diners.test(number))
                        return 'DINERS';
                    if (reg_JSB.test(number))
                        return 'JSB';*/
                   return false;
                };

            $('.change', $profile_html).on('click', function(e) {
                e.preventDefault();

                var $this = $(this),
                    module = $this.data('module'),
                    field_name = $this.data('field'),
                    new_data = THIS.clean_form_data(module, form2object('form_'+field_name));

                settings_validate(field_name, new_data, function() {
                        THIS.update_data(module, data[module], new_data,
                            function(data) {
                                winkstart.publish('myaccount.profile.render', function(parent) {
                                    success_updating(field_name, parent);

                                    if(typeof callback_update === 'function') {
                                        callback_update();
                                    }
                                }, module);
                            },
                            function(data) {
                                if(data && data.data && 'api_error' in data.data && 'message' in data.data.api_error) {
                                    winkstart.alert(data.data.api_error.message);
                                }
                            }
                        );
                    },
                    function(error) {
                        winkstart.alert(error);
                    }
                );
            });

            $('.edit-credit-card', $profile_html).on('click', function(e) {
                e.preventDefault();

                $('.edition', $profile_html).show();
                $('.uneditable', $profile_html).hide();
            });

            var display_card_type = function($this) {
                var type = get_card_type($this.val());

                if(type === false) {
                    $('.card-type', $profile_html).hide();
                    $('.add-on i', $profile_html).show();
                }
                else if(!($('.card-type.'+type, $profile_html).is(':visible'))) {
                    $('.card-type', $profile_html).hide();
                    $('.add-on i', $profile_html).hide();
                    $('.card-type.'+type, $profile_html).css('display', 'inline-block');
                }
            };

            $('#credit_card_number', $profile_html).on('keyup', function(e) {
                display_card_type($(this));
            });

            $('#credit_card_number', $profile_html).on('paste', function(e) {
                var $this = $(this);
                //Hack for paste event: w/o timeout, the value is set to undefined...
                setTimeout(function() {
                    display_card_type($this);
                }, 0);
            });

            $('#profile_settings a', $profile_html).on('click', function (e) {
                e.preventDefault();
                close_content();

                $(this).tab('show');
            });

            $('li.settings-item', $profile_html).on('click', function(e) {
                var $this = $(this);

                if(!$this.hasClass('open')) {
                    close_content();

                    $this.addClass('open');
                    $('a.settings-link', $(this)).hide();
                    $('.settings-item-content', $this).slideDown('fast');
                }
            });

            $('button.cancel', $profile_html).on('click', function(e) {
                e.preventDefault();
                close_content();

                e.stopPropagation();
            });
        },

        render: function(_callback, _tab) {
            var THIS = this;

            winkstart.parallel({
                    billing: function(callback) {
                        winkstart.request('profile.billing_get', {
                                account_id: winkstart.apps['myaccount'].account_id,
                                api_url: winkstart.apps['myaccount'].api_url,
                            },
                            function(data, status) {
                                callback(null, data.data);
                            }
                        );
                    },
                    user: function(callback) {
                        winkstart.request('profile.user_get', {
                                account_id: winkstart.apps['myaccount'].account_id,
                                api_url: winkstart.apps['myaccount'].api_url,
                                user_id: winkstart.apps['myaccount'].user_id
                            },
                            function(data, status) {
                                callback(null, data.data);
                            }
                        );
                    },
                    account: function(callback) {
                        winkstart.request('profile.account_get', {
                                account_id: winkstart.apps['myaccount'].account_id,
                                api_url: winkstart.apps['myaccount'].api_url
                            },
                            function(data, status) {
                                callback(null, data.data);
                            }
                        );
                    }
                },
                function(err, results) {
                    results = THIS.format_data(results);

                    var $profile_html = THIS.templates.profile.tmpl(results);

                    THIS.bind_events_profile($profile_html, results);

                    winkstart.publish('myaccount.render_submodule', $profile_html);

                    if(_tab) {
                        $('a[href="#'+_tab+'"]', $profile_html).tab('show');
                    }

                    if(typeof _callback === 'function') {
                        _callback($profile_html);
                    }
                }
            );
        },

        myaccount_loaded: function($myaccount_html, account) {
            var THIS = this,
                $profile_menu_html = THIS.templates.menu.tmpl({
                    'account_name': account.name || "Account Name"
                });

            winkstart.publish('myaccount.add_submodule', $profile_menu_html, 1, 'account_category');
        }
    }
);
