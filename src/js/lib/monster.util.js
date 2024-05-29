define(function(require) {
	var $ = require('jquery');
	var _ = require('lodash');
	var monster = require('monster');
	var libphonenumber = require('libphonenumber');
	var moment = require('moment');

	require('moment-timezone');

	return {
		autoLogout: autoLogout,
		cacheUrl: cacheUrl,
		canAddExternalNumbers: canAddExternalNumbers,
		canImpersonate: canImpersonate,
		checkVersion: checkVersion,
		cmp: cmp,
		dataFlags: getDataFlagsManager(),
		dateToBeginningOfGregorianDay: dateToBeginningOfGregorianDay,
		dateToEndOfGregorianDay: dateToEndOfGregorianDay,
		dateToGregorian: dateToGregorian,
		dateToUnix: dateToUnix,
		findCallflowNode: findCallflowNode,
		formatBytes: formatBytes,
		formatMacAddress: formatMacAddress,
		formatNumber: formatNumber,
		formatPhoneNumber: formatPhoneNumber,
		formatPrice: formatPrice,
		formatVariableToDisplay: formatVariableToDisplay,
		friendlyTimer: friendlyTimer,
		generateAccountRealm: generateAccountRealm,
		getAppIconPath: getAppIconPath,
		getAppStoreMetadata: getAppStoreMetadata,
		getAuthToken: getAuthToken,
		getBookkeepers: getBookkeepers,
		getBusinessDate: getBusinessDate,
		getCapability: getCapability,
		getCurrencySymbol: getCurrencySymbol,
		getCurrentTimeZone: getCurrentTimeZone,
		getCurrentUserDefaultApp: getCurrentUserDefaultApp,
		getDefaultNumbersFormat: getDefaultNumbersFormat,
		getDefaultRangeDates: getDefaultRangeDates,
		getFeatureConfig: getFeatureConfig,
		getFormatPhoneNumber: getFormatPhoneNumber,
		getModbID: getModbID,
		getNextExtension: getNextExtension,
		getNumberFeatures: getNumberFeatures,
		getRealmSuffix: getRealmSuffix,
		getUrlVars: getUrlVars,
		getUserFullName: getUserFullName,
		getUserInitials: getUserInitials,
		getVersion: getVersion,
		gregorianToDate: gregorianToDate,
		guid: guid,
		isAdmin: isAdmin,
		isFeatureAvailable: isFeatureAvailable,
		isJSON: isJSON,
		isLoggedIn: isLoggedIn,
		isMasquerading: isMasquerading,
		isNumberFeatureEnabled: isNumberFeatureEnabled,
		isReseller: isReseller,
		isSuperDuper: isSuperDuper,
		isTrial: isTrial,
		isUserPermittedApp: isUserPermittedApp,
		isWhitelabeling: isWhitelabeling,
		jwt_decode: jwt_decode,
		listAppsMetadata: listAppsMetadata,
		listAppStoreMetadata: listAppStoreMetadata,
		listAppLinks: listAppLinks,
		parseQueryString: parseQueryString,
		protectSensitivePhoneNumbers: protectSensitivePhoneNumbers,
		randomString: randomString,
		reload: reload,
		resetAuthCookies: resetAuthCookies,
		logoutAndReload: logoutAndReload,
		timeToSeconds: timeToSeconds,
		toFriendlyDate: toFriendlyDate,
		tryI18n: tryI18n,
		uiFlags: {
			account: getUiFlagsManager('account'),
			user: getUiFlagsManager('user')
		},
		unformatPhoneNumber: unformatPhoneNumber,
		unixToDate: unixToDate,
		updateImagePath: updateImagePath,
		isAuthorizedTopicForCrossSiteMessaging: isAuthorizedTopicForCrossSiteMessaging
	};

	function isAuthorizedTopicForCrossSiteMessaging(topicName) {
		var TopicForCrossSiteMessaging = [
			'voip.tab.myOffice',
			'voip.tab.numbers',
			'voip.tab.users',
			'voip.tab.groups',
			'voip.tab.strategy',
			'voip.tab.callLogs',
			'voip.tab.devices',
			'voip.tab.vmboxes',
			'voip.tab.featureCodes'
		];

		return TopicForCrossSiteMessaging.includes(topicName);
	}

	function getFeatureConfig(featurePath, defaultValue) {
		return _.get(monster.apps.auth.appFlags.featureSet, featurePath, defaultValue);
	}

	function isFeatureAvailable(featurePath) {
		return _.get(monster.apps.auth.appFlags.featureSet, featurePath, true);
	}

	/**
	 * Returns a randomly generated realm based on the logged in account's whitelabel document.
	 * @return {String|Undefined}
	 */
	function generateAccountRealm() {
		var realmSuffix = getRealmSuffix();
		var isRealmSuffixNotConfigured = _.isUndefined(realmSuffix);

		if (isRealmSuffixNotConfigured) {
			return undefined;
		}
		return _.toLower(
			randomString(7) + '.' + realmSuffix
		);
	}

	/**
	 * Returns the realm suffix of the logged in account's whitelabel document.
	 * @return {String|Undefined}
	 */
	function getRealmSuffix() {
		var realmSuffix = _.get(monster.config.whitelabel, 'realm_suffix');
		var isNonEmptyString = _.overEvery(
			_.isString,
			_.negate(_.isEmpty)
		);

		return _.find([
			realmSuffix
		], isNonEmptyString);
	}

	/**
	 * Automatically logout authenticated user afet `wait` minutes (defaults to 30).
	 * Shows a warning popup `alertBeforeLogout` minutes before logging out (defaults to 2).
	 * If the user moves his cursor, the timer resets.
	 */
	function autoLogout() {
		var minutesUntilLogout = monster.config.whitelabel.logoutTimer;
		var shouldScheduleAutoLogout = minutesUntilLogout > 0;

		if (!shouldScheduleAutoLogout) {
			return;
		}
		var i18n = monster.apps.core.i18n.active();
		var minutesUntilAlert = minutesUntilLogout - 2;
		var minutesToMilliseconds = _.partial(_.multiply, 60000);
		var delayBeforeLogout = minutesToMilliseconds(minutesUntilLogout);
		var delayBeforeAlert = minutesToMilliseconds(minutesUntilAlert);
		var wasAlertTriggered = false;
		var alertDialog;
		var timerAlert;
		var timerLogout;
		var openAlertDialog = function() {
			wasAlertTriggered = true;

			alertDialog = monster.ui.alert(i18n.alertLogout);
		};
		var logout = function()	{
			monster.pub('auth.logout');
		};
		var resetTimer = function() {
			clearTimeout(timerAlert);
			clearTimeout(timerLogout);

			if (wasAlertTriggered) {
				wasAlertTriggered = false;

				alertDialog.dialog('close').remove();
			}

			timerAlert = setTimeout(openAlertDialog, delayBeforeAlert);
			timerLogout = setTimeout(logout, delayBeforeLogout);
		};

		document.addEventListener('keydown', resetTimer);
		document.addEventListener('mousemove', resetTimer);

		resetTimer();
	}

	/**
	 * Appends app version to a url.
	 * @param  {Object} app Representation of an app.
	 * @param  {String} url URL to append version to.
	 * @return {String}     URL with version.
	 */
	function cacheUrl(app, url) {
		var isNonEmptyString = _.overEvery(
			_.isString,
			_.negate(_.isEmpty)
		);
		var bustValue = _.find([
			_.get(app, 'data.version'),
			_.toString(new Date().getTime())
		], isNonEmptyString);
		var bustName = 'v';
		var bustParameter = _.join([bustName, bustValue], '=');
		var delimiter = _.includes(url, '?') ? '&' : '?';

		return url + delimiter + bustParameter;
	}

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

	/**
	 * Returns whether `accountId` has the ability to impersonate sub-account users.
	 * @param  {String} accountId Account ID to check against.
	 * @return {Boolean}           Whether `accountId` has the ability to impersonate.
	 */
	function canImpersonate(accountId) {
		return isSuperDuper() && monster.apps.auth.originalAccount.id !== accountId;
	}

	/**
	 * Prompts for user confirmation when `object` has non Monster-UI metadata.
	 * @param  {Object} object    Object to check.
	 * @param  {Function} [callback] Calback to execute on confirmation.
	 */
	function checkVersion(object, pCallback) {
		var callback = pCallback || function() {};
		var i18n = monster.apps.core.i18n.active();
		var wasModifiedByDifferentUi = _.flow(
			_.partial(_.get, _, 'ui_metadata.ui'),
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

	/**
	 * @param  {Date} date      Date to convert to gregorian.
	 * @param  {String} [timezone] Timezone to set date in.
	 * @return {Number}           Gregorian timestamp to beginning of day.
	 */
	function dateToBeginningOfGregorianDay(date, pTimezone) {
		var dateToStartOfDay = moment(date).format('YYYYMMDD 000000');
		var timezone = pTimezone || moment.tz.guess();
		var unixTimestamp = moment.tz(dateToStartOfDay, timezone).unix();
		return dateToGregorian(unixTimestamp);
	}

	/**
	 * @param  {Date} date      Date to convert to gregorian.
	 * @param  {String} [timezone] Timezone to set date in.
	 * @return {Number}           Gregorian timestamp to end of day.
	 */
	function dateToEndOfGregorianDay(date, pTimezone) {
		var dateToEndOfDay = moment(date).format('YYYYMMDD 235959');
		var timezone = pTimezone || moment.tz.guess();
		var unixTimestamp = moment.tz(dateToEndOfDay, timezone).unix();
		return dateToGregorian(unixTimestamp);
	}

	/**
	 * @param  {Date|Number} date Date or UNIX timestanp
	 * @return {Number}      Gregorian timestamp.
	 */
	function dateToGregorian(date) {
		var unixToGregorian = function(timestamp) {
			return _.isNumber(timestamp) ? _.add(timestamp, 62167219200) : undefined;
		};
		var dateToGregorian = _.flow(
			dateToUnix,
			unixToGregorian
		);

		return _.isDate(date) ? dateToGregorian(date)
			: _.isNumber(date) ? unixToGregorian(date)
			: undefined;
	}

	/**
	 * @param  {Date} date
	 * @return {Number}      UNIX timestamp.
	 */
	function dateToUnix(date) {
		return _.isDate(date) ? _.floor(date.getTime() / 1000) : undefined;
	}

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
		var supportedLocales = _.keys(app.i18n);
		var locale = _.find([
			monster.config.whitelabel.language,
			monster.defaultLanguage,
			_.head(supportedLocales)
		], _.partial(_.has, app.i18n));
		var activeI18n = _.get(app.i18n, locale);

		return _.merge({
			supportedLocales: supportedLocales
		}, _.omit(app, [
			'i18n'
		]), activeI18n, iconMetadata);
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

	/**
	 * Returns auth token for `connectionName`.
	 * @param  {String} [connectionName]
	 * @return {String}                 Auth token for `connectionName`.
	 */
	function getAuthToken(connectionName) {
		return isLoggedIn()
			? monster.apps.auth.getAuthTokenByConnection(connectionName)
			: undefined;
	}

	/**
	 * Parses an amount of seconds and returns a time representation such as [DD:]HH:MM:SS.
	 * @param  {Number} seconds Amount of seconds to format.
	 * @param  {'verbose'|'shortVerbose'} [mode] Formatting type of time representation.
	 * @return {String} Time representation of `seconds`.
	 */
	function friendlyTimer(seconds, pMode) {
		var mode = pMode || 'normal';
		var seconds = Math.floor(seconds);
		var minutes = Math.floor(seconds / 60) % 60;
		var hours = Math.floor(seconds / 3600) % 24;
		var days = Math.floor(seconds / 86400);
		var remainingSeconds = seconds % 60;
		var i18n = monster.apps.core.i18n.active();
		var format2Digits = function(number) {
			if (typeof number === 'string') {
				number = parseInt(number);
			}
			return (number < 10 ? '0' : '') + number;
		};
		var getString = function(quantity, keys) {
			return i18n.friendlyTimer[quantity === 1 ? keys[0] : keys[1]];
		};
		var displayTime = '';

		if (mode === 'verbose') {
			displayTime = _.join([
				hours,
				i18n.friendlyTimer.hours + ',',
				minutes,
				i18n.friendlyTimer.minutesAnd,
				remainingSeconds,
				i18n.friendlyTimer.seconds
			], ' ');
		} else if (mode === 'shortVerbose') {
			if (hours > 0) {
				var stringHour = getString(hours, ['hour', 'hours']);
				displayTime = displayTime.concat(hours, ' ', stringHour, ' ');
			}

			if (minutes > 0) {
				var stringMinutes = getString(minutes, ['minute', 'minutes']);
				displayTime = displayTime.concat(minutes, ' ', stringMinutes, ' ');
			}

			if (remainingSeconds > 0) {
				var stringSeconds = getString(remainingSeconds, ['second', 'seconds']);
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
	}

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

	/**
	 * Adds/removes business days to/from the current date or a specific date.
	 * @param  {Number} numberOfDays Number of business days to add/remove.
	 * @param  {Date} [from]        Specific date to calculate from.
	 * @return {Date}              Adjusted date.
	 */
	function getBusinessDate(numberOfDays, pFrom) {
		var from = _.isDate(pFrom) ? pFrom : new Date();
		var weeks = Math.floor(numberOfDays / 5);
		var days = ((numberOfDays % 5) + 5) % 5;
		var dayOfTheWeek = from.getDay();

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
	}

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
			.thru(getAppStoreMetadata)
			.defaultTo(_.head(validApps))
			.value();
	}

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

	/**
	 * Returns numbers formatting strategy for the original account.
	 * @return {String} Numbers formatting strategy.
	 */
	function getDefaultNumbersFormat() {
		var account = _.get(monster.apps, 'auth.originalAccount', {});

		return _.find([
			_.get(account, 'ui_flags.numbers_format'),
			'international'
		], _.overEvery(
			_.isString,
			_.negate(_.isEmpty)
		));
	}

	/**
	 * @param  {'monthly'|Number} [range=7]
	 * @return {Object}
	 */
	function getDefaultRangeDates(pRange) {
		var range = pRange || 7;
		var now = moment();
		var params = range === 'monthly' ? {
			quantity: 1,
			period: 'month'
		} : {
			quantity: range,
			period: 'days'
		};

		return {
			from: now
				.clone()
				.subtract(params.quantity, params.period)
				.add(1, 'days')
				.toDate(),
			to: now.toDate()
		};
	}

	function getFormatPhoneNumber(input) {
		var phoneNumber = libphonenumber.parsePhoneNumberFromString(
			_.toString(input),
			monster.config.whitelabel.countryCode
		);
		var userFlags = _.get(monster, 'apps.auth.currentUser.ui_flags', {});
		var accountFlags = _.get(monster, 'apps.auth.originalAccount.ui_flags', {});
		var formattedData = {
			isValid: false,
			originalNumber: input,
			userFormat: input // Setting it as a default, in case the number is not valid
		};
		var getUserFormatFromFlags = function(flags, data) {
			var isException = _.flow(
				_.partial(_.get, _, 'numbers_format_exceptions', []),
				_.partial(_.includes, _, _.get(data, 'country.code'))
			);
			var rawFormat = flags.numbers_format;
			var format = rawFormat !== 'international_with_exceptions' ? rawFormat
				: isException(flags) ? 'national'
				: 'international';
			var formatter = _.get({
				national: _.partial(_.get, _, 'nationalFormat'),
				international: _.partial(_.get, _, 'internationalFormat')
			}, format);

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

			if (_.get(userFlags, 'numbers_format', 'inherit') !== 'inherit') {
				_.merge(formattedData, {
					userFormat: getUserFormatFromFlags(userFlags, formattedData),
					userFormatType: _.get(userFlags, 'numbers_format')
				});
			} else if (_.get(accountFlags, 'numbers_format', '') !== '') {
				_.merge(formattedData, {
					userFormat: getUserFormatFromFlags(accountFlags, formattedData),
					userFormatType: _.get(accountFlags, 'numbers_format')
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
	 * Finds the smallest number not in `list`, greater or equal to 1000.
	 * @param  {String[]} list Values treated as existing numbers.
	 * @return {Number}      Next number.
	 */
	function getNextExtension(list) {
		var minNumber = 1000;
		var isLessThan = function(a, b) {
			return _.every([
				_.every([a, b], _.isNumber),
				a < b
			]);
		};
		var isNonConsecutive = function(number, index, list) {
			var next = list[index + 1];
			var upperBound = _.isUndefined(next) ? Infinity : next;
			var candidate = number + 1;

			return isLessThan(candidate, upperBound);
		};
		var findFirstNonConsecutiveNumber = _.partial(_.find, _, isNonConsecutive);
		var getNextNumber = _.flow(
			_.sortBy,
			_.sortedUniq,
			findFirstNonConsecutiveNumber,
			_.partial(_.add, 1)
		);
		var isInvalidNumber = _.overSome(
			_.isNaN,
			_.negate(_.isFinite),
			_.partial(isLessThan, _, minNumber)
		);
		var sanitized = _
			.chain(list)
			.map(_.ary(_.parseInt, 1))
			.reject(isInvalidNumber)
			.value();
		var isMinNumberUnused = _.isEmpty(sanitized) || !_.includes(sanitized, minNumber);

		return isMinNumberUnused ? minNumber : getNextNumber(sanitized);
	}

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
			'metadata.features.available',
			'features_available'
		], function(path) {
			return _.has(number, path);
		});
		return _.get(number, pathToFeatures, []);
	}

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

	/**
	 * Returns the full name of a specific user or, if missing, of the currently logged in user.
	 * @param  {Object} [pUser]           User object, that contains at least first_name and
	 *                                    last_name
	 * @param  {String} pUser.first_name  User's first name
	 * @param  {String} pUser.last_name   User's last name
	 * @return {String}                   User's full name
	 */
	function getUserFullName(pUser) {
		if (_.isUndefined(pUser) && !isLoggedIn()) {
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
		if (_.isUndefined(pUser) && !isLoggedIn()) {
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

	/**
	 * Returns Monster-UI version number.
	 * @return {String} Monster-UI version number.
	 */
	function getVersion() {
		return monster.config.developerFlags.build.version;
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
	 * Returns a globally unique identifier.
	 * @return {String} Identifier.
	 */
	function guid() {
		var result = '';

		for (var i = 0; i < 4; i++) {
			result += (Math.random().toString(16) + '000000000').substr(2, 8);
		}

		return result;
	}

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

	/**
	 * Returns whether or not a user is logged in
	 * @return {Boolean} Whether a user is logged in or not
	 */
	function isLoggedIn() {
		return _.get(monster, 'apps.auth.appFlags.isAuthentified', false);
	}

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

	/**
	 * Returns whether or not the account provided is a reseller or not.
	 * @param  {Object}  [pAccount] Account to check
	 * @return {Boolean}          Whether or not the account provided is a reseller or not
	 */
	function isReseller(pAccount) {
		var account = pAccount || _.get(monster, 'apps.auth.originalAccount', {});
		return _.get(account, 'is_reseller', false);
	}

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

	/**
	 * Returns object representation of decoded JWT.
	 * @param  {String} token     JWT to decode.
	 * @return {Object|Undefined} Object representation of decoded `token`.
	 */
	function jwt_decode(token) {
		var base64Url = token.split('.')[1];
		var base64 = base64Url.replace('-', '+').replace('_', '/');
		var object;

		try {
			object = JSON.parse(atob(base64));
		} catch (error) {
			object = undefined;
		}

		return object;
	}

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

	/**
	 * Parses a query string into an object
	 * @param  {String} queryString Query string to be parsed
	 * @return {Object}             Object representation of the query string parameters
	 */
	function parseQueryString(queryString) {
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
	 * Function used to replace displayed phone numbers by "fake" numbers.
	 * Can be useful to generate marketing documents or screenshots with lots of data without
	 * showing sensitive information.
	 */
	function protectSensitivePhoneNumbers() {
		var numbers = {};
		var logs = [];
		var printLogs = function() {
			var str = '';

			_.each(logs, function(item, index) {
				str += index + ' - replace ' + item.oldValue + ' by ' + item.newValue + '\n';
			});

			console.log(str);
		};
		var randomNumber = function(format) {
			return (Math.floor(Math.random() * 9 * format) + 1 * format);
		};
		var randomPhoneNumber = function() {
			return '+1 555 ' + randomNumber(100) + ' ' + randomNumber(1000);
		};
		var randomExtension = function() {
			return '10' + randomNumber(10);
		};
		var replacePhoneNumbers = function(element) {
			var text = element.innerText;
			var regex = /(\+?[()\- \d]{10,})/g;
			var match = regex.exec(text);

			while (match != null) {
				var key = match[0];
				var formattedKey = formatPhoneNumber(key);

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
		};
		var replaceExtensions = function(element) {
			var text = element.innerText;
			var regex = /(\d{4,7})/g;
			var match = regex.exec(text);

			while (match != null) {
				var key = match[0];

				if (!numbers.hasOwnProperty(key)) {
					numbers[key] = randomExtension();
				}

				replaceHTML(element, key, numbers[key]);

				match = regex.exec(text);
			}
		};
		var replaceHTML = function(element, oldValue, newValue) {
			// First we need to escape the old value, since we're creating a regex out of it, we
			// can't have special regex characters like the "+" that are often present in phone
			// numbers
			var escapedOldvalue = oldValue.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
			// Then we create a regex, because we want to replace all the occurences in the
			// innerHTML, not just the first one
			var regexOldValue = new RegExp(escapedOldvalue, 'g');

			// Replace all occurences of old value by the new value
			element.innerHTML = element.innerHTML.replace(regexOldValue, newValue);

			logs.push({ oldValue: oldValue, newValue: newValue });
		};
		var replaceBoth = function(element) {
			replaceExtensions(element);
			replacePhoneNumbers(element);
		};

		document
			.querySelectorAll('.number-div,.monster-phone-number-value,.phone-number')
			.forEach(replacePhoneNumbers);
		document
			.querySelectorAll('.extension')
			.forEach(replaceExtensions);
		document
			.querySelectorAll('span,.number,.sub-cell,.element-title, .multi-line-div')
			.forEach(replaceBoth);

		if (monster.isDev()) {
			printLogs();
		}
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
	 * Reloads current URL or SSO logout one if configured.
	 */
	function reload() {
		if (monster.config.whitelabel.hasOwnProperty('sso')) {
			var sso = monster.config.whitelabel.sso;
			/* this didn't work
				$.cookie(sso.cookie.name, null, {domain : sso.cookie.domain ,path:'/'});
			*/

			window.location = sso.logout;
		} else {
			window.location = window.location.pathname;
		}
	}

	/**
	 * Unset authentication related cookies.
	 */
	function resetAuthCookies() {
		monster.cookies.remove('monster-auth');
		monster.cookies.remove('monster-sso-auth');
	}

	/**
	 * Triggers logout metchanism.
	 */
	function logoutAndReload() {
		// Unbind window events before logout, via namespace (useful for events like 'beforeunload',
		// which may block the logout action)
		$(window).off('.unbindBeforeLogout');

		resetAuthCookies();

		reload();
	}

	/**
	 * @param  {String} time Time in hh:mmA format
	 * @return {String}      Amount of seconds in `time`.
	 */
	function timeToSeconds(time) {
		var suffix = time.substring(time.length - 2).toLowerCase();
		var timeArr = time.split(':');
		var hours = parseInt(timeArr[0], 10);
		var minutes = parseInt(timeArr[1], 10);

		if (suffix === 'pm' && hours < 12) {
			hours += 12;
		} else if (suffix === 'am' && hours === 12) {
			hours = 0;
		}

		return (hours * 3600 + minutes * 60).toString();
	}

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

	/**
	 * Looks for `path`'s value' in `obj`, otherwise use human readable format of `path`.
	 * @param  {Object} obj Object to search.
	 * @param  {String} path Path to resolve.
	 * @return {String}     Value at `path` or humanl readable `path`.
	 */
	function tryI18n(obj, path) {
		return _.get(obj, path, formatVariableToDisplay(path));
	}

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

	/**
	 * Updates img relative paths to absolute paths if needed.
	 * @param  {HTMLElement} markup
	 * @param  {Object} app
	 * @return {String}
	 *
	 * Without this, img with relative path would be displayed from the domain name of the browser,
	 * which we want to avoid since we're loading sources from external URLs for some apps.
	 */
	function updateImagePath(markup, app) {
		var $markup = $(markup);
		var listImg = $markup.find('img');
		var result = '';

		// For each image, check if the path is correct based on the appPath, and if not change it
		for (var i = 0; i < listImg.length; i++) {
			var	currentSrc = listImg[i].src;

			// If it's an image belonging to an app, and the current path doesn't contain the right
			// appPath
			if (currentSrc.indexOf(app.name) >= 0 && currentSrc.indexOf(app.appPath) < 0) {
				// We replace it by the app path and append the path of the image (we strip the name
				// of the app, since it's already part of the appPath)
				var newPath = app.appPath + currentSrc.substring(
					currentSrc.indexOf(app.name) + app.name.length, currentSrc.length
				);

				listImg[i].src = newPath;
			}
		}

		for (var j = 0; j < $markup.length; j++) {
			result += $markup[j].outerHTML;
		}

		return result;
	}
});
