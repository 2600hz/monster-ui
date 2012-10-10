winkstart.module('voip', 'registration',
	{
		css: [
            'css/registration.css'
		],

		templates: {
			registration: 'tmpl/registration.html'
		},

		subscribe: {
			'registration.activate' : 'activate'
		},

		resources: {
			'registration.list': {
				url: '{api_url}/accounts/{account_id}/registrations',
				contentType: 'application/json',
				verb: 'GET'
			}
		}
	},

	function(args) {
		winkstart.registerResources(this.__whapp, this.config.resources);

		winkstart.publish('whappnav.subnav.add', {
			whapp: 'voip',
			module: this.__module,
			label: 'Registrations',
			icon: 'registration',
			weight: '35'
		});
	},

	{
		activate: function(data) {
			var THIS = this;

			var registration_html = THIS.templates.registration.tmpl({}).appendTo( $('#ws-content').empty() );

            THIS.setup_table(registration_html);

            THIS.list_registrations(registration_html);

            $('#refresh_registrations', registration_html).click(function() {
                winkstart.table.registration.fnClearTable();

                THIS.list_registrations(registration_html);
            });
		},

        list_registrations: function(registration_html) {
            var parse_date = function(timestamp) {
                    var parsed_date = '-';

                    if(timestamp) {
                        var date = new Date((timestamp - 62167219200)*1000),
                            month = date.getMonth() +1,
                            year = date.getFullYear(),
                            day = date.getDate(),
                            humanDate = month+'/'+day+'/'+year,
                            humanTime = date.toLocaleTimeString();

                        parsed_date = humanDate + ' ' + humanTime;
                    }

                    return parsed_date;
                };

		    winkstart.getJSON('registration.list', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(reply) {
                    var tab_data = [];
                    $.each(reply.data, function() {
                        var humanTime = parse_date(this.event_timestamp);
                        this.contact = this.contact.replace(/"/g,"");
                        this.contact = this.contact.replace(/'/g,"\\'");
                        var stringToDisplay = 'Details of Registration<br/>';
                        stringToDisplay += '<br/>App-Name: ' + this.app_name;
                        stringToDisplay += '<br/>App-Version: ' + this.app_version;
                        stringToDisplay += '<br/>Call-ID: ' + this.call_id;
                        stringToDisplay += '<br/>Contact: ' + this.contact;
                        stringToDisplay += '<br/>Event-Category: ' + this.event_category;
                        stringToDisplay += '<br/>Event-Name: ' + this.event_name;
                        stringToDisplay += '<br/>Expires: ' + this.expires;
                        stringToDisplay += '<br/>FreeSWITCH-Hostname: ' + this.freeswitch_hostname;
                        stringToDisplay += '<br/>From-Host: ' + this.from_host;
                        stringToDisplay += '<br/>From-User: ' + this.from_user;
                        stringToDisplay += '<br/>Network-IP: ' + this.network_ip;
                        stringToDisplay += '<br/>Contact-IP: ' + this.contact_ip;
                        stringToDisplay += '<br/>Contact-Port: ' + this.contact_port;
                        stringToDisplay += '<br/>Network-Port: ' + this.network_port;
                        stringToDisplay += '<br/>Presence-Hosts: ' + this.presence_hosts;
                        stringToDisplay += '<br/>Profile-Name: ' + this.profile_name;
                        stringToDisplay += '<br/>RPid: ' + this.rpid;
                        stringToDisplay += '<br/>Realm: ' + this.realm;
                        stringToDisplay += '<br/>Server-ID: ' + this.server_id;
                        stringToDisplay += '<br/>Status: ' + this.status;
                        stringToDisplay += '<br/>To-Host: ' + this.to_host;
                        stringToDisplay += '<br/>To-User: ' + this.to_user;
                        stringToDisplay += '<br/>User-Agent: ' + this.user_agent;
                        stringToDisplay += '<br/>Username: ' + this.username;
                        stringToDisplay += '<br/>Date: ' + humanTime;

                        tab_data.push([this.username, this.contact_ip, this.contact_port, humanTime, stringToDisplay]);
                    });

                    winkstart.table.registration.fnAddData(tab_data);

                    //Hack to hide pagination if number of rows < 10
                    if(reply.data.length < 10){
                        $('.dataTables_paginate', registration_html).hide();
                    }
			    }
            );
        },

		setup_table: function(parent) {
			var THIS = this,
			    columns = [
                {
                    'sTitle': 'Username'
                },
                {
                    'sTitle': 'IP'
                },
                {
                    'sTitle': 'Port'
                },
                {
                    'sTitle': 'Date'
                },
                {
                    'sTitle': 'Details',
                    'fnRender': function(obj) {
                        winkstart.log(obj);
                        var reg_details = obj.aData[obj.iDataColumn];
                        return '<a href="#" onClick="winkstart.alert(\'info\',\''+reg_details+'\');">Details</a>';
                    }
                }
			];

			winkstart.table.create('registration', $('#registration-grid', parent), columns, {}, {
                sDom: 'frtlip',
                aaSorting: [[3, 'desc']]
            });

			$('#registration-grid_filter input[type=text]', parent).first().focus();

			$('.cancel-search', parent).click(function(){
				$('#registration-grid_filter input[type=text]', parent).val('');
				winkstart.table.registration.fnFilter('');
			});
		}
	}
);
