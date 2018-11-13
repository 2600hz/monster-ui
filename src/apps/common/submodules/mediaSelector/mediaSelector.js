define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash');

	var mediaSelector = {
		requests: {},

		subscribe: {
			'common.mediaSelector.render': 'mediaSelectorRender'
		},

		mediaSelectorRender: function(args) {
			var self = this,
				container = args.container,
				labels = $.extend({
					select: {
						empty: self.i18n.active().mediaSelector.select.emptyValue,
						choose: self.i18n.active().mediaSelector.select.choose,
						upload: self.i18n.active().mediaSelector.select.upload,
						remove: self.i18n.active().mediaSelector.select.remove
					},
					upload: {
						headline: self.i18n.active().mediaSelector.upload.headline
					}
				}, args.labels),
				layout = $(self.getTemplate({
					name: 'layout',
					data: {
						labels: labels.select,
						inputName: args.inputName || '',
						media: args.media,
						noChoose: !!args.noChoose,
						noUpload: !!args.noUpload
					},
					submodule: 'mediaSelector'
				}));

			if (container) {
				args.labels = labels;
				self.mediaSelectorBindEvents($.extend({ template: layout }, args));
				container.append(layout);
			} else {
				throw new Error('A container must be provided.');
			}
		},

		mediaSelectorBindEvents: function(args) {
			var self = this,
				template = args.template,
				afterCallback = args.afterCallback,
				dropdown = template.find('.media-selector-dropdown'),
				input = template.find('input[name="' + args.inputName + '"]'),
				displayedElement = template.find('.media-selector-displayed .media'),
				removeElement = template.find('.remove-element'),
				medias = args.medias,
				selectMediaCallback = function(media) {
					if (!_.isEmpty(media[0])) {
						input.val(media[0].id);

						removeElement.find('.media').text(media[0].name);
						displayedElement.text(media[0].name);
						removeElement.removeClass('hidden');

						afterCallback && afterCallback(media.id);
					}
				};

			dropdown.on('click', function() {
				dropdown.toggleClass('open');
			});

			dropdown.on('blur', function() {
				dropdown.removeClass('open');
			});

			template.find('.media-selector-element').on('click', function() {
				switch ($(this).data('action')) {
					case 'remove': {
						self.removeSelectedMedia({input: input, displayedElement: displayedElement, removeElement: removeElement});
						break;
					}
					case 'select': {
						monster.pub('common.monsterListing.render', {
							dataList: medias,
							dataType: 'medias',
							labels: {
								title: self.i18n.active().mediaSelector.dialogSelect.title,
								headline: self.i18n.active().mediaSelector.dialogSelect.headline,
								okButton: self.i18n.active().mediaSelector.dialogSelect.proceed
							},
							singleSelect: true,
							okCallback: selectMediaCallback
						});
						break;
					}
					case 'upload': {
						self.fileUpload(args);
						break;
					}
				}
			});
		},

		removeSelectedMedia: function(args) {
			var self = this;
			args.input.val('');
			args.displayedElement.text(self.i18n.active().mediaSelector.emptyValue);
			args.removeElement.addClass('hidden');
			args.removeElement.find('.media').text('');
		},

		fileUpload: function(args) {
			var self = this,
				template = $(self.getTemplate({
					name: 'file-uploadDialog',
					data: {
						labels: args.labels.upload
					},
					submodule: 'mediaSelector'
				}));

			self.mediaUploadBinEvents(template);

			monster.pub('common.mediaSelect.render', {
				container: template.find('.media-wrapper'),
				options: [],
				selectedOption: null,
				label: 'Label',
				noneLabel: 'NonLabel',
				skin: 'tabs',
				callback: function() {
					/*self.bindWelcomeDialog(template, audioControl, results.callflow, function() {
						dialog.dialog('close').remove();
					});*/

					monster.ui.dialog(template, {
						position: ['top', 20],
						title: args.labels.upload.headline
					});
				}
			});
		},

		mediaUploadBinEvents: function(template) {
			var mediaToUpload = undefined;

			template.find('.media-upload-input').fileUpload({
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
				}
			});
		}
	};

	return mediaSelector;
});
