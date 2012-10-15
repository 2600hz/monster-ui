(function(winkstart, amplify, undefined) {
    var modules = {},
        loading = {},
        locked_topics = {},
        slice = [].slice;

    winkstart.get_version = function(callback) {
        $.ajax({
            url: 'VERSION',
            cache: false,
            success: function(template) {
                callback(template);
            }
        });
    },

    winkstart.publish = function(locking) {
        var args = arguments,
            ret;

        if(locking === true) {
            args = slice.call(arguments, 1);

            if(!args.length) {
                return false;
            }

            if(args[0] in locked_topics) {
                return false;
            }
            else {
                locked_topics[args[0]] = true;
            }
        }

        ret = amplify.publish.apply(null, args);

        if(locking === true) {
            if(args[0] in locked_topics) {
                delete locked_topics[args[0]];
            }
        }

        return ret;
    },

    winkstart.subscribe   = amplify.subscribe;
    winkstart.unsubscribe = amplify.unsubscribe;

    winkstart.templates = {};
    winkstart.css = {};
    winkstart.locales = {};

    /* First we need to load translation of the config folder */
    var default_languages = [winkstart.config.language || 'en', winkstart.config.fallback_language || 'en'];
    $.each(default_languages, function(k, language) {
        var namespace = 'translation';
        $.ajax({
            url : 'config/locales/' + language +'/'+namespace+'.json',
            cache: false,
            success : function(data) {
                /* On different browser/OS sometimes the data is a string and sometimes an object... */
                var data = typeof data === 'object' ? data : JSON.parse(data),
                    parsed_data = {};

                parsed_data[language] = {};
                parsed_data[language][namespace] = {};
                parsed_data[language][namespace]['config'] = data;

                $.extend(true, winkstart.locales || {}, parsed_data);

                i18n.init({
                        ns: { namespaces: [namespace], defaultNs: namespace },
                        resStore: winkstart.locales,
                        lng: winkstart.config.language || 'en',
                        fallbackLng: winkstart.config.fallback_language || 'en'
                    }
                );
            }
        });
    });

    winkstart.module = amplify.module;
    amplify.module.constructor = function(args, callback) {
        var completed = 0, THIS = this;

        if(this.config.locales) {
            var namespace = 'translation';

            $.each(this.config.locales, function(k, language) {
                if(language === (winkstart.config.language || 'en') || language === (winkstart.config.fallback_language || 'en')) {
                    $.ajax({
                        url : 'whapps/' + THIS.__whapp + '/' + THIS.__module + '/locales/' + language +'/'+namespace+'.json',
                        cache: false,
                        success : function(data) {
                            /* On different browser/OS sometimes the data is a string and sometimes an object... */
                            var data = typeof data === 'object' ? data : JSON.parse(data),
                                parsed_data = {};

                            parsed_data[language] = {};
                            parsed_data[language][namespace] = {};
                            parsed_data[language][namespace][THIS.__whapp] = {};
                            parsed_data[language][namespace][THIS.__whapp][THIS.__module] = data;

                            $.extend(true, winkstart.locales || {}, parsed_data);

                            i18n.init({
                                    ns: { namespaces: [namespace], defaultNs: namespace },
                                    resStore: winkstart.locales,
                                    lng: winkstart.config.language || 'en',
                                    fallbackLng: winkstart.config.fallback_language || 'en'
                                }
                            );
                        }
                    });
                }
            });
        }

        if(this.config.templates) {
            this.templates = {};
            $.each(this.config.templates, function(name, url) {
                completed++;

                if(THIS.__module + '/' + url in (winkstart.templates[THIS.__whapp] || {})) {
                    completed--;
                    THIS.templates[name] = winkstart.templates[THIS.__whapp][THIS.__module + '/' + url];
                }
                else {
                    // Make sure you set cache = false, or things really suck
                    $.ajax({
                        url: 'whapps/' + THIS.__whapp + '/' + THIS.__module + '/' + url,
                        cache: false,
                        success: function(template) {
                            completed--;

                            /* TODO remove jQuery template support */
                            if(url.indexOf('handlebars') >= 0) {
                                THIS.templates[name] = Handlebars.compile(template);
                                THIS.templates[name].tmpl = function(data) { return $(this(data)); };
                            }
                            else {
                                THIS.templates[name] = $(template);
                            }
                        }
                    });
                }
            });
        }

        if(this.config.requires) {
            $.each(this.config.requires, function(k, module) {
                                winkstart.log('Loading dependency ' + k + ' ' + module);
                completed++;
                amplify.module.loadModule(k, module, function() {
                    completed--;
                });
            });
        }

        if(this.config.css) {
            this.css = {};
            $.each(this.config.css, function(name, url) {
                if(THIS.__module + '/' + url in (winkstart.css[THIS.__whapp] || {})) {
                    THIS.css[name] = winkstart.css[THIS.__whapp][THIS.__module + '/' + url];
                    THIS.css[name].appendTo('head');
                }
                else {
                    url = 'whapps/' + THIS.__whapp + '/' + THIS.__module + '/' + url;

                    $('<link href="' + url + '" rel="stylesheet" type="text/css">').appendTo('head');
                }
            });
        }

        if(this.config.subscribe) {
            $.each(this.config.subscribe, function(k, v) {
                winkstart.subscribe(k, function() {
                    var ret = true;

                    if ( THIS[v] ) {
                        ret = THIS[v].apply(THIS, arguments);
                    }

                    return ret;
                });
            });
        }

        //Validation engine
        if(this.config.schemas) {
            THIS.schemas = {};

            $.each(this.config.schemas, function(k, schema) {
                completed++;
                $.ajax({
                    url: winkstart.apps[THIS.__whapp].api_url + '/schemas' + '/' + schema,
                    type: 'GET',
                    success: function(data) {
                        THIS.schemas[schema] = {
                            type: 'object',
                            properties: data.data.properties
                        }
                        completed--;
                    }
                });
            });
        }

        setTimeout(function() {
            completed = 0;
        }, 3000);

        var THIS = this;
        (function() {
            if ( completed == 0 ) {
                if ( $.isFunction(callback) ) {
                    callback();

                    var uri = winkstart.history();

                    if(uri) {
                        if(uri.length == 1) {
                            if(THIS.__whapp == uri[0] && THIS.__module == uri[0]) {
                                winkstart.publish(uri[0] + '.activate', {});
                            }
                        } else {
                            if(THIS.__whapp == uri[0]) {
                                if(THIS.__module == uri[1]) {
                                    winkstart.publish(uri[0] + '.module_activate', {name: uri[1]});
                                }
                            }
                        }
                    }
                }
                return;
            }
            var _c = arguments.callee;
            setTimeout(function() { _c(); }, 10);
        })();
    };

    // Bootstrap the app: Start by loading the core module
    winkstart.module.loadApp('core', function() {
        // Create an instance of the core module, which loads layouts and all whApps
        this.init();

/*          winkstart.module.loadModule('core', 'layout', function() {
                this.init({ parent: $('body') }, function() {

                    //Bootstrap some form data
                    $.getJSON('endpoint/form/data.json', function(data){
                        amplify.store('form_data', data);
                    });
                });
            });
        });*/
    });

})( window.winkstart = window.winkstart || {}, window.amplify = window.amplify || {});
