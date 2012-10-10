winkstart.module('myaccount', 'statistics', {
        css: [
            'css/statistics.css'
        ],

        templates: {
            statistics: 'tmpl/statistics.html',
            stat: 'tmpl/stat.html'
        },

        subscribe: {
            'myaccount.initialized': 'activate',
            'voip.loaded': 'voip_loaded',
            'statistics.update_stat': 'update_stat',
            'statistics.get_nav': 'get_stat_html',
            'statistics.add_stat': 'add_stat'
        },

        targets: {
            stats_nav: '#ws-topbar #statistics_navbar'
        }
    },

    function(args) {
        var THIS = this;
    },

    {
        stats: {},

        activate: function() {
            var THIS = this;

            THIS.poll_stat();
        },

        poll_stat: function() {
            var THIS = this,
                polling_interval = 15,
                poll = function() {
                    $.each(THIS.stats, function(k, v) {
                        THIS.update_stat(k);
                    });
                    setTimeout(poll, polling_interval * 1000);
                };

            setTimeout(poll, polling_interval * 1000);
        },

        add_stat: function(data_stat) {
            var THIS = this,
                stat_html,
                stat;

            if($.isEmptyObject(THIS.stats)) {
                winkstart.publish('linknav.add', {
                    name: 'stats',
                    weight: '05',
                    content: THIS.templates.statistics.tmpl()
                });
            }

            var stats_html = $(THIS.config.targets.stats_nav);

            $.each(data_stat, function(k,v) {
                v.active = v.active || false;
                v.number = v.number || 0;
                v.color = v.color || 'green';
                v.name = k;
                v.clickable = v.click_handler ? true : false;
                stat_html = ('container' in v ? v.container({stat: v}) : THIS.templates.stat.tmpl({stat: v})).prependTo(stats_html);

                if(v.click_handler && typeof v.click_handler === 'function') {
                    $(stat_html, stats_html).click(function() {
                        v.click_handler();
                    });
                }

                stat = {};
                stat[k] = v;

                $.extend(THIS.stats, stat);

                THIS.update_stat(k);
            });
        },

        update_stat: function(stat_name, callback) {
            var THIS = this,
                current_stat = THIS.stats[stat_name];

            if(!('nb_error' in current_stat) || current_stat.nb_error < 3) {
                THIS.stats[stat_name].get_stat(function(args) {
                    current_stat = $.extend(current_stat, args);
                    if(!args.error) {
                        delete current_stat.nb_error;

                        winkstart.publish('statistics.get_nav', {name: stat_name}, function(stat_html) {
                            if('container' in current_stat) {
                                current_stat.update_container(stat_html);
                            }
                            else {
                                if(current_stat.active) {
                                    $('.icon', stat_html).addClass('blue');
                                    $('.bubble', stat_html).removeClass('inactive');
                                }
                                else {
                                    $('.icon', stat_html).removeClass('blue');
                                    $('.bubble', stat_html).addClass('inactive');
                                }
                                $('.bubble', stat_html).html(current_stat.number);
                                $('.bubble', stat_html).removeClass('green orange red').addClass(current_stat.color);
                            }
                        });
                    }
                    else {
                        if('nb_error' in current_stat && typeof current_stat.nb_error === 'number') {
                            current_stat.nb_error++;
                        }
                        else {
                            current_stat.nb_error = 1;
                        }
                    }
                });
            }

            if(typeof callback === 'function') {
                callback()
            }
        },

        get_stat_html: function(data, callback) {
            var THIS = this,
                stats_html = $(THIS.config.targets.stats_nav),
                stat_html = $('.stat_wrapper[data-name="' + data.name + '"]', stats_html);

            if(typeof callback === 'function') {
                callback(stat_html);
            }
        }
    }
);
