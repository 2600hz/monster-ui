winkstart.module('core', 'linknav', {
        css: [
            'css/linknav.css'
        ],

        templates: {
            link: 'tmpl/link.handlebars'
        },

        subscribe: {
            'linknav.add': 'add',
            'linknav.remove': 'remove',
            'linknav.remove_all': 'remove_all'

        },

        targets: {
            linknav: '#ws-navbar .links'
        }
    },

    function() {
        var THIS = this;
    },
    {
        add: function(id, html, _class, _callbacks) {
            var THIS = this,
                $linknav_html = $(THIS.config.targets.linknav),
                $link_html = THIS.templates.link.tmpl({
                    id: id,
                    html: html,
                    class: _class
                });

            if(_callbacks) {
                if (typeof _callbacks.click == "function") {
                    $link_html.on('click', _callbacks.click);
                }
                if (typeof _callbacks.hover == "function") {
                    $link_html.on('hover', _callbacks.hover);
                }
            }

            $linknav_html.append($link_html);
        },

        remove: function(id) {
            var THIS = this,
                $linknav_html = $(THIS.config.targets.linknav);

            if(id) {    
                $('[data-link="' + id + '"]', $linknav_html).remove();
            } else {
                $('li:last-child', $linknav_html).remove();
                $('li:last-child', $linknav_html).remove();
            }
        },

        remove_all: function() {
             var THIS = this,
                $linknav_html = $(THIS.config.targets.linknav);

            $('li', $linknav_html).remove();
        }
    }
);
