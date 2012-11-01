winkstart.module('myaccount', 'billing', {
        css: [
           
        ],

        templates: {
           
        },

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.billing.test': 'test'
        },

        resources: {
            
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
    },
    {
        test: function() {
            console.log('TEST SUCCESS !!!');
        },

        myaccount_loaded: function($myaccount_html) {
            var $billing_menu_html = $('<li><a href="#myaccount/billing/test"><i class="icon-tag"></i> Billing</a></li>');

            winkstart.publish('myaccount.add_submodule', $billing_menu_html);   
        }
    }
);
