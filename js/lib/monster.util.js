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
			var i18n = monster.apps['core'].i18n.active(),
				timerAlert,
				timerLogout,
			    wait=15,
			    alertBeforeLogout=2,
			    alertTriggered = false,
			    alertDialog;

			var logout = function()	{
				monster.pub('auth.logout');
			};

			var resetTimer = function() {
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
		},

		/* Set the default Language to English, and overrides it with the language from the browser. If a cookie exists, we override the language value with the value stored in the cookie) */
		setDefaultLanguage: function() {
			var defaultLanguage = navigator.language || 'en-US';

			monster.config.language = monster.config.language || defaultLanguage;

			if($.cookie('monster-auth')) {
				var authData = $.parseJSON($.cookie('monster-auth'));

				monster.config.language = authData.language;
			};
		},

		toFriendlyDate: function(timestamp, type) {
			var self = this,
				parsedDate = '-';

			if(timestamp) {
				var today = new Date(),
					todayYear = today.getFullYear(),
					todayMonth = today.getMonth() + 1 < 10 ? '0' + (today.getMonth() + 1) : today.getMonth() + 1,
					todayDay = today.getDate() < 10 ? '0' + today.getDate() : today.getDate(),
					date = self.gregorianToDate(timestamp),
					month = date.getMonth() +1,
					year = date.getFullYear(),
					day = date.getDate(),
					hours = date.getHours(),
					minutes = date.getMinutes();

				if(hours >= 12) {
					if(hours !== 12) {
						hours-=12;
					}
					suffix = ' PM';
				}
				else {
					if(hours === 0) {
						hours = 12;
					}
					suffix = ' AM';
				}

				day = day < 10 ? '0' + day : day;
				month = month < 10 ? '0' + month : month;
				hours = hours < 10 ? '0'+ hours : hours;
				minutes = minutes < 10 ? '0'+ minutes : minutes;

				var humanDate = month+'/'+day+'/'+year,
					humanTime = hours + ':' + minutes + suffix;

				if(todayYear === year && todayMonth === month && todayDay === day && type !== 'short' && type !== 'standard') {
					humanDate = 'Today';
				}

				if(type === 'short') {
					parsedDate = humanDate;
				}
				else {
					parsedDate = humanDate + ' - ' + humanTime;
				}
			}

			return parsedDate;
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
					console.log('Please remove this console.log once we\'re sure this is not buggy! After the 5/7');
					console.log('replacing :' + currentSrc + ' by ' + newPath);
					listImg[i].src = newPath;
				}
			};

			for(var i = 0; i < $markup.length; i++) {
				result += $markup[i].outerHTML;
			};

			return result;
		}
	};

	return util;
});
