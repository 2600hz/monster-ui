( function(winkstart, amplify, $) {
    winkstart.is_password_valid = function(password_string, strength) {
        var help = {
                standard: 'The password must contain at least 6 characters and include a letter and a number.',
                strong: 'The password must contain at least 8 characters including a non-capitalized letter, a capitalized letter, a number and a special character (!%$...)'
            },
            strength = strength || 'standard', //Standard is the default value
            res = password_string.match(winkstart.get_password_regex(strength));

        if(res && res[0]) {
            return true;
        }
        else {
            winkstart.alert('Your password is not valid<br/>' + help[strength] || '');
            return false;
        }
    };

    winkstart.format_phone_number = function(phone_number) {
        if(phone_number.substr(0,2) === "+1" && phone_number.length === 12) {
            phone_number = phone_number.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
        }
        else if(phone_number.length === 10) {
            phone_number = phone_number.replace(/(\d{3})(\d{3})(\d{4})/, '+1 ($1) $2-$3');
        }

        return phone_number;
    };

    winkstart.get_password_regex = function(strength) {
        var validation = {
            standard: /(?=^.{6,}$)(?=.*\d)((?=.*[a-z])|(?=.*[A-Z])).*$/g,
            strong: /(?=^.{8,}$)(?![.\n])(?=.*[\!\@\#\$\%\^\&\*\-\_\(\)\[\]\=\+\^])(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).*$/g
        };

        return validation[strength || 'standard'];
    };

    winkstart.log = function(data) {
        //if (winkstart.debug) {
        if(winkstart.config.debug) {
            console.log(data);
        }
    };

    winkstart.random_string = function(length, _chars) {
        var chars = _chars || "23456789abcdefghjkmnpqrstuvwxyz",
            chars_length = chars.length,
            random_string = '';

        for(var i = length; i > 0; i--) {
            random_string += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return random_string;
    };

    winkstart.confirm = function(content, callback_ok, callback_cancel) {
        var THIS = this,
            html,
            popup,
            options = {
                closeOnEscape: false,
                title: i18n.t('core.layout.dialog_confirm_title'),
                onClose: function() {
                            if(ok) {
                                if(typeof callback_ok == 'function') {
                                    callback_ok();
                                }
                            }
                            else {
                                if(typeof callback_cancel == 'function') {
                                    callback_cancel();
                                }
                            }
                        }
            },
            ok = false;

        html = $('<div class="alert-dialog"><div class="help-box gray-box"><div class="wrapper-icon"><i class="icon-question-sign2"></i></div><div class="text-wrapper">'+content+'</div></div><div class="alert-buttons-wrapper"><button id="cancel_button" class="btn btn-danger confirm_button">'+ i18n.t('core.layout.dialog_confirm_cancel')  +'</button><button id="confirm_button" class="btn btn-success confirm_button">'+ i18n.t('core.layout.dialog_confirm_ok') +'</button></div></div>');

        popup = winkstart.dialog(html, options);

        $('#confirm_button', html).click(function() {
            ok = true;
            popup.dialog('close');
        });

        $('#cancel_button', html).click(function() {
            popup.dialog('close');
        });

        return popup;
    };

    winkstart.alert = function(type, content, callback) {
        var html,
            popup,
            options = {},
            type_temp = type.toLowerCase(),
            f_data = {};

        if(content && content.data) {
            f_data = winkstart.print_r(content.data);
        }

        if(type_temp == 'error') {
            html = $('<div class="alert-dialog"><div class="help-box red-box"><div class="wrapper-icon"><i class="icon-remove icon-red"></i></div><div class="text-wrapper">'+content+'</div></div></div>');

            if(content && content.data) {
                html = $('<div class="center"><div class="alert_img error_alert"></div><div class="alert_text_wrapper error_alert"><span><p>' +
                    content.text +
                    '<p>' +
                    '<p><button class="btn small btn-danger json">'+ i18n.t('core.layout.dialog_show_error') + '</button>' +
                    '</p><p style="display:none" class="json_error"></p>' +
                    '</span></div><div class="clear"/></div>');
            }
        }
        else if(type_temp == 'info'){
            html = $('<div class="alert-dialog"><div class="help-box gray-box"><div class="wrapper-icon"><i class="icon-info-sign2 icon-blue"></i></div><div class="text-wrapper">'+content+'</div></div></div>');
        }
        else {
            callback = content;
            content = type;
            type_temp = 'warning';

            html = $('<div class="alert-dialog"><div class="help-box red-box"><div class="wrapper-icon"><i class="icon-remove icon-red"></i></div><div class="text-wrapper">'+content+'</div></div></div>');
        }

 //       options.title = type_temp.charAt(0).toUpperCase() + type_temp.slice(1);
        options.title = i18n.t('core.layout.'+type_temp);
        options.onClose = function() {
            if(typeof callback == 'function') {
                callback();
            }
        };

        popup = winkstart.dialog(html, options);

        $('.btn.alert_button', html).click(function() {
            popup.dialog('close');
        });

        if(content && content.data) {
            $('.json_error', popup)
                .css({
                    'cursor': 'pointer'
                })
                .append(f_data);

            $('.json', popup)
                .css('min-width', 0)
                .click(function(e){
                    e.preventDefault();
                   $('.json_error', popup).toggle();
                });
        }


        return popup;
    };

    winkstart.dialog = function(content, options) {
        var newDiv = $(document.createElement('div')).html(content);

        $('input', content).keypress(function(e) {
            if(e.keyCode == 13) {
                e.preventDefault();
                return false;
            }
        });

        //Unoverridable options
        var strict_options = {
            show: { effect : 'fade', duration : 200 },
            hide: { effect : 'fade', duration : 200 },
            zIndex: 20000,
            closeText: i18n.t('core.layout.close', 'X'),
            close: function() {
                $('div.popover').remove();
                $(newDiv).dialog('destroy');
                $(newDiv).remove();

                if(typeof options.onClose == 'function') {
                    /* jQuery FREAKS out and gets into an infinite loop if the following function kicks back an error.
                       Hence the try/catch. */
                    try {
                        options.onClose();
                    }
                    catch(err) {
                        if(console && err.message && err.stack) {
                            console.log(err.message);
                            console.log(err.stack);
                        }
                    }
                }
            }
        },

        //Default values
        defaults = {
            width: 'auto',
            modal: true,
            resizable: false
        };

        //Overwrite any defaults with settings passed in, and then overwrite any attributes with the unoverridable options.
        options = $.extend(defaults, options || {}, strict_options);
        $(newDiv).dialog(options);

        return $(newDiv);       // Return the new div as an object, so that the caller can destroy it when they're ready.'
    };

    winkstart.print_r = function(arr) {

        var arrayToString = function(arr, level) {
                var dumped_text = "",
                    level_padding = "";

                if(!level) level = 0;

                for(var j=0; j< level+1; j++) level_padding += "    ";

                if(typeof(arr) == 'object') {
                    for(var item in arr) {
                        var value = arr[item];

                        if(typeof(value) == 'object') {
                           dumped_text += level_padding + "'" + item + "': { \n";
                           dumped_text += arrayToString(value, level+1);
                           dumped_text += level_padding + "}\n";
                        } else {
                           dumped_text += level_padding + "'" + item + "': \"" + value + "\"\n";
                        }
                    }
                } else {
                    dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
                }

                return dumped_text;
            },
            str = "";

        str += "<pre style='text-align:left;'>{\n";
        str += arrayToString(arr);
        str += "\n}</pre>";

        return str;
    },

    winkstart.jsonToString = function(obj) {

        var objToString = function(arr, level) {
                var dumped_text = "";

                if(!level) level = 0;

                if(typeof(arr) == 'object') {
                    for(var item in arr) {
                        var value = arr[item];

                        if(typeof(value) == 'object') {
                           dumped_text +=  '"' + item + '": {';
                           dumped_text += objToString(value, level+1);
                           dumped_text +=  "}, ";
                        } else {
                           dumped_text += '"' + item + '": "' + value + '", ';
                        }
                    }
                } else {
                    dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
                }

                return dumped_text;
            },
            str = "";

        str += objToString(obj);

        return str;

    }

})(window.winkstart = window.winkstart || {}, window.amplify = window.amplify || {}, jQuery);
