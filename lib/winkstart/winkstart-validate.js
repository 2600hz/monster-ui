(function(winkstart, amplify, undefined) {
    winkstart.error_message = {
        process_error: function(callback) {
            var objectToArray = function(data) {
                    var return_data = [],
                        return_sub_data,
                        THIS = this;

                    $.each(data, function(k, v) {
                        if(typeof v == 'object') {
                            $.each(v, function(key, value) {
                                v[k+'.'+key] = value;
                                delete v[key];
                            });

                            return_sub_data = objectToArray(this);

                            $.each(return_sub_data, function(k2, v2) {
                                return_data.push({'key': v2.key, 'value': v2.value});
                            });
                        }
                        else {
                            return_data.push({'key':k, 'value':v});
                        }
                    });
                    return return_data;
                },
                arrayToString = function(data) {
                    var array_obj = objectToArray(data || {}),
                        output_string = '';

                    $.each(array_obj, function(k, v) {
                        output_string += v.key+': '+v.value+'<br/>';
                    });

                    return output_string;
                };

            return function(data, status) {
                var string_alert = '';

                if(status === 400 && (data.message === 'invalid data' || data.message === 'braintree api error')) {
                    string_alert += 'Schema Error:<br/><br/>';

                    string_alert += arrayToString(data.data || {});
                }
                else if($.inArray(status, ['400','401','403','404','405','413','500','503',400,401,403,404,405,413,500,503]) >= 0) {
                    if(data.message === 'no_payment_token') {
                        string_alert += 'No credit card found for your account.';
                    }
                    else {
                        string_alert += 'Error status code : ' + status + '<br/><br/><br/>';
                        string_alert += winkstart.print_r(data);
                    }
                }

                if(string_alert != '') {
                    if(typeof callback == 'function') {
                        winkstart.alert('error', string_alert, function() { callback(data, status); });
                    }
                    else {
                        winkstart.alert('error', string_alert);
                    }
                }
            };
        }
    };

    winkstart.validate = {
        set: function(items, _parent) {
            var THIS = this,
                parent = _parent || $('body');

            if($.isArray(items)) {
                $.each(items, function(key, val) {
                    if('name' in val && 'regex' in val) {
                        THIS.add($(val.name, parent), val.regex);
                    }
                });
            }
            else {
                if('name' in items && 'regex' in items) {
                    THIS.add($(items.name, parent), items.regex);
                }
            }
        },

        is_valid: function(items, _parent, success, failure) {
            var parent,
                invalid_num,
                ret;

            if(typeof _parent == 'function') {
                failure = success;
                success = _parent;
                _parent = null;
            }

            var failure = failure || function(){
                winkstart.alert('There are some errors on the form, please correct it');
            };

            parent = _parent || $('body');

            if($.isArray(items)) {
                invalid_num = items.length;

                $.each(items, function(key, val) {
                    if('name' in val && 'regex' in val) {
                        ret = $(val.name, parent)
                                  .trigger('keyup')
                                  .parents('.validated')
                                  .hasClass('valid');

                        if(ret) {
                            invalid_num--;
                        }
                    }
                });
            }
            else {
                invalid_num = 1;
                if('name' in items && 'regex' in items) {
                    ret = $(items.name, parent)
                              .trigger('keyup')
                              .parents('.validated')
                              .hasClass('valid');

                    if(ret) {
                        invalid_num--;
                    }
                }
            }

            if(invalid_num) {
                if(typeof failure == 'function') {
                    failure();
                }
            }
            else {
                if(typeof success == 'function') {
                    success();
                }
            }
        },

        /* Old functions */
        add: function($element, regex) {
            $element.wrap('<span class="validated" />');
            $element.keyup(function() {
                if($element.val().match(regex) == null) {
                    $element.parents('.validated')
                                .removeClass('valid')
                                .addClass('invalid');
                }
                else {
                    $element.parents('.validated')
                                .removeClass('invalid')
                                .addClass('valid');
                }
            });
        },

        save: function($element, regex) {
            $element.trigger('keyup');
        }
    }

})( window.winkstart = window.winkstart || {}, window.amplify = window.amplify || {});
