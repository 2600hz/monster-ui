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

    winkstart.cleanForm = function() {
        var max = 0;
        $("label").each( function() {
            if ($(this).width() > max)
                max = $(this).width();
        });
        $("label").width(max);
    };

    winkstart.loadFormHelper = function(name) {
        var url = 'js/tmpl_snippets/'  + name + '.html';
        $.get(url, function(data) {
            $('body').append(data);
        });
    };

    winkstart.confirm = function(content, callback_ok, callback_cancel) {
        var html,
            popup,
            options = {},
            ok = false;

        html = $('<div class="center"><div class="alert_img confirm_alert"></div><div class="alert_text_wrapper info_alert"><span>' + content + '</span></div><div class="clear"/><div class="alert_buttons_wrapper"><button id="confirm_button" class="btn success confirm_button">OK</button><button id="cancel_button" class="btn danger confirm_button">Cancel</button></div></div>');

        options.title = 'Please confirm';
        options.maxWidth = '400px';
        options.width = '400px';
        options.onClose = function() {
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
        };

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
            html = $('<div class="center"><div class="alert_img error_alert"></div><div class="alert_text_wrapper error_alert"><span>' +
                content +
                '</span></div><div class="clear"/><div class="alert_buttons_wrapper"><button class="btn primary alert_button">Close</button></div></div>');

            if(content && content.data) {
                html = $('<div class="center"><div class="alert_img error_alert"></div><div class="alert_text_wrapper error_alert"><span><p>' +
                    content.text +
                    '<p>' +
                    '<p><button class="btn small danger json">Show Errors</button>' +
                    '</p><p style="display:none" class="json_error"></p>' +
                    '</span></div><div class="clear"/><div class="alert_buttons_wrapper"><button class="btn primary alert_button">Close</button></div></div>');
            }
        }
        else if(type_temp == 'info'){
            html = $('<div class="center"><div class="alert_img info_alert"></div><div class="alert_text_wrapper info_alert"><span>' + content + '</span></div><div class="clear"/><div class="alert_buttons_wrapper"><button class="btn primary alert_button">Close</button></div></div>');
        }
        else {
            callback = content;
            content = type;
            type_temp = 'warning';
            html = $('<div class="center"><div class="alert_img warning_alert"></div><div class="alert_text_wrapper warning_alert"><span>' + content + '</span></div><div class="clear"/><div class="alert_buttons_wrapper"><button class="btn primary alert_button">Close</button></div></div>');
        }

        options.title = type_temp.charAt(0).toUpperCase() + type_temp.slice(1);
        options.maxWidth = '600px';
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

    winkstart.random_string = function(length, _chars) {
        var chars = _chars || "0123456789abcdefghijklmnopqrstuvwxyz",
            chars_length = chars.length,
            random_string = '';

        for(var i = length; i > 0; i--) {
            random_string += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return random_string;
    };

    winkstart.friendly_timestamp = function(timestamp) {
        var THIS = this,
            timestamp = timestamp,
            parsed_date = '-';

        if(timestamp) {
            var date = new Date((timestamp - 62167219200)*1000),
                month = date.getMonth() +1,
                year = date.getFullYear(),
                day = date.getDate(),
                humanDate = month+'/'+day+'/'+year,
                humanTime = date.toLocaleTimeString();

            parsed_date = humanDate + ' ' + humanTime;
        }

        return parsed_date;
    },

    winkstart.friendly_seconds = function(duration, type) {
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
            duration = hours+':'+minutes+':'+seconds;
        }

        return duration;
    },

    winkstart.link_form = function(html){
        $('input', html).bind('change.link keyup.link focus.link', function() {
            var name = $(this).attr('name'),
                type = $(this).attr('type'),
                value = $(this).val(),
                input_fields = $('input[name="' + name + '"]', html);

            if(input_fields.size() > 1) {
                if(type == 'checkbox'){
                    input_fields = input_fields.filter('[value='+value+']');
                    ($(this).attr('checked')) ? input_fields.attr('checked', 'checked') : input_fields.removeAttr('checked');
                }
                else {
                    input_fields.val($(this).val());
                }
            }
            else {
                $(this).unbind('.link');
            }
        });
    };

    winkstart.tabs = function(buttons_html, tabs_html, advanced) {

        if(advanced) {
            $('.btn', buttons_html).removeClass('activate');
            $('.advanced', buttons_html).addClass('activate');
        } else {
            if(winkstart.config.advancedView) {
                $('.btn', buttons_html).removeClass('activate');
                $('.advanced', buttons_html).addClass('activate');
            } else {
                 tabs_html.hide('blind');
            }
        }

        if($('li', tabs_html).length < 2){
            buttons_html.hide();
        }

        $('.basic', buttons_html).click(function(){
            if(!$(this).hasClass('activate')){
                $('.btn', buttons_html).removeClass('activate');
                $(this).addClass('activate');
                $('li:first-child > a', tabs_html).trigger('click');
                tabs_html.hide('blind');
            }
        });

        $('.advanced', buttons_html).click(function(){
            if(!$(this).hasClass('activate')){
                $('.btn', buttons_html).removeClass('activate');
                $(this).addClass('activate');
                tabs_html.show('blind');
            }
        });
    };

    winkstart.accordion = function(html, change_name) {

        function toggle(btn, state) {
            var div = $('#' + btn.data('toggle'));

            if(state) {
                btn.addClass('activated');
                if(change_name != false) {
                    btn.html('Hide');
                }
                div.slideDown();
            } else {
                btn.removeClass('activated');
                if(change_name != false) {
                    btn.html('Show');
                }
                div.slideUp();
            }
        }

        $('.toggled', html).hide();

        $('.toggle-all', html).click(function(ev){
            var btn = $(this);
            ev.preventDefault();

            $('.toggle', html).each(function(i) {
                toggle($(this), !btn.hasClass('activate'));
            });

            if(btn.hasClass('activate')) {
                btn.removeClass('activate');
                btn.html('Show All');
            } else {
                btn.addClass('activate');
                btn.html('Hide All');
            }
        });

        $('.toggle', html).click(function(ev){
            var btn = $(this);
            ev.preventDefault();

            toggle(btn, !btn.hasClass('activated'));
        });

    };

    winkstart.chart = function(target, data, opt, type) {
        this.target = target;
        this.data = data;
        this.options = {
            backgroundColor: 'transparent',
            pieSliceText: 'value',
            pieSliceBorderColor: 'transparent',
            legend: {
                textStyle: {
                    color: 'white'
                }
            }
        };
        if(type){
            this.type = type;
        }

        $.extend(true, this.options, opt);

        return this.init();
    };

    winkstart.chart.prototype = {
        init: function() {
            var THIS = this;

            function loadChart() {
                THIS.loadChart(THIS);
            }

            google.load("visualization", "1", {
                packages:["corechart", "gauge"],
                callback: loadChart
            });
        },

        loadChart: function(THIS){
            switch(THIS.type) {
                case 'line':
                    THIS.chart = new google.visualization.LineChart(document.getElementById(THIS.target));
                    break;
                case 'gauge':
                    THIS.chart = new google.visualization.Gauge(document.getElementById(THIS.target));
                    break;
                default:
                    THIS.chart = new google.visualization.PieChart(document.getElementById(THIS.target));
                    break;
            }
            THIS.chart.draw(google.visualization.arrayToDataTable(THIS.data), THIS.options);
        },

        setData: function(data, push) {
            if(push) {
                this.data.push(data);
            } else {
                this.data = data;
            }
        },

        setOptions: function(options, ext) {
            if(ext) {
                $.extend(true, this.options, options);
            } else {
                this.options = options;
            }
        },

        refresh: function() {
            var data = google.visualization.arrayToDataTable(this.data);
            this.chart.draw(data, this.options);
        }
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
