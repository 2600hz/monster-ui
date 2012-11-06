winkstart.module('myaccount', 'profile', {
        css: [
           'css/profile.css'
        ],

        templates: {
           menu: 'tmpl/menu.handlebars',
           profile: 'tmpl/profile.handlebars'
        },

        locales: ['en', 'fr'],

        subscribe: {
            'myaccount.loaded': 'myaccount_loaded',
            'myaccount.profile.render': 'render'
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
                $profile_html = THIS.templates.profile.tmpl();

            $('.myaccount .myaccount-content .container-fluid').html($profile_html); 

        },

        myaccount_loaded: function($myaccount_html) {
            var THIS = this,
                $profile_menu_html = THIS.templates.menu.tmpl(); 

            winkstart.publish('myaccount.add_submodule', $profile_menu_html, 1);   
        }
    }
);
