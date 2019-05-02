define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var tagSelector = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'common.tagSelector.render': 'tagSelectorRender'
		},

		/**
		 * @param {Object} args
		 * @param {Object} args.tags
		 * @param {String} args.title
		 * @param {String} args.description
		 * @param {Function} args.callback
		 */
		tagSelectorRender: function(args) {
			var self = this,
				tags = args.tags,
				title = args.title,
				description = args.description,
				template = $(self.getTemplate({
					name: 'layout',
					data: {
						tags: tags,
						description: description || self.i18n.active().tagSelector.description
					},
					submodule: 'tagSelector'
				})),
				optionsPopup = {
					position: ['center', 100],
					title: title || self.i18n.active().tagSelector.title
				},
				popup = monster.ui.dialog(template, optionsPopup);

			template.find('.tags-search .tags-keyword').focus();

			self.tagSelectorBindEvents(_.merge({}, args, {
				template: template,
				popup: popup
			}));
		},

		tagSelectorBindEvents: function(args) {
			var self = this,
				template = args.template,
				popup = args.popup,
				callback = args.callback;

			template
				.find('#cancel')
					.on('click', function(event) {
						popup.dialog('close').remove();
					});

			template
				.find('.tags-search .tags-keyword')
					.on('keyup', function(event) {
						event.preventDefault();

						var $this = $(this),
							searchString = $this.val().toLowerCase(),
							items = $this.parents('.add-tags-dialog-content-wrapper').find('.tags-list a'),
							stringArray = searchString.split(' '),
							arrayLength = stringArray.length,
							textToFind = stringArray.length > 0 ? stringArray[arrayLength - 1] : searchString;

						if (textToFind.length > 0) {
							template
								.find('.tags-list')
									.removeClass('hide')
									.addClass('show');
						} else {
							template
								.find('.tags-list')
									.removeClass('show')
									.addClass('hide');
						}

						_.each(items, function(item) {
							var $item = $(item),
								value = $item.html().toLowerCase();

							value.indexOf(textToFind) < 0 || $item.hasClass('selected') ? $item.hide() : $item.show();
						});
					});

			template
				.find('.tags-list a')
					.on('click', function(event) {
						event.preventDefault();

						var $this = $(this),
							tag = $this.html(),
							id = $this.data('id'),
							newTag = $(self.getTemplate({
								name: 'tag',
								data: {
									tag: tag,
									id: id
								},
								submodule: 'tagSelector'
							}));

						template
							.find('.tags-search .tags')
								.prepend(newTag);

						template
							.find('.tags-search .tags-keyword')
								.attr('placeholder', '')
								.val('')
								.focus();

						template
							.find('.tags-list')
								.toggleClass('hide show');

						$this.addClass('selected');
					});

			template
				.on('click', '.tags-search svg', function(event) {
					event.preventDefault();

					var $this = $(this),
						$tag = $this.parents('.tag'),
						tagsCount = template.find('.tag').length;

					$tag.remove();

					if (tagsCount === 0) {
						template
							.find('.tags-search .tags-keyword')
								.attr('placeholder', self.i18n.active().tagSelector.placeholder);
					}

					template
						.find('.tags-list a[data-id="' + $tag.data('id') + '"]')
							.removeClass('selected');
					template
						.find('.tags-search .tags-keyword')
							.focus();
				});

			template
				.find('.add-tags')
					.on('click', function(event) {
						var tags = _.map(template.find('.tags-search .tag'), function(tag) {
							var $tag = $(tag);

							return {
								id: $tag.data('id'),
								tag: $tag.data('name')
							};
						});

						callback && callback(tags);

						popup.dialog('close').remove();
					});
		}
	};

	return tagSelector;
});
