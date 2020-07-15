define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var mediaSelect = {

		requests: {},

		subscribe: {
			'common.mediaSelect.render': 'mediaSelectRender'
		},

		/**
		 * @param {Object} args
		 * @param {jQuery} args.container
		 * @param {String} [args.skin]
		 * @param {Function} args.callback
		 * @param {String} [args.label]
		 * @param {Array} args.options
		 * @param {Array} args.mimeTypes - Allowed file formats to be uploaded if `dragableUpload` is true
		 * @param {Boolean} [args.dragableUpload]
		 * @param {Boolean} [args.enableTTS] - Show text to speech tab
		 * @param {String} args.selectedOption - The current media id
		 * @param {Object} [args.tts] - Options required if enableTTS is true
		 * @param {String} [args.tts.entity] - Displayed in the tts tab instructions
		 * @param {String} [args.tts.name] - The tts media name
		 * @param {String} [args.tts.type] - The tts media type
		 */
		mediaSelectRender: function(args) {
			var self = this,
				container = args.container,
				callback = args.callback,
				initTemplate = function initTemplate(results) {
					args.options = results.medias;
					args.selectedMedia = results.media;

					var formattedData = self.mediaSelectFormatData(args),
						template = self.mediaSelectGetSkinnedTemplate(args, formattedData);

					callback && callback({
						getValue: function(callback) {
							if (args.enableTTS) {
								self.mediaSelectGetValue(template, _.merge({}, args, {
									callback: callback
								}));
							} else {
								return self.mediaSelectGetValue(template, args);
							}
						}
					});

					return template;
				},
				afterInsert = function afterInsert() {
					if (args.selectedMedia.media_source === 'tts') {
						$('.monster-media-tabs-skin .navbar-menu-item a.active').removeClass('active');
						$('.monster-media-tabs-skin .monster-tab-content.active').removeClass('active');

						$('.monster-media-tabs-skin [data-tab="text_to_speech"]').addClass('active');
					}
				};

			monster.ui.insertTemplate(container, function(insertTemplateCallback) {
				monster.parallel({
					media: function(cb) {
						if (_.isEmpty(args.selectedOption)) {
							cb(null, {});
							return;
						}

						self.callApi({
							resource: 'media.get',
							data: {
								accountId: self.accountId,
								mediaId: args.selectedOption
							},
							success: function(data) {
								cb(null, data.data);
							},
							error: function(err) {
								cb(err, null);
							}
						});
					},
					medias: function(cb) {
						if (_.has(args, 'options') && args.options.length.length > 0) {
							cb(null, args.options);
							return;
						}

						self.callApi({
							resource: 'media.list',
							data: {
								accountId: self.accountId
							},
							success: function(data) {
								cb(null, data.data);
							},
							error: function(err) {
								cb(err, null);
							}
						});
					}
				}, function(error, results) {
					insertTemplateCallback(initTemplate(results), afterInsert);
				});
			});
		},

		mediaSelectFormatData: function(args) {
			var self = this,
				defaultData = {
					showMediaUploadDisclosure: monster.config.whitelabel.showMediaUploadDisclosure,
					noneLabel: self.i18n.active().mediaSelect.noneLabel,
					selectedOption: false,
					uploadButton: true,
					options: [],
					name: undefined,
					uploadLabel: self.i18n.active().upload,
					label: args.hasOwnProperty('label') ? args.label : self.i18n.active().mediaSelect.defaultLabel,
					hasNone: true,
					hasShoutcast: true,
					hasSilence: true,
					isShoutcast: false,
					shoutcastURLInputClass: '',
					tts: args.tts,
					mediaId: args.selectedOption,
					selectedMedia: null
				},
				formattedData = $.extend(true, {}, defaultData, args),
				optionShoutcast = {
					id: 'shoutcast',
					name: self.i18n.active().mediaSelect.shoutcastURL
				},
				optionNone = {
					id: 'none',
					name: formattedData.noneLabel
				},
				optionSilence = {
					id: 'silence_stream://300000',
					name: self.i18n.active().mediaSelect.silence
				},
				isShoutcast = formattedData.selectedOption && formattedData.selectedOption.indexOf('://') >= 0 && formattedData.selectedOption !== 'silence_stream://300000',
				options = [];

			if (formattedData.hasNone) {
				options.push(optionNone);
			}

			if (formattedData.hasSilence) {
				options.push(optionSilence);
			}

			if (formattedData.hasShoutcast) {
				options.push(optionShoutcast);
			}

			formattedData.options = _(options)
				.concat(args.options)
				.filter(opt => opt.media_source !== 'tts')
				.value();

			if (isShoutcast) {
				formattedData.isShoutcast = isShoutcast;
				formattedData.shoutcastValue = formattedData.selectedOption;
				formattedData.selectedOption = 'shoutcast';
			};

			return formattedData;
		},

		mediaSelectGetSkinnedTemplate: function(args, formattedData) {
			var self = this,
				skin = args.hasOwnProperty('skin') ? args.skin : 'default',
				enableTextspeechTab = args.enableTTS,
				template;

			if (skin === 'default') {
				template = $(self.getTemplate({
					name: 'layout',
					data: formattedData,
					submodule: 'mediaSelect'
				}));
				self.mediaSelectBindDefaultTemplate(_.merge({}, args, {
					template: template,
					skin: skin
				}));
			} else if (skin === 'tabs') {
				template = $(self.getTemplate({
					name: 'tabs-layout',
					data: _.merge({}, formattedData, {
						enableTextspeechTab: enableTextspeechTab,
						ttsInfo: self.getTemplate({
							name: '!' + self.i18n.active().mediaSelect.textToSpeech.info,
							data: {
								entity: _.get(args, 'tts.entity', '')
							},
							submodule: 'mediaSelect'
						})
					}),
					submodule: 'mediaSelect'
				}));

				monster.ui.charsRemaining(template.find('.custom-greeting-text'), {
					size: 350,
					customClass: 'chars-remaining-counter'
				});

				self.mediaSelectBindTabsTemplate(template);
			}

			return template;
		},

		mediaSelectGetValue: function(template, args) {
			var self = this,
				ttsTab = template.find('.monster-tab-content.monster-tab-content-tts.active'),
				callback = args.callback,
				response;

			if (template) {
				var val = template.find('.media-dropdown').val();

				if (val === 'shoutcast') {
					response = template.find('.shoutcast-div input').val();
				} else if (ttsTab.length && callback) {
					args.selectedMedia = _.merge({}, {
						tts: {
							text: ttsTab.find('.custom-greeting-text').val()
						}
					});

					self.mediaSelectUpdateTTSMedia(args, callback);
				} else {
					response = val;
				}

				if (args.selectedMedia.media_source === 'tts' && !ttsTab.length) {
					self.deleteTTSMedia(args.selectedMedia.id);
				}
			} else {
				response = 'invalid_template';
			}

			if (args.enableTTS) {
				if (!ttsTab.length) {
					callback(response);
				};
			} else {
				return response;
			}
		},

		mediaSelectBindCommon: function(template, mediaToUpload, callbackAfterSave, mimeTypes) {
			var self = this;

			template.find('.upload-input').fileUpload({
				mimeTypes: mimeTypes,
				inputOnly: true,
				wrapperClass: 'file-upload input-append',
				btnClass: 'monster-button',
				maxSize: 5,
				success: function(results) {
					mediaToUpload = results[0];
				},
				error: function(errors) {
					if (errors.hasOwnProperty('size') && errors.size.length > 0) {
						monster.ui.alert(self.i18n.active().mediaSelect.fileTooBigAlert);
					}
					template.find('.upload-div input').val('');
					mediaToUpload = undefined;
				}
			});

			template.find('.upload-submit').on('click', function() {
				if (mediaToUpload) {
					self.callApi({
						resource: 'media.create',
						data: {
							accountId: self.accountId,
							data: {
								streamable: true,
								name: mediaToUpload.name,
								media_source: 'upload',
								description: mediaToUpload.name
							}
						},
						success: function(data, status) {
							var media = data.data;
							self.callApi({
								resource: 'media.upload',
								data: {
									accountId: self.accountId,
									mediaId: media.id,
									data: mediaToUpload.file
								},
								success: function(data, status) {
									template.find('.shoutcast-div').addClass('hidden');
									if (media) {
										var mediaSelect = template.find('.media-dropdown');
										mediaSelect.append('<option value="' + media.id + '">' + media.name + '</option>');
										mediaSelect.val(media.id);
									}
									callbackAfterSave && callbackAfterSave(media);
								},
								error: function(data, status) {
									self.callApi({
										resource: 'media.delete',
										data: {
											accountId: self.accountId,
											mediaId: media.id,
											data: {}
										},
										success: function(data, status) {}
									});
								}
							});
						}
					});
				} else {
					monster.ui.alert(self.i18n.active().mediaSelect.emptyUploadAlert);
				}
			});

			template.find('.media-dropdown').on('change', function() {
				var val = $(this).val(),
					isShoutcast = val === 'shoutcast';

				template.find('.shoutcast-div')
						.toggleClass('hidden', !isShoutcast)
						.find('input')
						.val('');
			});
		},

		mediaSelectBindDefaultTemplate: function(args) {
			var self = this,
				template = args.template,
				popupTemplate = $(self.getTemplate({
					name: 'upload-dialog',
					submodule: 'mediaSelect'
				})),
				popup,
				mediaToUpload,
				closeUploadDiv = function(newMedia) {
					mediaToUpload = undefined;
					template.find('.upload-div input').val('');
					template.find('.upload-div').slideUp(function() {
						template.find('.upload-toggle').removeClass('active');
					});
				};

			template.find('.media-dropdown').on('change', function() {
				var val = $(this).val(),
					isShoutcast = val === 'shoutcast';

				if (isShoutcast) {
					closeUploadDiv();
				}
			});

			template.find('.upload-toggle').on('click', function() {
				if (args.dragableUpload) {
					popup = monster.ui.dialog(popupTemplate, {
						title: self.i18n.active().mediaSelect.uploadNewMedia,
						width: '400px',
						position: ['center', 20]
					});

					monster.pub('common.dragableUploads.render', {
						container: popupTemplate,
						popup: popup,
						allowedFiles: args.mimeTypes,
						callback: function(error, medias) {
							if (medias) {
								var mediaSelect = template.find('.media-dropdown');
								mediaSelect.append('<option value="' + medias[0].id + '">' + medias[0].name + '</option>');
								mediaSelect.val(medias[0].id);
							}
						}
					});
				} else {
					if ($(this).hasClass('active')) {
						template.find('.upload-div').stop(true, true).slideUp();
					} else {
						template.find('.upload-div').stop(true, true).slideDown();
					}
				}
			});

			template.find('.upload-cancel').on('click', function() {
				closeUploadDiv();
			});

			self.mediaSelectBindCommon(template, mediaToUpload, function(media) {
				closeUploadDiv(media);
			}, args.mimeTypes);
		},

		mediaSelectBindTabsTemplate: function(template) {
			var self = this,
				mediaToUpload;

			monster.ui.fancyTabs(template.find('.monster-tab-wrapper'));

			self.mediaSelectBindCommon(template, mediaToUpload);
		},

		deleteTTSMedia: function(mediaId) {
			var self = this;

			self.callApi({
				resource: 'media.delete',
				bypassProgressIndicator: true,
				data: {
					accountId: self.accountId,
					mediaId: mediaId
				}
			});
		},

		mediaSelectUpdateTTSMedia: function(args, callback) {
			var self = this,
				greetingMedia = {
					description: '<Text to Speech>',
					media_source: 'tts',
					name: args.tts.name,
					streamable: true,
					type: args.tts.type,
					tts: {
						text: args.selectedMedia.tts.text,
						voice: 'female/en-US'
					}
				};

			if (args.selectedMedia.id && args.selectedMedia.media_source === 'tts') {
				self.callApi({
					resource: 'media.update',
					data: {
						accountId: self.accountId,
						mediaId: args.selectedMedia.id,
						data: greetingMedia
					},
					success: function(data) {
						callback && callback(data.data.id);
					},
					error: function() {
						monster.ui.alert(self.i18n.active().mediaSelect.textToSpeech.errors.update);
						callback && callback(null);
					}
				});
			} else {
				return self.callApi({
					resource: 'media.create',
					data: {
						accountId: self.accountId,
						data: greetingMedia
					},
					success: function(data) {
						callback && callback(data.data.id);
					},
					error: function() {
						monster.ui.alert(self.i18n.active().mediaSelect.textToSpeech.errors.create);
						callback && callback(null);
					}
				});
			}
		}
	};

	return mediaSelect;
});
