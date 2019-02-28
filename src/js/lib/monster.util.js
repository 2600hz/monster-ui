define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		libphonenumber = require('libphonenumber'),
		moment = require('moment');

	require('moment-timezone');
		//momentTimezone = require('moment-timezone');

	var util = {

		/**
		 * Format bytes to display its decimal multiple
		 * @param  {Number} bytes   Number in bytes to format
		 * @param  {Number} pDigits Number of digits after decimal point
		 *                          default: 0 if multiple is < GB, 1 if multiple is >= GB
		 * @return {Object}         Object containing the formatted data about the initial bytes value
		 */
		formatBytes: function(bytes, pDigits) {
			var base = 1000,
				sizes = monster.apps.core.i18n.active().unitsMultiple.byte,
				exponent = Math.floor(Math.log(bytes) / Math.log(base)),
				value = bytes / Math.pow(base, exponent),
				digits = pDigits || (exponent > 2 ? 1 : 0);

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
		},

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

		getModbID: function(id, timestamp) {
			var jsDate = gregorianToDate(timestamp),
				UTCYear = jsDate.getUTCFullYear() + '',
				UTCMonth = jsDate.getUTCMonth() + 1,
				formattedUTCMonth = UTCMonth < 10 ? '0' + UTCMonth : UTCMonth + '',
				modbDBprefix = UTCYear + formattedUTCMonth + '-',
				modbString;

			// Verify that the ID we got is not already a MODB ID
			if (id.substr(0, 7) !== modbDBprefix) {
				modbString = UTCYear + formattedUTCMonth + '-' + id;
			} else {
				modbString = id;
			}

			return modbString;
		},

		dateToUnix: function(date) {
			var formattedResponse;

			// This checks that the parameter is an object and not null
			if (typeof date === 'object' && date) {
				formattedResponse = parseInt(date.getTime() / 1000);
			}

			return formattedResponse;
		},

		unformatPhoneNumber: function(formattedNumber, pSpecialRule) {
			var resp = libphonenumber.parse(phoneNumber, {
					country: {
						'default': 'US'
					}
				}),
				phoneNumber;

			if (resp.hasOwnProperty('country') && resp.hasOwnProperty('phone') && resp.country.length && resp.phone.length) {
				phoneNumber = libphonenumber.format(resp.phone, resp.country, 'International_plaintext');
			} else {
				phoneNumber = formattedNumber.replace(/[^0-9+]/g, '');
			}

			return phoneNumber;
		},

		formatPhoneNumber: function(phoneNumber) {
			var self = this,
				formattedPhoneNumber = phoneNumber;

			if (!monster.config.whitelabel.preventDIDFormatting && phoneNumber) {
				formattedPhoneNumber = self.getFormatPhoneNumber(phoneNumber).userFormat;
			}

			return formattedPhoneNumber;
		},

		getFormatPhoneNumber: function(phoneNumber) {
			var resp = libphonenumber.parse(phoneNumber, {
					country: {
						'default': 'US'
					}
				}),
				user = monster.apps.auth.currentUser || {},
				account = monster.apps.auth.originalAccount || {},
				formattedData = {
					originalNumber: phoneNumber,
					userFormat: phoneNumber // Setting it as a default, in case the number is not valid
				},
				getUserFormatFromEntity = function(entity, data) {
					var response = '';

					if (entity.ui_flags.numbers_format === 'national') {
						response = data.nationalFormat;
					} else if (entity.ui_flags.numbers_format === 'international') {
						response = data.internationalFormat;
					} else if (entity.ui_flags.numbers_format === 'international_with_exceptions') {
						if (entity.ui_flags.numbers_format_exceptions.length && entity.ui_flags.numbers_format_exceptions.indexOf(data.country.code) >= 0) {
							response = data.nationalFormat;
						} else {
							response = data.internationalFormat;
						}
					}
					return response;
				};

			if (resp.hasOwnProperty('country') && resp.hasOwnProperty('phone') && resp.country.length && resp.phone.length) {
				formattedData.e164Number = libphonenumber.format(resp.phone, resp.country, 'International_plaintext');
				formattedData.nationalFormat = libphonenumber.format(resp.phone, resp.country, 'National');
				formattedData.internationalFormat = libphonenumber.format(resp.phone, resp.country, 'International');

				formattedData.country = {
					code: resp.country,
					name: monster.timezone.getCountryName(resp.country)
				};

				// Default to international mode
				formattedData.userFormat = formattedData.internationalFormat;
				formattedData.userFormatType = 'international';

				if (user.hasOwnProperty('ui_flags') && user.ui_flags.hasOwnProperty('numbers_format') && user.ui_flags.numbers_format !== 'inherit') {
					formattedData.userFormatType = user.ui_flags.numbers_format;
					formattedData.userFormat = getUserFormatFromEntity(user, formattedData);
				} else if (account.hasOwnProperty('ui_flags') && account.ui_flags.hasOwnProperty('numbers_format')) {
					formattedData.userFormatType = account.ui_flags.numbers_format;
					formattedData.userFormat = getUserFormatFromEntity(account, formattedData);
				}
			}

			return formattedData;
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

		cmp: function(a, b) {
			return (a > b) ? 1 : (a < b) ? -1 : 0;
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

		// Takes a string and replace all the "_" from it with a " ". Also capitalizes first word.
		// Useful to display hardcoded data from the database that hasn't make it to the i18n files.
		formatVariableToDisplay: function(variable) {
			var str = variable || '',
				formattedString = str.replace(/_/g, ' ');

			formattedString = formattedString.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });

			return formattedString;
		},

		// Function returning if an account is a superduper admin, uses original account by default, but can take an account document in parameter
		isSuperDuper: function(pAccount) {
			var self = this,
				isSuperDuper = false,
				account = pAccount || (monster.apps.hasOwnProperty('auth') && monster.apps.auth.hasOwnProperty('originalAccount') ? monster.apps.auth.originalAccount : {});

			if (account.hasOwnProperty('superduper_admin')) {
				isSuperDuper = account.superduper_admin;
			}

			return isSuperDuper;
		},

		// We only let super duper admins impersonate users from subaccounts. If you're not a super duper admin, or if you're using the account you logged in with, you shouldn't have access to impersonating.
		canImpersonate: function(accountId) {
			var self = this,
				isDifferentAccount = monster.apps.auth.originalAccount.id !== accountId;

			return monster.util.isSuperDuper() && isDifferentAccount;
		},

		// Function returning if an account is in trial or not
		isTrial: function(pAccount) {
			var self = this,
				isTrial = false,
				account = pAccount || (monster.apps.hasOwnProperty('auth') && monster.apps.auth.hasOwnProperty('originalAccount') ? monster.apps.auth.originalAccount : {});

			if (account.hasOwnProperty('trial_time_left')) {
				isTrial = true;
			}

			return isTrial;
		},

		// Function returning if an account can add external numbers or not
		canAddExternalNumbers: function(pAccount) {
			var self = this,
				hasRights = false,
				account = pAccount || (monster.apps.hasOwnProperty('auth') && monster.apps.auth.hasOwnProperty('originalAccount') ? monster.apps.auth.originalAccount : {});

			if (account.hasOwnProperty('wnm_allow_additions') && account.wnm_allow_additions) {
				hasRights = true;
			}

			return hasRights;
		},

		// Function returning if a user is an admin or not
		isAdmin: function(pUser) {
			var self = this,
				user = pUser || (monster.apps.hasOwnProperty('auth') && monster.apps.auth.hasOwnProperty('currentUser') ? monster.apps.auth.currentUser : {});

			return user.priv_level === 'admin';
		},

		// Function returning if an account is a superduper admin, uses original account by default, but can take an account document in parameter
		isWhitelabeling: function() {
			return monster.config.whitelabel.hasOwnProperty('domain') && monster.config.whitelabel.domain.length > 0;
		},

		// Function returning a Boolean indicating whether the end-user is logged in or not.
		isLoggedIn: function() {
			var self = this,
				isLoggedIn = monster && monster.hasOwnProperty('apps') && monster.apps.hasOwnProperty('auth') && monster.apps.auth.hasOwnProperty('appFlags') && monster.apps.auth.appFlags.isAuthentified;

			return isLoggedIn;
		},

		// Function returning a Boolean indicating whether the current user is masquerading a sub-account or not.
		isMasquerading: function() {
			var self = this,
				isMasquerading = false;

			if (monster.hasOwnProperty('apps') && monster.apps.hasOwnProperty('auth') && monster.apps.auth.hasOwnProperty('originalAccount') && monster.apps.auth.hasOwnProperty('currentAccount')) {
				isMasquerading = monster.apps.auth.originalAccount.id !== monster.apps.auth.currentAccount.id;
			}

			return isMasquerading;
		},

		// Function returning a Boolean indicating whether the logged in account is a reseller or not.
		isReseller: function() {
			var self = this,
				isReseller = false;

			if (monster.hasOwnProperty('apps') && monster.apps.hasOwnProperty('auth') && monster.apps.auth.hasOwnProperty('originalAccount') && monster.apps.auth.originalAccount.hasOwnProperty('is_reseller')) {
				isReseller = monster.apps.auth.originalAccount.is_reseller;
			}

			return isReseller;
		},

		// Function returning map of URL parameters
		// Optional key, returns value of specific GET parameter
		// keepHashes was added because having hashes sometimes crashed some requests
		getUrlVars: function(key, pKeepHashes) {
			var vars = {},
				hashes = window.location.search.substring(1).split('&'),
				hash,
				keepHashes = pKeepHashes || false;

			for (var i = 0; i < hashes.length; i++) {
				hash = hashes[i].split('=');
				vars[hash[0]] = keepHashes ? hash[1] : (hash[1] || '').replace(/#/g, '');
			}

			// If we were looking for a specific key, then we only return that value, otherwise, return the full map of GET parameters
			return key ? vars[key] : vars;
		},

		/****************** Helpers not documented because people shoudln't need to use them *******************/

		// Helper only used in conference app, takes seconds and transforms it into a timer
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

				if (hours) {
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

		/* Set the language to start the application.
			By default will take the value from the cookie,
			or if it doesn't exist, it will take the value from the config.js,
			or if it's not set it will fall back to the language of the browser.
			In last resort it will set it to 'en-US' if nothing is set above
		*/
		setDefaultLanguage: function() {
			var languages = [
					'de-DE',
					'en-US',
					'es-ES',
					'fr-FR',
					'nl-NL',
					'ru-RU'
				],
				browserLanguage = _.find(languages, function(lang) {
					return lang.indexOf(navigator.language) > -1;
				}),
				cookieLanguage = monster.cookies.has('monster-auth') ? monster.cookies.getJson('monster-auth').language : undefined,
				defaultLanguage = browserLanguage || 'en-US';

			monster.config.whitelabel.language = cookieLanguage || monster.config.whitelabel.language || defaultLanguage;

			// Normalize the language to always be capitalized after the hyphen (ex: en-us -> en-US, fr-FR -> fr-FR)
			// Will normalize bad input from the config.js or cookie data coming directly from the database
			monster.config.whitelabel.language = (monster.config.whitelabel.language).replace(/-.*/, function(a) { return a.toUpperCase(); });
		},

		checkVersion: function(obj, callback) {
			var self = this,
				i18n = monster.apps.core.i18n.active();

			if (obj.hasOwnProperty('ui_metadata') && obj.ui_metadata.hasOwnProperty('ui')) {
				if (obj.ui_metadata.ui !== 'monster-ui') {
					monster.ui.confirm(i18n.olderVersion, callback);
				} else {
					callback && callback();
				}
			} else {
				callback && callback();
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

		// To keep the structure of the help settings consistent, we built this helper so devs don't have to know the exact structure
		// internal function used by different apps to set their own help flags.
		uiFlags: {
			user: {
				get: function(appName, flagName, pUser) {
					var user = pUser || monster.apps.auth.currentUser,
						value;

					if (user.hasOwnProperty('ui_help') && user.ui_help.hasOwnProperty(appName) && user.ui_help[appName].hasOwnProperty(flagName)) {
						value = user.ui_help[appName][flagName];
					}

					return value;
				},
				set: function(appName, flagName, value, pUser) {
					var user = pUser || monster.apps.auth.currentUser;

					user.ui_help = user.ui_help || {};
					user.ui_help[appName] = user.ui_help[appName] || {};
					user.ui_help[appName][flagName] = value;

					return user;
				},
				destroy: function(appName, flagName, pUser) {
					var user = pUser || monster.apps.auth.currentUser;

					user.ui_help = user.ui_help || {};
					user.ui_help[appName] = user.ui_help[appName] || {};
					delete user.ui_help[appName][flagName];

					if (_.isEmpty(user.ui_help[appName])) {
						delete user.ui_help[appName];
					}

					return user;
				}
			},

			account: {
				get: function(appName, flagName, pAccount) {
					var account = pAccount || monster.apps.auth.currentAccount,
						value;

					if (account.hasOwnProperty('ui_flags') && account.ui_flags.hasOwnProperty(appName) && account.ui_flags[appName].hasOwnProperty(flagName)) {
						value = account.ui_flags[appName][flagName];
					}

					return value;
				},
				set: function(appName, flagName, value, pAccount) {
					var account = pAccount || monster.apps.auth.currentAccount;

					account.ui_flags = account.ui_flags || {};
					account.ui_flags[appName] = account.ui_flags[appName] || {};
					account.ui_flags[appName][flagName] = value;

					return account;
				},
				destroy: function(appName, flagName, pAccount) {
					var account = pAccount || monster.apps.auth.currentAccount;

					account.ui_flags = account.ui_flags || {};
					account.ui_flags[appName] = account.ui_flags[appName] || {};
					delete account.ui_flags[appName][flagName];

					if (_.isEmpty(account.ui_flags[appName])) {
						delete account.ui_flags[appName];
					}

					return account;
				}
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

		/* Helper function that takes an array of number in parameter, sorts it, and returns the first number not in the array, greater than the minVal */
		getNextExtension: function(listNumbers) {
			var orderedArray = listNumbers,
				previousIterationNumber,
				minNumber = 1000,
				lowestNumber = minNumber,
				increment = 1;

			orderedArray.sort(function(a, b) {
				var parsedA = parseInt(a),
					parsedB = parseInt(b);

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
					// If we went through this loop already, previousIterationNumber will be set to the number of the previous iteration
					if (typeof previousIterationNumber !== 'undefined') {
						// If there's a gap for a number between the last number and the current number, we check if it's a valid possible number (ie, greater than minNumber)
						// And If yes, we return it, if not we just continue
						if (currentNumber - previousIterationNumber !== increment && previousIterationNumber >= minNumber) {
							return previousIterationNumber + increment;
						}
					// else, it's the first iteration, we initialize the minValue to the first number in the ordered array
					// only if it's greater than 1000, because we don't want to recommend lower numbers
					} else if (currentNumber > minNumber) {
						lowestNumber = currentNumber;
					}
					// We store current as the previous number for the next iteration
					previousIterationNumber = currentNumber;
				}
			});

			return (previousIterationNumber) ? previousIterationNumber + increment : lowestNumber;
		},

		findCallflowNode: function(callflow, module, data) {
			var self = this,
				result = [],
				matchNode = function(node) {
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
		},

		// Check if the object is parsable or not
		isJSON: function(obj) {
			var self = this;

			try {
				JSON.stringify(obj);
			} catch (e) {
				return false;
			}

			return true;
		},

		// Monster helper used to get the path to the icon of an app
		// Some app have their icons loaded locally, whereas some new apps won't have them
		getAppIconPath: function(app) {
			var self = this,
				response,
				authApp = monster.apps.auth,
				localIcons = ['accounts', 'auth-security', 'blacklists', 'branding', 'callflows', 'callqueues', 'call-recording', 'carriers',
					'cluster', 'conferences', 'csv-onboarding', 'debug', 'developer', 'dialplans', 'duo', 'fax', 'integration-aws', 'integration-google-drive',
					'migration', 'mobile', 'numbers', 'operator', 'operator-pro', 'pbxs', 'pivot', 'port', 'provisioner', 'reporting', 'reseller_reporting',
					'service-plan-override', 'tasks', 'taxation', 'userportal', 'voicemails', 'voip', 'webhooks', 'websockets'];

			if (localIcons.indexOf(app.name) >= 0) {
				response = 'css/assets/appIcons/' + app.name + '.png';
			} else {
				response = authApp.apiUrl + 'accounts/' + authApp.accountId + '/apps_store/' + app.id + '/icon?auth_token=' + self.getAuthToken();
			}

			return response;
		},

		guid: function() {
			var result = '';

			for (var i = 0; i < 4; i++) {
				result += (Math.random().toString(16) + '000000000').substr(2, 8);
			}

			return result;
		},

		getAuthToken: function(pConnectionName) {
			var self = this,
				authToken;

			if (monster && monster.hasOwnProperty('apps') && monster.apps.hasOwnProperty('auth')) {
				authToken = monster.apps.auth.getAuthTokenByConnection(pConnectionName);
			}

			return authToken;
		},

		getVersion: function() {
			return monster.config.developerFlags.build.version;
		},

		cacheUrl: function(url) {
			var self = this;

			return url;

			/* Commenting this as we don't want to add this just yet. We have issues with this code because versions from apps != versions in VERSION
			   If we were to use this, and just updated monster-ui-voip, the VERSION file wouldn't change, which means we wouldn't change the query sting used to get assets from any app, even monster-ui-voip...
			   This only gets incremented when master build runs, whereas we need it to be changed when an app is built as well...
			   Leaving this here for now, might have to just remove and forget about it eventually :/

				var self = this,
				prepend = url.indexOf('?') >= 0 ? '&' : '?',
				isDev = monster.config.developerFlags.build.type === 'development',
				devCacheString = (new Date()).getTime(),
				prodCacheString = monster.util.getVersion(),
				cacheString = prepend + '_=' + (isDev ? devCacheString : prodCacheString),
				finalString = url + cacheString;

			return finalString;*/
		},

		dataFlags: {
			get: function(flagName, object) {
				object.markers = object.markers || {};
				object.markers.monster = object.markers.monster || {};

				return object.markers.monster[flagName];
			},

			add: function(flags, object) {
				object.markers = object.markers || {};
				object.markers.monster = object.markers.monster || {};

				$.extend(true, object.markers.monster, flags);

				return object;
			},

			destroy: function(flagName, object) {
				object.markers = object.markers || {};
				object.markers.monster = object.markers.monster || {};

				delete object.markers.monster[flagName];

				return object;
			}
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
							replaceHTML(element, key, monster.util.unformatPhoneNumber(numbers[formattedKey]));
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

					logs.push({oldValue: oldValue, newValue: newValue});
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
	 * Formats a string into a string representation of a MAC address, using
	 * colons as separator.
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

	/**
	 * Decimal and currency formatting for prices
	 * @param  {Object}  args
	 * @param  {Number}  args.price        Price to format (number or string
	 *                                     representation of a number).
	 * @param  {Number}  args.digits       Number of digits to appear after the
	 *                                     decimal point.
	 * @param  {Boolean} args.withCurrency Hide/show currency symbol.
	 * @return {String}                    String representation of `price`.
	 *
	 * If `digits` is not specified, integers will have no digits and floating
	 * numbers with at least one significant number after the decimal point
	 * will have two digits.
	 */
	function formatPrice(args) {
		var price = Number(args.price);
		var digits = parseInt(args.digits);
		var withCurrency = _.isBoolean(args.withCurrency)
			? args.withCurrency
			: true;
		var digitsCount = digits >= 0
			? digits
			: 2;
		var roundedPrice = Math.round(price * Math.pow(10, digitsCount)) / Math.pow(10, digitsCount);
		var fixedPrice = roundedPrice.toFixed(parseInt(price) === price && (isNaN(digits) || digits < 0) ? 0 : digitsCount);
		var addCurrency = function(value) {
			var currencyCode = monster.config.hasOwnProperty('currencyCode')
				? monster.config.currencyCode
				: 'USD';
			var codeData = monster.supportedCurrencyCodes[currencyCode];
			var ret;
			if (_.isUndefined(codeData)) {
				throw new Error('Currency code ' + currencyCode + ' is not supported.');
			} else {
				if (codeData.position === 'ante') {
					ret = codeData.symbol + fixedPrice;
				} else if (codeData.position === 'post') {
					ret = fixedPrice + ' ' + codeData.symbol;
				}
			}
			return ret;
		};
		return withCurrency
			? addCurrency(fixedPrice)
			: fixedPrice;
	}

	/**
	 * Return the symbol of the currency used
	 * @return {String} Symbol of currency
	 */
	function getCurrencySymbol() {
		var currencyCode = monster.config.hasOwnProperty('currencyCode')
			? monster.config.currencyCode
			: 'USD';
		var codeData = monster.supportedCurrencyCodes[currencyCode];
		if (_.isUndefined(codeData)) {
			throw new Error('Currency code ' + currencyCode + ' is not supported');
		}
		return codeData.symbol;
	}

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
	 * Returns the available features for a Kazoo phone number
	 * @param  {Object} number  Phone number object, which contains the features details
	 * @return {String[]}       Number's available features
	 */
	function getNumberFeatures(number) {
		if (!_.isPlainObject(number)) {
			throw new TypeError('"number" is not an object');
		}
		if (!_.has(number, 'features_available') && !_.has(number, '_read_only.features_available')) {
			throw new Error('"number" does not represent a Kazoo phone number');
		}
		var numberFeatures = _.get(number, 'features_available', []);
		if (_.isEmpty(numberFeatures)) {
			numberFeatures = _.get(number, '_read_only.features_available', []);
		}
		return numberFeatures;
	}

	/**
	 * Returns the full name of a specific user or, if missing, of the currently
	 * logged in user.
	 * @param  {Object} [pUser]           User object, that contains at least first_name and last_name
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

	/**
	 * Determine if a specific number feature is enabled on the current account
	 * @param  {String}  feature  Feature to check (e.g. e911, cnam)
	 * @param  {Object}  pAccount Account object to check from (optional)
	 * @return {Boolean}          Indicate whether or not the feature is enabled
	 *
	 * The check is made against a flag in the account document but it can be
	 * overridden by a flag in `config.js/whitelabel.disableNumbersFeatures`. If
	 * none of those flags are set, it will return `true` by default.
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

	/**
	 * Formats a Gregorian/Unix timestamp or Date instances into a String
	 * representation of the corresponding date.
	 * @param  {Date|String} pDate   Representation of the date to format.
	 * @param  {String} pFormat      Tokens to format the date with.
	 * @param  {Object} pUser        Specific user to use for formatting.
	 * @param  {Boolean} pIsGregorian Indicate whether or not the date is in
	 *                                gregorian format.
	 * @param  {String} tz           Timezone to format the date with.
	 * @return {String}              Representation of the formatted date.
	 *
	 * If pDate is undefined then return an empty string. Useful for form which
	 * use toFriendlyDate for some fields with an undefined value. Otherwise it
	 * would display NaN/NaN/NaN in Firefox for example.
	 *
	 * By default, the timezone of the specified or logged in user will be used
	 * to format the date. If that timezone is not set, then the account
	 * timezone will be used. If not set, the browser’s timezone will be used as
	 * a last resort.
	 */
	function toFriendlyDate(pDate, pFormat, pUser, pIsGregorian, tz) {
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
		if (!_.isNull(moment.tz.zone(tz))) {
			return moment(date).tz(tz).format(format);
		}
		if (_.has(monster, 'apps.auth.currentUser.timezone')) {
			return moment(date)
				.tz(monster.apps.auth.currentUser.timezone)
				.format(format);
		}
		if (_.has(monster, 'apps.auth.currentAccount.timezone')) {
			return moment(date)
				.tz(monster.apps.auth.currentAccount.timezone)
				.format(format);
		}
		return moment(date).tz(moment.tz.guess()).format(format);
	}

	/**
	 * Converts a Unix timestamp into a Date instance
	 * @param  {Number} pTimestamp Unix timestamp
	 * @return {Date}           Converted Date instance
	 *
	 * Sometimes Unix times are defined with more precision, such as with the
	 * /legs API which returns channel created time in microseconds, so we need
	 * need to remove this extra precision to use the Date constructor.
	 *
	 * If we only get the "seconds" precision, we need to multiply it by 1000 to
	 * get milliseconds in order to use the Date constructor.
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

	util.formatMacAddress = formatMacAddress;
	util.formatPrice = formatPrice;
	util.getCurrencySymbol = getCurrencySymbol;
	util.getNumberFeatures = getNumberFeatures;
	util.getUserFullName = getUserFullName;
	util.gregorianToDate = gregorianToDate;
	util.isNumberFeatureEnabled = isNumberFeatureEnabled;
	util.randomString = randomString;
	util.toFriendlyDate = toFriendlyDate;
	util.unixToDate = unixToDate;

	return util;
});
