define(function(require){

	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var util = {

		/*
			This function will automatically logout the user after %wait% minutes (defaults to 15).
		   	This function will show a warning popup %alertBeforeLogout% minutes before logging out (defaults to 2). If the user moves his cursor, the timer will reset.
		*/
		autoLogout: function() {
			if(!monster.config.hasOwnProperty('logoutTimer') || monster.config.logoutTimer > 0) {
				var i18n = monster.apps['core'].i18n.active(),
					timerAlert,
					timerLogout,
					wait = monster.config.logoutTimer || 15,
					alertBeforeLogout = 2,
					alertTriggered = false,
					alertDialog,
					logout = function()	{
						monster.pub('auth.logout');
					},
					resetTimer = function() {
						clearTimeout(timerAlert);
						clearTimeout(timerLogout);

						if(alertTriggered) {
							alertTriggered = false;

							alertDialog.dialog('close').remove();
						}

						timerAlert=setTimeout(function() {
							alertTriggered = true;

							alertDialog = monster.ui.alert(i18n.alertLogout);
						}, 60000*(wait-alertBeforeLogout));

						timerLogout=setTimeout(function() {
							logout();
						}, 60000*wait);
					};

				document.onkeypress = resetTimer;
				document.onmousemove = resetTimer;

				resetTimer();
			}
		},

		/* Set the default Language to English, and overrides it with the language from the browser. If a cookie exists, we override the language value with the value stored in the cookie) */
		setDefaultLanguage: function() {
			var browserLanguage = (navigator.language).replace(/-.*/,function(a){return a.toUpperCase();}), // always capitalize the second part of the navigator language
				defaultLanguage = browserLanguage || 'en-US';

			monster.config.whitelabel.language = monster.config.whitelabel.language || defaultLanguage;

			if($.cookie('monster-auth')) {
				var authData = $.parseJSON($.cookie('monster-auth'));

				monster.config.whitelabel.language = authData.language;
			};
		},

		checkVersion: function(obj, callback) {
			var self = this,
				i18n = monster.apps['core'].i18n.active();

			if(obj.hasOwnProperty('ui_metadata') && obj.ui_metadata.hasOwnProperty('ui')) {
				if(obj.ui_metadata.ui !== 'monster-ui') {
					monster.ui.confirm(i18n.olderVersion, callback);
				}
				else {
					callback && callback();
				}
			}
			else {
				callback && callback();
			}
		},

		toFriendlyDate: function(timestamp, format){
			var self = this;

			if (typeof timestamp === 'number') {
				var i18n = monster.apps.core.i18n.active(),
					format2Digits = function(number) {
						return number < 10 ? '0'.concat(number) : number;
					},
					today = new Date(),
					todayYear = today.getFullYear(),
					todayMonth = format2Digits(today.getMonth() + 1),
					todayDay = format2Digits(today.getDate()),
					date = self.gregorianToDate(timestamp),
					year = date.getFullYear().toString().substr(2, 2),
					fullYear = date.getFullYear(),
					month = format2Digits(date.getMonth() + 1),
					calendarMonth = i18n.calendar.month[date.getMonth()],
					day = format2Digits(date.getDate()),
					weekDay = i18n.calendar.day[date.getDay()],
					hours = format2Digits(date.getHours()),
					minutes = format2Digits(date.getMinutes()),
					seconds = format2Digits(date.getSeconds()),
					patterns = {
						'year': fullYear,
						'YY': year,
						'month': calendarMonth,
						'MM': month,
						'day': weekDay,
						'DD': day,
						'hh': hours,
						'mm': minutes,
						'ss': seconds
					};

				if (format) {
					if (format === 'short') {
						format = 'MM/DD/year'
					}
				}
				else {
					format = 'MM/DD/year - hh:mm12h'
				}

				if (format.indexOf('12h') > -1) {
					var suffix;

					if (hours >= 12) {
						if (hours !== 12) {
							hours -= 12;
						}

						suffix = i18n.calendar.suffix.pm;
					}
					else {
						if (hours === '00') {
							hours = 12
						}

						suffix = i18n.calendar.suffix.am;
					}

					patterns.hh = hours;
					patterns['12h'] = suffix;
				}

				_.each(patterns, function(v, k){
					format = format.replace(k, v);
				});

				return format;
			}
			else {
				console.log('Timestamp should be a number');
			}
		},

		friendlyTimer: function(seconds) {
			var seconds = Math.floor(seconds),
				hours = Math.floor(seconds / 3600),
				minutes = Math.floor(seconds / 60) % 60,
				remainingSeconds = seconds % 60,
				displayTime = (hours < 10 ? '0' + hours : '' + hours) + ':' + (minutes < 10 ? '0' + minutes : '' + minutes) + ':' + (remainingSeconds < 10 ? '0' + remainingSeconds : '' + remainingSeconds);

			return seconds >= 0 ? displayTime : '00:00:00';
		},

		gregorianToDate: function(timestamp) {
			return (new Date((timestamp  - 62167219200)*1000));
		},

		dateToGregorian: function(date) {
			return parseInt((date.getTime() / 1000) + 62167219200);
		},

		dateToBeginningOfGregorianDay: function(date) {
			var self = this,
				newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

			return self.dateToGregorian(newDate);
		},

		dateToEndOfGregorianDay: function(date) {
			var self = this,
				newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

			return self.dateToGregorian(newDate);
		},

		unformatPhoneNumber: function(formattedNumber, specialRule) {
			var regex = /[^0-9]/g,
				specialRule = specialRule || 'none';

			if(specialRule === 'keepPlus') {
				regex = /[^0-9\+]/g;
			}

			var phoneNumber = formattedNumber.replace(regex, '');

			return phoneNumber;
		},

		accountArrayToTree: function(accountArray, rootAccountId) {
			var result = {};

			$.each(accountArray, function(k, v) {
				if(v.id === rootAccountId) {
					if(!result[v.id]) { result[v.id] = {}; }
					result[v.id].name = v.name;
					result[v.id].realm = v.realm;
				}
				else {
					var parents = v.tree.slice(v.tree.indexOf(rootAccountId)),
						currentAcc;

					for(var i=0; i<parents.length; i++) {
						if(!currentAcc) {
							if(!result[parents[i]]) { result[parents[i]] = {}; }

						 	currentAcc = result[parents[i]];
 	 	 	 	 	 	}
						else {
							if(!currentAcc.children) { currentAcc.children = {}; }
							if(!currentAcc.children[parents[i]]) { currentAcc.children[parents[i]] = {}; }

							currentAcc = currentAcc.children[parents[i]];
						}
					}

					if(!currentAcc.children) { currentAcc.children = {}; }
					if(!currentAcc.children[v.id]) { currentAcc.children[v.id] = {}; }

					currentAcc.children[v.id].name = v.name;
					currentAcc.children[v.id].realm = v.realm;
				}
			});

			return result;
		},

		formatPhoneNumber: function(phoneNumber){
			if(phoneNumber) {
				phoneNumber = phoneNumber.toString();

				if(phoneNumber.substr(0,2) === "+1" && phoneNumber.length === 12) {
					phoneNumber = phoneNumber.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
				}
				else if(phoneNumber.length === 10) {
					phoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '+1 ($1) $2-$3');
				}
			}

			return phoneNumber;
		},

		formatMacAddress: function(macAddress) {
			var regex = /[^0-9a-fA-F]/g,
			    macAddress = macAddress.replace(regex, ''),
				formattedMac = '';

			if(macAddress.length === 12) {
				var i = 0;

				for(var c in macAddress) {
    				if((i%2 === 0) && (i !== 0)) {
        				formattedMac += ':' + macAddress[i];
    				}
    				else {
        				formattedMac += macAddress[i];
    				}
    				i++;
				}
			}

			return formattedMac;
		},

		getDefaultRangeDates: function(range) {
			var self = this,
				range = range || 7,
				dates = {
					from: '',
					to: ''
				};

			var fromDefault = new Date(),
				toDefault = new Date();

			if(range === 'monthly') {
				fromDefault.setMonth(fromDefault.getMonth() - 1);
			}
			else {
				fromDefault.setDate(fromDefault.getDate() - range);
			}
			fromDefault.setDate(fromDefault.getDate() + 1);

			dates.from = fromDefault;
			dates.to = toDefault;

			return dates;
		},

		randomString: function(length, _chars) {
			var chars = _chars || "23456789abcdefghjkmnpqrstuvwxyz",
				randomString = '';

			for(var i = length; i > 0; i--) {
				randomString += chars.charAt(Math.floor(Math.random() * chars.length));
			}

			return randomString;
		},

		/* Automatically sorts an array of objects. secondArg can either be a custom sort to be applied to the dataset, or a fieldName to sort alphabetically on */
    	sort: function(dataSet, secondArg) {
			var fieldName = 'name',
    			sortFunction = function(a, b) {
    				var aString = a[fieldName].toLowerCase(),
    					bString = b[fieldName].toLowerCase(),
    					result = (aString > bString) ? 1 : (aString < bString) ? -1 : 0;

					return result;
    			};

    		if(typeof secondArg === 'function') {
				sortFunction = secondArg;
    		}
    		else if(typeof secondArg === 'string') {
				fieldName = secondArg;
    		}

    		result = dataSet.sort(sortFunction);

			return result;
    	},

		// expects time string if format 9:00AM or 09:00AM. This is used by Main Number custom hours, and its validation.
		timeToSeconds: function(time) {
			var suffix = time.substring(time.length-2),
				timeArr = time.split(':'),
				h = parseInt(timeArr[0],10),
				m = parseInt(timeArr[1],10);

			if(suffix === 'pm' && h < 12) {
				h += 12;
			} else if(suffix === "am" && h === 12) {
				h = 0;
			}

			return (h*3600 + m*60).toString();
		},

		// takes a HTML element, and update img relative paths to complete paths if they need to be updated
		// without this, img with relative path would  be displayed from the domain name of the browser, which we want to avoid since we're loading sources from external URLs for some apps
		updateImagePath: function(markup, app) {
			var $markup = $(markup),
				listImg = $markup.find('img'),
				result = '';

			// For each image, check if the path is correct based on the appPath, and if not change it
			for(var i = 0; i < listImg.length; i++) {
				var	currentSrc = listImg[i].src;

				// If it's an image belonging to an app, and the current path doesn't contain the right appPath
				if(currentSrc.indexOf(app.name) >= 0 && currentSrc.indexOf(app.appPath) < 0) {
					// We replace it by the app path and append the path of the image (we strip the name of the app, since it's already part of the appPath)
					var newPath = app.appPath + currentSrc.substring(currentSrc.indexOf(app.name) + app.name.length, currentSrc.length);

					listImg[i].src = newPath;
				}
			};

			for(var i = 0; i < $markup.length; i++) {
				result += $markup[i].outerHTML;
			};

			return result;
		},

		/**
		 * @desc add or remove business days to the current date or to a specific date
		 * @param numberOfDays - mandatory integer representing the number of business days to add
		 * @param from - optional JavaScript Date Object
		 */
		getBusinessDate: function(numberOfDays, from) {
			var self = this,
				from = from && from instanceof Date ? from : new Date(),
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
		}
	};

	return util;
});
