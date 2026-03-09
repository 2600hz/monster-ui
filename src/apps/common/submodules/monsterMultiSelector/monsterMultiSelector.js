define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var monsterMultiSelector = {
		// Define the events available for other apps
		subscribe: {
			'common.monsterMultiSelector.renderDialog': 'monsterMultiSelectorRenderDialog'
		},

		/**
		 * Renders a dialog that allows to select multiple items from a list.
		 * @param   {Object}   args
		 * @param   {String}   args.title            Dialog title.
		 * @param   {Function} args.getItems         Function that receives a callback to return the items to display in the list.
		 * @param   {String[]} args.selectedKeys     List of pre-selected item keys.
		 * @param   {Function} [args.okCallback]     Callback function to be invoked when the OK button is pressed, which will receie the list of selected items.
		 * @param   {Function} [args.cancelCallback] Callback function to be invoked when the Cancel button is pressed.
		 * @param   {Object}   [args.i18n]           Object that contains translations for labels.
		 * @param   {String}   [args.i18n.okButton]      Label for the OK button.
		 * @param   {String}   [args.i18n.cancelButton]  Label for the Cancel button.
		 * @param   {String}   [args.i18n.search]        Label for the Search input placeholder.
		 * @param   {Object}   [args.i18n.columnsTitles] Object that contains labels for the linked columns titles.
		 * @param   {String}   [args.i18n.columnsTitles.available] Label for the column of available items.
		 * @param   {String}   [args.i18n.columnsTitles.selected]  Label for the column of selected items.
		 * @returns {jQuery}   JQuery dialog container element.
		 */
		monsterMultiSelectorRenderDialog: function(args) {
			var self = this,
				title = args.title,
				getItems = args.getItems,
				selectedKeys = args.selectedKeys,
				i18n = _.get(args, 'i18n', {}),
				$layoutTemplate = $(self.getTemplate({
					name: 'layout',
					submodule: 'monsterMultiSelector'
				})),
				$container = $layoutTemplate,
				$popup = monster.ui.dialog($layoutTemplate, {
					title: title
				}),
				okCallback = function(selectedKeys) {
					args.okCallback && args.okCallback(selectedKeys);
					$popup.dialog('close');
				},
				cancelCallback = function() {
					args.cancelCallback && args.cancelCallback();
					$popup.dialog('close');
				};

			monster.ui.insertTemplate($container, function(insertTemplateCallback) {
				self.monsterMultiSelectorInitTemplate({
					getItems: getItems,
					selectedKeys: selectedKeys,
					popup: $popup,
					i18n: i18n,
					renderCallback: function(err, $template) {
						if (err) {
							$popup.dialog('close').remove();
							return;
						}

						insertTemplateCallback($template, function() {
							$popup.dialog('option', 'position', [ 'center', 24 ]);
						});
					},
					okCallback: okCallback,
					cancelCallback: cancelCallback
				});
			});

			return $popup;
		},

		/**
		 * Renders a dialog that allows to select multiple items from a list.
		 * @param   {Object} args
		 * @param   {Function} args.getItems       Function that receives a callback to return the items to display in the list.
		 * @param   {String[]} args.selectedKeys   List of pre-selected item keys.
		 * @param   {Function} args.renderCallback A callback to be executed when the template has been rendered.
		 * @param   {Function} args.okCallback     Callback function to be invoked when the OK button is pressed, which will receie the list of selected items.
		 * @param   {Function} args.cancelCallback Callback function to be invoked when the Cancel button is pressed.
		 * @param   {Object} args.i18n             Object that contains translations for labels.
		 * @param   {String} [args.i18n.okButton]      Label for the OK button.
		 * @param   {String} [args.i18n.cancelButton]  Label for the Cancel button.
		 * @param   {String} [args.i18n.search]        Label for the Search input placeholder.
		 * @param   {Object} [args.i18n.columnsTitles] Object that contains labels for the linked columns titles.
		 * @param   {String} [args.i18n.columnsTitles.available] Label for the column of available items.
		 * @param   {String} [args.i18n.columnsTitles.selected]  Label for the column of selected items.
		 * @returns {jQuery} JQuery dialog container element.
		 */
		monsterMultiSelectorInitTemplate: function(args) {
			var self = this,
				getItems = args.getItems,
				selectedKeys = args.selectedKeys,
				renderCallback = args.renderCallback,
				okCallback = args.okCallback,
				cancelCallback = args.cancelCallback,
				i18n = args.i18n,
				$template = $(self.getTemplate({
					name: 'selector',
					submodule: 'monsterMultiSelector',
					data: {
						labels: {
							okButton: _.get(i18n, 'okButton', self.i18n.active().monsterMultiSelector.ok),
							cancelButton: _.get(i18n, 'cancelButton', self.i18n.active().monsterMultiSelector.cancel)
						}
					}
				}));

			monster.waterfall([
				function loadData(next) {
					getItems(next);
				}
			], function(err, items) {
				if (err) {
					return renderCallback(err);
				}

				var itemsByKey = _.keyBy(items, 'key'),
					selectedItems = _.map(selectedKeys, function(key) {
						return itemsByKey[key];
					}),
					linkedColumnsI18n = _.pick(i18n, ['search', 'columnsTitles']),
					linkedColumns = monster.ui.linkedColumns(
						$template.find('.monster-multi-selector-linked-columns'),
						items,
						selectedItems,
						{ i18n: linkedColumnsI18n }
					);

				self.monsterMultiSelectorBindEvents({
					template: $template,
					linkedColumns: linkedColumns,
					items: items,
					okCallback: okCallback,
					cancelCallback: cancelCallback
				});

				renderCallback(null, $template);
			});
		},

		/**
		 * Binds the event handlers for the multi-selector template.
		 * @param  {Object} args
		 * @param  {jQuery} args.template         Main jQUery template object.
		 * @param  {Object} args.linkedColumns    Linked columns widget object.
		 * @param  {Object[]} args.items          List of available items to select.
		 * @param  {String} args.items[].key      Item key.
		 * @param  {String} args.items[].value    Item value to be displayed in the list.
		 * @param  {Function} args.okCallback     Callback function to be invoked when the OK button is pressed, which will receie the list of selected items.
		 * @param  {Function} args.cancelCallback Callback function to be invoked when the Cancel button is pressed.
		 */
		monsterMultiSelectorBindEvents: function(args) {
			var self = this,
				$template = args.template,
				linkedColumns = args.linkedColumns,
				itemsByKey = _.keyBy(args.items, 'key'),
				okCallback = args.okCallback,
				cancelCallback = args.cancelCallback;

			$template.find('button.ok').on('click', function() {
				var selectedKeys = _.map(linkedColumns.getSelectedItems(), function(key) {
					return itemsByKey[key];
				});
				okCallback(selectedKeys);
			});

			$template.find('button.cancel').on('click', function() {
				cancelCallback();
			});
		}
	};

	return monsterMultiSelector;
});
