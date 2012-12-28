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

    winkstart.validate = function(obj, schema, $form, success, failure) {
        var env = JSV.createEnvironment("json-schema-draft-03"),
            res = env.validate(obj, schema);

        if(res.errors.length === 0) {
            if(typeof success == 'function') {
                success(obj);
            }
        } else {
            $('.clearfix.error', $form)
                    .removeClass('error')
                    .find('.help-inline')
                    .text('');

            $.each(res.errors, function(k, err) {
                var properties = err.uri.split('#'),
                    selector = "";

                properties = properties[1].split('/').splice(1);

                $.each(properties, function(i, v) {
                    if(i == 0){
                        selector += v;
                    } else {
                        selector += '.' + v;
                    }
                });

                $('[name="' + selector + '"]', $form)
                    .parents('.clearfix')
                    .addClass('error')
                    .find('.help-inline')
                    .text(err.message + ' (' + err.details + ')');
            });

            if(typeof failure == 'function') {
                failure(res.errors, obj);
            }
        }
    };

})( window.winkstart = window.winkstart || {}, window.amplify = window.amplify || {});
