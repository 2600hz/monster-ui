define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		leaflet = require('leaflet'),
		monster = require('monster');

	var app = {

		name: 'cluster',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {},

		subscribe: {},

		load: function(callback){
			var self = this;

			callback && callback(self);
		},

		render: function(container){
			var self = this,
				container = container || $('div#ws-content'),
				clusterManagerView = $(monster.template(self, 'app'));

			self.bindEvents(clusterManagerView);
			self.renderServersView(clusterManagerView);

			container
				.empty()
				.append(clusterManagerView);
		},

		bindEvents: function(parent) {
			var self = this;

			parent.find('div.left-menu').find('li.nav-item:not(.role)').on('click', function() {
				parent
					.find('div.left-menu')
					.find('li.nav-item.active')
					.removeClass('active');
				$(this).addClass('active');
			});

			parent.find('#servers').on('click', function() {
				self.renderServersView(parent);
			});
		},

		renderServersView: function(parent) {
			var self = this,
				serversView = $(monster.template(self, 'serversView')),
				dataTemplate = {
						servers: [
						{ status: "down", ip: "125.0.0.1", dn: "1.amazon.com", country: "RU", city: "Moscow", alert: "Databse https error", speed: 120, ping: 96, nic1: true, nic2: false, vpn: false, cpu: 42, ram: 93, disk: 67 },
						{ status: "warning", ip: "10.0.1.23", dn: "1.amazonaws.com", country: "RU", city: "Saint Petersburg ", alert: "Databse http error", speed: 1800, ping: 400, nic1: true, nic2: false, vpn: true, cpu: 83, ram: 18, disk: 47 },
						{ status: "up", ip: "10.25.14.136", dn: "2.amazon.com", country: "GB", city: "London", alert: "Server version old", speed: 109, ping: 43, nic1: true, nic2: true, vpn: true, cpu: 56, ram: 29, disk: 18 },
						{ status: "up", ip: "10.25.14.136", dn: "3.amazon.com", country: "IN", city: "Mumbai", alert: "CPU overload", speed: 58, ping: 18, nic1: true, nic2: true, vpn: true, cpu: 78, ram: 57, disk: 54 },
						{ status: "up", ip: "10.25.14.136", dn: "2.amazonaws.com", country: "US", city: "San Francisco", alert: "Disk overload", speed: 57, ping: 98, nic1: true, nic2: true, vpn: true, cpu: 68, ram: 35, disk: 98 },
						{ status: "up", ip: "10.25.14.136", dn: "3.amazonaws.com", country: "US", city: "San Francisco", alert: "", speed: 68, ping: 57, nic1: true, nic2: true, vpn: true, cpu: 64, ram: 75, disk: 45 }
						]
					};

			for (var key in dataTemplate.servers) {
				dataTemplate.servers[key].cpu_overload = ( dataTemplate.servers[key].cpu >= 75 ) ? true : false;
				dataTemplate.servers[key].ram_overload = ( dataTemplate.servers[key].ram >= 75 ) ? true : false;
				dataTemplate.servers[key].disk_overload = ( dataTemplate.servers[key].disk >= 75 ) ? true : false;

				if ( dataTemplate.servers[key].alert == '' ) {
					dataTemplate.servers[key].alert = 'No error';
				}
			}

			parent
				.find('div.right-content')
				.empty()
				.append(serversView);

			var viewType = parent.find('div.switch-view.active').data('view');

			parent
				.find('div#servers_view_container')
				.append($(monster.template(
					self,
					'servers' + viewType.charAt(0).toUpperCase() + viewType.slice(1),
					dataTemplate
				)));

			self.bindServersViewEvents(parent, dataTemplate);
		},

		bindServersViewEvents: function(parent, data) {
			var self = this;

			parent.find('div.server-actions').find('div.switch-view').on('click', function() {
				var viewType = $(this).data('view');

				if ( !$(this).hasClass('active') ) {
					parent
						.find('div.switch-view.active')
						.removeClass('active');
					$(this).addClass('active');

					parent
						.find('div#servers_view_container')
						.find('div[id^="servers_"][data-view]')
						.remove();

					parent
						.find('div#servers_view_container')
						.append($(monster.template(
							self,
							'servers' + viewType.charAt(0).toUpperCase() + viewType.slice(1),
							data
						)));
				}
			});
		}
	};

	return app;
});
