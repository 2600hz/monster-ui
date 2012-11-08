winkstart.module('core', 'whappnav', {
        css: [
            'css/whappnav.css'
        ],

        templates: {
            whapp: 'tmpl/whapp.handlebars'
        },

        subscribe: {
            'whappnav.add': 'add',
            'whappnav.remove': 'remove',
            'whappnav.remove_all': 'remove_all'
        },

        targets: {
            nav_bar: '#ws-navbar .whapps'
        }
    },

    function() {
        var THIS = this;

    },
    {
        add: function(id, _options, _callbacks) {
            var THIS = this,
                $whappnav_html = $(THIS.config.targets.nav_bar),
                $whapp_html = THIS.templates.whapp.tmpl({
                    id: id,
                    name: (_options && _options.name) ? _options.name.toUpperCase() : id.toUpperCase(),
                    link: (_options && _options.link) ? _options.link : '#' + id
                });

            if(_callbacks) {
                if (typeof _callbacks.click == 'function') {
                    $whapp_html.on('click', _callbacks.click);
                }
                if (typeof _callbacks.hover == 'function') {
                    $whapp_html.on('hover', _callbacks.hover);
                }
            }

            /* In order to allow the refresh of a whapp */
            if(!_callbacks || typeof _callbacks.click !== 'function') {
                $whapp_html.on('click', function() {
                    /* We only need to manually activate the whapp again if the URI is the same
                       because the URI listener handles it otherwise */
                    if(winkstart.rooting.get_hashtag().publish === id) {
                        winkstart.publish(id + '.activate');
                    }
                });
            }

            $whappnav_html.append($whapp_html);
        },

        remove: function(id) {
            var THIS = this,
                $whappnav_html = $(THIS.config.targets.nav_bar);

            if(id) {
                $('[data-whapp="' + id + '"]', $whappnav_html).remove();
            } else {
                $('li:last-child', $whappnav_html).remove();
            }
        },

        remove_all: function() {
             var THIS = this,
                $whappnav_html = $(THIS.config.targets.nav_bar);

            $('li', $whappnav_html).remove();
        }
    }
);
