winkstart.module('myaccount', 'balance', {
        css: [
           'css/balance.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           balance: 'tmpl/balance.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.balance.render': 'render'
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
                $balance_html = THIS.templates.balance.tmpl();

            winkstart.publish('myaccount.select_menu', THIS.__module);

            $('.myaccount .myaccount-content .container-fluid').html($balance_html); 

        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this,
                $balance_menu_html = THIS.templates.menu.tmpl(); 

            winkstart.publish('myaccount.add_submodule', $balance_menu_html, 2);   
        }
    }
);
