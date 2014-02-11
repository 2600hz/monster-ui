define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		chart = require('chart');

	var app = {
		requests: {
			'voip.myOffice.getAccount': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			},
			'voip.myOffice.updateAccount': {
				url: 'accounts/{accountId}',
				verb: 'POST'
			},
			'voip.myOffice.listUsers': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			},
			'voip.myOffice.listDevices': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'voip.myOffice.listNumbers': {
				url: 'accounts/{accountId}/phone_numbers',
				verb: 'GET'
			},
			'voip.myOffice.listDirectories': {
				url: 'accounts/{accountId}/directories',
				verb: 'GET'
			},
			'voip.myOffice.listTypedCallflows': {
				url: 'accounts/{accountId}/callflows?has_value=type',
				verb: 'GET'
			},
			'voip.myOffice.listMedia': {
				url: 'accounts/{accountId}/media?key_missing=type',
				verb: 'GET'
			},
			'voip.myOffice.createMedia': {
				url: 'accounts/{accountId}/media',
				verb: 'PUT'
			},
			'voip.myOffice.deleteMedia': {
				url: 'accounts/{accountId}/media/{mediaId}',
				verb: 'DELETE'
			},
            'voip.myOffice.uploadMedia': {
                url: 'accounts/{accountId}/media/{mediaId}/raw',
                verb: 'POST',
                type: 'application/x-base64'
            }
		},

		subscribe: {
			'voip.myOffice.render': 'myOfficeRender'
		},

		/* My Office */
		myOfficeRender: function(args) {
			var self = this,
				parent = args.parent || $('.right-content');

			self.myOfficeLoadData(function(myOfficeData) {
				var dataTemplate = {
						account: myOfficeData.account,
						totalUsers: myOfficeData.users.length,
						totalDevices: myOfficeData.devices.length,
						totalNumbers: _.size(myOfficeData.numbers),
						totalConferences: myOfficeData.totalConferences,
						mainNumbers: myOfficeData.mainNumbers,
						confNumbers: myOfficeData.confNumbers,
						faxNumbers: myOfficeData.faxNumbers,
						devicesList: _.toArray(myOfficeData.devicesData).sort(function(a, b) { return b.count - a.count ; }),
						assignedNumbersList: _.toArray(myOfficeData.assignedNumbersData).sort(function(a, b) { return b.count - a.count ; }),
						numberTypesList: _.toArray(myOfficeData.numberTypesData).sort(function(a, b) { return b.count - a.count ; })
					},
					template = $(monster.template(self, 'myOffice-layout', dataTemplate)),
					chartOptions = {
						animateScale: true,
						segmentShowStroke: false,
						// segmentStrokeWidth: 1,
						animationSteps: 50,
						animationEasing: "easeOutCirc",
						percentageInnerCutout: 60
					},
					devicesChart = new Chart(template.find('#dashboard_devices_chart').get(0).getContext("2d")).Doughnut(
						$.map(myOfficeData.devicesData, function(val) {
							return {
								value: val.count,
								color: val.color
							};
						}).sort(function(a, b) { return b.value - a.value ; }), 
						chartOptions
					),
					assignedNumbersChart = new Chart(template.find('#dashboard_assigned_numbers_chart').get(0).getContext("2d")).Doughnut(
						$.map(myOfficeData.assignedNumbersData, function(val) {
							return {
								value: val.count,
								color: val.color
							};
						}).sort(function(a, b) { return b.value - a.value ; }), 
						chartOptions
					),
					numberTypesChart = new Chart(template.find('#dashboard_number_types_chart').get(0).getContext("2d")).Doughnut(
						$.map(myOfficeData.numberTypesData, function(val) {
							return {
								value: val.count,
								color: val.color
							};
						}).sort(function(a, b) { return b.value - a.value ; }), 
						chartOptions
					);

				self.myOfficeBindEvents({
					parent: parent,
					template: template,
					myOfficeData: myOfficeData
				});

				parent
					.empty()
					.append(template);
			});
		},

		myOfficeLoadData: function(callback) {
			var self = this;
			monster.parallel({
					account: function(parallelCallback) {
						monster.request({
							resource: 'voip.myOffice.getAccount',
							data: {
								accountId: self.accountId
							},
							success: function(dataUsers) {
								parallelCallback && parallelCallback(null, dataUsers.data);
							}
						});
					},
					users: function(parallelCallback) {
						monster.request({
							resource: 'voip.myOffice.listUsers',
							data: {
								accountId: self.accountId
							},
							success: function(dataUsers) {
								parallelCallback && parallelCallback(null, dataUsers.data);
							}
						});
					},
					devices: function(parallelCallback) {
						monster.request({
							resource: 'voip.myOffice.listDevices',
							data: {
								accountId: self.accountId
							},
							success: function(data) {
								parallelCallback && parallelCallback(null, data.data);
							}
						});
					},
					numbers: function(parallelCallback) {
						monster.request({
							resource: 'voip.myOffice.listNumbers',
							data: {
								accountId: self.accountId
							},
							success: function(data) {
								parallelCallback && parallelCallback(null, data.data.numbers);
							}
						});
					},
					// directories: function(parallelCallback) {
					// 	monster.request({
					// 		resource: 'voip.myOffice.listDirectories',
					// 		data: {
					// 			accountId: self.accountId
					// 		},
					// 		success: function(data) {
					// 			parallelCallback && parallelCallback(null, data.data);
					// 		}
					// 	});
					// },
					callflows: function(parallelCallback) {
						monster.request({
							resource: 'voip.myOffice.listTypedCallflows',
							data: {
								accountId: self.accountId
							},
							success: function(data) {
								parallelCallback && parallelCallback(null, data.data);
							}
						});
					}
				},
				function(error, results) {
					callback && callback(self.myOfficeFormatData(results));
				}
			);
		},

		myOfficeFormatData: function(data) {
			var self = this,
				devices = {
					"sip_device": {
						label: self.i18n.active().devices.types.sip_device,
						count: 0,
						color: "#bde55f"
					},
					"cellphone": {
						label: self.i18n.active().devices.types.cellphone,
						count: 0,
						color: "#6cc5e9"
					},
					"smartphone": {
						label: self.i18n.active().devices.types.smartphone,
						count: 0,
						color: "#00a1e0"
					},
					"softphone": {
						label: self.i18n.active().devices.types.softphone,
						count: 0,
						color: "#b588b9"
					},
					"landline": {
						label: self.i18n.active().devices.types.landline,
						count: 0,
						color: "#f1e87c"
					},
					"fax": {
						label: self.i18n.active().devices.types.fax,
						count: 0,
						color: "#ef8f25"
					},
					"ata": {
						label: self.i18n.active().devices.types.ata,
						count: 0,
						color: "#6f7c7d"
					}
				},
				assignedNumbers = {
					"spare": {
						label: self.i18n.active().myOffice.numberChartLegend.spare,
						count: 0,
						color: "#6f7c7d"
					},
					"assigned": {
						label: self.i18n.active().myOffice.numberChartLegend.assigned,
						count: 0,
						color: "#6cc5e9"
					}
				},
				numberTypes = {
					"local": {
						label: self.i18n.active().myOffice.numberChartLegend.local,
						count: 0,
						color: "#6cc5e9"
					},
					"tollfree": {
						label: self.i18n.active().myOffice.numberChartLegend.tollfree,
						count: 0,
						color: "#bde55f"
					},
					"international": {
						label: self.i18n.active().myOffice.numberChartLegend.international,
						count: 0,
						color: "#b588b9"
					}
				},
				totalConferences = 0,
				mainNumbers = [],
				confNumbers = [],
				faxNumbers = [];

			_.each(data.devices, function(val) {
				if(val.device_type in devices) {
					devices[val.device_type].count++;
				} else {
					console.log('Unknown device type: '+val.device_type);
				}
			});

			_.each(data.numbers, function(val) {
				if("used_by" in val && val["used_by"].length > 0) {
					assignedNumbers["assigned"].count++;
				} else {
					assignedNumbers["spare"].count++;
				}

				//TODO: Find out the number type and increment the right category
				numberTypes["local"].count++;
			});

			_.each(data.users, function(val) {
				if(val.features.indexOf("conferencing") >= 0) {
					totalConferences++;
				}
			});

			_.each(data.callflows, function(val) {
				if(val.type === "main" && val.name === "MainCallflow") {
					_.each(val.numbers, function(num) {
						mainNumbers.push({
							number: num,
							e911: (data.numbers[num].features.indexOf("dash_e911") >= 0),
							callerId: (data.numbers[num].features.indexOf("outbound_cnam") >= 0)
						});
					});
				} else if(val.type === "conference" && val.name === "MainConference") {
					_.each(val.numbers, function(num) {
						confNumbers.push({
							number: num,
							e911: (data.numbers[num].features.indexOf("dash_e911") >= 0),
							callerId: (data.numbers[num].features.indexOf("outbound_cnam") >= 0)
						});
					});
				}
			});

			data.devicesData = devices;
			data.assignedNumbersData = assignedNumbers;
			data.numberTypesData = numberTypes;
			data.totalConferences = totalConferences;
			data.mainNumbers = mainNumbers;
			data.confNumbers = confNumbers;
			data.faxNumbers = faxNumbers;

			return data;
		},

		myOfficeBindEvents: function(args) {
			var self = this,
				parent = args.parent,
				template = args.template,
				myOfficeData = args.myOfficeData;

			template.find('.link-box').on('click', function(e) {
				var $this = $(this),
					category = $this.data('category'),
					subcategory = $this.data('subcategory');

				$('.category#my_office').removeClass('active');
				switch(category) {
					case "users":
						$('.category#users').addClass('active');
						monster.pub('voip.users.render', { parent: parent });
						break;
					case "devices":
						$('.category#devices').addClass('active');
						monster.pub('voip.devices.render', { parent: parent });
						break;
					case "numbers":
						$('.category#numbers').addClass('active');
						monster.pub('voip.numbers.render', parent);
						break;
					case "strategy":
						$('.category#strategy').addClass('active');
						monster.pub('voip.strategy.render', { parent: parent, openElement: subcategory });
						break;
				}
			});

			template.find('.header-link.music-on-hold').on('click', function(e) {
				e.preventDefault();
				self.myOfficeRenderMusicOnHoldPopup({
					account: myOfficeData.account
				});
			});

			template.find('.header-link.caller-id').on('click', function(e) {
				e.preventDefault();
				monster.ui.alert('Caller ID popup coming soon...')
			});
		},

		myOfficeRenderMusicOnHoldPopup: function(args) {
			var self = this,
				account = args.account,
				silenceMediaId = 'silence_stream://300000';

			self.groupsListMedias(function(medias) {
				var templateData = {
						silenceMedia: silenceMediaId,
						mediaList: medias,
						media: 'music_on_hold' in account && 'media_id' in account.music_on_hold ? account.music_on_hold.media_id : undefined
					},
					popupTemplate = $(monster.template(self, 'myOffice-musicOnHoldPopup', templateData)),
					popup = monster.ui.dialog(popupTemplate, {
					title: self.i18n.active().myOffice.musicOnHold.title,
					position: ['center', 20]
				});

				self.myOfficeMusicOnHoldPopupBindEvents({
					popupTemplate: popupTemplate,
					popup: popup,
					account: account
				})
			});
		},

		myOfficeMusicOnHoldPopupBindEvents: function(args) {
			var self = this,
				popupTemplate = args.popupTemplate,
				popup = args.popup,
				account = args.account,
				closeUploadDiv = function(newMedia) {
					var uploadInput = popupTemplate.find('.upload-input');
					uploadInput.wrap('<form>').closest('form').get(0).reset();
					uploadInput.unwrap();
					popupTemplate.find('.upload-div').slideUp(function() {
						popupTemplate.find('.upload-toggle').removeClass('active');
					});
					if(newMedia) {
						var mediaSelect = popupTemplate.find('.media-dropdown');
						mediaSelect.append('<option value="'+newMedia.id+'">'+newMedia.name+'</option>');
						mediaSelect.val(newMedia.id);
					}
				};

			popupTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			popupTemplate.find('.upload-toggle').on('click', function() {
				if($(this).hasClass('active')) {
					popupTemplate.find('.upload-div').stop(true, true).slideUp();
				} else {
					popupTemplate.find('.upload-div').stop(true, true).slideDown();
				}
			});

			popupTemplate.find('.upload-cancel').on('click', function() {
				closeUploadDiv();
			});

			popupTemplate.find('.upload-submit').on('click', function() {
				var file = popupTemplate.find('.upload-input')[0].files[0];
					fileReader = new FileReader();

				fileReader.onloadend = function(evt) {
					monster.request({
						resource: 'voip.myOffice.createMedia',
						data: {
							accountId: self.accountId,
							data: {
								streamable: true,
								name: file.name,
								media_source: "upload",
								description: file.name
							}
						},
						success: function(data, status) {
							var media = data.data;
							monster.request({
								resource: 'voip.myOffice.uploadMedia',
								data: {
									accountId: self.accountId,
									mediaId: media.id,
									data: evt.target.result
								},
								success: function(data, status) {
									closeUploadDiv(media);
								},
								error: function(data, status) {
									monster.request({
										resource: 'voip.myOffice.deleteMedia',
										data: {
											accountId: self.accountId,
											mediaId: media.id,
											data: {}
										},
										success: function(data, status) {

										}
									});
								}
							});
						}
					});
				};

				if(file) {
					fileReader.readAsDataURL(file);
				} else {
					monster.ui.alert(self.i18n.active().myOffice.musicOnHold.emptyUploadAlert);
				}
			});

			popupTemplate.find('.save').on('click', function() {
				var selectedMedia = popupTemplate.find('.media-dropdown option:selected').val();

				if(!('music_on_hold' in account)) {
					account.music_on_hold = {};
				}

				if(selectedMedia && selectedMedia.length > 0) {
					account.music_on_hold = {
						media_id: selectedMedia
					};
				} else {
					account.music_on_hold = {};
				}
				self.myOfficeUpdateAccount(account, function(updatedAccount) {
					popup.dialog('close').remove();
				});
			});
		},

		myOfficeListMedias: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.myOffice.listMedia',
				data: {
					accountId: self.accountId
				},
				success: function(medias) {
					callback && callback(medias.data);
				}
			});
		},

		myOfficeUpdateAccount: function(account, callback) {
			var self = this;

			delete account.extra;

			monster.request({
				resource: 'voip.myOffice.updateAccount',
				data: {
					accountId: self.accountId,
					data: account
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		}
	};

	return app;
});
