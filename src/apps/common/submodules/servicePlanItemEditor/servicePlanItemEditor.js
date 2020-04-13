define(function() {
	return {
		appFlags: {
			servicePlanItemEditor: {
				editableFields: [
					'activation_charge',
					'as',
					'cascade',
					'maximum',
					'minimum',
					'rate',
					'prorate.additions',
					'prorate.removals',
					'step'
				]
			}
		},

		subscribe: {
			'common.servicePlanItemEditor.render': 'servicePlanItemEditorRender'
		},

		/**
		 * Store getter
		 * @param  {Array|String} [path]
		 * @param  {*} [defaultValue]
		 * @return {*}
		 */
		servicePlanItemEditorGetStore: function(path, defaultValue) {
			var self = this,
				store = ['_store', 'servicePlanItemEditor'];
			return _.get(
				self,
				_.isUndefined(path)
					? store
					: _.flatten([store, _.isString(path) ? path.split('.') : path]),
				defaultValue
			);
		},

		/**
		 * Store setter
		 * @param {Array|String} [path]
		 * @param {*} [value]
		 */
		servicePlanItemEditorSetStore: function(path, value) {
			var self = this,
				hasValue = _.toArray(arguments).length === 2,
				store = ['_store', 'servicePlanItemEditor'];
			_.set(
				self,
				hasValue
					? _.flatten([store, _.isString(path) ? path.split('.') : path])
					: store,
				hasValue ? value : path
			);
		},

		/**
		 * @param  {Object} args
		 * @param  {Function} args.callback
		 * @param  {String} [args.category]
		 * @param  {String} [args.key]
		 */
		servicePlanItemEditorRender: function(args) {
			var self = this,
				category = _.get(args, 'category'),
				key = _.get(args, 'key'),
				initTemplate = function() {
					var editableFields = self.appFlags.servicePlanItemEditor.editableFields,
						selectedFields = self.servicePlanItemEditorFieldsComputeSelectedFields(),
						$template = $(self.getTemplate({
							name: 'layout',
							data: {
								selected: selectedFields,
								options: _
									.chain(editableFields)
									.reject(function(field) {
										return _.includes(['as', 'exceptions'], field) && key !== '_all';
									})
									.map(function(field) {
										return {
											value: field,
											label: monster.util.tryI18n(
												self.i18n.active().servicePlanItemEditor.fieldSelector,
												_.camelCase(field)
											)
										};
									})
									.value()
							},
							submodule: 'servicePlanItemEditor'
						})),
						$selector = $template.find('select#selector');

					monster.ui.chosen($selector, {
						width: '100%'
					});

					$selector
						.on('change', function(event) {
							var newSelected = $(this).val(),
								toAdd = _.difference(newSelected, selectedFields),
								toRemove = _.difference(selectedFields, newSelected);

							selectedFields = newSelected;

							_.forEach(toRemove, function(field) {
								$template.find('.field-container[data-type="' + field + '"]').slideUp(100);
							});

							_.forEach(toAdd, function(field) {
								$template.find('.field-container[data-type="' + field + '"]').slideDown(100);
							});

							monster.ui.valid($template);
						});

					self.servicePlanItemEditorFieldsRender(_.merge({
						$container: $template
					}, _.pick(args, ['category', 'key'])));

					return $template;
				};

			self.servicePlanItemEditorSetStore(_.merge({
				callback: args.callback,
				category: _.get(args, 'category'),
				key: _.get(args, 'key'),
				schema: _.get(args, ['editable', key], {}),
				applied: _
					.chain(args)
					.get('applied', {})
					.thru(self.servicePlanItemEditorCleanUp)
					.value(),
				original: _
					.chain(args)
					.get('data', {})
					.thru(self.servicePlanItemEditorCleanUp)
					.value(),
				edited: _
					.chain(args)
					.get('data', {})
					.thru(self.servicePlanItemEditorCleanUp)
					.value()
			}, key === '_all' ? {
				editable: _
					.chain(args)
					.get('editable', {})
					.keys()
					.reject(function(item) {
						return item === '_all';
					})
					.map(function(item) {
						return {
							value: item,
							label: _.includes(['account_apps', 'user_apps'], category) && _.has(monster.appsStore, item)
								? monster.appsStore[item].i18n[monster.config.whitelabel.language].label
								: monster.util.tryI18n(self.i18n.active().servicePlanItemEditor.keys, item)
						};
					})
					.sortBy('label')
					.value()
			} : {}));

			monster.ui.dialog(initTemplate(), {
				title: self.servicePlanItemEditorFormatName(category, key),
				autoScroll: false,
				dialogClass: 'service-plan-item-editor-dialog'
			});
		},

		servicePlanItemEditorCleanUp: function(plan) {
			var formattedPlan = _.cloneDeep(plan);

			if (_.isBoolean(formattedPlan.prorate)) {
				formattedPlan.prorate = {
					additions: formattedPlan.prorate
				};
			}

			return formattedPlan;
		},

		servicePlanItemEditorFieldsComputeSelectedFields: function() {
			var self = this,
				planItem = self.servicePlanItemEditorGetStore('edited'),
				editableFields = self.appFlags.servicePlanItemEditor.editableFields;

			return _.filter(editableFields, function(path) {
				return _.has(planItem, path);
			});
		},

		servicePlanItemEditorUtilFormatPrice: function(pPrice) {
			var price = _.isNaN(pPrice) ? 0 : pPrice;

			return monster.util.formatNumber({
				number: price,
				style: 'currency'
			});
		},

		/**
		 * @param  {Object} args
		 * @param  {jQuery} [args.$container]
		 * @param  {Object} [args.formattedField]
		 * @param  {String} [args.category]
		 * @param  {String} [args.key]
		 */
		servicePlanItemEditorFieldsRender: function(args) {
			var self = this,
				$container = _.get(args, '$container', $('.service-plan-item-editor-dialog')),
				category = _.get(args, 'category'),
				key = _.get(args, 'key'),
				initTemplate = function() {
					var $template = $(self.getTemplate({
						name: 'field-plan-details',
						data: self.servicePlanItemEditorFormat(category, key),
						submodule: 'servicePlanItemEditor'
					}));

					monster.ui.chosen($template.find('#as'), {
						allow_single_deselect: true
					});
					monster.ui.chosen($template.find('#exceptions'), {
						width: '100%'
					});

					self.servicePlanItemEditorHelperComputeRateMargins($template);

					self.servicePlanItemEditorRatesRowBindEvents($template);

					self.servicePlanItemEditorBindEvents($container, category, key);

					return $template;
				};

			$container
				.find('.field-editor-wrapper')
					.fadeOut(150, function() {
						$(this).replaceWith(initTemplate());
					});
		},

		servicePlanItemEditorFormatName: function(category, key) {
			var self = this;

			return _.join([
				monster.util.tryI18n(self.i18n.active().servicePlanItemEditor.keys, category),
				' - ',
				monster.util.tryI18n(self.i18n.active().servicePlanItemEditor.keys, key)
			], '');
		},

		servicePlanItemEditorFormat: function(category, key) {
			var self = this,
				currentItem = self.servicePlanItemEditorGetStore('applied'),
				planItem = self.servicePlanItemEditorGetStore('edited'),
				formattedItem = _.merge({
					selectedFields: self.servicePlanItemEditorFieldsComputeSelectedFields(),
					category: category,
					key: key,
					friendlyName: self.servicePlanItemEditorFormatName(category, key),
					rate: 0,
					activation_charge: 0,
					minimum: 0,
					maximum: 0,
					cascade: false,
					prorate: {
						additions: true,
						removals: false
					},
					step: 1,
					extra: {
						currencySymbol: monster.util.getCurrencySymbol(),
						activationCharge: {
							yourValue: 0,
							yourFormattedValue: self.i18n.active().servicePlanItemEditor.notApplicable,
							margin: self.i18n.active().servicePlanItemEditor.notApplicable
						},
						rates: [],
						currentRates: []
					}
				}, key === '_all' ? {
					exceptions: [],
					as: '_none',
					allOptions: self.servicePlanItemEditorGetStore('editable')
				} : {}, planItem);

			if (_.isUndefined(currentItem)) {
				formattedItem.extra.activationCharge.margin = self.servicePlanItemEditorUtilFormatPrice(formattedItem.activation_charge);
			} else {
				if (_.get(currentItem, 'activation_charge', 0) !== 0) {
					formattedItem.extra.activationCharge.yourValue = currentItem.activation_charge;
					formattedItem.extra.activationCharge.yourFormattedValue = self.servicePlanItemEditorUtilFormatPrice(currentItem.activation_charge);

					if (formattedItem.activation_charge !== 0) {
						formattedItem.extra.activationCharge.margin = self.servicePlanItemEditorUtilFormatPrice(formattedItem.activation_charge - formattedItem.extra.activationCharge.yourValue);
					}
				}

				formattedItem.extra.currentRates.push(self.servicePlanItemEditorRateRowFormat(currentItem.rate, 0));
				if (_.has(currentItem, 'rates')) {
					_.each(currentItem.rates, function(value, maxNumber) {
						formattedItem.extra.currentRates.push(self.servicePlanItemEditorRateRowFormat(value, maxNumber));
					});
				}
			}

			formattedItem.extra.rates.push(self.servicePlanItemEditorRateRowFormat(formattedItem.rate, 0));
			if (formattedItem.hasOwnProperty('rates')) {
				// For each rate we want to display a line
				_.each(formattedItem.rates, function(value, maxNumber) {
					formattedItem.extra.rates.push(self.servicePlanItemEditorRateRowFormat(value, maxNumber));
				});
			}

			// handle old format
			if (_.isBoolean(formattedItem.prorate)) {
				formattedItem.prorate = {
					additions: formattedItem.prorate,
					removals: false
				};
			}

			return formattedItem;
		},

		servicePlanItemEditorBindEvents: function(template, category, key) {
			var self = this;

			monster.ui.tooltips(template);

			monster.ui.validate(template, {
				rules: {
					minimum: {
						lowerThan: '#monthly_maximum',
						digits: true,
						min: 0
					},
					maximum: {
						greaterThan: '#monthly_minimum',
						digits: true,
						min: 0
					},
					activation_charge: {
						number: true,
						min: 0
					},
					step: {
						digits: true,
						min: 1
					}
				}
			});

			template.find('.js-cancel').on('click', function() {
				template.parents('.ui-dialog-content').dialog('close');
			});

			template.on('submit', function(event) {
				event.preventDefault();
				if (!monster.ui.valid(template)) {
					return;
				}
				template.find('.field-container:hidden').remove();

				var formattedItem = self.servicePlanItemEditorNormalize(template, category, key);

				template.parents('.ui-dialog-content').dialog('close');

				self.servicePlanItemEditorGetStore('callback')(formattedItem);
			});
		},

		servicePlanItemEditorRateRowFormat: function(pRate, quantity) {
			var self = this,
				rate = typeof pRate !== 'undefined' ? pRate : 0,
				formattedRate = {};

			if (quantity === '') {
				formattedRate = {
					value: 'n/a',
					formattedValue: self.i18n.active().servicePlanItemEditor.notApplicable,
					margin: self.i18n.active().servicePlanItemEditor.notApplicable,
					isInfinite: false,
					quantity: '',
					hasAdd: true,
					hasDelete: true
				};
			} else {
				formattedRate = {
					value: rate,
					formattedValue: self.servicePlanItemEditorUtilFormatPrice(rate),
					margin: self.i18n.active().servicePlanItemEditor.notApplicable,
					isInfinite: quantity === 0,
					quantity: quantity === 0 ? '∞' : quantity,
					hasAdd: true,
					hasDelete: quantity === 0 ? false : true
				};
			}

			formattedRate.currencySymbol = monster.util.getCurrencySymbol();

			return formattedRate;
		},

		servicePlanItemEditorRatesRowBindEvents: function(template) {
			var self = this;

			template.find('.rate-container').on('keyup', '.trigger-rate-margin', function() {
				self.servicePlanItemEditorHelperComputeRateMargins(template);
			});

			template.find('.rate-container').on('keyup', '.trigger-activation-charge-margin', function() {
				self.servicePlanItemEditorHelperUpdateActivationChargeMargin($(this).parents('tr.rate-row'));
			});

			template.find('.rate-container').on('click', '.delete-rate-row', function() {
				$(this).parents('.rate-row').remove();
			});

			template.find('.rate-container').on('click', '.add-rate-row', function() {
				var dataRow = self.servicePlanItemEditorRateRowFormat(0, ''),
					templateRow = $(self.getTemplate({
						name: 'field-plan-rate-row',
						data: dataRow,
						submodule: 'servicePlanItemEditor'
					}));

				$(this).parents('.rate-table tbody').append(templateRow);
			});
		},

		servicePlanItemEditorNormalize: function(template, category, key) {
			var self = this,
				formattedItem = monster.ui.getFormData('plan_field_form'),
				typeCheckers = {
					number: _.toNumber,
					integer: _.toInteger,
					'boolean': Boolean
				},
				enforceTypes = function(node, schema) {
					_.forEach(schema, function(meta, prop) {
						if (!_.has(node, prop)) {
							return;
						}
						if (_.has(typeCheckers, meta.type)) {
							_.set(node, prop, typeCheckers[meta.type](node[prop]));
						} else if (_.has(meta, 'properties')) {
							enforceTypes(node[prop], schema[prop].properties);
						} else if (_.has(meta, 'patternProperties')) {
							_.forEach(meta.patternProperties, function(meta, pattern) {
								enforceTypes(node[prop], _
									.chain(node[prop])
									.keys()
									.filter(function(key) {
										return key.match(pattern);
									})
									.transform(function(object, key) {
										_.set(object, key, meta);
									}, {})
									.value()
								);
							});
						}
					});

					return node;
				};

			template.find('.rate-container .rate-row').each(function() {
				var $this = $(this),
					rate = $this.find('.customer-rate-cell input').val();

				if ($this.find('.quantity-cell input').length === 0) {
					formattedItem.rate = parseFloat(rate);
				} else {
					formattedItem.rates = formattedItem.rates || {};
					var quantity = $this.find('.quantity-cell input').val();
					if (quantity.length && parseInt(quantity) >= 0 && rate && parseFloat(rate) >= 0) {
						formattedItem.rates[quantity] = parseFloat(rate);
					}
				}
			});

			if (category === 'ui_apps') {
				if (monster.appsStore.hasOwnProperty(key)) {
					var accId = monster.appsStore[key].account_id;
					var formattedAccDb = 'account%2F' + accId.substring(0, 2) + '%2F' + accId.substr(2, 2) + '%2F' + accId.substr(4, accId.length - 4);
					formattedItem.app_id = monster.appsStore[key].id;
					formattedItem.account_db = formattedAccDb;
				}
				if (monster.appsStore.hasOwnProperty(key) || key === '_all') {
					// UI-3137: automatically enable apps when added
					formattedItem.enabled = true;
				}
			}

			return enforceTypes(formattedItem, self.servicePlanItemEditorGetStore('schema'));
		},

		servicePlanItemEditorHelperComputeRateMargins: function(template) {
			var self = this,
				customerRateTable = template.find('.rate-container .rate-table'),
				existingRateTable = template.find('.rate-container .current-rate-table'),
				existingRates = {};

			existingRateTable.find('.rate-row').each(function() {
				var data = $(this).data(),
					quantity = data.infinite ? 0 : parseInt(data.quantity);

				existingRates[quantity] = parseFloat(data.value);
			});

			customerRateTable.find('.rate-row').each(function() {
				var $this = $(this),
					isInfinite = $this.find('.quantity-cell input').length === 0,
					quantity = isInfinite ? 0 : parseInt($this.find('.quantity-cell input').val()),
					customerValue = parseFloat($this.find('.customer-rate-cell input').val()),
					marginText = self.i18n.active().servicePlanItemEditor.notApplicable;

				if (quantity >= 0 && customerValue >= 0 && existingRates.hasOwnProperty(quantity)) {
					marginText = self.servicePlanItemEditorUtilFormatPrice(customerValue - existingRates[quantity]);
				} else if (!_.isNaN(customerValue)) {
					marginText = self.servicePlanItemEditorUtilFormatPrice(customerValue);
				}

				$this.find('.margin-cell').text(marginText);
			});
		},

		servicePlanItemEditorHelperUpdateActivationChargeMargin: function(tr) {
			var self = this,
				originalRate = parseFloat(tr.find('.your-rate-cell').data('value')),
				marginCell = tr.find('.margin-cell'),
				newValue = parseFloat(tr.find('.customer-rate-cell input').val()),
				marginText = self.i18n.active().servicePlanItemEditor.notApplicable;

			if (_.isNumber(newValue)) {
				marginText = self.servicePlanItemEditorUtilFormatPrice(newValue - originalRate);
			}

			marginCell.text(marginText);
		}
	};
});
