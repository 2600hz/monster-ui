define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		footable = require('footable'),
		footableFilter = require('footable-filter'),
		footableSort = require('footable-sort'),
		leaflet = require('leaflet'),
		monster = require('monster');

	var app = {

		name: 'cluster',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			/*
			'servers.list': {
				apiRoot: 'apps/cluster/static/data/',
				url: 'servers.json',
				verb: 'GET'
			}*/
			'servers.list': {
				apiRoot: 'http://colelabs.com/2600/cm/',
				url: 'servers',
				verb: 'GET'
			}
		},

		subscribe: {},

		load: function (callback) {
			var self = this;

			callback && callback(self);
		},

		render: function (container) {
			var self = this,
				format = function (data) {
					for (var server in data.servers) {

						/*
							TODO: remove when API works
						*/

						data.servers[server].id = server;

						var status = ['up', 'up', 'up', 'warning', 'down'],
							alerts = ['Database HTTPS Error', 'Server Version Old'];

						data.servers[server].status = status[Math.floor(Math.random() * status.length)];

						data.servers[server].nic1 = ( Math.round(Math.random()) == 1 ) ? true : false;
						data.servers[server].nic2 = ( Math.round(Math.random()) == 1 ) ? true : false;
						data.servers[server].vpn = ( Math.round(Math.random()) == 1 ) ? true : false;

						data.servers[server].cpu = Math.floor((Math.random() * 100) + 1);
						data.servers[server].ram = Math.floor((Math.random() * 100) + 1);
						data.servers[server].disk = Math.floor((Math.random() * 100) + 1);

						data.servers[server].speed = Math.floor(Math.random() * 500) + 1;
						data.servers[server].ping = Math.floor(Math.random() * 150) + 1;

						if ( data.servers[server].status == 'warning' || data.servers[server].status == 'down' ) {
							data.servers[server].alert = alerts[Math.floor(Math.random() * alerts.length)];
						} else {
							data.servers[server].alert = 'No error';
						}

						// data.servers[server].role = data.servers[server].type;
						// delete data.servers[server].type;

						/*
							end TODO
						*/

						data.servers[server].cpu_overload = ( data.servers[server].cpu >= 75 ) ? true : false;
						data.servers[server].ram_overload = ( data.servers[server].ram >= 75 ) ? true : false;
						data.servers[server].disk_overload = ( data.servers[server].disk >= 75 ) ? true : false;

						if ( data.servers[server].alert == '' ) {
							data.servers[server].alert = 'No error';
						}
					}

					return data;
				},
				formatToServersStatus = function (data) {
					var serversStatusByType = new Array(),
						serversTypes = new Array(),
						formattedData = new Object(),
						getServersStatus = function (statusList) {
							var counter = 0;

							for (var status in statusList) {
								if ( statusList[status] == 'up' ) {
									++counter;
								}
							}

							if ( counter == 0 ) {
								return 'down';
							} else if ( counter == 1 ) {
								return 'warning';
							} else {
								return 'up';
							}
						};

					for (var server in data.servers) {

						/*
							Test if array
						*/

						if ( data.servers[server].type instanceof Array ) {
							/* Format if array */
						}

						/*
							End Test
						*/

						serversTypes.push(data.servers[server].type);
					}

					serversTypes = _.uniq(serversTypes, true);

					for (var type in serversTypes) {
						var serversStatus = new Array();

						for (var server in data.servers) {
							if ( data.servers[server].type == serversTypes[type] ) {
								serversStatus.push(data.servers[server].status);
							}
						}

						formattedData[serversTypes[type]] = getServersStatus(serversStatus);
					}

					for (var status in formattedData) {
						serversStatusByType.push(formattedData[status]);
					}

					formattedData.all = getServersStatus(serversStatusByType);

					return formattedData;
				};

			monster.request({
				resource: 'servers.list',
				data: {},
				success: function(data, status) {
					var data = format(data),
						container = container || $('div#ws-content'),
						serversStatus = formatToServersStatus(data),
						clusterManagerTemplate = $(monster.template(self, 'app', serversStatus));

					container
						.empty()
						.append(clusterManagerTemplate);

					self.renderServersView(clusterManagerTemplate, data);
					self.bindEvents(clusterManagerTemplate, data);

				}
			});
		},

		/* Expected params:
			parent (mandatory),
			data (mandatory)
		*/
		bindEvents: function (parent, data) {
			var self = this,
				filterServersByType = function(data, serverType) {
					var formattedData = { servers: [] },
						serverType = ( serverType == 'servers' ) ? 'all' : serverType;

					if ( serverType != 'all' ) {
						for (var server in data.servers) {
							if ( data.servers[server].type == serverType ) {
								formattedData.servers.push(data.servers[server]);
							}
						}

						return formattedData;
					} else {
						return data;
					}
				};

			parent.find('div.left-menu').find('ul:first-child').find('li.nav-item:not(.role)').on('click', function () {
				parent
					.find('div.left-menu')
					.find('ul:first-child')
					.find('li.nav-item.active')
					.removeClass('active');

				$(this).addClass('active');

				self.renderServersView(
					parent,
					filterServersByType(data, $(this).prop('id')),
					parent.find('div.server-actions').find('div.switch-view.active').data('view')
				);
			});
		},

		/* Expected params:
			parent (mandatory),
			data (mandatory),
			viewType (optional, 'map' by default)
		*/
		renderServersView: function (parent, data, viewType) {
			var self = this,
				activeView = new Object(),
				viewType = ( typeof viewType != 'undefined' ) ? viewType : 'list';

			activeView[viewType] = true;

			parent
				.find('div.right-content')
				.empty()
				.append($(monster.template(self, 'serversView', activeView)));

			parent
				.find('div#servers_view_container')
				.append($(monster.template(
					self,
					'servers' + viewType.charAt(0).toUpperCase() + viewType.slice(1),
					data
				)));

			if ( viewType == 'map' ) {
				self.renderMap(parent, data);
			} else {
				parent
					.find('div.server-actions')
					.find('span.search-box')
					.css({
						opacity: '1',
						visibility: 'visible'
					});;

					parent
						.find('.footable')
						.footable($, footable);
			}

			self.bindServersViewEvents(parent, data);
		},

		/* Expected params:
			parent (mandatory),
			data (mandatory)
		*/
		bindServersViewEvents: function (parent, data) {
			var self = this;

			parent.find('div.server-actions').find('div.switch-view').on('click', function () {
				var viewType = $(this).data('view');

				if ( !$(this).hasClass('active') ) {
					parent
						.find('div.server-actions')
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

					if ( viewType == 'map' ) {
						parent
							.find('div.server-actions')
							.find('span.search-box')
							.animate({opacity: '0'}, 300)
							.css('visibility', 'hidden');

						self.renderMap(parent, data);
					} else {
						parent
							.find('div.server-actions')
							.find('span.search-box')
							.css('visibility', 'visible')
							.animate({opacity: '1'}, 300);

						parent
							.find('.footable')
							.footable($, footable);
					}
				}
			});
		},

		/* Expected params:
			parent (mandatory),
			data (mandatory)
		*/
		renderMap: function (parent, data) {
			var self = this,
				markers = new Array(),
				map = L.map('map', {
						center: [32, 10],
						zoom: 2,
						zoomControl: false
				});

			L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {
					attribution: 'Map data &copy; 2011 <a href="http://www.openstreetmap.org/#map=2/39.0/7.7">OpenStreetMap</a> contributors, Imagery &copy; 2011 <a href="">CloudMade</a>.',
					key: 'BC9A493B41014CAABB98F0471D759707',
					styleId: 22677
				})
				.addTo(map);

			for (var server in data.servers) {
				var icon = L.icon({
						iconUrl: 'css/leaflet/images/marker-server-' + data.servers[server].status + '.png',
						iconSize: [25, 41],
						iconAnchor: [12, 41],
						shadowUrl: 'css/leaflet/images/marker-shadow.png',
						shadowSize: [41, 41]
					});

				markers.push(L.marker([data.servers[server].lat, data.servers[server].lng], { icon: icon, id: data.servers[server].id }));
			}

			L.layerGroup(markers).addTo(map);

			map.doubleClickZoom.disable();
			map.scrollWheelZoom.disable();
			map.dragging.disable();

			self.bindMapEvents(parent, data);
		},

		/* Expected params:
			parent (mandatory),
			data (mandatory)
		*/
		bindMapEvents: function (parent, data) {
			var self = this;

			parent.find('div#map').find('div.leaflet-marker-pane').find('img').on('click', function () {
				var serversList = { servers: [] },
					city = '';

				for (var server in data.servers) {
					if ( data.servers[server].id == $(this).prop('id') ) {
						city = data.servers[server].city;
					}
				}

				for (var server in data.servers) {
					if ( data.servers[server].city == city ) {
						serversList.servers.push(data.servers[server]);
					}
				}

				var template = $(monster.template(self, 'serversList', serversList));
				template.find('.footable').footable();
				monster.ui.dialog(template);
				$('div.ui-widget-content').prop('id', 'ui-dialog-map');

			});
		}
	};

	return app;
});
