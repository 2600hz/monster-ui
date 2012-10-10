winkstart.module('core', 'whappnav', {
        css: [
            'css/whappnav.css'
        ],

        templates: {
            whapp: 'tmpl/whapp.html',
            whapp_divider: 'tmpl/whapp_divider.html',
            module: 'tmpl/module.html',
            module_divider: 'tmpl/module_divider.html',
            category: 'tmpl/category.html'
        },

        subscribe: {
            'whappnav.add': 'add',
            'whappnav.subnav.add': 'sub_add',
            'whappnav.subnav.show': 'show_menu',
            'whappnav.subnav.hide': 'hide_menu',
            'whappnav.subnav.disable' : 'disable_whapp',
            'whappnav.subnav.enable': 'enable_whapp'
        },

        targets: {
            nav_bar: '#ws-topbar .whapps'
        }
    },

    function() {
        var THIS = this,
            whapp_list_html = $(THIS.config.targets.nav_bar),
            whapp_divider_html = THIS.templates.whapp_divider.tmpl();

        (whapp_list_html).append(whapp_divider_html);
    },

    {
        add: function(args) {
            var THIS = this,
                inserted = false,
                whapp_list_html = $(THIS.config.targets.nav_bar),
                whapp_html = THIS.templates.whapp.tmpl({
                    name: args.name,
                    whapp: winkstart.apps[args.name],
                    weight: args.weight || 0
                }),
                whapp_divider_html = THIS.templates.whapp_divider.tmpl();

            $('> a', whapp_html).click(function(ev) {
                ev.preventDefault();

                if(!(whapp_html.hasClass('disabled'))) {
                    $('.whapps .whapp > a').removeClass('activate');
                    $(this).addClass('activate');
                    winkstart.publish(args.name + '.activate', {});
                }
            });

            (whapp_html)
                .hoverIntent({
                    sensitivity: 1,
                    interval: 40,
                    timeout: 200,
                    over: function() {
                        if((whapp_html).dataset('dropdown') && !(whapp_html.hasClass('disabled'))) {
                            (whapp_html).addClass('open');
                        }
                    },
                    out: function() {
                        if((whapp_html).dataset('dropdown')) {
                            (whapp_html).removeClass('open');
                        }
                    }
                });

            $('.whapp', whapp_list_html).each(function(index) {
                var weight = $(this).dataset('weight');

                if(args.weight < weight) {
                    $(this)
                        .before(whapp_html)
                        .before(whapp_divider_html);
                    inserted = true;

                    return false;
                }
                else if(index >= $('.whapp', whapp_list_html).length - 1) {
                    $(this)
                        .after(whapp_html)
                        .after(whapp_divider_html);
                    inserted = true;

                    return false;
                }
            });

            if(!inserted) {
                (whapp_list_html)
                    .prepend(whapp_html)
                    .prepend(whapp_divider_html);
            }

            var topbar = $('body > .topbar'),
                nb = topbar.data('nb') || 0;

            topbar.data('nb', nb + 1);

            if(topbar.data('nb') > 6) {
                topbar.css({
                    'min-width': '+= 140'
                });
            }
        },

        disable_whapp: function(whapp_name) {
            var THIS = this,
                whapp_list_html = $(THIS.config.targets.nav_bar);

            $('li[data-whapp='+whapp_name+']', whapp_list_html).addClass('disabled');
        },

        enable_whapp: function(whapp_name) {
            var THIS = this,
                whapp_list_html = $(THIS.config.targets.nav_bar);

            $('li[data-whapp='+whapp_name+']', whapp_list_html).removeClass('disabled');
        },

        show_menu: function(whapp) {
            var THIS = this,
                whapp_list_html = $(THIS.config.targets.nav_bar),
                whapp_html = $('.whapp[data-whapp="' + whapp + '"]', whapp_list_html);

            if((whapp_html).dataset('dropdown')) {
                (whapp_html).addClass('open');
            }
        },

        hide_menu: function(whapp) {
            var THIS = this,
                whapp_list_html = $(THIS.config.targets.nav_bar),
                whapp_html = $('.whapp[data-whapp="' + whapp + '"]', whapp_list_html);

            if((whapp_html).dataset('dropdown')) {
                (whapp_html).removeClass('open');
            }
        },

        sub_add: function(data) {
            var THIS = this,
                whapp_list_html = $(THIS.config.targets.nav_bar),
                whapp_html = $('.whapp[data-whapp="' + data.whapp + '"]', whapp_list_html),
                whapp_dropdown_html = $('> .dropdown-menu', whapp_html),
                whapp_module_list_html = $('.module[data-category="' + (data.category || '') + '"]', whapp_dropdown_html),
                whapp_module_html = THIS.templates.module.tmpl(data),
                inserted = false,
                module_divider_html,
                category_html;

            THIS.ensure_dropdown(whapp_html);

            $('> a', whapp_module_html).click(function(ev) {
                ev.preventDefault();

                $('.whapps .whapp > a').removeClass('activate');
                $(this).parents('.whapp').find('a').addClass('activate');

                winkstart.publish(data.whapp + '.module_activate', { name: data.module });
            });

            (whapp_module_list_html).each(function(index) {
                var weight = $(this).dataset('weight');

                if(data.weight < weight) {
                    $(this).before(whapp_module_html);

                    inserted = true;

                    return false;
                }
                else if(index >= whapp_module_list_html.length - 1) {
                    $(this).after(whapp_module_html);

                    inserted = true;

                    return false;
                }
            });

            if(!inserted) {
                if(data.category) {
                    /* This should become its own function at somepoint... */
                    module_divider_html = THIS.templates.module_divider.tmpl();
                    category_html = THIS.templates.category.tmpl({
                        name: data.category,
                        label: data.category[0].toUpperCase() + data.category.slice(1),
                        icon: data.category
                    });

                    (category_html)
                        .hoverIntent({
                            sensitivity: 1,
                            interval: 40,
                            timeout: 200,
                            over: function() {
                                if((category_html).dataset('dropdown')) {
                                    (category_html).addClass('open');
                                }
                            },
                            out: function() {
                                if((category_html).dataset('dropdown')) {
                                    (category_html).removeClass('open');
                                }
                            }
                        });

                    $('.dropdown-menu', category_html).prepend(whapp_module_html);

                    (whapp_dropdown_html)
                        .append(module_divider_html)
                        .append(category_html);
                }
                else {
                    (whapp_dropdown_html).prepend(whapp_module_html);
                }
            }

            /* Make sure all the sub menus are aligned correctly */
            $('.category > .dropdown-menu', whapp_dropdown_html).css('left', (whapp_dropdown_html).width());
        },

        ensure_dropdown: function(whapp_html) {
            $('> a', whapp_html).addClass('dropdown-toggle');

            (whapp_html)
                .addClass('dropdown')
                .dataset('dropdown', 'dropdown');
        }
    }
);
