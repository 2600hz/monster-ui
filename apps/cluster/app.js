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
		cmapi: 'http://localhost/2600/v1/accounts/accountidhere/',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
		 
			'servers.list': {
				//apiRoot: 'http://www.colelabs.com/2600/v1/accounts/{accountId}/',
				apiRoot: 'http://localhost/2600/v1/accounts/{accountId}/',
				url: 'system/{cluster}',
				verb: 'GET'
			},
			'localservers.list': {
				apiRoot: 'apps/cluster/static/data/',
				//apiRoot: this.cmapi ,
				url: '{cluster}.json',
				verb: 'GET'
			} 

		},

		subscribe: {},

		load: function (callback) {
			var self = this;
			self.initApp(function() { 
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},
		
		render: function (container, cluster) {

			 //Find better place to stick this
			 window.Handlebars.registerHelper('select', function( value, options ){
		        var $el = $('<select />').html( options.fn(this) );
		        $el.find('[value=' + value + ']').attr({'selected':'selected'});
		        return $el.html();
		    });

			var self = this,
				format = function (data) {
					for (var server in data.servers) {

						/*
							TODO: remove when API works
						*/

						data.servers[server].id = server;

						var status = ['up', 'up', 'up', 'warning', 'down'],
							alerts = ['Database HTTPS Error', 'Server Version Old'];

						/*
						data.servers[server].status = status[Math.floor(Math.random() * status.length)];

						data.servers[server].nic1 = ( Math.round(Math.random()) == 1 ) ? true : false;
						data.servers[server].nic2 = ( Math.round(Math.random()) == 1 ) ? true : false;
						data.servers[server].vpn = ( Math.round(Math.random()) == 1 ) ? true : false;
						
						data.servers[server].cpu = Math.floor((Math.random() * 100) + 1);
						data.servers[server].ram = Math.floor((Math.random() * 100) + 1);
						data.servers[server].disk = Math.floor((Math.random() * 100) + 1);
						
						data.servers[server].speed = Math.floor(Math.random() * 500) + 1;
						data.servers[server].ping = Math.floor(Math.random() * 150) + 1;
						*/
						/*
						if ( data.servers[server].status == 'warning' || data.servers[server].status == 'down' ) {
							data.servers[server].alert = alerts[Math.floor(Math.random() * alerts.length)];
						} else {
							data.servers[server].alert = 'No error';
						}
						*/
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

			if (!cluster)
				cluster='kawlinlocal';


			if (cluster=='local1' || cluster == '2600hzlocal' || cluster == 'kawlinlocal')
				apiresource='localservers.list';
			else
				apiresource='servers.list';

			monster.request({
				resource: apiresource,
				data: {
					accountId: self.accountId,
					cluster: cluster
				},
				success: function(data, status) {
					console.log(self.accountId);
					data.cluster=cluster;
					console.log(data);

					if (data.noauth) {
						//alert("You need to log in first!");
						console.log(data);
						var container =  $('div#ws-content');
							clusterManagerTemplate = $(monster.template(self, 'login', data));
						container
							.empty()
							.append(clusterManagerTemplate);	
					}
					else { 
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
						formattedData.serverFilter=serverType;

					if (serverType != 'all') {
						data.serverFilter=serverType;
					}
					else
						data.serverFilter = null;

					if ( serverType != 'all' && serverType != 'carrier' && serverType != 'network' && serverType != 'security' && serverType != 'capacity') {
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
			

//			parent.find('div.left-menu').find('ul:first-child').find('li.nav-item:not(.role)').on('click', function () {
			parent.find('div.left-menu').find('ul').find('li.nav-item:not(.role)').on('click', function () {
				parent
					.find('div.left-menu')
					.find('ul')
					//.find('ul:first-child')
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
			activeView['cluster']=data.cluster;

			parent
				.find('div.right-content')
				.empty()
				.append($(monster.template(self, 'serversView', activeView)));
			

			if (data.serverFilter)
				parent
					.find('div#servers_view_container').find('div#servers_list')
					.prepend($(monster.template(
						self,
						data.serverFilter + 'List',
						data
					)));		

			if (data.serverFilter != 'carrier' && data.serverFilter != 'network' && data.serverFilter != 'security' && data.serverFilter != 'capacity' )
			parent
				.find('div#servers_view_container').find('div#servers_list')
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
	
			//Action Dropdown
			parent.find('button.btnaction').on('click', function () {
			dn = $(this).attr('client');
			ip = $(this).attr('ip');				
			command = $("#sel_"+dn).val();
			//alert(command);
			$("#php").html("");	
			$("#php").load(self.cmapi + "ssh", 
				{ip:ip, command:command}, 
				function() {
					$( "#php" ).attr("title",ip + '-' + command);
					$( "#php" ).dialog();
				});

			});

			//CPU, MEM, HD Metrics
			parent.find('.barmetric').on('click', function () {
				dn = $(this).attr('client');
				metric = $(this).attr('metric');				
				///////$("#php").html("<img width='95%' height='95%' src='" + self.cmapi + "show_graph/"+dn+"/"+metric+"'>");
				$("#php").html("<img width='95%' height='95%' src='apps/cluster/static/images/graphall.png'>");
				//$("#php").html("<img src='http://localhost/db/2600/index.php/cm/show_graph/"+dn+"/"+metric+"'>");
				//$("#php").attr("title","");
				//$("#php").attr("title",dn + '  -  ' + metric);
				var wWidth = $(window).width();
				var dWidth = wWidth * 0.8;
				var wheight = $(window).height();
				var dheight = wheight * 0.8;

				$("#php").dialog({height:600,  width:800, modal:true, 
					buttons: {
						        "Ok!": function() {
						          $( this ).dialog( "close" );
						         } 
						     } 
				});
			});

			//Sensu Event Buttons
			parent.find('.btn-sensuevent').on('click', function () {
				$("#php").html( $(this).attr("output") );
				$("#php").dialog({ modal:true, width:500, height:300, title:$(this).attr('check'), 
					buttons: {
						        "Silence Client": function() {
						          $( this ).dialog( "close" );
						         },
						         "Silence Check": function() {
						          $( this ).dialog( "close" );
						         },
						          "Resolve": function() {
						          $( this ).dialog( "close" );
						         }
						     } 
				});
			});


			//Cluster Selection Dropdown
			parent.find('#selcluster').on('change', function () {
					targetcluster=$("#selcluster").val(); 
					$("#servers_list").fadeOut(2000);
					self.render(null, targetcluster);
			});

			parent.find('.regionfilter').on('click', function() {
				alert('werdup');
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
