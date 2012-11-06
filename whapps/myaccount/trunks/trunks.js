winkstart.module('myaccount', 'trunks', {
        css: [
           'css/trunks.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           trunks: 'tmpl/trunks.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.trunks.render': 'render'
        },

        resources: {
            
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        render: function() {
            var THIS = this,
                $trunks_html = THIS.templates.trunks.tmpl();

            winkstart.publish('myaccount.select_menu', THIS.__module);

            $('.myaccount .myaccount-content .container-fluid').html($trunks_html); 

        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this,
                $trunks_menu_html = THIS.templates.menu.tmpl(); 

            winkstart.publish('myaccount.add_submodule', $trunks_menu_html, 3);   
        }
    }
);
