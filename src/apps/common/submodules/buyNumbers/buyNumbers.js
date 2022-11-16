define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var buyNumbers = {

		externalScripts: [ 'buyNumbers-googleMapsLoader' ],

		requests: {
			// Numbers endpoints
			'phonebook.search': {
				apiRoot: monster.config.api.phonebook,
				url: 'numbers/us/search?prefix={pattern}&limit={limit}&offset={offset}',
				verb: 'GET'
			},
			'phonebook.searchBlocks': {
				apiRoot: monster.config.api.phonebook,
				url: 'blocks/us/search?prefix={pattern}&limit={limit}&offset={offset}&size={size}',
				verb: 'GET'
			},
			// Locality endpoints
			'phonebook.searchByAddress': {
				apiRoot: monster.config.api.phonebook,
				url: 'locality/address',
				verb: 'POST',
				generateError: false
			}
		},

		subscribe: {
			'common.buyNumbers': 'buyNumbersRender'
		},

		appFlags: {
			searchLimit: 15,
			selectedCountryCode: monster.config.whitelabel.countryCode,
			isPhonebookConfigured: monster.config.api.hasOwnProperty('phonebook')
		},

		/**
		 * @param  {Object} [params]
		 * @param  {String} [params.accountId=self.accountId]
		 * @param  {'regular'|'tollfree'|'vanity'} [params.searchType='regular']
		 * @param  {Boolean} [params.singleSelect=false]
		 * @param  {Object} [params.callback]
		 * @param  {Function} [params.callback.success]
		 * @param  {Function} [params.callback.error]
		 */
		buyNumbersRender: function(params) {
			if (monster.config.whitelabel.hideBuyNumbers) {
				throw new Error('Whitelabeling configuration does not allow for this common control to be loaded');
			}
			var self = this,
				accountId = _.get(params, 'accountId', self.accountId),
				searchType = _.get(params, 'searchType', 'regular'),
				singleSelect = _.isBoolean(params.singleSelect)
					? params.singleSelect
					: false,
				params = params || {},
				args = {
					searchType: searchType,
					singleSelect: singleSelect
				};

			self.assignedAccountId = accountId;

			self.buyNumbersGetData(function(data) {
				args.availableCountries = data.countries;
				args.carrierInfo = data.carrierInfo;

				self.buyNumbersShowPopup(args, params.callbacks);
			});
		},

		buyNumbersGetData: function(callback) {
			var self = this,
				countries = {
					'US': {
						local: true,
						toll_free: [
							'80*',
							'84*',
							'85*',
							'86*',
							'87*',
							'88*'
						],
						vanity: true,
						prefix: 1,
						name: 'United States'
					}
				};

			self.callApi({
				resource: 'numbers.getCarrierInfo',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					var formattedResults = {
						carrierInfo: data.data, //{maximal_prefix_length: 7}, for debugging
						countries: countries
					};

					callback && callback(formattedResults);
				}
			});
		},

		/*buyNumbersGetAvailableCountries: function(callback) {
			var self = this;
			// monster.request({
			// 	resource: 'buyNumbers.listCountries',
			// 	data: {
			// 		accountId: self.assignedAccountId
			// 	},
			// 	success: function(data, status) {
			// 		callback(data.data);
			// 	},
			// 	error: function(data, status) {
			// 		monster.ui.alert('error', self.i18n.active().buyNumbers.unavailableServiceAlert);
			// 	}
			// });
			callback({
				'US': {
					"local": true,
					"toll_free": [
						'80*',
						'84*',
						'85*',
						'86*',
						'87*',
						'88*'
					],
					"vanity": true,
					"prefix": 1,
					"name": "United States"
				}
			});
		},*/

		buyNumbersShowPopup: function(args, callbacks) {
			var self = this,
				searchType = args.searchType,
				maxDigits = args.carrierInfo.maximal_prefix_length,
				template = $(self.getTemplate({
					name: 'layout',
					data: {
						isPhonebookConfigured: self.appFlags.isPhonebookConfigured,
						maxDigits: maxDigits
					},
					submodule: 'buyNumbers'
				}));

			args.popup = monster.ui.dialog(template, {
				title: self.i18n.active().buyNumbers.buyDialogTitle,
				width: '600px',
				position: ['center', 20]
			});

			$.extend(true, args, {
				container: template,
				displayedNumbers: [],
				selectedNumbers: [],
				isSearchFunctionEnabled: false
			});

			template.find('.start-hidden').hide();
			template.find('.regular-search').hide();
			template.find('.vanity-search').hide();
			template.find('.tollfree-search').hide();

			switch (searchType) {
				case 'tollfree':
					self.buyNumbersRenderTollfree(args);
					break;

				case 'vanity':
					self.buyNumbersRenderVanity(args, callbacks || {});
					break;

				case 'regular':
				default:
					self.buyNumbersRenderRegular(args);
					break;
			}

			self.buyNumbersBindEvents(args, callbacks || {});
		},

		buyNumbersBindEvents: function(args, callbacks) {
			var self = this,
				container = args.container,
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				purchaseNumbers = function() {
					var numbers = self.buyNumbersSelectedNumbersToArray(args.selectedNumbers, args.availableCountries[self.appFlags.selectedCountryCode].prefix),
						processingDiv = container.find('#processing_purchase_div');

					processingDiv.show();
					processingDiv.find('i.fa-spinner').addClass('fa-spin');

					self.buyNumbersRequestActivateBlock({
						data: {
							accountId: self.assignedAccountId,
							data: {
								numbers: numbers
							}
						},
						success: function(data) {
							if (data.hasOwnProperty('success') && !_.isEmpty(data.success)) {
								callbacks.hasOwnProperty('success') && callbacks.success(data.success);
							}
							args.popup.dialog('close');
						},
						error: function(data) {
							if (!_.isEmpty(data)) {
								var errMsg = self.i18n.active().buyNumbers.partialPurchaseFailure + ' ' + _.keys(data).join(' ');
								monster.ui.alert('error', errMsg);
							}
							args.popup.dialog('close');
							callbacks.hasOwnProperty('error') && callbacks.error();
						},
						cancel: function() {
							self.buyNumbersShowSearchResults(args);
							processingDiv.hide();
						}
					});
				};

			searchResultDiv.on('click', 'i.remove-number', function(ev) {
				ev.preventDefault();
				var $this = $(this),
					removedIndex = $this.data('index'),
					removedArrayIndex = $this.data('array_index');

				if (args.singleSelect) {
					$.each(container.find('.add-number'), function() {
						$(this)
							.removeClass('disabled')
							.prop('disabled', false);
					});
					container
						.find('#single_select_info')
							.removeClass('hidden');
				}

				args.selectedNumbers.splice(removedIndex, 1);
				self.buyNumbersRefreshSelectedNumbersList(args);

				delete args.displayedNumbers[removedArrayIndex].selected;
				container.find('#' + removedArrayIndex + '_div').show();
			});

			searchResultDiv.on('click', 'button.add-number', function(ev) {
				ev.preventDefault();
				var addedIndex = $(this).data('array_index');
				if (args.singleSelect) {
					$.each(container.find('.add-number'), function() {
						$(this)
							.addClass('disabled')
							.prop('disabled', true);
					});
					container
						.find('#single_select_info')
							.addClass('hidden');
				}
				args.selectedNumbers.push(args.displayedNumbers[addedIndex]);
				self.buyNumbersRefreshSelectedNumbersList(args);

				args.displayedNumbers[addedIndex].selected = true;

				container
					.find('#' + addedIndex + '_div')
					.hide('slide', {
						direction: 'right'
					}, 300);

				if (resultDiv.children('.number-box').height() * resultDiv.children('.number-box:visible').length <= resultDiv.innerHeight()) {
					resultDiv.scroll();
				}
			});

			container.find('#buy_numbers_button').on('click', function(ev) {
				ev.preventDefault();
				var totalNumbers = self.buyNumbersGetTotalNumbers(args.selectedNumbers);

				if (totalNumbers > 0) {
					container.find('#search_top_div').hide();
					container.find('#search_result_div').hide();
					container.find('#check_numbers_div').show();

					self.buyNumbersToggleCheckingDiv(container, true);
					/********** TEMPORARILY FAKING THE CHECK SINCE THERE IS NO STATUS API **********/
					setTimeout(function() {
						self.buyNumbersToggleCheckingDiv(container, false);
						var unavailableNumbers = [];
						if (unavailableNumbers.length > 0) {
							container
								.find('#check_numbers_div .unavailable-div .unavailable-numbers')
									.empty()
									.append($(self.getTemplate({
										name: 'unavailableNumbers',
										data: {
											numbers: unavailableNumbers
										},
										submodule: 'buyNumbers'
									})));
						} else {
							container.find('#check_numbers_div').hide();
							purchaseNumbers();
						}
					}, 1000);
					/*********************************************************************************/
				} else {
					monster.ui.alert('error', self.i18n.active().buyNumbers.noSelectedNumAlert);
				}
			});

			container.find('#back_to_results_link').on('click', function(ev) {
				ev.preventDefault();
				self.buyNumbersShowSearchResults(args);
				container.find('#check_numbers_div').hide();
			});

			container.find('#continue_buy_button').on('click', function(ev) {
				ev.preventDefault();
				container.find('#check_numbers_div').hide();
				purchaseNumbers();
			});
		},

		buyNumbersRenderCountrySelect: function() {
		// buyNumbersRenderCountrySelect: function(args, callback) {
			// var self = this,
			// 	container = args.container,
			// 	countryData = args.countryData
			// 	countrySelect = args.countrySelect,
			// 	countrySelectFunction = args.countrySelectFunction;

			/* TEMPORARILY COMMENTED OUT FOR THE SAKE OF THE DEMO. NEEDS TO BE DEBUGGED */
			/*countrySelect.ddslick({
				data:countryData,
				width:270,
				defaultSelectedIndex:0,
				onSelected: function(data) {
					// Country select generic code:
					self.appFlags.selectedCountryCode = data.selectedData.value;

					// Country select specific code (should be set in switch above):
					countrySelectFunction(data);
				}
			});

			// Temporary solution to run some code after the ddslick is generated.
			// The library will eventually need to be modified to add a callback.
			setTimeout(function() {
				if (countryData.length <= 1) { // If there is only one element, the dropdown becomes unclickable
					countrySelect.find('.dd-select').unbind();
					countrySelect.find('.dd-select').css('cursor','auto');
					countrySelect.find('.dd-pointer').hide();
				} else {
					// The dropdown elements (ul) position is set to relative if its size is bigger than the available space.
					// The library will eventually need to be modified to allow these elements (ul) to go outside the modal popup
					var ddOptionsHeight = countrySelect.find('.dd-options').height(),
						ddOptionsTop = countrySelect.height() + countrySelect.position().top;

					countrySelect.on('click', function(e) {
						var ddOptions = $(this).find('.dd-options');
						if (ddOptions.height() < ddOptionsHeight) {
							if ( container.height()-ddOptionsTop < ddOptionsHeight ) {
								ddOptions.css('position','relative');
							} else {
								ddOptions.css('position','absolute');
							}
						}
					});
				}
			}, 100);*/
		},

		buyNumbersRenderVanity: function(args, popupCallbacks) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if (value.vanity) {
					key === 'US' ? countryData.splice(0, 0, self.buyNumbersFormatCountryListElement(key, value)) : countryData.push(self.buyNumbersFormatCountryListElement(key, value));
				}
			});

			self.buyNumbersRenderCountrySelect({
				container: container,
				countryData: countryData,
				countrySelect: container.find('#vanity_country_select'),
				countrySelectFunction: function(data) {
					var searchDiv = container.find('#vanity_search_div'),
						specificVanityInput = searchDiv.find('.vanity-input.' + data.selectedData.value + '-input');

					searchDiv.find('.vanity-input').hide();
					if (specificVanityInput.length >= 1) {
						specificVanityInput.show();
					} else {
						searchDiv.find('.vanity-input.default-input').show();
					}

					searchDiv.find('#back_to_vanity_search').click();
				}
			});

			container.find('.vanity-search').show();

			self.buyNumbersBindVanityEvents(args, popupCallbacks);
		},

		buyNumbersBindVanityEvents: function(args, callbacks) {
			var self = this,
				container = args.container,
				vanitySearchDiv = container.find('#vanity_search_div'),
				number = '';

			vanitySearchDiv.find('.vanity-input input').on('keydown', function(e) {
				var $this = $(this),
					nextInput = $this.nextAll('input').first(),
					previousInput = $this.prevAll('input').first();

				if (nextInput.length === 1 && this.selectionStart === $this.prop('maxlength')
				&& ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90) || e.keyCode === 39)) {
					if (e.keyCode === 39) { e.preventDefault(); }
					nextInput.focus();
					nextInput[0].selectionStart = nextInput[0].selectionEnd = 0;
				} else if (previousInput.length === 1 && this.selectionStart === 0 && (e.keyCode === 8 || e.keyCode === 37)) {
					if (e.keyCode === 37) { e.preventDefault(); }
					previousInput.focus();
					previousInput[0].selectionStart = previousInput[0].selectionEnd = previousInput.val().length;
				}
			});

			vanitySearchDiv.find('#vanity_search_button').on('click', function(ev) {
				ev.preventDefault();
				var vanityInputDiv = vanitySearchDiv.find('.vanity-input-div'),
					searchButton = $(this),
					countryValidation = false;

				vanityInputDiv.find('.vanity-input:visible input:text').each(function(k, v) {
					number += $(v).val().toUpperCase();
				});

				if (self.appFlags.selectedCountryCode === 'US') {
					countryValidation = number.length === 10;
				} else {
					countryValidation = number.length > 0 && number.length <= 20;
				}

				vanityInputDiv.children('i').hide();
				vanityInputDiv.children('i.fa-spinner').show();
				searchButton.prop('disabled', true);
				if (countryValidation) {
					self.buyNumbersRequestSearchNumbers({
						data: {
							pattern: number,
							offset: 0,
							limit: 1
						},
						success: function(data) {
							if (data && data.length > 0) {
								vanityInputDiv.children('i.fa-check').show();
								vanitySearchDiv.find('#vanity_buy_button').show();
								vanitySearchDiv.find('#back_to_vanity_search').show();
								searchButton.hide();
								vanityInputDiv.find('input:text').prop('disabled', true);
							} else {
								vanityInputDiv.children('i.fa-times').show();
								number = '';
							}

							vanityInputDiv.children('i.fa-spinner').hide();
							searchButton.prop('disabled', false);
						},
						error: function() {
							monster.ui.alert('error', self.i18n.active().buyNumbers.unavailableServiceAlert);

							vanityInputDiv.children('i.fa-spinner').hide();
							searchButton.prop('disabled', false);
						}
					});
				} else {
					monster.ui.alert('error', self.i18n.active().buyNumbers.partialNumAlert);
					number = '';
					vanityInputDiv.children('i.fa-spinner').hide();
					searchButton.prop('disabled', false);
				}
			});

			vanitySearchDiv.find('#back_to_vanity_search').on('click', function(ev) {
				ev.preventDefault();
				var vanityInputDiv = vanitySearchDiv.find('.vanity-input-div');
				vanityInputDiv.children('i').hide();
				vanityInputDiv.find('.vanity-input:visible input:text').prop('disabled', false).val('').first().focus();
				vanitySearchDiv.find('#vanity_search_button').show();
				vanitySearchDiv.find('#vanity_buy_button').hide();
				$(this).hide();
			});

			vanitySearchDiv.find('#vanity_buy_button').on('click', function(ev) {
				ev.preventDefault();
				if (number.length > 0) {
					self.buyNumbersRequestActivateBlock({
						data: {
							accountId: self.assignedAccountId,
							data: {
								numbers: [ '+' + args.availableCountries[self.appFlags.selectedCountryCode].prefix + number ]
							}
						},
						success: function(data) {
							if (data.hasOwnProperty('success') && !_.isEmpty(data.success)) {
								callbacks.hasOwnProperty('success') && callbacks.success(data.success);
							} else {
								if (!_.isEmpty(data)) {
									var errMsg = self.i18n.active().buyNumbers.partialPurchaseFailure + '<br/>' + _.keys(data.error).join('<br/>');
									monster.ui.alert('error', errMsg);
								}
								callbacks.hasOwnProperty('error') && callbacks.error();
							}
							args.popup.dialog('close');
						}
					});
				}
			});
		},

		buyNumbersRenderTollfree: function(args) {
		// buyNumbersRenderTollfree: function(args, callback) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if (value.toll_free && value.toll_free.length > 0) {
					key === 'US' ? countryData.splice(0, 0, self.buyNumbersFormatCountryListElement(key, value)) : countryData.push(self.buyNumbersFormatCountryListElement(key, value));
				}
			});

			/************** Temporary modification on countrySelect for the sake of the demo **************/
			// self.buyNumbersRenderCountrySelect({
			// 	container: container,
			// 	countryData: countryData,
			// 	countrySelect: container.find('#tollfree_country_select'),
			// 	countrySelectFunction: function(data) {
			// 		var tollfreePrefixes = availableCountries[data.selectedData.value].toll_free,
			// 			radioGroup = container.find('#tollfree_radio_group');

			// 		radioGroup
			// 			.empty()
			// 			.append($(self.getTemplate({
			// 				name: 'tolfree',
			// 				data: {
			// 					tollfreePrefixes: tollfreePrefixes
			// 				},
			// 				submodule: 'buyNumbers'
			// 			})));

			// 		radioGroup.find('input:radio:first').prop('checked', true);
			// 	}
			// });
			var tollfreePrefixes = availableCountries[self.appFlags.selectedCountryCode].toll_free,
				radioGroup = container.find('#tollfree_radio_group');

			radioGroup
				.empty()
				.append($(self.getTemplate({
					name: 'tollfree',
					data: {
						tollfreePrefixes: tollfreePrefixes
					},
					submodule: 'buyNumbers'
				})));

			radioGroup.find('input:radio:first').prop('checked', true);
			/************************************************************************************************/

			container.find('.tollfree-search').show();

			self.buyNumbersBindTollfreeEvents(args);
		},

		buyNumbersBindTollfreeEvents: function(args) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				performSearch = function(_offset) { /* To be implemented in search button click event */ },
				loadingNewNumbers = false,
				searchOffset = 0;

			container.find('#tollfree_search_button').on('click', function(ev) {
				ev.preventDefault();
				var tollfreePrefix = container.find('#tollfree_radio_group input[type="radio"]:checked').val();

				performSearch = function(_offset, _limit, _callback) {
					loadingNewNumbers = true;
					resultDiv
						.append($(self.getTemplate({
							name: 'loadingNumbers',
							submodule: 'buyNumbers'
						})));
					resultDiv[0].scrollTop = resultDiv[0].scrollHeight;
					self.buyNumbersRequestSearchNumbers({
						data: {
							pattern: tollfreePrefix,
							offset: _offset,
							limit: _limit
						},
						success: function(data) {
							if (data && data.length > 0) {
								$.each(data, function(key, value) {
									var num = value.number,
										prefix = '+' + availableCountries[self.appFlags.selectedCountryCode].prefix;
									if (num.indexOf(prefix) === 0) { num = num.substring(prefix.length); }
									args.displayedNumbers.push({
										array_index: args.displayedNumbers.length,
										number_value: num,
										formatted_value: self.buyNumbersFormatNumber(num, self.appFlags.selectedCountryCode)
									});
								});

								searchOffset += _limit;
							} else {
								args.isSearchFunctionEnabled = false;
							}

							_callback && _callback();
							loadingNewNumbers = false;
						},
						error: function() {
							monster.ui.alert('error', self.i18n.active().buyNumbers.unavailableServiceAlert);
							_callback && _callback();
							loadingNewNumbers = false;
						}
					});
				};

				args.displayedNumbers = [];
				args.selectedNumbers = [];
				searchOffset = 0;
				args.isSearchFunctionEnabled = true;
				resultDiv.empty();
				performSearch(searchOffset, self.appFlags.searchLimit, function() {
					self.buyNumbersRefreshDisplayedNumbersList(args);
					self.buyNumbersRefreshSelectedNumbersList(args);
				});

				if (searchResultDiv.css('display') === 'none') {
					searchResultDiv.slideDown();
				}
			});

			resultDiv.on('scroll', function(ev) {
				var $this = $(this);
				// Added a 20px offset to the scroll condition to avoid issues caused by zooming and low resolutions
				if (args.isSearchFunctionEnabled && !loadingNewNumbers && $this.scrollTop() >= $this[0].scrollHeight - $this.innerHeight() - 20) {
					performSearch(searchOffset, self.appFlags.searchLimit, function() {
						self.buyNumbersRefreshDisplayedNumbersList(args);
					});
				}
			});
		},

		buyNumbersRenderRegular: function(args) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if (value.local) {
					key === 'US' ? countryData.splice(0, 0, self.buyNumbersFormatCountryListElement(key, value)) : countryData.push(self.buyNumbersFormatCountryListElement(key, value));
				}
			});

			self.buyNumbersRenderCountrySelect({
				container: container,
				countryData: countryData,
				countrySelect: container.find('#regular_country_select'),
				countrySelectFunction: function(data) {}
			});

			container.find('.regular-search').show();

			self.buyNumbersBindRegularEvents(args);
		},

		buyNumbersBindRegularEvents: function(args) {
			var self = this,
				container = args.container,
				cityList = {},
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				performSearch = function(_offset) { /* To be implemented in search button click event */ },
				loadingNewNumbers = false,
				availableCountries = args.availableCountries,
				searchOffset = 0;

			// Activating the autocomplete feature on the city input
			container.find('#city_input').autocomplete({
				source: function(request, response) {
					container.find('#area_code_radio_div').empty().slideUp();
					if (!request.term.match(/^\d+/)) {
						self.buyNumbersRequestSearchNumbersByCity({
							data: {
								city: request.term
							},
							success: function(data) {
								if (data) {
									cityList = data;
									response(
										$.map(cityList, function(val, key) {
											return {
												label: key + ', ' + val.state + ' (' + (val.prefixes.length <= 2 ? val.prefixes.join(', ') : val.prefixes.slice(0, 2).join(', ') + ',...') + ')',
												value: key
											};
										}).sort(function(a, b) {
											return (a.value.toLowerCase() > b.value.toLowerCase());
										}).slice(0, 10)
									);
								}
							}
						});
					}
				},
				minLength: 2,
				delay: 500,
				select: function(event, ui) {
					var areaCodes = cityList[ui.item.value].prefixes.sort(),
						areaCodesDiv = container.find('#area_code_radio_div');
					areaCodesDiv
						.empty()
						.append($(self.getTemplate({
							name: 'areaCodes',
							data: {
								areaCodes: areaCodes
							},
							submodule: 'buyNumbers'
						})))
						.find('input:radio:first').prop('checked', true);
					areaCodes.length > 1 ? areaCodesDiv.slideDown() : areaCodesDiv.slideUp();
					event.stopPropagation();
				}
			});

			// Activating the 'change' action on the sequential number checkbox
			container.find('#seq_num_checkbox').change(function() {
				var seqNumInputSpan = container.find('#seq_num_input_span'),
					searchButton = container.find('#search_numbers_button');
				if (this.checked) {
					seqNumInputSpan.slideDown();
					searchButton.animate({
						marginTop: '46px'
					});
				} else {
					seqNumInputSpan.slideUp();
					searchButton.animate({
						marginTop: '0'
					});
				}
			});

			container.on('keydown', '#city_input, input[name="area_code_radio"], #seq_num_input, #seq_num_checkbox', function(e) {
				if (e.keyCode === 13) {
					container.find('#search_numbers_button').click();
					$(this).blur();
				}
			});

			container.find('#search_numbers_button').on('click', function(ev) {
				ev.preventDefault();

				var seqNumIntvalue = parseInt(container.find('#seq_num_input').val(), 10) || 1,
					isSeqNumChecked = container.find('#seq_num_checkbox').prop('checked'),
					cityInput = container.find('#city_input').val(),
					areacode = cityInput.match(/^\d+$/) ? cityInput : container.find('#area_code_radio_div input[type="radio"]:checked').val(),
					searchParams = areacode + (isSeqNumChecked
						? ' ' + self.i18n.active().buyNumbers.seqNumParamLabel.replace('{{sequentialNumbers}}', seqNumIntvalue)
						: ''
					);

				/*if (self.appFlags.isPhonebookConfigured && self.appFlags.selectedCountryCode === 'US' && cityInput.match(/^\d{5}$/)) {
					self.buyNumbersRequestSearchAreaCodeByAddress({
						data: {
							address: parseInt(cityInput, 10)
						},
						success: function(data) {
							container
								.find('#area_code_map')
									.slideDown(400, function() {
										self.buyNumbersInitAreaCodeMap(data);
									});
						},
						error: function() {
							container.find('#area_code_map').slideUp(function() {
								$(this).empty();
							});

							monster.ui.toast({
								type: 'error',
								message: self.i18n.active().buyNumbers.zipCodeDoesNotExist
							});
						}
					});
				} else if (!areacode || (self.appFlags.selectedCountryCode === 'US' && !areacode.match(/^\d{3}$/)) ) {
					monster.ui.alert('error', self.i18n.active().buyNumbers.noInputAlert);
				} else */if (isSeqNumChecked && !(seqNumIntvalue > 1)) {
					monster.ui.alert('error', self.i18n.active().buyNumbers.seqNumAlert);
				} else {
					if (isSeqNumChecked) { /***** Block Search *****/
						performSearch = function(_offset, _limit, _callback) {
							loadingNewNumbers = true;
							resultDiv
								.append($(self.getTemplate({
									name: 'loadingNumbers',
									submodule: 'buyNumbers'
								})));
							// Disable search as we don't want them to search for more than one block at a time
							args.isSearchFunctionEnabled = false;
							self.buyNumbersRequestSearchBlockOfNumbers({
								data: {
									pattern: '+' + availableCountries[self.appFlags.selectedCountryCode].prefix + areacode,
									size: seqNumIntvalue,
									offset: _offset,
									limit: _limit
								},
								success: function(data) {
									if (data && data.length > 0) {
										$.each(data, function(key, value) {
											var num = value.number,
												prefix = '+' + availableCountries[self.appFlags.selectedCountryCode].prefix;

											if (num.indexOf(prefix) === 0) { num = num.substring(prefix.length); }

											args.displayedNumbers.push({
												array_index: args.displayedNumbers.length,
												number_value: num,
												formatted_value: self.buyNumbersFormatNumber(num, self.appFlags.selectedCountryCode)
											});
										});

										searchOffset += _limit;
									} else {
										args.isSearchFunctionEnabled = false;
									}

									_callback && _callback();
									loadingNewNumbers = false;
								},
								error: function() {
									monster.ui.alert('error', self.i18n.active().buyNumbers.unavailableServiceAlert);
									_callback && _callback();
									loadingNewNumbers = false;
								}
							});
						};
					} else { /***** Regular Search *****/
						performSearch = function(_offset, _limit, _callback) {
							loadingNewNumbers = true;
							resultDiv
								.append($(self.getTemplate({
									name: 'loadingNumbers',
									submodule: 'buyNumbers'
								})));
							resultDiv[0].scrollTop = resultDiv[0].scrollHeight;

							self.buyNumbersRequestSearchNumbers({
								data: {
									pattern: areacode,
									offset: _offset,
									limit: _limit
								},
								success: function(data) {
									if (data && data.length > 0) {
										$.each(data, function(key, value) {
											var num = value.number,
												prefix = '+' + availableCountries[self.appFlags.selectedCountryCode].prefix;

											if (num.indexOf(prefix) === 0) { num = num.substring(prefix.length); }

											args.displayedNumbers.push({
												array_index: args.displayedNumbers.length,
												number_value: num,
												formatted_value: self.buyNumbersFormatNumber(num, self.appFlags.selectedCountryCode)
											});
										});

										searchOffset += _limit;
									} else {
										args.isSearchFunctionEnabled = false;
									}

									_callback && _callback();
									loadingNewNumbers = false;
								},
								error: function() {
									monster.ui.alert('error', self.i18n.active().buyNumbers.unavailableServiceAlert);
									_callback && _callback();
									loadingNewNumbers = false;
								}
							});
						};
					}

					container.find('#search_parameters').html(searchParams);

					args.displayedNumbers = [];
					args.selectedNumbers = [];
					searchOffset = 0;
					args.isSearchFunctionEnabled = true;
					resultDiv.empty();
					performSearch(searchOffset, self.appFlags.searchLimit, function() {
						self.buyNumbersRefreshDisplayedNumbersList(args);
						self.buyNumbersRefreshSelectedNumbersList(args);
					});
					container.find('#search_top_div').slideUp(function() {
						searchResultDiv.slideDown();
					});
				}
			});

			container.find('#back_to_search').click(function(ev) {
				ev.preventDefault();

				searchResultDiv.find('.result-content-div .left-div').scrollTop(0);
				searchResultDiv.slideUp(function() {
					container.find('#search_top_div').slideDown();
				});
			});

			resultDiv.on('scroll', function(ev) {
				var $this = $(this);
				// Added a 20px offset to the scroll condition to avoid issues caused by zooming and low resolutions
				if (args.isSearchFunctionEnabled && !loadingNewNumbers && $this.scrollTop() >= $this[0].scrollHeight - $this.innerHeight() - 20) {
					performSearch(searchOffset, self.appFlags.searchLimit, function() {
						self.buyNumbersRefreshDisplayedNumbersList(args);
					});
				}
			});
		},

		buyNumbersFormatNumber: function(startNumber, countryCode, endNumber, addPrefix) {
			var self = this,
				number = startNumber.toString(),
				countryCode = countryCode || 'US',
				endNumber = endNumber ? endNumber.toString() : number,
				result = number;

			if (countryCode === 'US') {
				result = (addPrefix ? '+' + addPrefix + ' ' : '') + number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
			} else {
				result = (addPrefix ? '+' + addPrefix : '') + number;
			}

			if (endNumber.length === number.length && endNumber !== number) {
				result += ' ' + self.i18n.active().buyNumbers.to + ' ' + endNumber.substr(endNumber.length - 4);
			}

			return result;
		},

		buyNumbersGetTotalNumbers: function(selectedNumbers) {
			var matched,
				result = 0;

			$.each(selectedNumbers, function(key, value) {
				matched = value.number_value.match(/\d+_(\d+)/);
				if (matched) {
					result += parseInt(matched[1], 10);
				} else {
					result += 1;
				}
			});

			return result;
		},

		buyNumbersFormatCountryListElement: function(k, v) {
			return {
				text: v.name,
				value: k
			};
		},

		buyNumbersRefreshSelectedNumbersList: function(args) {
			var self = this,
				container = args.container,
				selectedNumbersList = $(self.getTemplate({
					name: 'selectedNumbers',
					data: {
						numbers: args.selectedNumbers,
						isSingleSelect: args.singleSelect
					},
					submodule: 'buyNumbers'
				})),
				totalNumbers = self.buyNumbersGetTotalNumbers(args.selectedNumbers),
				textAdded;

			container.find('#search_result_div .right-div .center-div').empty().append(selectedNumbersList);
			container.find('#total_num_span').html(totalNumbers);

			// display the plural if there's more than 1 number added
			textAdded = (totalNumbers === 0 || totalNumbers === 1) ? self.i18n.active().buyNumbers.numberAddedSingle : self.i18n.active().buyNumbers.numberAddedPlural;
			container.find('.number-added').html(textAdded);
		},

		buyNumbersRefreshDisplayedNumbersList: function(args) {
			var self = this,
				container = args.container,
				searchResultsList = $(self.getTemplate({
					name: 'searchResults',
					data: {
						numbers: args.displayedNumbers
					},
					submodule: 'buyNumbers'
				})),
				resultDiv = container.find('#search_result_div .left-div');

			resultDiv.empty().append(searchResultsList);

			if (args.singleSelect) {
				if (!_.isEmpty(args.selectedNumbers)) {
					$.each(resultDiv.find('.add-number'), function() {
						$(this)
							.addClass('disabled')
							.prop('disabled', true);
					});
				}
			}

			if (!args.isSearchFunctionEnabled && resultDiv[0].scrollHeight > resultDiv.height()) {
				resultDiv.children('.number-box.number-wrapper').last().css('border-bottom', 'none');
			}
		},

		buyNumbersShowSearchResults: function(args) {
			var self = this,
				container = args.container,
				searchResultDiv = container.find('#search_result_div'),
				searchType = args.searchType;

			if (searchType === 'tollfree') {
				container.find('#search_top_div').show();
			}
			searchResultDiv.show();

			self.buyNumbersRefreshDisplayedNumbersList({
				container: searchResultDiv,
				displayedNumbers: args.displayedNumbers,
				isSearchFunctionEnabled: args.isSearchFunctionEnabled
			});
			self.buyNumbersRefreshSelectedNumbersList({
				container: searchResultDiv,
				selectedNumbers: args.selectedNumbers
			});
		},

		buyNumbersToggleCheckingDiv: function(container, toggle) {
			var checkingDiv = container.find('#check_numbers_div .checking-div'),
				unavailableDiv = container.find('#check_numbers_div .unavailable-div');
			if (toggle) {
				unavailableDiv.hide();
				checkingDiv.show();
				checkingDiv.find('i.fa-spinner').addClass('fa-spin');
			} else {
				unavailableDiv.show();
				checkingDiv.hide();
				checkingDiv.find('i.fa-spinner').removeClass('fa-spin');
			}
		},

		buyNumbersSelectedNumbersToArray: function(selectedNumbers, prefix) {
			var result = [],
				prefix = prefix.toString().indexOf('+') < 0 ? '+' + prefix : prefix;
			_.each(selectedNumbers, function(val) {
				var block = val.number_value.match(/([0-9]+)_([0-9]+)/),
					number = block ? block[1] : val.number_value;
				if (block) {
					for (var i = 0; i < parseInt(block[2]); i++) {
						result.push(prefix + (parseInt(number) + i));
					}
				} else {
					result.push(prefix + number);
				}
			});

			return result;
		},

		/**
		 * Initialize and render the map with the list of locations displayed as
		 * markers. Bind a click event on each marker to show the related data.
		 * Initialize the map and show the list of locations as markers
		 * @param  {Object} mapData         List of locations to show on the map
		 */
		// buyNumbersInitAreaCodeMap: function(mapData) {
		// 	var self = this,
		// 		init = function init() {
		// 			var bounds = new google.maps.LatLngBounds(),
		// 				infoWindow = new google.maps.InfoWindow(),
		// 				mapOptions = {
		// 					panControl: false,
		// 					zoomControl: true,
		// 					mapTypeControl: false,
		// 					scaleControl: true,
		// 					streetViewControl: false,
		// 					overviewMapControl: true
		// 				},
		// 				map = new google.maps.Map(document.getElementById('area_code_map'), mapOptions);

		// 			_.each(mapData.locales, function(markerValue, markerKey) {
		// 				bounds.extend(setMarker(map, infoWindow, markerKey, markerValue).getPosition());
		// 			});

		// 			// Center the map to the geometric center of all bounds
		// 			map.setCenter(bounds.getCenter());
		// 			// Sets the viewport to contain the given bounds
		// 			map.fitBounds(bounds);
		// 		},
		// 		setMarker = function setMarker(map, infoWindow, key, value) {
		// 			var position = new google.maps.LatLng(parseFloat(value.latitude), parseFloat(value.longitude)),
		// 				markerOptions = {
		// 					animation: google.maps.Animation.DROP,
		// 					areaCodes: value.prefixes,
		// 					position: position,
		// 					title: key,
		// 					map: map
		// 				},
		// 				marker = new google.maps.Marker(markerOptions);

		// 			marker.addListener('click', function() {
		// 				infoWindow.setContent(
		// 					'<p>' + self.i18n.active().buyNumbers.markerAreaCodes + this.title + ':</p/>'
		// 					+ '<ul>'
		// 					+ '<li><b>' + this.areaCodes.join('<b/></li><li><b>') + '</b>' + '</li>'
		// 					+ '</ul>'
		// 				);
		// 				infoWindow.open(map, marker);
		// 			});

		// 			return marker;
		// 		};

		// 	init();
		// },

		/**************************************************
		 *            Data manipulation helpers           *
		 **************************************************/

		/**
		 * If the 'structure' parameter is an Object, coerce it to an Array and
		 * returns it or returns the Array if 'structure' is already an Array.
		 * @param  {Object|Array} structure List to coerce to Array
		 * @return {Array}                  Array created from 'structure'
		 */
		buyNumbersCoerceObjectToArray: function(structure) {
			return _.isArray(structure) ? structure : _.map(structure, function(v) { return v; });
		},

		/**
		 * Extract the area code of each prefix value for each city and remove
		 * duplicate occurences.
		 * @param  {Object} cities List of cities containing prefixes
		 * @return {Object}        Same list with duplicate area codes removed
		 */
		buyNumbersGetUniqueAreaCodes: function(cities) {
			_.each(cities, function(cityValue, cityKey, citiesObject) {
				cityValue.prefixes = _.map(cityValue.prefixes, function(prefixValue, prefixIdx) { return prefixValue.substr(0, 3); });
				citiesObject[cityKey].prefixes = _.uniq(cityValue.prefixes);
			});

			return cities;
		},

		/**************************************************
		 *              Requests declarations             *
		 **************************************************/

		// Activation Requests
		buyNumbersRequestActivateBlock: function(args) {
			var self = this;

			self.callApi({
				resource: 'numbers.activateBlock',
				data: $.extend(true, {}, args.data, {
					generateError: false
				}),
				success: function(data, status, globalHandler) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(data, status, globalHandler) {
					if (typeof data.data !== 'string') {
						args.error && args.error(data.data);
					}
				},
				onChargesCancelled: function() {
					args.cancel && args.cancel();
				}
			});
		},

		// Search Requests
		buyNumbersRequestSearchNumbers: function(args) {
			var self = this,
				settings = {
					resource: self.appFlags.isPhonebookConfigured ? 'phonebook.search' : 'numbers.search',
					data: args.data,
					success: function(data, status) {
						args.hasOwnProperty('success') && args.success(self.buyNumbersCoerceObjectToArray(data.data));
					},
					error: function(data, status) {
						args.hasOwnProperty('error') && args.error();
					}
				};

			if (self.appFlags.isPhonebookConfigured) {
				monster.request(settings);
			} else {
				settings.data.accountId = self.accountId;

				self.callApi(settings);
			}
		},
		buyNumbersRequestSearchBlockOfNumbers: function(args) {
			var self = this,
				settings = {
					resource: self.appFlags.isPhonebookConfigured ? 'phonebook.searchBlocks' : 'numbers.searchBlocks',
					data: args.data,
					success: function(data, status) {
						args.hasOwnProperty('success') && args.success(data.data);
					},
					error: function(data, status) {
						args.hasOwnProperty('error') && args.error();
					}
				};

			if (self.appFlags.isPhonebookConfigured) {
				monster.request(settings);
			} else {
				settings.data.accountId = self.accountId;

				self.callApi(settings);
			}
		},
		buyNumbersRequestSearchNumbersByCity: function(args) {
			var self = this;

			self.callApi({
				resource: 'numbers.searchCity',
				data: _.extend({
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(data, status) {
					args.hasOwnProperty('error') && args.error();
				}
			});
		},
		buyNumbersRequestSearchAreaCodeByAddress: function(args) {
			var self = this;

			monster.request({
				resource: 'phonebook.searchByAddress',
				data: {
					data: $.extend({
						distance: 10
					}, args.data)
				},
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success($.extend(true, data.data, {
						locales: self.buyNumbersGetUniqueAreaCodes(data.data.locales)
					}));
				},
				error: function(data, status) {
					if (status.status === 404) {
						args.hasOwnProperty('error') && args.error();
					}
				}
			});
		}

		/*add_numbers: function(numbers_data, callback, numbers_bought) {
			var self = this,
				number_data,
				numbers_bought = numbers_bought || [];

			if (numbers_data.length > 0) {
				var phone_number = numbers_data[0].phone_number.match(/^\+?1?([2-9]\d{9})$/),
					error_function = function() {
						winkstart.confirm('There was an error when trying to acquire ' + numbers_data[0].phone_number +
							', would you like to retry?',
							function() {
								self.add_numbers(numbers_data, callback, numbers_bought);
							},
							function() {
								self.add_numbers(numbers_data.slice(1), callback, numbers_bought);
							}
						);
					};

				if (phone_number[1]) {
					self.activate_number(phone_number[1],
						function(_data, status) {
							numbers_bought.push(_data.data.id);
							self.add_numbers(numbers_data.slice(1), callback, numbers_bought);
						},
						function(_data, status) {
							error_function();
						}
					);
				}
				else {
					error_function();
				}
			}
			else {
				if (typeof callback === 'function') {
					callback(numbers_bought);
				}
			}
		},

		activate_number: function(phone_number, success, error) {
			var self = this;

			winkstart.request(false, 'buyNumbers.activateNumber', {
					account_id: winkstart.apps['auth'].account_id,
					api_url: winkstart.apps['auth'].api_url,
					phone_number: phone_number,
					data: {}
				},
				function(_data, status) {
					if (typeof success === 'function') {
						success(_data, status);
					}
				},
				function(_data, status) {
					if (typeof error === 'function') {
						error(_data, status);
					}
				}
			);
		}*/

	};

	return buyNumbers;
});
