define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		libphonenumber = require('libphonenumber'),
		moment = require('moment');

	require('moment-timezone');

	var util = {

		parseDateString: function(dateString, dateFormat) {
			var self = this,
				regex = new RegExp(/(\d+)[/-](\d+)[/-](\d+)/),
				dateFormats = {
					'mdy': '$1/$2/$3',
					'dmy': '$2/$1/$3',
					'ymd': '$2/$3/$1'
				},
				format = (dateFormat in dateFormats) ? dateFormat : null;

			if (!format) {
				var user = monster.apps.auth.currentUser;
				format = user && user.ui_flags && user.ui_flags.date_format ? user.ui_flags.date_format : 'mdy';
			}

			return new Date(dateString.replace(regex, dateFormats[format]));
		},

		dateToGregorian: function(date) {
			var formattedResponse;

			// This checks that the parameter is an object and not null, or if it's a UNIX time
			if (typeof date === 'object' && date) {
				formattedResponse = parseInt((date.getTime() / 1000) + 62167219200);
			} else if (typeof date === 'number' && date) {
				formattedResponse = date + 62167219200;
			}

			return formattedResponse;
		},

		dateToUnix: function(date) {
			var formattedResponse;

			// This checks that the parameter is an object and not null
			if (typeof date === 'object' && date) {
				formattedResponse = parseInt(date.getTime() / 1000);
			}

			return formattedResponse;
		},

		getDefaultNumbersFormat: function() {
			var self = this,
				account = monster.apps.auth.originalAccount || {},
				format = 'international'; // default

			if (account && account.hasOwnProperty('ui_flags') && account.ui_flags.hasOwnProperty('numbers_format')) {
				format = account.ui_flags.numbers_format;
			}

			return format;
		},

		/**
		 * @desc add or remove business days to the current date or to a specific date
		 * @param numberOfDays - mandatory integer representing the number of business days to add
		 * @param from - optional JavaScript Date Object
		 */
		getBusinessDate: function(numberOfDays, pFrom) {
			var self = this,
				from = pFrom && pFrom instanceof Date ? pFrom : new Date(),
				weeks = Math.floor(numberOfDays / 5),
				days = ((numberOfDays % 5) + 5) % 5,
				dayOfTheWeek = from.getDay();

			if (dayOfTheWeek === 6 && days > -1) {
				if (days === 0) {
					days -= 2;
					dayOfTheWeek += 2;
				}

				days++;
				dayOfTheWeek -= 6;
			}

			if (dayOfTheWeek === 0 && days < 1) {
				if (days === 0) {
					days += 2;
					dayOfTheWeek -= 2;
				}

				days--;
				dayOfTheWeek += 6;
			}

			if (dayOfTheWeek + days > 5) {
				days += 2;
			}

			if (dayOfTheWeek + days < 1) {
				days -= 2;
			}

			return new Date(from.setDate(from.getDate() + weeks * 7 + days));
		},

		/****************** Helpers not documented because people shouldn't need to use them *******************/

		// Takes seconds and transforms it into a timer
		friendlyTimer: function(pSeconds, pMode) {
			var mode = pMode || 'normal',
				seconds = Math.floor(pSeconds),
				minutes = Math.floor(seconds / 60) % 60,
				hours = Math.floor(seconds / 3600) % 24,
				days = Math.floor(seconds / 86400),
				remainingSeconds = seconds % 60,
				i18n = monster.apps.core.i18n.active(),
				format2Digits = function(number) {
					if (typeof number === 'string') {
						number = parseInt(number);
					}
					return (number < 10 ? '0' : '') + number;
				},
				displayTime = '';

			if (mode === 'verbose') {
				displayTime = ''.concat(hours, ' ', i18n.friendlyTimer.hours, ', ', minutes, ' ', i18n.friendlyTimer.minutesAnd, ' ', remainingSeconds, ' ', i18n.friendlyTimer.seconds);
			} else if (mode === 'shortVerbose') {
				if (hours > 0) {
					var stringHour = hours === 1 ? i18n.friendlyTimer.hour : i18n.friendlyTimer.hours;
					displayTime = displayTime.concat(hours, ' ', stringHour, ' ');
				}

				if (minutes > 0) {
					var stringMinutes = minutes === 1 ? i18n.friendlyTimer.minute : i18n.friendlyTimer.minutes;
					displayTime = displayTime.concat(minutes, ' ', stringMinutes, ' ');
				}

				if (remainingSeconds > 0) {
					var stringSeconds = remainingSeconds === 1 ? i18n.friendlyTimer.second : i18n.friendlyTimer.seconds;
					displayTime = displayTime.concat(remainingSeconds, ' ', stringSeconds);
				}
			} else {
				displayTime = format2Digits(minutes) + ':' + format2Digits(remainingSeconds);

				if (hours || days) {
					displayTime = format2Digits(hours) + ':' + displayTime;
				}

				if (days) {
					displayTime = format2Digits(days) + ':' + displayTime;
				}
			}

			return seconds >= 0 ? displayTime : '00:00:00';
		},

		/*
			This function will automatically logout the user after %wait% minutes (defaults to 30).
			This function will show a warning popup %alertBeforeLogout% minutes before logging out (defaults to 2). If the user moves his cursor, the timer will reset.
		*/
		autoLogout: function() {
			if (!monster.config.whitelabel.hasOwnProperty('logoutTimer') || monster.config.whitelabel.logoutTimer > 0) {
				var i18n = monster.apps.core.i18n.active(),
					timerAlert,
					timerLogout,
					wait = monster.config.whitelabel.logoutTimer || 30,
					alertBeforeLogout = 2,
					alertTriggered = false,
					alertDialog,
					logout = function()	{
						monster.pub('auth.logout');
					},
					resetTimer = function() {
						clearTimeout(timerAlert);
						clearTimeout(timerLogout);

						if (alertTriggered) {
							alertTriggered = false;

							alertDialog.dialog('close').remove();
						}

						timerAlert = setTimeout(function() {
							alertTriggered = true;

							alertDialog = monster.ui.alert(i18n.alertLogout);
						}, 60000 * (wait - alertBeforeLogout));

						timerLogout = setTimeout(function() {
							logout();
						}, 60000 * wait);
					};

				document.onkeypress = resetTimer;
				document.onmousemove = resetTimer;

				resetTimer();
			}
		},

		accountArrayToTree: function(accountArray, rootAccountId) {
			var result = {};

			$.each(accountArray, function(k, v) {
				if (v.id === rootAccountId) {
					if (!result[v.id]) { result[v.id] = {}; }
					result[v.id].name = v.name;
					result[v.id].realm = v.realm;
				} else {
					var parents = v.tree.slice(v.tree.indexOf(rootAccountId)),
						currentAcc;

					for (var i = 0; i < parents.length; i++) {
						if (!currentAcc) {
							if (!result[parents[i]]) { result[parents[i]] = {}; }

							currentAcc = result[parents[i]];
						} else {
							if (!currentAcc.children) { currentAcc.children = {}; }
							if (!currentAcc.children[parents[i]]) { currentAcc.children[parents[i]] = {}; }

							currentAcc = currentAcc.children[parents[i]];
						}
					}

					if (!currentAcc.children) { currentAcc.children = {}; }
					if (!currentAcc.children[v.id]) { currentAcc.children[v.id] = {}; }

					currentAcc.children[v.id].name = v.name;
					currentAcc.children[v.id].realm = v.realm;
				}
			});

			return result;
		},

		getDefaultRangeDates: function(pRange) {
			var self = this,
				range = pRange || 7,
				dates = {
					from: '',
					to: ''
				};

			var fromDefault = new Date(),
				toDefault = new Date();

			if (range === 'monthly') {
				fromDefault.setMonth(fromDefault.getMonth() - 1);
			} else {
				fromDefault.setDate(fromDefault.getDate() - range);
			}
			fromDefault.setDate(fromDefault.getDate() + 1);

			dates.from = fromDefault;
			dates.to = toDefault;

			return dates;
		},

		getTZDate: function(date, tz) {
			return new Date(moment.tz(date, tz).unix() * 1000);
		},

		formatDateDigits: function(digit) {
			return digit < 10 ? '0' + digit : '' + digit;
		},

		dateToBeginningOfGregorianDay: function(date, pTimezone) {
			var self = this,
				timezone = pTimezone || moment.tz.guess(),
				// we do month + 1 because jsDate returns 0 for January ... 11 for December
				newDate = moment.tz('' + date.getFullYear() + self.formatDateDigits(date.getMonth() + 1) + self.formatDateDigits(date.getDate()) + ' 000000', timezone).unix();

			return self.dateToGregorian(newDate);
		},

		dateToEndOfGregorianDay: function(date, pTimezone) {
			var self = this,
				timezone = pTimezone || moment.tz.guess(),
				// we do month + 1 because jsDate returns 0 for January ... 11 for December
				newDate = moment.tz('' + date.getFullYear() + self.formatDateDigits(date.getMonth() + 1) + self.formatDateDigits(date.getDate()) + ' 235959', timezone).unix();

			return self.dateToGregorian(newDate);
		},

		// expects time string if format 9:00AM or 09:00AM. This is used by Main Number custom hours, and its validation.
		timeToSeconds: function(time) {
			var suffix = time.substring(time.length - 2).toLowerCase(),
				timeArr = time.split(':'),
				hours = parseInt(timeArr[0], 10),
				minutes = parseInt(timeArr[1], 10);

			if (suffix === 'pm' && hours < 12) {
				hours += 12;
			} else if (suffix === 'am' && hours === 12) {
				hours = 0;
			}

			return (hours * 3600 + minutes * 60).toString();
		},

		resetAuthCookies: function() {
			monster.cookies.remove('monster-auth');
			monster.cookies.remove('monster-sso-auth');
		},

		logoutAndReload: function() {
			var self = this;

			// Unbind window events before logout, via namespace (useful for events like
			// 'beforeunload', which may block the logout action)
			$(window).off('.unbindBeforeLogout');

			self.resetAuthCookies();

			self.reload();
		},

		reload: function() {
			var self = this;

			if (monster.config.whitelabel.hasOwnProperty('sso')) {
				var sso = monster.config.whitelabel.sso;
				/* this didn't work
					$.cookie(sso.cookie.name, null, {domain : sso.cookie.domain ,path:'/'});
				*/

				window.location = sso.logout;
			} else {
				window.location = window.location.pathname;
			}
		},

		// takes a HTML element, and update img relative paths to complete paths if they need to be updated
		// without this, img with relative path would  be displayed from the domain name of the browser, which we want to avoid since we're loading sources from external URLs for some apps
		updateImagePath: function(markup, app) {
			var $markup = $(markup),
				listImg = $markup.find('img'),
				result = '';

			// For each image, check if the path is correct based on the appPath, and if not change it
			for (var i = 0; i < listImg.length; i++) {
				var	currentSrc = listImg[i].src;

				// If it's an image belonging to an app, and the current path doesn't contain the right appPath
				if (currentSrc.indexOf(app.name) >= 0 && currentSrc.indexOf(app.appPath) < 0) {
					// We replace it by the app path and append the path of the image (we strip the name of the app, since it's already part of the appPath)
					var newPath = app.appPath + currentSrc.substring(currentSrc.indexOf(app.name) + app.name.length, currentSrc.length);

					listImg[i].src = newPath;
				}
			}

			for (var j = 0; j < $markup.length; j++) {
				result += $markup[j].outerHTML;
			}

			return result;
		},

		guid: function() {
			var result = '';

			for (var i = 0; i < 4; i++) {
				result += (Math.random().toString(16) + '000000000').substr(2, 8);
			}

			return result;
		},

		getVersion: function() {
			return monster.config.developerFlags.build.version;
		},

		jwt_decode: function(Token) {
			var base64Url = Token.split('.')[1],
				base64 = base64Url.replace('-', '+').replace('_', '/');

			return JSON.parse(window.atob(base64));
		},

		tryI18n: function(obj, key) {
			return obj.hasOwnProperty(key) ? obj[key] : monster.util.formatVariableToDisplay(key);
		},

		// Functions used to replace displayed phone numbers by other "fake" numbers. Can be useful to generate marketing documents or screenshots with lots of data without showing sensitive information
		protectSensitivePhoneNumbers: function() {
			var self,
				numbers = {},
				logs = [],
				printLogs = function() {
					var str = '';

					_.each(logs, function(item, index) {
						str += index + ' - replace ' + item.oldValue + ' by ' + item.newValue + '\n';
					});

					console.log(str);
				},
				randomNumber = function(format) {
					return (Math.floor(Math.random() * 9 * format) + 1 * format);
				},
				randomPhoneNumber = function() {
					return '+1 555 ' + randomNumber(100) + ' ' + randomNumber(1000);
				},
				randomExtension = function() {
					return '10' + randomNumber(10);
				},
				replacePhoneNumbers = function(element) {
					var text = element.innerText,
						regex = /(\+?[()\- \d]{10,})/g,
						match = regex.exec(text);

					while (match != null) {
						var key = match[0],
							formattedKey = monster.util.formatPhoneNumber(key);

						if (!numbers.hasOwnProperty(formattedKey)) {
							numbers[formattedKey] = randomPhoneNumber();
						}

						if (formattedKey !== key) {
							replaceHTML(element, key, unformatPhoneNumber(numbers[formattedKey]));
						} else {
							replaceHTML(element, key, numbers[key]);
						}

						match = regex.exec(text);
					}
				},
				replaceExtensions = function(element) {
					var text = element.innerText,
						regex = /(\d{4,7})/g,
						match = regex.exec(text);

					while (match != null) {
						var key = match[0];

						if (!numbers.hasOwnProperty(key)) {
							numbers[key] = randomExtension();
						}

						replaceHTML(element, key, numbers[key]);

						match = regex.exec(text);
					}
				},
				replaceHTML = function(element, oldValue, newValue) {
					// First we need to escape the old value, since we're creating a regex out of it, we can't have special regex characters like the "+" that are often present in phone numbers
					var escapedOldvalue = oldValue.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'),
						// Then we create a regex, because we want to replace all the occurences in the innerHTML, not just the first one
						regexOldValue = new RegExp(escapedOldvalue, 'g');

					// Replace all occurences of old value by the new value
					element.innerHTML = element.innerHTML.replace(regexOldValue, newValue);

					logs.push({ oldValue: oldValue, newValue: newValue });
				},
				replaceBoth = function(element) {
					replaceExtensions(element);
					replacePhoneNumbers(element);
				};

			document.querySelectorAll('.number-div,.monster-phone-number-value,.phone-number').forEach(replacePhoneNumbers);
			document.querySelectorAll('.extension').forEach(replaceExtensions);
			document.querySelectorAll('span,.number,.sub-cell,.element-title, .multi-line-div').forEach(replaceBoth);

			printLogs();
		}
	};

	/**
	 * Formats a string into a string representation of a MAC address, using colons as separator.
	 * @param  {String} url
	 * @return {String}
	 *
	 * Commenting this as we don't want to add this just yet. We have issues with this code because
	 * versions from apps != versions in VERSION.
	 *
	 * If we were to use this, and just updated monster-ui-voip, the VERSION file wouldn't change,
	 * which means we wouldn't change the query sting used to get assets from any app, even
	 * monster-ui-voip...
	 *
	 * This only gets incremented when master build runs, whereas we need it to be changed when an
	 * app is built as well...
	 *
	 * Leaving this here for now, might have to just remove and forget about it eventually :/
	 */
	function cacheUrl(url) {
		var self = this;

		return url;

		// var self = this;
		// var prepend = url.indexOf('?') >= 0 ? '&' : '?';
		// var isDev = monster.config.developerFlags.build.type === 'development';
		// var devCacheString = (new Date()).getTime();
		// var prodCacheString = monster.util.getVersion();
		// var cacheString = prepend + '_=' + (isDev ? devCacheString : prodCacheString);
		// var finalString = url + cacheString;

		// return finalString;
	}
	util.cacheUrl = cacheUrl;

	/**
	 * Returns whether an account is allowed to add external phone numbers.
	 * @param  {Object} [account] Account document to check against.
	 * @return {Boolean}          Whether `account` is allowed to add external phone numbers.
	 *
	 * When no `account` is provided, check against original account.
	 */
	function canAddExternalNumbers(account) {
		return _.isMatch(
			account || _.get(monster.apps, 'auth.originalAccount', {}),
			{ wnm_allow_additions: true }
		);
	}
	util.canAddExternalNumbers = canAddExternalNumbers;

	/**
	 * Returns whether `accountId` has the ability to impersonate sub-account users.
	 * @param  {String} accountId Account ID to check against.
	 * @return {Boolean}           Whether `accountId` has the ability to impersonate.
	 */
	function canImpersonate(accountId) {
		return isSuperDuper() && monster.apps.auth.originalAccount.id !== accountId;
	}
	util.canImpersonate = canImpersonate;

	/**
	 * Prompts for user confirmation when `object` has non Monster-UI metadata.
	 * @param  {Object} object    Object to check.
	 * @param  {Function} [callback] Calback to execute on confirmation.
	 */
	function checkVersion(object, pCallback) {
		var callback = pCallback || function() {};
		var i18n = monster.apps.core.i18n.active();
		var wasModifiedByDifferentUi = _.flow(
			_.partial(_.get, 'ui_metadata.ui'),
			_.overEvery(
				_.negate(_.isUndefined),
				_.partial(_.negate(_.isEqual), 'monster-ui')
			)
		);

		if (!wasModifiedByDifferentUi(object)) {
			return callback();
		}
		monster.ui.confirm(i18n.olderVersion, callback);
	}
	util.checkVersion = checkVersion;

	/**
	 * Compare function for `Array#sort`.
	 * @param  {*} a
	 * @param  {*} b
	 * @return {Number}
	 */
	function cmp(a, b) {
		return a > b ? 1
			: a < b ? -1
			: 0;
	}
	util.cmp = cmp;

	/**
	 * Collects callflow nodes matching `module` and `data`.
	 * @param  {Object} callflow Callfow object to scan.
	 * @param  {String} module   Node module to look for.
	 * @param  {Object} [data]   Node metadata to match.
	 * @return {Object|Object[]}          Nodes matching `module`/`data`.
	 */
	function findCallflowNode(callflow, module, data) {
		var result = [];
		var matchNode = function(node) {
			if (node.module === module) {
				if (!data || _.isEqual(data, node.data)) {
					result.push(node);
				}
			}
			_.each(node.children, function(child) {
				matchNode(child);
			});
		};

		matchNode(callflow.flow);

		return result.length > 1 ? result : result[0];
	}
	util.findCallflowNode = findCallflowNode;

	/**
	 * Parses bytes value into human readable value/unit pair.
	 * @param  {Number} bytes   Value in bytes to format
	 * @param  {Number} [digits] Digits after decimal point
	 *                          default: 0 if multiple is < GB, 1 if multiple is >= GB
	 * @return {Object}         Formatted data about `bytes`.
	 */
	function formatBytes(bytes, pDigits) {
		var base = 1000;
		var sizes = monster.apps.core.i18n.active().unitsMultiple.byte;
		var exponent = Math.floor(Math.log(bytes) / Math.log(base));
		var value = bytes / Math.pow(base, exponent);
		var digits = pDigits || (exponent > 2 ? 1 : 0);

		if (bytes === 0) {
			return {
				value: 0,
				unit: sizes[0]
			};
		} else {
			return {
				value: value.toFixed(digits),
				unit: sizes[exponent]
			};
		}
	}
	util.formatBytes = formatBytes;

	/**
	 * Formats a string into a string representation of a MAC address, using colons as separator.
	 * @param  {String} macAddress   String to format as MAC address.
	 * @return {String}              String representation of a MAC address.
	 */
	function formatMacAddress(macAddress) {
		if (!_.isString(macAddress)) {
			throw new TypeError('"macAddress" is not a string');
		}
		var matches = macAddress
			.toLowerCase()
			.replace(/[^0-9a-f]/g, '')
			.match(/[0-9a-f]{2}/g);

		return !_.isNull(matches) && _.size(matches) >= 6
			? matches.slice(0, 6).join(':')
			: '';
	}
	util.formatMacAddress = formatMacAddress;

	/**
	 * Wrapper over Intl.NumberFormat constructor's format function
	 * @param  {Object} args
	 * @param  {Number|String} args.number Number to format.
	 * @param  {Number} [args.digits] Exact number of fractional digits.
	 * @param  {('currency'|'decimal'|'percent')} [args.style='decimal'] Formating style to use.
	 * @return {String}      String representation of `number`
	 */
	function formatNumber(args) {
		var styles = ['currency', 'decimal', 'percent'];
		if (
			!(_.isNumber(args.number) || _.isString(args.number))
			|| _.isNaN(args.number)
			|| (_.isString(args.number) && _.chain(args.number).toNumber().isNaN().value())
			|| (_.isString(args.number) && _.isEmpty(args.number))
		) {
			throw new TypeError('"number" is not a valid number or not castable into a number');
		}
		if (
			!_.isUndefined(args.digits)
			&& (!_.isInteger(args.digits) || args.digits < 0)
		) {
			throw new TypeError('"digits" is not a positive integer');
		}
		if (
			!_.isUndefined(args.style)
			&& !_.includes(styles, args.style)
		) {
			throw new TypeError('"style" is not one of ' + styles.join(', '));
		}
		var number = _.toNumber(args.number);
		var style = _.get(args, 'style', 'decimal');
		var digits = _.get(args, 'digits', undefined);
		var formatter = new Intl.NumberFormat(monster.config.whitelabel.language, {
			style: style,
			currency: monster.config.currencyCode,
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		});
		return formatter.format(number);
	}
	util.formatNumber = formatNumber;

	/**
	 * Phone number formatting according to user preferences.
	 * @param  {Number|String} phoneNumber Input to format as phone number
	 * @return {String}                    Input formatted as phone number
	 *
	 * Warning: this method is used to format entities other than phone numbers (e.g. extensions)
	 * so keep that in mind if you plan to update it.
	 */
	function formatPhoneNumber(input) {
		var phoneNumber = getFormatPhoneNumber(input);
		return !monster.config.whitelabel.preventDIDFormatting && phoneNumber.isValid
			? _.get(phoneNumber, 'userFormat')
			: _.toString(input);
	}
	util.formatPhoneNumber = formatPhoneNumber;

	/**
	 * Decimal and currency formatting for prices
	 * @deprecated
	 * @param  {Object}  args
	 * @param  {Number}  args.price        Price to format (number or string representation of a
	 *                                     number).
	 * @param  {Number}  args.digits       Number of digits to appear after the decimal point.
	 * @param  {Boolean} args.withCurrency Hide/show currency symbol.
	 * @return {String}                    String representation of `price`.
	 *
	 * If `digits` is not specified, integers will have no digits and floating numbers with at least
	 * one significant number after the decimal point will have two digits.
	 */
	function formatPrice(args) {
		if (
			_.isNaN(args.price)
			|| (!_.isNumber(args.price) && _.isNaN(_.toNumber(args.price)))
		) {
			throw new TypeError('"price" is not a valid number or not castable into a number');
		}
		if (
			!_.isUndefined(args.digits)
			&& (!_.isNumber(args.digits) || (!_.isInteger(args.digits) || args.digits < 0))
		) {
			throw new TypeError('"digits" is not a positive integer');
		}
		if (!_.isUndefined(args.withCurrency) && !_.isBoolean(args.withCurrency)) {
			throw new TypeError('"withCurrency" is not a boolean');
		}
		var price = _.toNumber(args.price);
		var digits = _.get(args, 'digits', 2);
		var withCurrency = _.get(args, 'withCurrency', true);
		var formatter = new Intl.NumberFormat(monster.config.whitelabel.language, {
			style: withCurrency ? 'currency' : 'decimal',
			currency: monster.config.currencyCode,
			minimumFractionDigits: digits
		});

		return formatter.format(price);
	}
	util.formatPrice = formatPrice;

	/**
	 * Takes a string and replace all the "_" from it with a " ".
	 * Also capitalizes first word.
	 * Useful to display hardcoded data from the database that hasn't make it to the i18n files.
	 * @param  {*} variable Value to format.
	 * @return {String} Formatted string representation of the value.
	 */
	function formatVariableToDisplay(variable) {
		return _
			.chain(variable)
			.toString()
			.replace(/_/g, ' ')
			.replace(/\w\S*/g, _.capitalize)
			.value();
	}
	util.formatVariableToDisplay = formatVariableToDisplay;

	/**
	 * Returns an app's icon path/URL.
	 * @param  {Object} app
	 * @param  {String} app.name
	 * @param  {String} app.id
	 * @return {String}
	 *
	 * Some app have their icons loaded locally, whereas some new apps won't have them.
	 */
	function getAppIconPath(app) {
		var authApp = monster.apps.auth;
		var localIcons = [
			'accounts',
			'auth-security',
			'blacklists',
			'branding',
			'callflows',
			'callqueues',
			'call-recording',
			'carriers',
			'cluster',
			'conferences',
			'csv-onboarding',
			'debug',
			'developer',
			'dialplans',
			'duo',
			'fax',
			'integration-aws',
			'integration-google-drive',
			'migration',
			'mobile',
			'myaccount',
			'numbers',
			'operator',
			'operator-pro',
			'pbxs',
			'pivot',
			'port',
			'provisioner',
			'reporting',
			'reseller_reporting',
			'service-plan-override',
			'tasks',
			'taxation',
			'userportal',
			'voicemails',
			'voip',
			'webhooks',
			'websockets'
		];

		if (_.includes(localIcons, app.name)) {
			return 'css/assets/appIcons/' + app.name + '.png';
		} else {
			return _.join([
				authApp.apiUrl,
				'accounts/',
				authApp.accountId,
				'/apps_store/',
				app.id,
				'/icon?auth_token=',
				getAuthToken()
			], '');
		}
	}
	util.getAppIconPath = getAppIconPath;

	/**
	 * @param  {Object[]} apps List of apps to get app metadata from.
	 * @param  {String} input Either an app id or name to look for in `apps`.
	 * @return {Object} Formatted app metadata.
	 */
	function getAppMetadata(apps, input) {
		var app = _.find(apps, _.overSome(
			_.flow(
				_.partial(_.get, _, 'id'),
				_.partial(_.isEqual, input)
			),
			_.flow(
				_.partial(_.get, _, 'name'),
				_.partial(_.isEqual, input)
			)
		));

		if (_.isUndefined(app)) {
			return undefined;
		}

		var iconMetadata = _.merge({
			icon: getAppIconPath(app)
		}, _.includes(['alpha', 'beta'], app.phase) && {
			extraCssClass: app.phase + '-overlay-icon'
		});
		var locale = _.find([
			monster.config.whitelabel.language,
			monster.defaultLanguage,
			_.head(_.keys(app.i18n))
		], _.partial(_.has, app.i18n));
		var activeI18n = _.get(app.i18n, locale);

		return _.merge({}, _.omit(app, 'i18n'), activeI18n, iconMetadata);
	}

	/**
	 * @param  {String} input Either an app id or name to look for in the apps store.
	 * @return {Object} Formatted app metadata.
	 */
	function getAppStoreMetadata(input) {
		return getAppMetadata(
			_.get(monster.apps, 'auth.appsStore', []),
			input
		);
	}
	util.getAppStoreMetadata = getAppStoreMetadata;

	/**
	 * @param  {Object[]} apps List of apps to filter by `scope`.
	 * @param  {'all'|'account'|'user'} scope Scope to filter `apps` against.
	 * @return {Object[]} List of `apps` filtered for a `scope`.
	 */
	function listAppsMetadata(apps, scope) {
		var filterForAccount = _.partial(_.filter, _, _.flow(
			_.partial(_.ary(_.get, 2), _, 'allowed_users'),
			_.overEvery(
				_.isString,
				_.partial(_.negate(_.isEqual), 'specific')
			)
		));
		var isCurrentUserPermittedApp = _.partial(
			isUserPermittedApp,
			_.get(monster.apps, 'auth.currentUser')
		);
		var filterForCurrentUser = _.partial(_.filter, _, isCurrentUserPermittedApp);
		var getFilterForScope = function(pScope) {
			var filtersPerScope = {
				undefined: _.identity,
				all: _.identity,
				account: filterForAccount,
				user: filterForCurrentUser
			};
			var scope = _
				.chain(filtersPerScope)
				.keys()
				.find(_.partial(_.isEqual, pScope))
				.value();

			return _.get(filtersPerScope, scope);
		};
		var formatMetadata = _.flow(
			_.partial(_.ary(_.get, 2), _, 'id'),
			_.partial(getAppMetadata, apps)
		);

		return _
			.chain(apps)
			.thru(getFilterForScope(scope))
			.map(formatMetadata)
			.value();
	}
	util.listAppsMetadata = listAppsMetadata;

	/**
	 * @param  {String} scope
	 * @return {Object[]}
	 */
	function listAppStoreMetadata(scope) {
		return listAppsMetadata(
			_.get(monster.apps, 'auth.appsStore', []),
			scope
		);
	}
	util.listAppStoreMetadata = listAppStoreMetadata;

	/**
	 * Returns auth token for `connectionName`.
	 * @param  {String} [connectionName]
	 * @return {String}                 Auth token for `connectionName`.
	 */
	function getAuthToken(connectionName) {
		var getToken = _.get(
			monster.apps,
			'auth.getAuthTokenByConnection',
			function() { return undefined; }
		);

		return getToken(connectionName);
	}
	util.getAuthToken = getAuthToken;

	/**
	 * Returns a list of bookkeepers available for Monster UI
	 * @return {Array} List of bookkeepers availalbe
	 */
	function getBookkeepers() {
		var i18n = monster.apps.core.i18n.active().bookkeepers;

		return _.flatten([
			[
				{
					label: i18n.default,
					value: null
				}
			],
			_.chain(monster.config.whitelabel.bookkeepers)
				.map(function(isEnabled, bookkeeper) {
					return {
						bookkeeper: bookkeeper,
						isEnabled: isEnabled
					};
				})
				.filter('isEnabled')
				.map(function(item) {
					var value = _.get(item, 'bookkeeper');

					return {
						label: _.get(i18n, value, _.startCase(value)),
						value: value
					};
				})
				.sortBy('label')
				.value()
		]);
	}
	util.getBookkeepers = getBookkeepers;

	/**
	 * Returns capability information about a resource/feature.
	 * @param  {String|String[]} path Path to resource/feature.
	 * @return {undefined|String[]|Object} Capability information.
	 */
	function getCapability(path) {
		var node = _.get(monster.apps.auth.appFlags.capabilities, path);
		var isFeatureNode = _.has(node, 'available');

		if (!_.isPlainObject(node)) {
			return undefined;
		}
		if (!isFeatureNode) {
			return _.keys(node);
		}
		return _.merge({
			isEnabled: _.get(node, 'available')
		}, _.has(node, 'default') ? {
			defaultValue: _.get(node, 'default')
		} : {});
	}
	util.getCapability = getCapability;

	/**
	 * Return the symbol of the currency used through the UI
	 * @return {String} Symbol of currency
	 */
	function getCurrencySymbol() {
		var base = NaN;
		var formatter = new Intl.NumberFormat(monster.config.whitelabel.language, {
			style: 'currency',
			currency: monster.config.currencyCode
		});

		return formatter.format(base).replace('NaN', '').trim();
	}
	util.getCurrencySymbol = getCurrencySymbol;

	/**
	 * Returns the timezone of the currently authenticated session
	 * @return {String}  Current time zone identifier.
	 *
	 * By default, the time zone of the logged in user will be returned. If that time zone is not
	 * set, then the account time zone will be used. If not set, the browser’s time zone will be
	 * used as a last resort.
	 */
	function getCurrentTimeZone() {
		return _.get(monster, 'apps.auth.currentUser.timezone')
			|| _.get(monster, 'apps.auth.currentAccount.timezone')
			|| moment.tz.guess();
	}
	util.getCurrentTimeZone = getCurrentTimeZone;

	/**
	 * Returns the app considered as default for current user.
	 * @return {Object|Undefined} Current user's default app.
	 *
	 * When user document does not have an `appList`, defaults to using the first user accessible
	 * app from app store.
	 * When user does not have access to any app, returns `undefined`.
	 */
	function getCurrentUserDefaultApp() {
		var user = _.get(monster.apps, 'auth.currentUser', {});
		var validApps = listAppStoreMetadata('user');
		var validAppIds = _.map(validApps, 'id');

		return _
			.chain(user)
			.get('appList', [])
			.find(_.partial(_.includes, validAppIds))
			.thru(monster.util.getAppStoreMetadata)
			.defaultTo(_.head(validApps))
			.value();
	}
	util.getCurrentUserDefaultApp = getCurrentUserDefaultApp;

	/**
	 * @private
	 * @return {Object} Data flags manager module.
	 */
	function getDataFlagsManager() {
		var getPath = _.partial(_.concat, ['markers', 'monster']);
		return {
			get: function(name, object) {
				return _.get(object, getPath(name));
			},
			add: function(flags, object) {
				_.set(object, getPath(), flags);
				return object;
			},
			destroy: function(name, object) {
				_.unset(object, getPath(name));
				return object;
			}
		};
	}
	util.dataFlags = getDataFlagsManager();

	function getFormatPhoneNumber(input) {
		var phoneNumber = libphonenumber.parsePhoneNumberFromString(
			_.toString(input),
			monster.config.whitelabel.countryCode
		);
		var user = _.get(monster, 'apps.auth.currentUser', {});
		var account = _.get(monster, 'apps.auth.originalAccount', {});
		var formattedData = {
			isValid: false,
			originalNumber: input,
			userFormat: input // Setting it as a default, in case the number is not valid
		};
		var getUserFormatFromEntity = function(entity, data) {
			var formatter = _.get({
				national: _.partial(_.get, _, 'nationalFormat'),
				international: _.partial(_.get, _, 'internationalFormat'),
				international_with_exceptions: function(metadata) {
					var isException = _
						.chain(entity)
						.get('ui_flags.numbers_format_exceptions', [])
						.includes(metadata.country.code)
						.value();

					return _.get(metadata, isException ? 'nationalFormat' : 'internationalFormat');
				}
			}, entity.ui_flags);

			return formatter(data);
		};

		if (
			_.has(phoneNumber, 'country')
			&& !_.isEmpty(phoneNumber.country)
			&& _.has(phoneNumber, 'number')
			&& !_.isEmpty(phoneNumber.number)
		) {
			_.merge(formattedData, {
				isValid: phoneNumber.isValid(),
				e164Number: phoneNumber.format('E.164'),
				nationalFormat: phoneNumber.format('NATIONAL'),
				internationalFormat: phoneNumber.format('INTERNATIONAL'),
				country: {
					code: phoneNumber.country,
					name: monster.timezone.getCountryName(phoneNumber.country)
				},
				numberType: phoneNumber.getType()
			});

			if (_.get(user, 'ui_flags.numbers_format', 'inherit') !== 'inherit') {
				_.merge(formattedData, {
					userFormat: getUserFormatFromEntity(user, formattedData),
					userFormatType: _.get(user, 'ui_flags.numbers_format')
				});
			} else if (_.has(account, 'ui_flags.numbers_format')) {
				_.merge(formattedData, {
					userFormat: getUserFormatFromEntity(account, formattedData),
					userFormatType: _.get(account, 'ui_flags.numbers_format')
				});
			} else {
				_.merge(formattedData, {
					userFormat: phoneNumber.format('INTERNATIONAL'),
					userFormatType: 'international'
				});
			}
		}

		return formattedData;
	}
	util.getFormatPhoneNumber = getFormatPhoneNumber;

	/**
	 * Prepends MoDB prefix to a value when it does not already starts with it.
	 * @param  {String} id        Value to be prepended.
	 * @param  {Number} gregorian Gregorian timestamp.
	 * @return {String}           MoDB identifier.
	 */
	function getModbID(id, gregorian) {
		var date = gregorianToDate(gregorian);
		var prefix = moment(date).utc().format('YYYYMM-');

		return _.startsWith(id, prefix) ? id : prefix + id;
	}
	util.getModbID = getModbID;

	/**
	 * Determine the date format from a specific or current user's settings
	 * @private
	 * @param  {String} pFormat Specific format for the user
	 * @param  {Object} pUser   Specific user to get format from
	 * @return {String}         Computed representation of the format
	 */
	function getMomentFormat(pFormat, pUser) {
		var format = _.isString(pFormat)
			? pFormat
			: 'dateTime';
		var user = _.isObject(pUser)
			? pUser
			: _.get(monster, 'apps.auth.currentUser', {});
		var hourFormat = _.get(user, 'ui_flags.twelve_hours_mode', false)
			? '12h'
			: '24h';
		var dateFormat = _.get(user, 'ui_flags.date_format', 'mdy');
		var dateFormats = {
			dmy: 'DD/MM/YYYY',
			mdy: 'MM/DD/YYYY',
			ymd: 'YYYY/MM/DD'
		};
		var hourFormats = {
			'12h': 'hh',
			'24h': 'HH'
		};
		var shortcuts = {
			calendarDate: (dateFormat === 'mdy'
				? 'MMMM DD'
				: 'DD MMMM'
			) + ', YYYY',
			date: dateFormats[dateFormat],
			dateTime: dateFormats[dateFormat]
				.concat(
					' - ',
					hourFormats[hourFormat],
					':mm:ss'
				),
			shortDate: dateFormats[dateFormat].replace('YYYY', 'YY'),
			shortDateTime: dateFormats[dateFormat]
				.replace('YYYY', 'YY')
				.concat(
					' ',
					hourFormats[hourFormat],
					':mm'
				),
			shortTime: '' + hourFormats[hourFormat] + ':mm',
			time: '' + hourFormats[hourFormat] + ':mm:ss'
		};
		if (!_.includes(_.keys(shortcuts), format)) {
			throw new Error('`format` must be one of '.concat(
				_.keys(shortcuts).join(', '),
				' or undefined'
			));
		}
		if (hourFormat === '12h'
			&& _.includes([
				'shortDateTime',
				'dateTime',
				'shortTime',
				'time'
			], format)) {
			return shortcuts[format] + ' A';
		}
		return shortcuts[format];
	}

	/**
	 * Helper function that takes an array of number in parameter, sorts it, and returns the first
	 * number not in the array, greater than the minVal.
	 * @param  {String[]} listNumbers Values treated as existing extensions.
	 * @return {Number}             Next extension.
	 */
	function getNextExtension(listNumbers) {
		var orderedArray = listNumbers;
		var previousIterationNumber;
		var minNumber = 1000;
		var lowestNumber = minNumber;
		var increment = 1;

		orderedArray.sort(function(a, b) {
			var parsedA = parseInt(a);
			var parsedB = parseInt(b);

			if (isNaN(parsedA)) {
				return -1;
			} else if (isNaN(parsedB)) {
				return 1;
			} else {
				return parsedA > parsedB ? 1 : -1;
			}
		});

		_.each(orderedArray, function(number) {
			var currentNumber = parseInt(number);

			// First we make sure it's a valid number, if not we move on to the next number
			if (!isNaN(currentNumber)) {
				// If we went through this loop already, previousIterationNumber will be set to the
				// number of the previous iteration
				if (typeof previousIterationNumber !== 'undefined') {
					// If there's a gap for a number between the last number and the current number,
					// we check if it's a valid possible number (ie, greater than minNumber).
					// And If yes, we return it, if not we just continue
					if (
						currentNumber - previousIterationNumber !== increment
						&& previousIterationNumber >= minNumber
					) {
						return previousIterationNumber + increment;
					}
				// else, it's the first iteration, we initialize the minValue to the first number in
				// the ordered array.
				// only if it's greater than 1000, because we don't want to recommend lower numbers
				} else if (currentNumber > minNumber) {
					lowestNumber = currentNumber;
				}
				// We store current as the previous number for the next iteration
				previousIterationNumber = currentNumber;
			}
		});

		return (previousIterationNumber) ? previousIterationNumber + increment : lowestNumber;
	}
	util.getNextExtension = getNextExtension;

	/**
	 * Returns a list of features available for a Kazoo phone number.
	 * @param  {Object} number  Phone number object, which contains the features details
	 * @return {String[]}       Number's available features
	 */
	function getNumberFeatures(number) {
		if (!_.isPlainObject(number)) {
			throw new TypeError('"number" is not an object');
		}
		var pathToFeatures = _.find([
			'_read_only.features.available',
			'features_available'
		], function(path) {
			return _.has(number, path);
		});
		return _.get(number, pathToFeatures, []);
	}
	util.getNumberFeatures = getNumberFeatures;

	/**
	 * To keep the structure of the help settings consistent, we built this helper so devs don't
	 * have to know the exact structure internal function used by different apps to set their own
	 * help flags.
	 * @private
	 * @param  {'account'|'user'} context Context to use.
	 * @return {Object} UI flags manager module.
	 */
	function getUiFlagsManager(context) {
		var appliersPerContext = {
			account: function(func) {
				return function(object, app, flag, value) {
					var path = ['ui_flags', app, flag];
					return func(object || monster.apps.auth.currentAccount, path, value);
				};
			},
			user: function(func) {
				return function(object, app, flag, value) {
					var path = ['ui_help', app, flag];
					return func(object || monster.apps.auth.currentUser, path, value);
				};
			}
		};
		var applier = _.get(appliersPerContext, context);
		var unset = function(object, path) {
			_.unset(object, path);
			if (_.isEmpty(_.get(object, _.slice(path, -1), ''))) {
				_.unset(object, _.slice(path, -1));
			}
			return object;
		};

		return {
			get: applier(_.get),
			set: applier(_.set),
			destroy: applier(unset)
		};
	}
	util.uiFlags = {
		account: getUiFlagsManager('account'),
		user: getUiFlagsManager('user')
	};

	/**
	 * Returns map of URL parameters, with the option to return the value of a specific parameter
	 * @param  {String} [key]
	 * @return {Object|Array|String|undefined}
	 */
	function getUrlVars(key) {
		/**
		 * @param  {String} location
		 * @return {String}
		 */
		var getQueryString = function(location) {
			var hash = location.hash;
			var search;

			if (
				!_.isEmpty(hash)
				&& _.includes(hash, '?')
			) {
				search = hash.split('?')[1];
			} else {
				search = location.search.slice(1);
			}

			return search;
		};
		/**
		 * @param  {String} queryString
		 * @return {Object}
		 */
		var parseQueryString = function(queryString) {
			var pair;
			var paramKey;
			var paramValue;

			// if query string is empty exit early
			if (!queryString) {
				return {};
			}

			return _
				.chain(queryString)
				// anything after # is not part of the query string, so get rid of it
				.split('#', 1)
				.toString()
				// split our query string into its component parts
				.split('&')
				// prase query string key/value pairs
				.transform(function(acc, component) {
					// separate each component in key/value pair
					pair = component.split('=');

					// set parameter name and value (use 'true' if empty)
					paramKey = pair[0];
					paramValue = _.isUndefined(pair[1]) ? true : pair[1];

					// if the paramKey ends with square brackets, e.g. colors[] or colors[2]
					if (paramKey.match(/\[(\d+)?\]$/)) {
						// create key if it doesn't exist
						var key = paramKey.replace(/\[(\d+)?\]/, '');
						if (!acc[key]) {
							acc[key] = [];
						}

						// if it's an indexed array e.g. colors[2]
						if (paramKey.match(/\[\d+\]$/)) {
							// get the index value and add the entry at the appropriate position
							var index = /\[(\d+)\]/.exec(paramKey)[1];
							acc[key][index] = paramValue;
						} else {
							// otherwise add the value to the end of the array
							acc[key].push(paramValue);
						}
					} else {
						// we're dealing with a string
						if (!acc[paramKey]) {
							// if it doesn't exist, create property
							acc[paramKey] = paramValue;
						} else if (
							acc[paramKey]
							&& _.isString(acc[paramKey])
						) {
							// if property does exist and it's a string, convert it to an array
							acc[paramKey] = [acc[paramKey]];
							acc[paramKey].push(paramValue);
						} else {
							// otherwise add the property
							acc[paramKey].push(paramValue);
						}
					}
				}, {})
				.value();
		};
		/**
		 * @param  {Object} params
		 * @return {Object|Array|String|undefined}
		 */
		var resolveKey = function(params) {
			return _.isUndefined(key)
				? params
				: _.get(params, key, undefined);
		};
		var getUrlParams = _.flow(
			getQueryString,
			parseQueryString,
			resolveKey
		);

		return getUrlParams(window.location);
	}
	util.getUrlVars = getUrlVars;

	/**
	 * Returns the full name of a specific user or, if missing, of the currently logged in user.
	 * @param  {Object} [pUser]           User object, that contains at least first_name and
	 *                                    last_name
	 * @param  {String} pUser.first_name  User's first name
	 * @param  {String} pUser.last_name   User's last name
	 * @return {String}                   User's full name
	 */
	function getUserFullName(pUser) {
		if (_.isUndefined(pUser) && !monster.util.isLoggedIn()) {
			throw new Error('There is no logged in user');
		}
		if (!_.isUndefined(pUser) && !_.isPlainObject(pUser)) {
			throw new TypeError('"user" is not an object');
		}
		if (
			_.isPlainObject(pUser)
			&& (!_.has(pUser, 'first_name')
			|| !_.has(pUser, 'last_name'))
		) {
			throw new Error('"user" is missing "first_name" or "last_name');
		}
		var core = monster.apps.core;
		var user = _.isUndefined(pUser)
			? monster.apps.auth.currentUser
			: pUser;
		return core.getTemplate({
			name: '!' + core.i18n.active().userFullName,
			data: {
				firstName: user.first_name,
				lastName: user.last_name
			}
		});
	}
	util.getUserFullName = getUserFullName;

	/**
	 * Returns the initials (two characters) of a specific user or, if missing, of the currently
	 * logged in user.
	 *
	 * @param  {Object} [pUser]           User object, that contains at least first_name and
	 *                                    last_name
	 * @param  {String} pUser.first_name  User's first name
	 * @param  {String} pUser.last_name   User's last name
	 *
	 * @return {String}                   User's initials
	 */
	function getUserInitials(pUser) {
		if (_.isUndefined(pUser) && !monster.util.isLoggedIn()) {
			throw new Error('There is no logged in user');
		}
		if (!_.isUndefined(pUser) && !_.isPlainObject(pUser)) {
			throw new TypeError('"user" is not an object');
		}
		if (
			_.isPlainObject(pUser)
			&& (!_.has(pUser, 'first_name')
			|| !_.has(pUser, 'last_name'))
		) {
			throw new Error('"user" is missing "first_name" or "last_name');
		}

		var user = _.isUndefined(pUser)
			? monster.apps.auth.currentUser
			: pUser;

		return (user.first_name || '').charAt(0) + (user.last_name || '').charAt(0);
	}
	util.getUserInitials = getUserInitials;

	/**
	 * Converts a Gregorian timestamp into a Date instance
	 * @param  {Number} pTimestamp Gregorian timestamp
	 * @return {Date}           Converted Date instance
	 */
	function gregorianToDate(pTimestamp) {
		var timestamp = _.isString(pTimestamp)
			? _.parseInt(pTimestamp)
			: pTimestamp;
		if (_.isNaN(timestamp) || !_.isNumber(timestamp)) {
			throw new Error('`timestamp` is not a valid Number');
		}
		return new Date((_.floor(timestamp) - 62167219200) * 1000);
	}
	util.gregorianToDate = gregorianToDate;

	/**
	 * Returns whether a user has admin privileges.
	 * @param  {Object}  [user] User document to check against.
	 * @return {Boolean}      Whether `user` has admin privileges.
	 *
	 * When no `user` is provided, check against current user.
	 */
	function isAdmin(user) {
		return _.isMatch(
			user || _.get(monster.apps, 'auth.currentUser', {}),
			{ priv_level: 'admin' }
		);
	}
	util.isAdmin = isAdmin;

	/**
	 * Returns whether a value can be converted into JSON.
	 * @param  {*}  value Value to check.
	 * @return {Boolean}     Whether `value` can be converted into JSON.
	 */
	function isJSON(value) {
		try {
			JSON.stringify(value);
		} catch (e) {
			return false;
		}
		return true;
	}
	util.isJSON = isJSON;

	/**
	 * Returns whether or not a user is logged in
	 * @return {Boolean} Whether a user is logged in or not
	 */
	function isLoggedIn() {
		return _.get(monster, 'apps.auth.appFlags.isAuthentified', false);
	}
	util.isLoggedIn = isLoggedIn;

	/**
	 * Returns whether current account is masquerading.
	 * @return {Boolean} Whether current account is masquerading.
	 */
	function isMasquerading() {
		return _
			.chain([
				'auth.originalAccount.id',
				'auth.accountId'
			])
			.map(_.partial(_.ary(_.get, 2), monster.apps))
			.thru(_.overEvery(
				_.partial(_.every, _, _.isString),
				_.spread(_.negate(_.isEqual))
			))
			.value();
	}
	util.isMasquerading = isMasquerading;

	/**
	 * Determine if a specific number feature is enabled on the current account
	 * @param  {String}  feature  Feature to check (e.g. e911, cnam)
	 * @param  {Object}  pAccount Account object to check from (optional)
	 * @return {Boolean}          Indicate whether or not the feature is enabled
	 *
	 * The check is made against a flag in the account document but it can be overridden by a flag
	 * in `config.js/whitelabel.disableNumbersFeatures`. If none of those flags are set, it will
	 * return `true` by default.
	 */
	function isNumberFeatureEnabled(feature, pAccount) {
		return monster.config.whitelabel.disableNumbersFeatures
			? false
			: _.get(
				pAccount || monster.apps.auth.currentAccount,
				'numbers_features.'.concat(
					feature,
					'_enabled'
				),
				true
			);
	}
	util.isNumberFeatureEnabled = isNumberFeatureEnabled;

	/**
	 * Returns whether or not the account provided is a reseller or not.
	 * @param  {Object}  [pAccount] Account to check
	 * @return {Boolean}          Whether or not the account provided is a reseller or not
	 */
	function isReseller(pAccount) {
		var account = pAccount || _.get(monster, 'apps.auth.originalAccount', {});
		return _.get(account, 'is_reseller', false);
	}
	util.isReseller = isReseller;

	/**
	 * Returns whether an account is superduper admin.
	 * @param  {Object}  [account] Account document to check against.
	 * @return {Boolean}         Whether `account` is superduper admin.
	 *
	 * When no `account` is provided, check against original account.
	 */
	function isSuperDuper(account) {
		return _.isMatch(
			account || _.get(monster.apps, 'auth.originalAccount', {}),
			{ superduper_admin: true }
		);
	}
	util.isSuperDuper = isSuperDuper;

	/**
	 * Returns whether an account is in trial period.
	 * @param  {Object}  [account] Account document to check against.
	 * @return {Boolean}         Whether `account` is on Trial.
	 *
	 * When no `account` is provided, check against original account.
	 */
	function isTrial(account) {
		return _.has(
			account || _.get(monster.apps, 'auth.originalAccount', {}),
			'trial_time_left'
		);
	}
	util.isTrial = isTrial;

	/**
	 * Returns whether a user is allowed to access an app.
	 * @param  {Object}  user User document to check against.
	 * @param  {Object}  app  App metadata to check for.
	 * @return {Boolean}      Whether `user` has access to `app`.
	 */
	function isUserPermittedApp(user, app) {
		var allowedIds = _
			.chain(app)
			.get('users', [])
			.map('id')
			.value();
		var checksPerPermission = {
			all: function() {
				return true;
			},
			admins: _.flow(
				_.partial(_.get, _, 'priv_level'),
				_.partial(_.isEqual, 'admin')
			),
			specific: _.flow(
				_.partial(_.get, _, 'id'),
				_.partial(_.includes, allowedIds)
			),
			undefined: function() {
				return false;
			}
		};
		var permission = _
			.chain(checksPerPermission)
			.keys()
			.find(_.partial(_.isEqual, _.get(app, 'allowed_users')))
			.value();
		var checkForPermission = _.get(checksPerPermission, permission);

		return checkForPermission(user);
	}
	util.isUserPermittedApp = isUserPermittedApp;

	/**
	 * Returns whether whitelabelling is configured for current domain.
	 * @return {Boolean} Whether whitelabelling is configured for current domain.
	 */
	function isWhitelabeling() {
		return !_
			.chain(monster.config.whitelabel)
			.get('domain')
			.isEmpty()
			.value();
	}
	util.isWhitelabeling = isWhitelabeling;

	/**
	 * Returns list of formatted app links defined on whitelabel document.
	 * @return {Object[]} List of formatted app links.
	 */
	function listAppLinks() {
		var getOneKey = _.flow(
			_.keys,
			_.head
		);
		var formatLink = _.partial(function(locales, metadata, url) {
			var locale = _
					.chain(locales)
					.find(_.partial(_.has, metadata.i18n))
					.defaultTo(getOneKey(metadata.i18n))
					.value(),
				i18n = _.get(metadata.i18n, locale, {});

			return _.merge({
				id: url
			}, _.pick(metadata, [
				'icon'
			]), _.pick(i18n, [
				'label',
				'description'
			]));
		}, [
			monster.config.whitelabel.language,
			monster.defaultLanguage
		]);
		var hasInvalidProps = _.partial(function(props, link) {
			return _.some(props, _.flow(
				_.partial(_.get, link),
				_.negate(_.isString)
			));
		}, [
			'id',
			'icon',
			'label'
		]);

		return _
			.chain(monster.config.whitelabel.appLinks)
			.map(formatLink)
			.reject(hasInvalidProps)
			.value();
	}
	util.listAppLinks = listAppLinks;

	/**
	 * Generates a string of `length` random characters chosen from either a
	 * preset or a custom string of characters.
	 * @param  {Number} length  Number of characters to include.
	 * @param  {String} pPreset Characters to choose from.
	 * @return {String}         A string of random characters.
	 */
	function randomString(length, pPreset) {
		if (!_.isNumber(length)) {
			throw new TypeError('"length" is not a string');
		}
		if (_.isNaN(length)) {
			throw new TypeError('"length" is NaN');
		}
		if (!_.isUndefined(pPreset) && !_.isString(pPreset)) {
			throw new TypeError('"preset" is not a string');
		}
		if (!_.isUndefined(pPreset) && pPreset.length === 0) {
			throw new TypeError('"preset" is an empty string');
		}
		var input = _.isUndefined(pPreset)
			? 'safe'
			: pPreset;
		var presets = {
			alpha: '1234567890abcdefghijklmnopqrstuvwxyz',
			hex: '1234567890abcdef',
			letters: 'abcdefghijklmnopqrstuvwxyz',
			numerals: '1234567890',
			safe: '23456789abcdefghjkmnpqrstuvwxyz'
		};
		var preset = _
			.chain(presets)
			.get(input, input)
			.shuffle()
			.value();
		var upper = preset.length - 1;
		var getRandomItem = function() {
			var isUpper = _.sample([true, false]);
			var item = preset[_.random(upper)];
			return _[isUpper ? 'toUpper' : 'toLower'](item);
		};
		return length === 0
			? ''
			: _.chain(0)
				.range(length)
				.map(getRandomItem)
				.join('')
				.value();
	}
	util.randomString = randomString;

	/**
	 * Formats a Gregorian/Unix timestamp or Date instances into a String
	 * representation of the corresponding date.
	 * @param  {Date|String} pDate   Representation of the date to format.
	 * @param  {String} pFormat      Tokens to format the date with.
	 * @param  {Object} pUser        Specific user to use for formatting.
	 * @param  {Boolean} pIsGregorian Indicate whether or not the date is in gregorian format.
	 * @param  {String} pTz           Timezone to format the date with.
	 * @return {String}              Representation of the formatted date.
	 *
	 * If pDate is undefined then return an empty string. Useful for form which use toFriendlyDate
	 * for some fields with an undefined value. Otherwise it would display NaN/NaN/NaN in Firefox
	 * for example.
	 *
	 * By default, the timezone of the specified or logged in user will be used to format the date.
	 * If that timezone is not set, then the account timezone will be used. If not set, the
	 * browser’s timezone will be used as a last resort.
	 */
	function toFriendlyDate(pDate, pFormat, pUser, pIsGregorian, pTz) {
		if (_.isUndefined(pDate)) {
			return '';
		}
		var isGregorian = _.isBoolean(pIsGregorian)
			? pIsGregorian
			: true;
		var date = _.isDate(pDate)
			? pDate
			: isGregorian
				? gregorianToDate(pDate)
				: unixToDate(pDate);
		var format = getMomentFormat(pFormat, pUser);
		var tz = _.isNull(moment.tz.zone(pTz)) ? getCurrentTimeZone() : pTz;
		return moment(date)
			.tz(tz)
			.format(format);
	}
	util.toFriendlyDate = toFriendlyDate;

	/**
	 * Normalize phone number by using E.164 format
	 * @param  {String} input Input to normalize
	 * @return {String}       Input normalized as E.164 phone number
	 *
	 * Warning: this method is used to unformat entities other than phone
	 * numbers (e.g. extensions) so keep that in mind if you plan to update it.
	 */
	function unformatPhoneNumber(input) {
		var phoneNumber = getFormatPhoneNumber(input);
		return phoneNumber.isValid
			? _.get(phoneNumber, 'e164Number')
			: _.replace(input, /[^0-9+]/g, '');
	}
	util.unformatPhoneNumber = unformatPhoneNumber;

	/**
	 * Converts a Unix timestamp into a Date instance
	 * @param  {Number} pTimestamp Unix timestamp
	 * @return {Date}           Converted Date instance
	 *
	 * Sometimes Unix times are defined with more precision, such as with the /legs API which
	 * returns channel created time in microseconds, so we need need to remove this extra precision
	 * to use the Date constructor.
	 *
	 * If we only get the "seconds" precision, we need to multiply it by 1000 to get milliseconds in
	 * order to use the Date constructor.
	 */
	function unixToDate(pTimestamp) {
		var max = 9999999999999;
		var min = 10000000000;
		var timestamp = _.isString(pTimestamp)
			? _.parseInt(pTimestamp)
			: pTimestamp;
		if (_.isNaN(timestamp) || !_.isNumber(timestamp)) {
			throw new Error('`timestamp` is not a valid Number');
		}
		while (timestamp > max || timestamp < min) {
			if (timestamp > max) {
				timestamp /= 1000;
			}
			if (timestamp < min) {
				timestamp *= 1000;
			}
		}
		return new Date(timestamp);
	}
	util.unixToDate = unixToDate;

	return util;
});
