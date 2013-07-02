define(function(require){

	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var util = {
		addCommonI18n: function(app) {
			if('common' in monster.apps) {
				var i18n = monster.apps['common'].data.i18n;

				//We have to use jQuery deep copy
				app = $.extend(true, app.data.i18n, i18n);
			}
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

				if(todayYear === year && todayMonth === month && todayDay === day && type !== 'short') {
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

		gregorianToDate: function(timestamp) {
			return (new Date((timestamp  - 62167219200)*1000));
		},

		dateToGregorian: function(date) {
			return parseInt((date.getTime() / 1000) + 62167219200);
		},

		unformatPhoneNumber: function(formattedNumber) {
			var phoneNumber = formattedNumber.replace(/[^0-9]/g, '');

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
			if(phoneNumber.substr(0,2) === "+1" && phoneNumber.length === 12) {
				phoneNumber = phoneNumber.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
			}
			else if(phoneNumber.length === 10) {
				phoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '+1 ($1) $2-$3');
			}

			return phoneNumber;
		},

		randomString: function(length, _chars) {
			var chars = _chars || "23456789abcdefghjkmnpqrstuvwxyz",
				randomString = '';

			for(var i = length; i > 0; i--) {
				randomString += chars.charAt(Math.floor(Math.random() * chars.length));
			}

			return randomString;
		}
	};

	return util;
});
