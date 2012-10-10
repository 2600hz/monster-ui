winkstart.module('myaccount', 'personal_info', {
        css: [
            'css/personal_info.css'
        ],

        templates: {
            info: 'tmpl/personal_info.html'
        },

        subscribe: {
            'myaccount.nav.post_loaded': 'myaccount_loaded',
            'personal_info.popup': 'popup',
            'personal_info.advanced_view': 'advanced_view',
            'personal_info.primary_set': 'primary_set'
        },

        resources: {
            'personal_info.user_get': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'personal_info.user_update': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
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
        update_acct: function(data, new_data, success, error) {
            winkstart.request('personal_info.user_update', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    user_id: winkstart.apps['myaccount'].user_id,
                    data: $.extend(true, {}, data, new_data)
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
        },

        myaccount_loaded: function(args) {
            winkstart.publish('nav.add_sublink', {
                link: 'nav',
                sublink: 'perso',
                label: 'My Account',
                weight: '10',
                publish: 'personal_info.popup'
            });
        },

        render_info: function(data, target) {
            var THIS = this,
                info_html = THIS.templates.info.tmpl(data);

            $('*[rel=popover]:not([type="text"])', info_html).popover({
                trigger: 'hover'
            });

            $('*[rel=popover][type="text"]', info_html).popover({
                trigger: 'focus'
            });

            $('#btnEmail', info_html).click(function(ev) {
                ev.preventDefault();

                THIS.update_acct(data.data, {
                        email: $('#infos_email', info_html).val()
                    },
                    function() {
                        winkstart.alert('info', 'Email address updated!');
                    }
                );
            });

            $('#btnPwd', info_html).click(function(ev) {
                var pass = $('#infos_pwd1', info_html).val();

                ev.preventDefault();

                if(pass == $('#infos_pwd2', info_html).val()) {
                    if(winkstart.is_password_valid(pass)) {
                        THIS.update_acct(data.data, {
                                password: pass
                            },
                            function() {
                                winkstart.alert('info', 'Password updated!');
                            }
                        );
                    }
                } else {
                    winkstart.alert('Passwords do not match, please retype the passwords.');
                }
            });

            $('#advanced', info_html).click(function() {
                var $this = $(this);

                winkstart.config.advancedView = $this.is(':checked');
                THIS.update_acct(data.data, {
                    advanced: $this.is(':checked')
                });
            });

            $('#primary_app', info_html).change(function() {
                winkstart.publish('personal_info.primary_set', $('option:selected', this).val());
            });

            var count = true;
            $.each(data.data.apps, function(k, o) {
                if(o['default']) {
                    count = false;
                }
            });

            if(count) {
                $('#primary_app option[value="false"]', info_html).attr('checked', 'checked');
            }

            (target)
                .empty()
                .append(info_html);
        },

        popup: function(){
            var THIS = this,
                popup_html = $('<div class="inline_popup"><div class="inline_content main_content"/></div>');

            winkstart.request('personal_info.user_get', {
                account_id: winkstart.apps['myaccount'].account_id,
                api_url: winkstart.apps['myaccount'].api_url,
                user_id: winkstart.apps['myaccount'].user_id
            },
            function(data, status) {
                THIS.render_info(data, $('.inline_content', popup_html));

                var personal_info_dialog = winkstart.dialog(popup_html, {
                    modal: true,
                    title: 'My Account',
                    autoOpen: true
                });

                $('.personal_info-close', popup_html).click(function(e) {
                    e.preventDefault();
                    personal_info_dialog.dialog('close');
                });
            });
        },

        advanced_view: function(callback){
             winkstart.request('personal_info.user_get', {
                    account_id: winkstart.apps['myaccount'].account_id,
                    api_url: winkstart.apps['myaccount'].api_url,
                    user_id: winkstart.apps['myaccount'].user_id
                },
                function(data, status) {
                    if(typeof callback == 'function') {
                        callback(data.data.advanced);
                    }
                }
            );
        },

        primary_set: function(app, callback) {
            var THIS = this;

            winkstart.request('personal_info.user_get', {
                account_id: winkstart.apps['myaccount'].account_id,
                api_url: winkstart.apps['myaccount'].api_url,
                user_id: winkstart.apps['myaccount'].user_id
            },
            function(data, status) {
                var tmp = data.data;

                $.each(tmp.apps, function(k, o) {
                    if(k == app) {
                        tmp.apps[k]['default'] = true;
                    } else {
                        tmp.apps[k]['default'] = false;
                    }
                });

                THIS.update_acct(data.data, tmp,
                    function(data, status) {
                        if(app && app != "false"){
                            winkstart.alert('info', app + ' is now your primary app');
                        } else {
                            winkstart.alert('info', "You don't have a primary app anymore");
                        }

                        if(typeof callback == 'function') {
                            callback(data);
                        }
                    }
                );
            });
        }

    }
);
