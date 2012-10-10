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
    }

    winkstart.subscribe   = amplify.subscribe;
    winkstart.unsubscribe = amplify.unsubscribe;

    winkstart.templates = {};
    winkstart.css = {};

    winkstart.module = amplify.module;
    amplify.module.constructor = function(args, callback) {
        var completed = 0, THIS = this;

        if ( this.config.templates ) {
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
                            THIS.templates[name] = $(template);
                        }});
                }
            });
        }

        if ( this.config.requires ) {
            $.each(this.config.requires, function(k, module) {
                                winkstart.log('Loading dependency ' + k + ' ' + module);
                completed++;
                amplify.module.loadModule(k, module, function() {
                    completed--;
                });
            });
        }

        if ( this.config.css ) {
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

        if ( this.config.subscribe ) {
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

        setTimeout(function() {
            completed = 0;
        }, 3000);

        (function() {
            if ( completed == 0 ) {
                if ( $.isFunction(callback) ) {
                    callback();
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
