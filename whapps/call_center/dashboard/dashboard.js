winkstart.module('call_center', 'dashboard', {
        css: [
            'css/dashboard.css'
        ],

        templates: {
            dashboard: 'tmpl/dashboard.html',
            agents_dashboard: 'tmpl/agents_dashboard.html',
            queues_dashboard: 'tmpl/queues_dashboard.html',
            call: 'tmpl/call_list_element.html'
        },

        subscribe: {
            'dashboard.activate': 'activate',
            'dashboard.activate_queue_stat': 'activate_queue_stat'
        },

        resources: {
            'dashboard.agents.livestats': {
                url: '{api_url}/accounts/{account_id}/agents/stats/realtime',
                contentType: 'application/json',
                verb: 'GET',
                trigger_events: false
            },
            'dashboard.queues.livestats': {
                url: '{api_url}/accounts/{account_id}/queues/stats/realtime',
                contentType: 'application/json',
                verb: 'GET',
                trigger_events: false
            },
            'dashboard.queues.stats': {
                url: '{api_url}/accounts/{account_id}/queues/stats',
                contentType: 'application/json',
                verb: 'GET',
                trigger_events: false
            },
            'dashboard.agents.stats': {
                url: '{api_url}/accounts/{account_id}/agents/stats',
                contentType: 'application/json',
                verb: 'GET',
                trigger_events: false
            },
            'dashboard.queues.list': {
                url: '{api_url}/accounts/{account_id}/queues',
                contentType: 'application/json',
                verb: 'GET',
                trigger_events: false
            },
            'dashboard.agents.list': {
                url: '{api_url}/accounts/{account_id}/agents',
                contentType: 'application/json',
                verb: 'GET',
                trigger_events: false
            },
            'dashboard.queues.stats_loading': {
                url: '{api_url}/accounts/{account_id}/queues/stats',
                contentType: 'application/json',
                verb: 'GET'
            },
            'dashboard.agents.stats_loading': {
                url: '{api_url}/accounts/{account_id}/agents/stats',
                contentType: 'application/json',
                verb: 'GET'
            },
            'dashboard.queues.list_loading': {
                url: '{api_url}/accounts/{account_id}/queues',
                contentType: 'application/json',
                verb: 'GET'
            },
            'dashboard.agents.list_loading': {
                url: '{api_url}/accounts/{account_id}/agents',
                contentType: 'application/json',
                verb: 'GET'
            },
            'dashboard.agents.livestats_loading': {
                url: '{api_url}/accounts/{account_id}/agents/stats/realtime',
                contentType: 'application/json',
                verb: 'GET'
            },
            'dashboard.queues.livestats_loading': {
                url: '{api_url}/accounts/{account_id}/queues/stats/realtime',
                contentType: 'application/json',
                verb: 'GET'
            },
        }
    },

    function(args) {
        var THIS = this;

        winkstart.registerResources(THIS.__whapp, THIS.config.resources);

        winkstart.publish('whappnav.subnav.add', {
            whapp: 'call_center',
            module: THIS.__module,
            label: 'Dashboard',
            icon: 'graph1_box',
            weight: '20'
        });
    },

    {
        global_timer: false,
        current_queue_id: undefined,
        map_timers: {
            users: {},
            breaks: {},
            calls: {}
        },

        render_global_data: function(data, id, _parent) {
            var THIS = this,
                agents_html = THIS.templates.agents_dashboard.tmpl(data),
                queues_html = THIS.templates.queues_dashboard.tmpl(data),
                parent = _parent || $('#ws-content');

            $('#ws-content #dashboard-view').empty()
                                            .append(agents_html);

            $('#ws-content .topbar-right').empty()
                                          .append(queues_html);

            if(id) {
                THIS.detail_stat(id, parent);
            }
        },

        poll_agents: function(global_data, _parent) {
            var THIS = this,
                parent = _parent,
                polling_interval = 2,
                map_agents = {},
                cpt = 0,
                current_queue,
                current_global_data = global_data,
                stop_light_polling = false,
                poll = function() {
                    var data_template = $.extend(true, {}, {agents: current_global_data.agents, queues: current_global_data.queues}); //copy without reference;

                    if(stop_light_polling === false) {
                        THIS.get_queues_livestats(false, function(_data_queues) {
                            THIS.get_agents_livestats(false, function(_data_agents) {
                                /* agents */
                                $.each(global_data.agents, function(k, v) {
                                    data_template.agents[k].status = _data_agents.data.current_statuses[k] || 'off';

                                    /* Update # of active agents */
                                    if(current_global_data.agents[k].status === 'off' && data_template.agents[k].status !== 'off') {
                                        current_global_data.agents[k].status = data_template.agents[k].status;
                                        $.each(data_template.agents[k].queues_list, function(queue_id, queue) {
                                            current_global_data.queues[queue_id].current_agents++;
                                            data_template.queues[queue_id].current_agents++;
                                        });
                                    }
                                    else if(data_template.agents[k].status === 'off' && current_global_data.agents[k].status !== 'off') {
                                        current_global_data.agents[k].status = 'off';
                                        $.each(data_template.agents[k].queues_list, function(queue_id, queue) {
                                            current_global_data.queues[queue_id].current_agents--;
                                            data_template.queues[queue_id].current_agents--;
                                        });
                                    }

                                    /* Update # of call_per_hour and per day, per agent. Also update the # of Max calls of a queue */
                                    if(k in _data_agents.data.current_stats && _data_agents.data.current_stats[k].calls_handled) {
                                        var map_cpt = {};
                                        $.each(_data_agents.data.current_stats[k].calls_handled, function(k2, v2) {
                                            map_cpt[v2.queue_id] = map_cpt[v2.queue_id] || 0;
                                            if(++map_cpt[v2.queue_id] > data_template.agents[k].queues_list[v2.queue_id].new_calls) {
                                                data_template.agents[k].call_per_hour++;
                                                data_template.agents[k].call_per_day++;
                                                data_template.agents[k].queues_list[v2.queue_id].call_per_hour++;
                                                data_template.agents[k].queues_list[v2.queue_id].call_per_day++;
                                                data_template.queues[v2.queue_id].max_calls++;
                                            }
                                        });
                                    }

                                    if(k in THIS.map_timers.users && THIS.map_timers.users[k].duration) {
                                        data_template.agents[k].call_time = THIS.get_time_seconds(THIS.map_timers.users[k].duration);
                                    }
                                    else if(k in _data_agents.data.current_calls && _data_agents.data.current_calls[k].agent_state === 'answered') {
                                        data_template.agents[k].call_time = THIS.get_time_seconds(_data_agents.data.current_calls[k].duration);
                                    }
                                    else {
                                        data_template.agents[k].call_time = 0;
                                    }
                                });

                                THIS.render_global_data(data_template, THIS.current_queue_id);
                                THIS.render_timers({active_calls: _data_agents.data.current_calls, waiting_calls: _data_queues.data.current_calls, current_statuses: _data_agents.data.current_statuses});
                            });
                        });
                    }
                },
                huge_poll = function() {
                    if($('#dashboard-content').size() === 0) {
                        THIS.clean_timers();
                        //clearInterval(THIS.global_timer);
                        //THIS.global_timer = false;
                    }
                    else {
                        if(++cpt % 30 === 0) {
                            THIS.fetch_all_data(false, function(data) {
                                THIS.render_global_data(data, THIS.current_queue_id);
                                THIS.render_timers({active_calls: data.agents_live_stats.data.current_calls, waiting_calls: data.queues_live_stats.data.current_calls, current_statuses: data.agents_live_stats.data.current_statuses});
                                current_global_data = data;
                            });
                        }
                        else {
                            poll();
                        }
                    }
                };

            $.each(global_data.agents, function(k, v) {
                map_agents[v.id] = 'off';
            });

            THIS.global_timer = setInterval(huge_poll, polling_interval * 1000);
        },

        get_queues_livestats: function(display_loading, success, error) {
            var request_string = display_loading ? 'dashboard.queues.livestats_loading' : 'dashboard.queues.livestats';

            winkstart.request(request_string, {
                    account_id: winkstart.apps['call_center'].account_id,
                    api_url: winkstart.apps['call_center'].api_url
                },
                function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            );
        },

        get_agents_livestats: function(display_loading, success, error) {
            var request_string = display_loading ? 'dashboard.agents.livestats_loading' : 'dashboard.agents.livestats';

            winkstart.request(request_string, {
                    account_id: winkstart.apps['call_center'].account_id,
                    api_url: winkstart.apps['call_center'].api_url
                },
                function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            );
        },

        get_agents_stats: function(display_loading, success, error) {
            var request_string = display_loading ? 'dashboard.agents.stats_loading' : 'dashboard.agents.stats';

            winkstart.request(request_string, {
                    account_id: winkstart.apps['call_center'].account_id,
                    api_url: winkstart.apps['call_center'].api_url
                },
                function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            );
        },

        get_queues_stats: function(display_loading, success, error) {
            var request_string = display_loading ? 'dashboard.queues.stats_loading' : 'dashboard.queues.stats';

            winkstart.request(request_string, {
                    account_id: winkstart.apps['call_center'].account_id,
                    api_url: winkstart.apps['call_center'].api_url
                },
                function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            );
        },

        get_queues: function(display_loading, success, error) {
            var request_string = display_loading ? 'dashboard.queues.list_loading' : 'dashboard.queues.list';

            winkstart.request(request_string, {
                    account_id: winkstart.apps['call_center'].account_id,
                    api_url: winkstart.apps['call_center'].api_url
                },
                function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            );
        },

        get_agents: function(display_loading, success, error) {
            var request_string = display_loading ? 'dashboard.agents.list_loading' : 'dashboard.agents.list';

            winkstart.request(request_string, {
                    account_id: winkstart.apps['call_center'].account_id,
                    api_url: winkstart.apps['call_center'].api_url
                },
                function(_data, status) {
                    if(typeof success == 'function') {
                        success(_data, status);
                    }
                },
                function(_data, status) {
                    if(typeof error == 'function') {
                        error(_data, status);
                    }
                }
            );
        },

        render_callwaiting_list: function(_parent){
            var THIS = this,
                parent = _parent || $('#dashboard-content');;

            $('#callwaiting-list', parent)
                .empty()
                .listpanel({
                    label: 'Call Waiting',
                    identifier: 'callwaiting-listview',
                    data: []//array_cw
                });

            $('.add_flow', parent).empty()
                                  .html('Call Waiting Log...');
        },

        add_callwaiting: function(call) {
            var THIS = this;

            call.friendly_duration = THIS.get_time_seconds(call.wait_time);
            var call_html = THIS.templates.call.tmpl(call);
            $('#callwaiting-list .list-panel-anchor ul').append(call_html);

            THIS.map_timers.calls[call.call_id.toLowerCase()] = {};
            THIS.map_timers.calls[call.call_id.toLowerCase()].timer = setInterval(function(){
                $('.timer', call_html).html(THIS.get_time_seconds(++call.wait_time));
            }, 1000);
        },

        remove_callwaiting: function(call_id) {
            var THIS = this;

            $('#callwaiting-list .list-panel-anchor ul li').each(function(k, v) {
                if($(v).attr('id').toLowerCase() === call_id) {
                    $(v).remove().hide();
                }
            });

            clearInterval(THIS.map_timers.calls[call_id.toLowerCase()].timer);
            delete THIS.map_timers.calls[call_id.toLowerCase()];
        },

        get_time_seconds: function(seconds) {
            var seconds = Math.floor(seconds),
                hours = Math.floor(seconds / 3600),
                minutes = Math.floor(seconds / 60) % 60,
                remaining_seconds = seconds % 60,
                display_time = (hours < 10 ? '0' + hours : '' + hours) + ':' + (minutes < 10 ? '0' + minutes : '' + minutes) + ':' + (remaining_seconds < 10 ? '0' + remaining_seconds : '' + remaining_seconds);

            return display_time;
        },

        start_timer: function(target, seconds, id, state) {
            var THIS = this;

            if(target.size() > 0 && id) {
                var timer_type = state === 'paused' ? 'breaks' : 'users';

                THIS.map_timers[timer_type][id] = {};

                target.html(THIS.get_time_seconds(seconds));
                THIS.map_timers[timer_type][id].duration = seconds;

                THIS.map_timers[timer_type][id].timer = setInterval(function(){
                    target = $('.agent_wrapper#'+id+' .call_time .data_value');
                    if(target.size() > 0) {
                        target.html(THIS.get_time_seconds(++seconds));
                        THIS.map_timers[timer_type][id].duration = seconds;
                    }
                    else {
                        clearInterval(THIS.map_timers[timer_type][id].timer);
                        delete THIS.map_timers[timer_type][id];
                    }
                }, 1000);
            }
        },

        format_data: function(_data) {
            var THIS = this,
                data = _data,
                map_sort_status = {
                    'ready': 1,
                    'answered': 2,
                    'paused': 3,
                    'off': 4
                },
                total_calls = 0,
                active_calls = 0,
                map_agents_stats = THIS.format_agents_stats(_data),
                map_queues_stats = THIS.format_queues_stats(_data),
                get_queue_stat = function(queue_id) {
                    if(!(queue_id in map_queues_stats)) {
                        map_queues_stats[queue_id] = {
                            current_calls: 0,
                            max_calls: 0,
                            current_agents: 0,
                            max_agents: 0,
                            dropped_calls: 0,
                            average_hold_time: 0
                        };
                    }

                    return map_queues_stats[queue_id];
                },
                get_agent_stat = function(agent_id) {
                    if(!(agent_id in map_agents_stats)) {
                        map_agents_stats[agent_id] = {
                            status: 'off',
                            call_time: 0,
                            break_time: 0,
                            call_per_hour: 0,
                            new_calls: 0,
                            call_per_day: 0,
                            calls_missed: 0,
                            queues_list: {}
                        };
                    }

                    return map_agents_stats[agent_id];
                },
                map_current_stat = {};

            if(data.agents_live_stats.data.current_statuses) {
                $.each(data.agents_live_stats.data.current_statuses, function(agent_id, agent_status) {
                    map_current_stat[agent_id] = { agent_status: agent_status };
                });
            }

            if(data.agents_live_stats.data.current_stats) {
                $.each(data.agents_live_stats.data.current_stats, function(agent_id, calls) {
                    if(calls.calls_handled) {
                        map_current_stat[agent_id] = map_current_stat[agent_id] || {};
                        map_current_stat[agent_id].new_calls = 0;
                        map_current_stat[agent_id].queues_list = {};

                        $.each(calls.calls_handled, function(k, v) {
                            if(!(v.queue_id in map_current_stat[agent_id].queues_list)) {
                                map_current_stat[agent_id].queues_list[v.queue_id] = {
                                    new_calls: 0,
                                };
                            }

                            map_current_stat[agent_id].new_calls++;
                            map_current_stat[agent_id].queues_list[v.queue_id].new_calls++;
                        });
                    }
                });
            }

            if(data.agents_live_stats.data.current_calls) {
                $.each(data.agents_live_stats.data.current_calls, function(agent_id, call) {
                    if(call.agent_state === 'answered') {
                        if(agent_id in THIS.map_timers.users) {
                            map_current_stat[agent_id].call_time = THIS.get_time_seconds(THIS.map_timers.users[agent_id].duration);
                        }
                        else {
                            map_current_stat[agent_id].call_time = THIS.get_time_seconds(call.duration);
                        }
                    }
                });
            }

            $.each(data.agents, function(k, v) {
                var queue_string = '';
                $.extend(true, v, get_agent_stat(v.id));

                if(v.id in map_current_stat) {
                    v.call_per_day += map_current_stat[v.id].new_calls || 0;
                    v.call_per_hour += map_current_stat[v.id].new_calls || 0;
                    v.status = map_current_stat[v.id].agent_status || 'off';
                    v.call_time = map_current_stat[v.id].call_time || 0;
                }

                $.each(v.queues, function(k2, v2) {
                    if(!(v2 in map_queues_stats)) {
                        $.extend(true, {}, get_queue_stat(v2));
                    }

                    ++map_queues_stats[v2].max_agents;
                    v.status !== 'off' ? ++map_queues_stats[v2].current_agents : true;
                    v.status === 'answered' ? ++map_queues_stats[v2].current_calls : true;

                    queue_string += queue_string === '' ? v2 : ' ' + v2;

                    if(!(v2 in v.queues_list)) {
                        v.queues_list[v2] = {
                            calls_missed: 0,
                            call_per_hour: 0,
                            call_per_day: 0,
                            new_calls: 0
                        }
                    }

                    if(v.id in map_current_stat && 'queues_list' in map_current_stat[v.id] && v2 in map_current_stat[v.id].queues_list) {
                        v.new_calls += map_current_stat[v.id].queues_list[v2].new_calls;
                        v.queues_list[v2].call_per_hour += map_current_stat[v.id].queues_list[v2].new_calls;
                        v.queues_list[v2].call_per_day += map_current_stat[v.id].queues_list[v2].new_calls;
                        v.queues_list[v2].new_calls = map_current_stat[v.id].queues_list[v2].new_calls + (v.queues_list[v2].new_calls || 0);
                    }
                });
                v.queues = queue_string;

                map_agents_stats[v.id] = v;
            });

            data.agents.sort(function(a, b) {
                return map_sort_status[a.status] < map_sort_status[b.status] ? -1 : 1;
            });

            $.each(data.queues_live_stats.data.current_stats, function(k, v) {
                if(v.calls) {
                    $.each(v.calls, function(k2, call) {
                        if(!(k in map_queues_stats)) {
                            $.extend(true, {}, get_queue_stat(k));
                        }

                        if(call.abandoned) {
                            map_queues_stats[k].dropped_calls++;
                        }
                        else if(call.agent_id) {
                            map_queues_stats[k].max_calls++;
                        }
                    });
                }
            });

            $.each(data.queues, function(k, v) {
                $.extend(true, v, get_queue_stat(v.id));
                if(v.average_hold_time || v.average_hold_time === 0) {
                    //we sum all the wait time in average hold time first, so now we need to divide it by the number of calls to have an average wait time */
                    if((v.max_calls + v.dropped_calls) !== 0) {
                        v.average_hold_time /= (v.max_calls + v.dropped_calls);
                    }
                    else {
                        v.average_hold_time = 0;
                    }

                    v.average_hold_time = THIS.get_time_seconds(Math.round(v.average_hold_time));
                    total_calls += v.max_calls;
                    active_calls += v.current_calls;
                }
                map_queues_stats[v.id] = v;
            });

            data.total_calls = total_calls;
            data.active_calls = active_calls;

            data.agents = map_agents_stats;
            data.queues = map_queues_stats;
            return data;
        },

        format_queues_stats: function(data) {
            var THIS = this,
                map_queues_stats = {},
                queue;

            $.each(data.queues_stats.data, function(k, v) {
                queue = map_queues_stats[v.queue_id] || {
                    current_calls: 0,
                    max_calls: 0,
                    current_agents: 0,
                    max_agents: 0,
                    dropped_calls: 0,
                    average_hold_time: 0
                };

                if(v.calls) {
                    $.each(v.calls, function(k2, v2) {
                        queue.max_calls++;

                        if(v2.abandoned) {
                            queue.dropped_calls++;
                        }
                        else if(v2.duration && v2.agent_id) {
                            if(v2.wait_time) {
                                queue.average_hold_time+=v2.wait_time;
                            }
                        }
                    });
                }

                map_queues_stats[v.queue_id] = queue;
            });

            return map_queues_stats;
        },

        format_agents_stats: function(data) {
            var THIS = this,
                map_agents_stats = {},
                agent;

            $.each(data.agents_stats.data, function(k, v) {
                agent = map_agents_stats[v.agent_id] || {
                    status: 'off',
                    call_time: 0,
                    break_time: 0,
                    new_calls: 0,
                    call_per_hour: 0,
                    call_per_day: 0,
                    calls_missed: 0,
                    queues_list: {}
                };

                if(v.calls_missed) {
                    $.each(v.calls_missed, function(k2, v2) {
                        agent.calls_missed++;

                        if(v2.queue_id && !(v2.queue_id in agent.queues_list)) {
                            agent.queues_list[v2.queue_id] = {
                                calls_missed: 0,
                                call_per_hour: 0,
                                call_per_day: 0
                            }
                        }

                        agent.queues_list[v2.queue_id].calls_missed++;
                    });
                }

                if(v.calls_handled) {
                    $.each(v.calls_handled, function(k2, v2) {
                        if(v2.queue_id && !(v2.queue_id in agent.queues_list)) {
                            agent.queues_list[v2.queue_id] = {
                                calls_missed: 0,
                                call_per_hour: 0,
                                call_per_day: 0
                            }
                        }

                        if(THIS.get_diff_seconds(v.recorded_at) < 3600) {
                            agent.call_per_hour++;
                            agent.queues_list[v2.queue_id].call_per_hour++;
                        }
                        agent.call_per_day++;
                        agent.queues_list[v2.queue_id].call_per_day++;
                    });
                }

                map_agents_stats[v.agent_id] = agent;
            });

            return map_agents_stats;
        },

        get_diff_seconds: function(timestamp) {
            var date_var = new Date((timestamp - 62167219200)*1000).valueOf(),
                date_now = new Date().valueOf();

            return Math.round((date_now - date_var)/1000);
        },

        render_timers: function(data, parent) {
            var THIS = this,
                map_new_calls = {};

            if(data.waiting_calls) {
                $.each(data.waiting_calls, function(queue_id, queue_calls) {
                    $.each(queue_calls, function(call_id, call) {
                        call.queue_id = queue_id;
                        map_new_calls[call_id.toLowerCase()] = call;
                    });
                });

                $.each(map_new_calls, function(k, v) {
                    if(!(k in THIS.map_timers.calls)) {
                        THIS.add_callwaiting(v);
                    }
                });
            }

            if(data.current_statuses) {
                $.each(data.current_statuses, function(k, v) {
                    if(v === 'paused' && !(k in THIS.map_timers.breaks)) {
                        //TODO We don't have the duration of a break for now so we won't display the timer.
                        //THIS.start_timer($('.agent_wrapper#'+k+' .call_time .data_value'), 0, k, 'paused');
                    }
                    else if(v !== 'paused' && k in THIS.map_timers.breaks) {
                        clearInterval(THIS.map_timers.breaks[k].timer);
                        delete THIS.map_timers.breaks[k];
                    }
                });
            }

            if(data.active_calls) {
                $.each(data.active_calls, function(k, v) {
                    if(v.agent_state === 'answered' && !(k in THIS.map_timers.users)) {
                        THIS.start_timer($('.agent_wrapper#'+k+' .call_time .data_value'), v.duration, k);
                    }
                });
            }

            if(THIS.map_timers) {
                $.each(THIS.map_timers.calls, function(k, v) {
                    if(!(k in map_new_calls)) {
                        THIS.remove_callwaiting(k);
                    }
                });

                $.each(THIS.map_timers.breaks, function(k, v) {
                    if(!(k in data.current_statuses)) {
                        clearInterval(THIS.map_timers.breaks[k].timer);
                        delete THIS.map_timers.breaks[k];
                    }
                });

                $.each(THIS.map_timers.users, function(k, v) {
                    if(!(k in data.active_calls) || data.active_calls[k].agent_state === 'wrapup') {
                        clearInterval(THIS.map_timers.users[k].timer);
                        delete THIS.map_timers.users[k];
                    }
                });
            }
        },

        render_dashboard: function(_parent, callback) {
            var THIS = this,
                parent = _parent;

            THIS.clean_timers();

            THIS.fetch_all_data(true, function(data) {
                dashboard_html = THIS.templates.dashboard.tmpl(data);

                THIS.poll_agents(data, parent);

                (parent)
                    .empty()
                    .append(dashboard_html);

                THIS.render_callwaiting_list(dashboard_html);

                THIS.bind_live_events(parent);

                THIS.render_timers({active_calls: data.agents_live_stats.data.current_calls, waiting_calls: data.queues_live_stats.data.current_calls, current_statuses: data.agents_live_stats.data.current_statuses});

                if(typeof callback === 'function') {
                    callback()
                }
            });
        },

        fetch_all_data: function(loading, callback) {
            var THIS = this;

            THIS.get_agents_stats(loading, function(_data_stats_agents) {
                THIS.get_queues_stats(loading, function(_data_stats_queues) {
                    THIS.get_queues_livestats(loading, function(_data_live_queues) {
                        THIS.get_agents_livestats(loading, function(_data_live_agents) {
                            THIS.get_queues(loading, function(_data_queues) {
                                THIS.get_agents(loading, function(_data_agents) {
                                    var _data = {
                                        queues: _data_queues.data,
                                        agents: _data_agents.data,
                                        agents_stats: _data_stats_agents,
                                        queues_stats: _data_stats_queues,
                                        agents_live_stats: _data_live_agents,
                                        queues_live_stats: _data_live_queues,
                                    };

                                    _data = THIS.format_data(_data);

                                    if(typeof callback === 'function') {
                                        callback(_data);
                                    }
                                });
                            });
                        });
                    });
                });
            });
        },

        bind_live_events: function(parent) {
            var THIS = this;
            //TODO After first display, tooltip are not showing up anymore
            $('*[rel=popover]:not([type="text"])', parent).popover({
                trigger: 'hover'
            });

            $('.list_queues_inner > li', parent).die().live('click', function() {
                //THIS IS A HACK. :)
                $('.popover').remove();
                var $this_queue = $(this),
                    queue_id = $this_queue.attr('id');

                if($this_queue.hasClass('active')) {
                    THIS.current_queue_id = undefined;
                    $('.agent_wrapper', parent).show();
                    $('.all_data', parent).show();
                    $('.queue_data', parent).hide();
                    $('#callwaiting-list li', parent).show();
                    $('.icon.edit_queue', parent).hide();
                    $('.list_queues_inner > li', parent).removeClass('active');
                }
                else {
                    THIS.detail_stat(queue_id, parent);
                }
            });

            $('.list_queues_inner > li .edit_queue', parent).die().live('click', function() {
                //THIS IS A HACK. :)
                $('.popover').remove();

                var dom_id = $(this).parents('li').first().attr('id');
                winkstart.publish('queue.activate', { parent: $('#ws-content'), callback: function() {
                    winkstart.publish('queue.edit', { id: dom_id });
                }});
            });
        },

        detail_stat: function(queue_id, parent) {
            var THIS = this,
                $this_queue = $('#'+queue_id, parent);

            THIS.current_queue_id = queue_id;

            $('.list_queues_inner > li', parent).removeClass('active');
            $('.icon.edit_queue', parent).hide();

            $('.icon.edit_queue', $this_queue).show();
            $this_queue.addClass('active');

            $('#callwaiting-list li', parent).each(function(k, v) {
                var $v = $(v);

                if($v.dataset('queue_id') !== queue_id) {
                    $v.hide();
                }
                else {
                    $v.show();
                }
            });

            $('.agent_wrapper', parent).each(function(k, v) {
                var $v = $(v);

                if($v.dataset('queues').indexOf(queue_id) < 0) {
                    $v.hide();
                }
                else {
                    $v.show();
                    $('.all_data', $v).hide();
                    $('.queue_stat', $v).hide();
                    $('.queue_stat[data-id='+queue_id+']', $v).show();
                    $('.queue_data', $v).show();
                }
            });
        },

        clean_timers: function() {
            var THIS = this;

            if(THIS.global_timer !== false) {
                clearInterval(THIS.global_timer);
                THIS.global_timer = false;
            }

            $.each(THIS.map_timers, function(type, list_timers) {
                $.each(list_timers, function(k, v) {
                    clearInterval(v.timer);
                });
            });

            THIS.map_timers = {
                users: {},
                breaks: {},
                calls: {}
            };
        },

        activate_queue_stat: function(args) {
            var THIS = this,
                parent = args.parent || $('#ws-content');

            parent.empty();

            THIS.render_dashboard(parent, function() {
                var $this_queue = $('#'+args.id, parent);

                THIS.detail_stat(args.id, parent);
            });
        },

        activate: function(_parent) {
            var THIS = this,
                parent = _parent || $('#ws-content');

            parent.empty();

            THIS.render_dashboard(parent);
        }
    }
);
