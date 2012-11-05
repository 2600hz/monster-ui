winkstart.module('myaccount', 'billing', {
        css: [
           'css/billing.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           billing: 'tmpl/billing.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.billing.render': 'render'
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
                $billing_html = THIS.templates.billing.tmpl();

            $('.myaccount .myaccount-content').append($billing_html); 

        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this,
                $billing_menu_html = THIS.templates.menu.tmpl(); 

            winkstart.publish('myaccount.add_submodule', $billing_menu_html, 1);   
        }
    }
);
