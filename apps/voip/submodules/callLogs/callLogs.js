define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {
		requests: {
			'voip.callLogs.listCdrs': {
				url: 'accounts/{accountId}/cdrs?created_from={fromDate}&created_to={toDate}',
				verb: 'GET'
			},
			'voip.callLogs.getCdrsCSV': {
				url: 'accounts/{accountId}/cdrs?created_from={fromDate}&created_to={toDate}',
				verb: 'GET',
				headers: {
					'Accept': 'application/octet-stream'
				}
			},
			'voip.callLogs.getCdr': {
				url: 'accounts/{accountId}/cdrs/{cdrId}',
				verb: 'GET'
			}
		},

		subscribe: {
			'voip.callLogs.render': 'callLogsRender'
		},

		callLogsRender: function(args) {
			var self = this;

			self.callLogsRenderContent(args.parent);
		},

		callLogsRenderContent: function(parent, fromDate, toDate) {
			var self = this,
				dataTemplate = {},
				template;

			if(!toDate) {
				toDate = new Date();
				if(fromDate) {
					toDate.setTime(fromDate.getTime());
					toDate.setDate(toDate.getDate()+7);
				}
			}
			if(!fromDate) {
				fromDate = new Date();
				fromDate.setDate(fromDate.getDate()-7);
			}

			self.callLogsGetCdrs(fromDate, toDate, function(cdrs) {
				cdrs = self.callLogsFormatCdrs(cdrs);

				dataTemplate.cdrs = cdrs;
				template = $(monster.template(self, 'callLogs-layout', dataTemplate));

				self.callLogsBindEvents(template, cdrs);

				parent
					.empty()
					.append(template);

				self.callLogsInitDatepickers(template, fromDate, toDate);
			});
		},

		callLogsBindEvents: function(template, cdrs) {
			var self = this;

			template.find('.filter-div .apply-filter').on('click', function(e) {
				var fromDate = template.find('.filter-div input.filter-from').datepicker("getDate"),
					toDate = template.find('.filter-div input.filter-to').datepicker("getDate");
				self.callLogsRenderContent(template.parents('.right-content'), fromDate, toDate);
			});

			template.find('.filter-div .refresh-filter').on('click', function(e) {
				self.callLogsRenderContent(template.parents('.right-content'));
			});

			template.find('.filter-div .download-csv').on('click', function(e) {
				monster.ui.alert('Not implemented yet!');
				// var fromDate = template.find('.filter-div input.filter-from').datepicker("getDate"),
				// 	toDate = template.find('.filter-div input.filter-to').datepicker("getDate");

				// fromDate.setHours(0);
				// fromDate.setMinutes(0);
				// fromDate.setSeconds(0);
				// fromDate.setMilliseconds(0);
				// toDate.setHours(23);
				// toDate.setMinutes(59);
				// toDate.setSeconds(59);
				// toDate.setMilliseconds(999);

				// monster.request({
				// 	resource: 'voip.callLogs.getCdrsCSV',
				// 	data: {
				// 		accountId: self.accountId,
				// 		fromDate: monster.util.dateToGregorian(fromDate),
				// 		toDate: monster.util.dateToGregorian(toDate)
				// 	},
				// 	success: function(data, status) {
				// 		console.log('success');
				// 	}
				// });
			});

			template.find('.search-div input.search-query').on('keyup', function(e) {
				var searchValue = $(this).val().replace(/\|/g,'').toLowerCase(),
					matchedResults = false;
				if(searchValue.length <= 0) {
					template.find('.grid-row-group').show();
					matchedResults = true;
				} else {
					_.each(cdrs, function(cdr) {
						var searchString = (cdr.date + "|" + cdr.fromName + "|"
										 + cdr.fromNumber + "|" + cdr.toName + "|"
										 + cdr.toNumber + "|" + cdr.hangupCause).toLowerCase(),
							rowGroup = template.find('.grid-row.a-leg[data-id="'+cdr.id+'"]').parents('.grid-row-group');
						if(searchString.indexOf(searchValue) >= 0) {
							matchedResults = true;
							rowGroup.show();
						} else {
							var matched = _.find(cdr.bLegs, function(bLeg) {
								var searchStr = (bLeg.date + "|" + bLeg.fromName + "|"
											  + bLeg.fromNumber + "|" + bLeg.toName + "|"
											  + bLeg.toNumber + "|" + bLeg.hangupCause).toLowerCase();
								return searchStr.indexOf(searchValue) >= 0;
							});
							if(matched) {
								matchedResults = true;
								rowGroup.show();
							} else {
								rowGroup.hide();
							}
						}
					})
				}

				if(matchedResults) {
					template.find('.grid-row.no-match').hide();
				} else {
					template.find('.grid-row.no-match').show();
				}
			});

			template.find('.a-leg.has-b-legs').on('click', function(e) {
				var rowGroup = $(this).parents('.grid-row-group');
				if(rowGroup.hasClass('open')) {
					rowGroup.removeClass('open');
					rowGroup.find('.b-leg').slideUp();
				} else {
					template.find('.grid-row-group').removeClass('open');
					template.find('.b-leg').slideUp();
					rowGroup.addClass('open');
					rowGroup.find('.b-leg').slideDown();
				}
			});

			template.find('.grid-cell.details i').on('click', function(e) {
				e.stopPropagation();
				var cdrId = $(this).parents('.grid-row').data('id');
				self.callLogsShowDetailsPopup(cdrId);
			});

			template.find('.grid-cell.report a').on('click', function(e) {
				e.stopPropagation();
			});
		},

		callLogsInitDatepickers: function(template, fromDate, toDate) {
			var fromDateInput = template.find('.filter-div input.filter-from'),
				toDateInput = template.find('.filter-div input.filter-to');

			fromDateInput.datepicker({
				constrainInput: true,
				showOtherMonths: true,
				selectOtherMonths: true,
				onSelect: function(inputDate) {
					var selectedDate = new Date(inputDate),
						restrictTo = new Date(selectedDate),
						toDateTimestamp = toDateInput.datepicker("getDate").getTime();

					restrictTo.setDate(restrictTo.getDate()+7);
					toDateInput.datepicker("option", "minDate", selectedDate);
					toDateInput.datepicker("option", "maxDate", restrictTo);
					if(toDateTimestamp > restrictTo.getTime() || toDateTimestamp < selectedDate.getTime()) {
						toDateInput.datepicker("setDate", restrictTo);
					}
				}
			});
			fromDateInput.datepicker("setDate", fromDate);

			toDateInput.datepicker({
				constrainInput: true,
				showOtherMonths: true,
				selectOtherMonths: true,
				minDate: fromDate,
				maxDate: toDate
			});
			toDateInput.datepicker("setDate", toDate);
		},

		callLogsGetCdrs: function(fromDate, toDate, callback) {
			var self = this,
				fromDateTimestamp,
				toDateTimestamp;

			fromDate.setHours(0);
			fromDate.setMinutes(0);
			fromDate.setSeconds(0);
			fromDate.setMilliseconds(0);
			fromDateTimestamp = monster.util.dateToGregorian(fromDate);

			toDate.setHours(23);
			toDate.setMinutes(59);
			toDate.setSeconds(59);
			toDate.setMilliseconds(999);
			toDateTimestamp = monster.util.dateToGregorian(toDate);

			monster.request({
				resource: 'voip.callLogs.listCdrs',
				data: {
					accountId: self.accountId,
					fromDate: fromDateTimestamp,
					toDate: toDateTimestamp
				},
				success: function(data, status) {
					var cdrs = {};
					_.each(data.data, function(val) {
						if(val.direction === 'inbound') {
							var call_id = val.call_id || val.id;
							if(!(call_id in cdrs)) { cdrs[call_id] = {}; }
							cdrs[call_id].aLeg = val;
						} else {
							if('other_leg_call_id' in val) {
								if(!(val.other_leg_call_id in cdrs)) { cdrs[val.other_leg_call_id] = {}; }
								if(!('bLegs' in cdrs[val.other_leg_call_id])) { cdrs[val.other_leg_call_id].bLegs = {}; }
								cdrs[val.other_leg_call_id].bLegs[val.id] = val;
							}
						}
					});

					callback(cdrs);
				}
			});
		},

		callLogsFormatCdrs: function(cdrs) {
			var self = this,
				result = [],
				formatCdr = function(cdr) {
					var date = monster.util.gregorianToDate(cdr.timestamp),
						day = (date.getDate() < 10 ? "0" : "") + date.getDate(),
						month = (date.getMonth() < 9 ? "0" : "") + (date.getMonth()+1),
						year = date.getFullYear().toString().substr(2),
						hours = (date.getHours() < 10 ? "0" : "") + date.getHours(),
						minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes(),
						durationMin = parseInt(cdr.duration_seconds/60).toString(),
						durationSec = (cdr.duration_seconds % 60 < 10 ? "0" : "") + (cdr.duration_seconds % 60);

					return {
						id: cdr.id,
						callId: cdr.call_id,
						timestamp: cdr.timestamp,
						date: month+"/"+day+"/"+year,
						time: hours+":"+minutes,
						fromName: cdr.caller_id_name,
						fromNumber: cdr.caller_id_number || cdr.from.replace(/@.*/, ''),
						toName: cdr.callee_id_name,
						toNumber: cdr.callee_id_number || ("request" in cdr) ? cdr.request.replace(/@.*/, '') : cdr.to.replace(/@.*/, ''),
						duration: durationMin + ":" + durationSec,
						hangupCause: cdr.hangup_cause,
						isOutboundCall: ("authorizing_id" in cdr),
						mailtoLink: "mailto:support@2600hz.com"
								  + "?subject=Call Report: " + cdr.call_id
								  + "&body=Please describe the details of the issue:%0D%0A%0D%0A"
								  + "%0D%0A____________________________________________________________%0D%0A"
								  + "%0D%0AAccount ID: " + self.accountId
								  + "%0D%0AFrom (Name): " + (cdr.caller_id_name || "")
								  + "%0D%0AFrom (Number): " + (cdr.caller_id_number || cdr.from.replace(/@.*/, ''))
								  + "%0D%0ATo (Name): " + (cdr.callee_id_name || "")
								  + "%0D%0ATo (Number): " + (cdr.callee_id_number || ("request" in cdr) ? cdr.request.replace(/@.*/, '') : cdr.to.replace(/@.*/, ''))
								  + "%0D%0ADate: " + month+"/"+day+"/"+year
								  + "%0D%0ADuration: " + durationMin + ":" + durationSec
								  + "%0D%0AHangup Cause: " + (cdr.hangup_cause || "")
								  + "%0D%0ACall ID: " + cdr.call_id
								  + "%0D%0AOther Leg Call ID: " + (cdr.other_leg_call_id || "")
								  + "%0D%0AHandling Server: " + (cdr.handling_server || "")
					};
				};

			_.each(cdrs, function(val, key) {
				if(!('aLeg' in val)) {
					// Handling lone b-legs as standalone a-legs
					_.each(val.bLegs, function(v, k) {
						result.push($.extend({ bLegs: [] }, formatCdr(v)));
					});
				} else {
					var cdr = formatCdr(val.aLeg);
					cdr.bLegs = [];
					_.each(val.bLegs, function(v, k) {
						cdr.bLegs.push(formatCdr(v));
					});
					result.push(cdr);
				}
			});

			console.log(result);

			result.sort(function(a, b) {
				return b.timestamp - a.timestamp;
			})

			return result;
		},

		callLogsShowDetailsPopup: function(callLogId) {
			var self = this;
			monster.request({
				resource: 'voip.callLogs.getCdr',
				data: {
					accountId: self.accountId,
					cdrId: callLogId
				},
				success: function(data, status) {
					function objToArray(obj, prefix) {
						var prefix = prefix || "",
							result = [];
						_.each(obj, function(val, key) {
							if(typeof val === "object") {
								result = result.concat(objToArray(val, prefix+key+"."));
							} else {
								result.push({
									key: prefix+key,
									value: val
								});
							}
						});
						return result;
					}

					var detailsArray = objToArray(data.data);
					detailsArray.sort(function(a, b) {
						return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
					})

					monster.ui.dialog(
						monster.template(self, 'callLogs-detailsPopup', { details: detailsArray }),
						{ title: self.i18n.active().callLogs.detailsPopupTitle }
					);
				},
				error: function(data, status) {
					monster.ui.alert('error', self.i18n.active().callLogs.alertMessages.getDetailsError);
				}
			});
		}
	};

	return app;
});
