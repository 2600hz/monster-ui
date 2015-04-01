define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		ddslick = require('ddslick');

	var buyNumbers = {

		requests: {
		},

		subscribe: {
			'common.buyNumbers': 'buyNumbersRender'
		},

		searchLimit: 15,
		selectedCountryCode: "US",

		buyNumbersRender: function(params) {
			var self = this,
				params = params || {},
				args = {
					searchType: params.searchType || 'regular'
				};

			self.assignedAccountId = params.accountId || self.accountId;

			self.buyNumbersGetAvailableCountries(function(countries) {
				args.availableCountries = countries;
				self.buyNumbersGetPrices(function(prices) {
					args.prices = prices;
					self.buyNumbersShowPopup(args, params.callbacks);
				});
			});
		},

		buyNumbersGetAvailableCountries: function(callback) {
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
				"US": {
					"local": true,
					"toll_free": [
						800,
						888,
						877,
						866,
						855
					],
					"vanity": true,
					"prefix": 1,
					"name": "United States"
				}
			});
		},

		buyNumbersGetPrices: function(callback) {
			var self = this;
			self.callApi({
				resource: 'servicePlan.listCurrent',
				data: {
					accountId: self.assignedAccountId
				},
				success: function(data, status) {
					var prices = {
						regular: 0,
						tollfree: 0,
						vanity: 0
					};
					if(data.data && data.data.items && data.data.items.phone_numbers) {
						var phoneNumbers = data.data.items.phone_numbers;
						if(phoneNumbers.did_us && phoneNumbers.did_us.rate) {
							prices.regular = phoneNumbers.did_us.rate
						}
						if(phoneNumbers.tollfree_us && phoneNumbers.tollfree_us.rate) {
							prices.tollfree = phoneNumbers.tollfree_us.rate
						} else {
							prices.tollfree = prices.regular;
						}
						if(phoneNumbers.vanity_us && phoneNumbers.vanity_us.rate) {
							prices.vanity = phoneNumbers.vanity_us.rate
						}
					}
					callback(prices);
				},
				error: function(data, status) {
					monster.ui.alert('error', self.i18n.active().buyNumbers.unavailableServiceAlert);
				}
			});
		},

		buyNumbersShowPopup: function(args, callbacks) {
			var self = this,
				searchType = args.searchType,
				availableCountries = args.availableCountries,
				template = $(monster.template(self, 'buyNumbers-layout', {}));


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

			switch(searchType) {
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
			};

			self.buyNumbersBindEvents(args, callbacks || {});
		},

		buyNumbersBindEvents: function(args, callbacks) {
			var self = this,
				container = args.container,
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div');

			searchResultDiv.on('click', 'i.remove-number', function(ev) {
				ev.preventDefault();
				var $this = $(this),
					removedIndex = $this.data('index'),
					removedArrayIndex = $this.data('array_index');

				args.selectedNumbers.splice(removedIndex,1);
				self.buyNumbersRefreshSelectedNumbersList(args);

				delete args.displayedNumbers[removedArrayIndex].selected;
				container.find('#'+removedArrayIndex+"_div").show();
			});

			searchResultDiv.on('click', 'button.add-number', function(ev) {
				ev.preventDefault();
				var addedIndex = $(this).data('array_index');

				args.selectedNumbers.push(args.displayedNumbers[addedIndex]);
				self.buyNumbersRefreshSelectedNumbersList(args);

				args.displayedNumbers[addedIndex].selected = true;
				container.find('#'+addedIndex+"_div").hide("slide", { direction: "right" }, 300);
				if(resultDiv.children('.number-box').height() * resultDiv.children('.number-box:visible').length <= resultDiv.innerHeight()) {
					resultDiv.scroll();
				}
			});

			container.find('#buy_numbers_button').on('click', function(ev) {
				ev.preventDefault();
				var totalNumbers = self.buyNumbersGetTotalNumbers(args.selectedNumbers);

				if(totalNumbers.totalSelectedNumbers > 0) {
					container.find('#search_top_div').hide();
					container.find('#search_result_div').hide();
					container.find('#check_numbers_div').show();

					self.buyNumbersToggleCheckingDiv(container, true);

					// monster.request({
					// 	resource: 'buyNumbers.getStatus',
					// 	data: {
					// 		accountId: self.assignedAccountId,
					// 		country: self.selectedCountryCode,
					// 		data: $.map(args.selectedNumbers, function(val) {
					// 			return args.availableCountries[self.selectedCountryCode].prefix + val.number_value;
					// 		})
					// 	},
					// 	success: function(_data, _status) {
					// 		var unavailableNumbers = [];
					// 		if(_data.data && _data.status === "success") {
					// 			var tmpUnavailableNumbers = $.grep(_data.data, function(v) {
					// 				if(v.status !== "success") {
					// 					return true;
					// 				}
					// 				return false;
					// 			});

					// 			args.selectedNumbers = $.grep(args.selectedNumbers, function(value, index) {
					// 				if($.inArray(args.availableCountries[self.selectedCountryCode].prefix + value.number_value, tmpUnavailableNumbers) >= 0) {
					// 					unavailableNumbers.push(value);
					// 					return false;
					// 				}
					// 				return true;
					// 			});
					// 		}

					// 		self.buyNumbersToggleCheckingDiv(container, false);

					// 		if(unavailableNumbers.length > 0) {
					// 			container.find('#check_numbers_div .unavailable-div .unavailable-numbers')
					// 					 .empty()
					// 					 .append(monster.template(self, 'buyNumbers-unavailableNumbers', {numbers: unavailableNumbers}));
					// 		} else {
					// 			container.find('#check_numbers_div').hide();
					// 			container.find('#confirm_div').show();
					// 			container.find('#summary_total_numbers').html(totalNumbers.totalSelectedNumbers);
					// 			container.find('#summary_total_price').html(totalNumbers.totalPrice);
					// 		}
					// 	},
					// 	error: function(_data, _status) {
					// 		monster.ui.alert('error', self.i18n.active().buyNumbers.unavailableServiceAlert);
					// 	}
					// });

					/********** TEMPORARILY FAKING THE CHECK SINCE THERE IS NO STATUS API **********/
					setTimeout(function() {
						self.buyNumbersToggleCheckingDiv(container, false);
						var unavailableNumbers = [];
						// args.selectedNumbers = $.grep(args.selectedNumbers, function(value,index) {
						// 	if(Math.floor(Math.random()*10) === 0) {
						// 		unavailableNumbers.push(value);
						// 		return false;
						// 	}
						// 	return true;
						// });
						if(unavailableNumbers.length > 0) {
							container.find('#check_numbers_div .unavailable-div .unavailable-numbers')
									 .empty()
									 .append(monster.template(self, 'buyNumbers-unavailableNumbers', {numbers: unavailableNumbers}));
						} else {
							var totalNumbers = self.buyNumbersGetTotalNumbers(args.selectedNumbers)
							container.find('#check_numbers_div').hide();
							container.find('#confirm_div').show();
							container.find('#summary_total_numbers').html(totalNumbers.totalSelectedNumbers);
							container.find('#summary_total_price').html(totalNumbers.totalPrice);
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
				var totalNumbers = self.buyNumbersGetTotalNumbers(args.selectedNumbers);
				container.find('#check_numbers_div').hide();
				container.find('#confirm_div').show();
				container.find('#summary_total_numbers').html(totalNumbers.totalSelectedNumbers);
				container.find('#summary_total_price').html(totalNumbers.totalPrice);
			});

			container.find('#cancel_buy_link').on('click', function(ev) {
				ev.preventDefault();
				self.buyNumbersShowSearchResults(args);
				container.find('#confirm_div').hide();
			});

			container.find('#confirm_buy_button').on('click', function(ev) {
				ev.preventDefault();
				var numbers = self.buyNumbersSelectedNumbersToArray(args.selectedNumbers, args.availableCountries[self.selectedCountryCode].prefix),
					confirmDiv = container.find('#confirm_div'),
					processingDiv = container.find('#processing_purchase_div');
				
				confirmDiv.hide();
				processingDiv.show();
				processingDiv.find('i.icon-spinner').addClass('icon-spin');
				
				self.callApi({
					resource: 'numbers.activateBlock',
					data: {
						accountId: self.assignedAccountId,
						data: {
							numbers: numbers
						}
					},
					success: function(data, status) {
						if('data' in data) {
							if('error' in data.data && !$.isEmptyObject(data.data.error)) {
								var errMsg = self.i18n.active().buyNumbers.partialPurchaseFailure
										   + '<br/>' + Object.keys(data.data.error).join('<br/>');
								monster.ui.alert('error', errMsg);
							}

							if('success' in data.data && !$.isEmptyObject(data.data.success)) {
								callbacks.success && callbacks.success(data.data.success, data.data.error);
							} else {
								callbacks.error && callbacks.error(data.data.error);
							}
						} else {
							callbacks.error && callbacks.error(data);
						}
						args.popup.dialog('close');
					},
					error: function(){
						args.popup.dialog('close');
					}
				});
			});
		},

		buyNumbersRenderCountrySelect: function(args, callback) {
			var self = this,
				container = args.container,
				countryData = args.countryData
				countrySelect = args.countrySelect,
				countrySelectFunction = args.countrySelectFunction;

			/* TEMPORARILY COMMENTED OUT FOR THE SAKE OF THE DEMO. NEEDS TO BE DEBUGGED */
			/*countrySelect.ddslick({
				data:countryData,
				width:270,
				defaultSelectedIndex:0,
				onSelected: function(data) {
					// Country select generic code:
					self.selectedCountryCode = data.selectedData.value;

					// Country select specific code (should be set in switch above):
					countrySelectFunction(data);
				}
			});

			// Temporary solution to run some code after the ddslick is generated.
			// The library will eventually need to be modified to add a callback.
			setTimeout(function() {
				if(countryData.length <= 1) { // If there is only one element, the dropdown becomes unclickable
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
						if(ddOptions.height() < ddOptionsHeight) {
							if( container.height()-ddOptionsTop < ddOptionsHeight ) {
								ddOptions.css('position','relative');
							} else {
								ddOptions.css('position','absolute');
							}
						}
					});
				}
			}, 100);*/
		},

		buyNumbersRenderVanity: function(args, popupCallbacks, callback) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if(value.vanity) {
					key === "US" ? countryData.splice(0, 0, self.buyNumbersFormatCountryListElement(key,value)) : countryData.push(self.buyNumbersFormatCountryListElement(key,value));
				}
			});

			self.buyNumbersRenderCountrySelect({
				container: container,
				countryData: countryData,
				countrySelect: container.find('#vanity_country_select'),
				countrySelectFunction: function(data) {
					var searchDiv = container.find('#vanity_search_div'),
						specificVanityInput = searchDiv.find('.vanity-input.'+data.selectedData.value+'-input');

					searchDiv.find('.vanity-input').hide();
					if(specificVanityInput.length >= 1) {
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
				availableCountries = args.availableCountries,
				number = "";

			vanitySearchDiv.find('.vanity-input input').on('keydown', function(e) {
				var $this = $(this),
					nextInput = $this.nextAll('input').first(),
					previousInput = $this.prevAll('input').first();

				if(nextInput.length === 1 && this.selectionStart === $this.prop('maxlength')
				&& ( (e.keyCode>=48 && e.keyCode<=57) || (e.keyCode>=65 && e.keyCode<=90) || e.keyCode==39 )) {
					if(e.keyCode==39) { e.preventDefault(); }
					nextInput.focus();
					nextInput[0].selectionStart = nextInput[0].selectionEnd = 0;
				} else if(previousInput.length === 1 && this.selectionStart === 0 && (e.keyCode == 8 || e.keyCode == 37)) {
					if(e.keyCode==37) { e.preventDefault(); }
					previousInput.focus();
					previousInput[0].selectionStart = previousInput[0].selectionEnd = previousInput.val().length;
				}
			});

			vanitySearchDiv.find('#vanity_search_button').on('click', function(ev) {
				ev.preventDefault();
				var vanityInputDiv = vanitySearchDiv.find('.vanity-input-div'),
					searchButton = $(this),
					countryValidation = false;

				vanityInputDiv.find('.vanity-input:visible input:text').each(function(k,v) {
					number += $(v).val().toUpperCase();
				});

				switch(self.selectedCountryCode) {
					case "US":
						countryValidation = (number.length === 10);
						break;
					default:
						countryValidation = (number.length > 0 && number.length <= 20);
						break;
				}

				vanityInputDiv.children('i').hide();
				vanityInputDiv.children('i.icon-spinner').show();
				searchButton.prop('disabled', true);
				if(countryValidation) {
					self.callApi({
						resource: 'numbers.search',
						data: {
							pattern: number,
							offset:0,
							limit:1
						},
						success: function(data, status) {
							if(data.data && data.data.length > 0) {
								vanityInputDiv.children('i.icon-ok').show();
								vanitySearchDiv.find('#vanity_buy_button').show();
								vanitySearchDiv.find('#back_to_vanity_search').show();
								searchButton.hide();
								vanityInputDiv.find('input:text').prop('disabled',true);
							} else {
								vanityInputDiv.children('i.icon-remove').show();
								number = "";
							}

							vanityInputDiv.children('i.icon-spinner').hide();
							searchButton.prop('disabled', false);
						},
						error: function(data, status) {
							monster.ui.alert('error', self.i18n.active().buyNumbers.unavailableServiceAlert);

							vanityInputDiv.children('i.icon-spinner').hide();
							searchButton.prop('disabled', false);
						}
					});
				} else {
					monster.ui.alert('error', self.i18n.active().buyNumbers.partialNumAlert);
					number = "";
					vanityInputDiv.children('i.icon-spinner').hide();
					searchButton.prop('disabled', false);
				}
			});

			vanitySearchDiv.find('#back_to_vanity_search').on('click', function(ev) {
				ev.preventDefault();
				var vanityInputDiv = vanitySearchDiv.find('.vanity-input-div');
				vanityInputDiv.children('i').hide();
				vanityInputDiv.find('.vanity-input:visible input:text').prop('disabled',false).val("").first().focus();
				vanitySearchDiv.find('#vanity_search_button').show();
				vanitySearchDiv.find('#vanity_buy_button').hide();
				$(this).hide();
			});

			vanitySearchDiv.find('#vanity_buy_button').on('click', function(ev) {
				ev.preventDefault();
				if(number.length > 0) {
					self.callApi({
						resource: 'numbers.activateBlock',
						data: {
							accountId: self.assignedAccountId,
							data: {
								numbers: ["+" + args.availableCountries[self.selectedCountryCode].prefix + number]
							}
						},
						success: function(data, status) {
							if(!$.isEmptyObject(data.data.success)) {
								if(!$.isEmptyObject(data.data.error)) {
									var errMsg = self.i18n.active().buyNumbers.partialPurchaseFailure
										   + '<br/>' + Object.keys(data.data.error).join('<br/>');
									monster.ui.alert('error', errMsg);
								}
								callbacks.success && callbacks.success(data.data.success);
							} else {
								callbacks.error && callbacks.error(data.data.error);
							}
							args.popup.dialog('close');
						}
					});
				}
			});
		},

		buyNumbersRenderTollfree: function(args, callback) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if(value.toll_free && value.toll_free.length > 0) {
					key === "US" ? countryData.splice(0, 0, self.buyNumbersFormatCountryListElement(key,value)) : countryData.push(self.buyNumbersFormatCountryListElement(key,value));
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

			// 		radioGroup.empty()
			// 				  .append(monster.template(self, 'buyNumbers-tollfree', {tollfreePrefixes: tollfreePrefixes}));

			// 		radioGroup.find('input:radio:first').prop('checked', true);
			// 	}
			// });
			var tollfreePrefixes = availableCountries[self.selectedCountryCode].toll_free,
				radioGroup = container.find('#tollfree_radio_group');

			radioGroup.empty()
					  .append(monster.template(self, 'buyNumbers-tollfree', {tollfreePrefixes: tollfreePrefixes}));

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
				performSearch = function(_offset, _limit, _callback) { /* To be implemented in search button click event */ },
				loadingNewNumbers = false,
				searchOffset = 0;

			container.find('#tollfree_search_button').on('click', function(ev) {
				ev.preventDefault();
				var tollfreePrefix = container.find('#tollfree_radio_group input[type="radio"]:checked').val();

				performSearch = function(_offset, _limit, _callback) {
					loadingNewNumbers = true;
					resultDiv.append(monster.template(self, 'buyNumbers-loadingNumbers', {}));
					resultDiv[0].scrollTop = resultDiv[0].scrollHeight;
					self.callApi({
						resource: 'numbers.search',
						data: {
							pattern: tollfreePrefix,
							offset: _offset,
							limit: _limit
						},
						success: function(data, status) {
							if(data.data && data.data.length > 0) {
								$.each(data.data, function(key, value) {
									var num = value.number,
										prefix = "+"+availableCountries[self.selectedCountryCode].prefix;
									if(num.indexOf(prefix) === 0) { num = num.substring(prefix.length); }
									args.displayedNumbers.push({
										array_index: args.displayedNumbers.length,
										number_value: num,
										formatted_value: self.buyNumbersFormatNumber(num, self.selectedCountryCode),
										price: args.prices.tollfree
									});
								});

								searchOffset += _limit;
							} else {
								args.isSearchFunctionEnabled = false;
							}

							_callback && _callback();
							loadingNewNumbers = false;
						},
						error: function(data, status) {
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
				performSearch(searchOffset, self.searchLimit, function() {
					self.buyNumbersRefreshDisplayedNumbersList(args);
					self.buyNumbersRefreshSelectedNumbersList(args);
				});

				if(searchResultDiv.css('display') === 'none') {
					searchResultDiv.slideDown();
				}
			});

			resultDiv.on('scroll', function(ev) {
				var $this = $(this);
				if(args.isSearchFunctionEnabled && !loadingNewNumbers && $this.scrollTop() == $this[0].scrollHeight - $this.innerHeight()) {
					performSearch(searchOffset, self.searchLimit, function() {
						self.buyNumbersRefreshDisplayedNumbersList(args);
					});
				}
			});
		},

		buyNumbersRenderRegular: function(args, callback) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if(value.local) {
					key === "US" ? countryData.splice(0, 0, self.buyNumbersFormatCountryListElement(key,value)) : countryData.push(self.buyNumbersFormatCountryListElement(key,value));
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
				selectedCity,
				cityList = {},
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				performSearch = function(_offset, _limit, _callback) { /* To be implemented in search button click event */ },
				loadingNewNumbers = false,
				availableCountries = args.availableCountries,
				searchOffset = 0;

			// Activating the autocomplete feature on the city input
			container.find("#city_input").autocomplete({
				source: function( request, response ) {
					container.find('#area_code_radio_div').empty().slideUp();
					selectedCity = undefined;
					if(!request.term.match(/^\d+/)) {
						self.callApi({
							resource: 'numbers.searchCity',
							data: {
								city: request.term
							},
							success: function(data, status) {
								if(data.data) {
									cityList = data.data;
									response(
										$.map( cityList, function(val, key) {
											return {
												label: key + ", " + val.state + " (" + (val.prefixes.length <= 2 ? val.prefixes.join(", ") : val.prefixes.slice(0,2).join(", ")+",...") + ")",
												value: key
											}
										})
										.sort(function(a,b) {
											return (a.value.toLowerCase() > b.value.toLowerCase());
										})
										.slice(0,10)
									);
								}
							},
							error: function(data, status) {}
						});
					}
				},
				minLength: 2,
				delay: 500,
				select: function( event, ui ) {
					var areaCodes = cityList[ui.item.value].prefixes.sort(),
						areaCodesDiv = container.find('#area_code_radio_div');
					selectedCity = ui.item.value;
					areaCodesDiv.empty()
							  .append(monster.template(self, 'buyNumbers-areaCodes', {areaCodes: areaCodes}))
							  .find('input:radio:first').prop('checked', true);
					areaCodes.length > 1 ? areaCodesDiv.slideDown() : areaCodesDiv.slideUp();
					event.stopPropagation();
				}
			});

			// Activating the 'change' action on the sequential number checkbox
			container.find('#seq_num_checkbox').change(function() {
				var seqNumInputSpan = container.find('#seq_num_input_span'),
					searchButton = container.find('#search_numbers_button');
				if(this.checked) {
					seqNumInputSpan.slideDown();
					searchButton.animate({marginTop:"46px"});
				} else {
					seqNumInputSpan.slideUp();
					searchButton.animate({marginTop:"0"});
				}
			});

			container.on('keydown', '#city_input, input[name="area_code_radio"], #seq_num_input, #seq_num_checkbox', function(e) {
				if(e.keyCode == 13) {
					container.find('#search_numbers_button').click();
					$(this).blur();
				}
			});

			container.find('#search_numbers_button').on('click', function(ev) {
				ev.preventDefault();

				var seqNumIntvalue = parseInt(container.find('#seq_num_input').val(),10) || 1,
					isSeqNumChecked = container.find('#seq_num_checkbox').prop('checked'),
					cityInput = container.find('#city_input').val(),
					areacode = cityInput.match(/^\d+$/) ? cityInput : container.find('#area_code_radio_div input[type="radio"]:checked').val(),
					searchParams = (cityInput.match(/^\d{3}$/) ? self.i18n.active().buyNumbers.areaCode
								 + " " + cityInput : selectedCity + " ("+areacode+")")
								 + (isSeqNumChecked ? " " + monster.template(self, '!'+self.i18n.active().buyNumbers.seqNumParamLabel, { sequentialNumbers: seqNumIntvalue }) : "");

				if(!areacode || (self.selectedCountryCode === "US" && !areacode.match(/^\d{3}$/)) ) {
					monster.ui.alert('error', self.i18n.active().buyNumbers.noInputAlert);
				} else if( isSeqNumChecked && !(seqNumIntvalue > 1) ) {
					monster.ui.alert('error', self.i18n.active().buyNumbers.seqNumAlert);
				} else {
					if(isSeqNumChecked) { /***** Block Search *****/
						performSearch = function(_offset, _limit, _callback) {
							loadingNewNumbers = true;
							resultDiv.append(monster.template(self, 'buyNumbers-loadingNumbers', {}));
							//resultDiv[0].scrollTop = resultDiv[0].scrollHeight;
							self.callApi({
								resource: 'numbers.searchBlocks',
								data: {
									pattern: "%2B"+availableCountries[self.selectedCountryCode].prefix+areacode,
									size: seqNumIntvalue,
									offset: _offset,
									limit: _limit
								},
								success: function(data, status) {
									if(data.data && data.data.length > 0) {
										$.each(data.data, function(key, value) {
											var startNum = value.start_number,
												endNum = value.end_number,
												prefix = "+"+availableCountries[self.selectedCountryCode].prefix;

											if(startNum.indexOf(prefix) === 0) { startNum = startNum.substring(prefix.length); }
											if(endNum.indexOf(prefix) === 0) { endNum = endNum.substring(prefix.length); }

											args.displayedNumbers.push({
												array_index: args.displayedNumbers.length,
												number_value: startNum + "_" + value.size,
												formatted_value: self.buyNumbersFormatNumber(startNum, self.selectedCountryCode, endNum),
												price: value.size * args.prices.regular
											});
										});

										searchOffset += _limit;
									} else {
										args.isSearchFunctionEnabled = false;
									}

									_callback && _callback();
									loadingNewNumbers = false;
								},
								error: function(data, status) {
									monster.ui.alert('error', self.i18n.active().buyNumbers.unavailableServiceAlert);
									_callback && _callback();
									loadingNewNumbers = false;
								}
							});
						};
					} else { /***** Regular Search *****/
						performSearch = function(_offset, _limit, _callback) {
							loadingNewNumbers = true;
							resultDiv.append(monster.template(self, 'buyNumbers-loadingNumbers', {}));
							resultDiv[0].scrollTop = resultDiv[0].scrollHeight;

							self.callApi({
								resource: 'numbers.search',
								data: {
									pattern: areacode,
									offset: _offset,
									limit: _limit
								},
								success: function(data, status) {
									if(data.data && data.data.length > 0) {
										$.each(data.data, function(key, value) {
											var num = value.number,
												prefix = "+"+availableCountries[self.selectedCountryCode].prefix;

											if(num.indexOf(prefix) === 0) { num = num.substring(prefix.length); }

											args.displayedNumbers.push({
												array_index: args.displayedNumbers.length,
												number_value: num,
												formatted_value: self.buyNumbersFormatNumber(num, self.selectedCountryCode),
												price: seqNumIntvalue * args.prices.regular
											});
										});

										searchOffset += _limit;
									} else {
										args.isSearchFunctionEnabled = false;
									}

									_callback && _callback();
									loadingNewNumbers = false;
								},
								error: function(data, status) {
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
					performSearch(searchOffset, self.searchLimit, function() {
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
				if(args.isSearchFunctionEnabled && !loadingNewNumbers && $this.scrollTop() == $this[0].scrollHeight - $this.innerHeight()) {
					performSearch(searchOffset, self.searchLimit, function() {
						self.buyNumbersRefreshDisplayedNumbersList(args);
					});
				}
			});
		},

		buyNumbersFormatNumber: function(startNumber, countryCode, endNumber, addPrefix) {
			var self = this,
				number = startNumber.toString(),
				countryCode = countryCode || "US",
				endNumber = endNumber ? endNumber.toString() : number,
				result = number;

			switch(countryCode) {
				case "US":
					result = (addPrefix ? "+"+addPrefix+" " : "") + number.replace(/(\d{3})(\d{3})(\d{4})/,'($1) $2-$3');
					break;
				default:
					result = (addPrefix ? "+"+addPrefix : "") + number;
					break;
			}

			if(endNumber.length === number.length && endNumber !== number) {
				result += " "+self.i18n.active().buyNumbers.to+" " + endNumber.substr(endNumber.length - 4);
			}

			return result;
		},

		buyNumbersGetTotalNumbers: function(selectedNumbers) {
			var matched,
				result = {
					totalSelectedNumbers: 0,
					totalPrice: 0
				};

			$.each(selectedNumbers, function(key, value) {
				matched = value.number_value.match(/\d+_(\d+)/);
				if(matched) { result.totalSelectedNumbers += parseInt(matched[1], 10); }
				else { result.totalSelectedNumbers += 1; }
				result.totalPrice += parseInt(value.price, 10);
			});

			return result;
		},

		buyNumbersFormatCountryListElement: function(k, v) {
			return {
				text: v.name,
				value: k,
				imageSrc: "http://192.168.1.182:8888/number_manager/img/flags/"+k+".png"
			}
		},

		buyNumbersRefreshSelectedNumbersList: function(args) {
			var self = this,
				container = args.container,
				selectedNumbersList = monster.template(self, 'buyNumbers-selectedNumbers', { numbers: args.selectedNumbers }),
				totalNumbers = self.buyNumbersGetTotalNumbers(args.selectedNumbers);

			container.find('#search_result_div .right-div .center-div').empty().append(selectedNumbersList);
			container.find('#total_num_span').html(totalNumbers.totalSelectedNumbers);

			// display the plural if there's more than 1 number added
			textAdded = (totalNumbers.totalSelectedNumbers === 0 || totalNumbers.totalSelectedNumbers === 1) ? self.i18n.active().buyNumbers.numberAddedSingle : self.i18n.active().buyNumbers.numberAddedPlural;
			container.find('.number-added').html(textAdded);
		},

		buyNumbersRefreshDisplayedNumbersList: function(args) {
			var self = this,
				container = args.container,
				searchResultsList = monster.template(self, 'buyNumbers-searchResults', { numbers: args.displayedNumbers }),
				resultDiv = container.find('#search_result_div .left-div');

			resultDiv.empty().append(searchResultsList);

			if(!args.isSearchFunctionEnabled && resultDiv[0].scrollHeight > resultDiv.height()) {
				resultDiv.children('.number-box.number-wrapper').last().css('border-bottom','none');
			}
		},

		buyNumbersShowSearchResults: function(args) {
			var self = this,
				container = args.container,
				searchResultDiv = container.find('#search_result_div'),
				searchType = args.searchType;

			if(searchType === 'tollfree') {
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
			if(toggle) {
				unavailableDiv.hide();
				checkingDiv.show();
				checkingDiv.find('i.icon-spinner').addClass('icon-spin');
			} else {
				unavailableDiv.show();
				checkingDiv.hide();
				checkingDiv.find('i.icon-spinner').removeClass('icon-spin');
			}
		},

		buyNumbersSelectedNumbersToArray: function(selectedNumbers, prefix) {
			var result = [],
				prefix = prefix.toString().indexOf("+") < 0 ? "+"+prefix : prefix;
			_.each(selectedNumbers, function(val) {
				var block = val.number_value.match(/([0-9]+)_([0-9]+)/),
					number = block ? block[1] : val.number_value;
				if(block) {
					for(i=0; i<parseInt(block[2]); i++) {
						result.push(prefix+ (parseInt(number)+i) );
					}
				} else {
					result.push(prefix+number);
				}
			});

			return result;
		}

		/*add_numbers: function(numbers_data, callback, numbers_bought) {
			var self = this,
				number_data,
				numbers_bought = numbers_bought || [];

			if(numbers_data.length > 0) {
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

				if(phone_number[1]) {
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
				if(typeof callback === 'function') {
					callback(numbers_bought);
				}
			}
		},

		activate_number: function(phone_number, success, error) {
			var self = this;

			winkstart.request(false, 'buyNumbers.activateNumber', {
					account_id: winkstart.apps['auth'].account_id,
					api_url: winkstart.apps['auth'].api_url,
					phone_number: encodeURIComponent(phone_number),
					data: {}
				},
				function(_data, status) {
					if(typeof success == 'function') {
						success(_data, status);
					}
				},
				function(_data, status) {
					if(typeof error == 'function') {
						error(_data, status);
					}
				}
			);
		}*/

	};

	return buyNumbers;
});
