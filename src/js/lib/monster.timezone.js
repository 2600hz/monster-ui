define(function(require) {
	var $ = require('jquery');
	var _ = require('lodash');
	var moment = require('moment');
	var monster = require('monster');

	require('moment-timezone');

	return {
		formatTimezone: formatTimezone,
		getCountries: getCountries,
		getCountryName: getCountryName,
		getLocaleTimezone: getLocaleTimezone,
		populateDropdown: populateDropdown
	};

	function getCountries() {
		var i18n = monster.apps.core.i18n.active().monsterCountries;

		// We don't want the list to come from the i18n files
		return {
			AD: i18n.AD,
			AE: i18n.AE,
			AF: i18n.AF,
			AG: i18n.AG,
			AI: i18n.AI,
			AL: i18n.AL,
			AM: i18n.AM,
			AN: i18n.AN,
			AO: i18n.AO,
			AQ: i18n.AQ,
			AR: i18n.AR,
			AS: i18n.AS,
			AT: i18n.AT,
			AU: i18n.AU,
			AW: i18n.AW,
			AX: i18n.AX,
			AZ: i18n.AZ,
			BA: i18n.BA,
			BB: i18n.BB,
			BD: i18n.BD,
			BE: i18n.BE,
			BF: i18n.BF,
			BG: i18n.BG,
			BH: i18n.BH,
			BI: i18n.BI,
			BJ: i18n.BJ,
			BL: i18n.BL,
			BM: i18n.BM,
			BN: i18n.BN,
			BO: i18n.BO,
			BR: i18n.BR,
			BS: i18n.BS,
			BT: i18n.BT,
			BV: i18n.BV,
			BW: i18n.BW,
			BY: i18n.BY,
			BZ: i18n.BZ,
			CA: i18n.CA,
			CC: i18n.CC,
			CD: i18n.CD,
			CF: i18n.CF,
			CG: i18n.CG,
			CH: i18n.CH,
			CI: i18n.CI,
			CK: i18n.CK,
			CL: i18n.CL,
			CM: i18n.CM,
			CN: i18n.CN,
			CO: i18n.CO,
			CR: i18n.CR,
			CU: i18n.CU,
			CV: i18n.CV,
			CX: i18n.CX,
			CY: i18n.CY,
			CZ: i18n.CZ,
			DE: i18n.DE,
			DJ: i18n.DJ,
			DK: i18n.DK,
			DM: i18n.DM,
			DO: i18n.DO,
			DZ: i18n.DZ,
			EC: i18n.EC,
			EE: i18n.EE,
			EG: i18n.EG,
			EH: i18n.EH,
			ER: i18n.ER,
			ES: i18n.ES,
			ET: i18n.ET,
			FI: i18n.FI,
			FJ: i18n.FJ,
			FK: i18n.FK,
			FM: i18n.FM,
			FO: i18n.FO,
			FR: i18n.FR,
			GA: i18n.GA,
			GB: i18n.GB,
			GD: i18n.GD,
			GE: i18n.GE,
			GF: i18n.GF,
			GG: i18n.GG,
			GH: i18n.GH,
			GI: i18n.GI,
			GL: i18n.GL,
			GM: i18n.GM,
			GN: i18n.GN,
			GP: i18n.GP,
			GQ: i18n.GQ,
			GR: i18n.GR,
			GS: i18n.GS,
			GT: i18n.GT,
			GU: i18n.GU,
			GW: i18n.GW,
			GY: i18n.GY,
			HK: i18n.HK,
			HM: i18n.HM,
			HN: i18n.HN,
			HR: i18n.HR,
			HT: i18n.HT,
			HU: i18n.HU,
			ID: i18n.ID,
			IE: i18n.IE,
			IL: i18n.IL,
			IM: i18n.IM,
			IN: i18n.IN,
			IO: i18n.IO,
			IQ: i18n.IQ,
			IR: i18n.IR,
			IS: i18n.IS,
			IT: i18n.IT,
			JE: i18n.JE,
			JM: i18n.JM,
			JO: i18n.JO,
			JP: i18n.JP,
			KE: i18n.KE,
			KG: i18n.KG,
			KH: i18n.KH,
			KI: i18n.KI,
			KM: i18n.KM,
			KN: i18n.KN,
			KR: i18n.KR,
			KW: i18n.KW,
			KY: i18n.KY,
			KZ: i18n.KZ,
			LA: i18n.LA,
			LB: i18n.LB,
			LC: i18n.LC,
			LI: i18n.LI,
			LK: i18n.LK,
			LR: i18n.LR,
			LS: i18n.LS,
			LT: i18n.LT,
			LU: i18n.LU,
			LV: i18n.LV,
			LY: i18n.LY,
			MA: i18n.MA,
			MC: i18n.MC,
			MD: i18n.MD,
			ME: i18n.ME,
			MF: i18n.MF,
			MG: i18n.MG,
			MH: i18n.MH,
			MK: i18n.MK,
			ML: i18n.ML,
			MM: i18n.MM,
			MN: i18n.MN,
			MO: i18n.MO,
			MP: i18n.MP,
			MQ: i18n.MQ,
			MR: i18n.MR,
			MS: i18n.MS,
			MT: i18n.MT,
			MU: i18n.MU,
			MV: i18n.MV,
			MW: i18n.MW,
			MX: i18n.MX,
			MY: i18n.MY,
			MZ: i18n.MZ,
			NA: i18n.NA,
			NC: i18n.NC,
			NE: i18n.NE,
			NF: i18n.NF,
			NG: i18n.NG,
			NI: i18n.NI,
			NL: i18n.NL,
			NO: i18n.NO,
			NP: i18n.NP,
			NR: i18n.NR,
			NU: i18n.NU,
			NZ: i18n.NZ,
			OM: i18n.OM,
			PA: i18n.PA,
			PE: i18n.PE,
			PF: i18n.PF,
			PG: i18n.PG,
			PH: i18n.PH,
			PK: i18n.PK,
			PL: i18n.PL,
			PM: i18n.PM,
			PN: i18n.PN,
			PR: i18n.PR,
			PS: i18n.PS,
			PT: i18n.PT,
			PW: i18n.PW,
			PY: i18n.PY,
			QA: i18n.QA,
			RE: i18n.RE,
			RO: i18n.RO,
			RS: i18n.RS,
			RU: i18n.RU,
			RW: i18n.RW,
			SA: i18n.SA,
			SB: i18n.SB,
			SC: i18n.SC,
			SD: i18n.SD,
			SE: i18n.SE,
			SG: i18n.SG,
			SH: i18n.SH,
			SI: i18n.SI,
			SJ: i18n.SJ,
			SK: i18n.SK,
			SL: i18n.SL,
			SM: i18n.SM,
			SN: i18n.SN,
			SO: i18n.SO,
			SR: i18n.SR,
			ST: i18n.ST,
			SV: i18n.SV,
			SY: i18n.SY,
			SZ: i18n.SZ,
			TC: i18n.TC,
			TD: i18n.TD,
			TF: i18n.TF,
			TG: i18n.TG,
			TH: i18n.TH,
			TJ: i18n.TJ,
			TK: i18n.TK,
			TL: i18n.TL,
			TM: i18n.TM,
			TN: i18n.TN,
			TO: i18n.TO,
			TR: i18n.TR,
			TT: i18n.TT,
			TV: i18n.TV,
			TW: i18n.TW,
			TZ: i18n.TZ,
			UA: i18n.UA,
			UG: i18n.UG,
			UM: i18n.UM,
			US: i18n.US,
			UY: i18n.UY,
			UZ: i18n.UZ,
			VA: i18n.VA,
			VC: i18n.VC,
			VE: i18n.VE,
			VG: i18n.VG,
			VI: i18n.VI,
			VN: i18n.VN,
			VU: i18n.VU,
			WF: i18n.WF,
			WS: i18n.WS,
			YE: i18n.YE,
			YT: i18n.YT,
			ZA: i18n.ZA,
			ZM: i18n.ZM,
			ZW: i18n.ZW
		};
	}

	function getCountryName(countryCode) {
		return _.get(getCountries(), countryCode, countryCode);
	}

	function populateDropdown(dropdown, _selected, _extraOptions) {
		var selected = _selected || getLocaleTimezone();
		var getOptionTag = _.partial(function(selected, args) {
			return $('<option>', _.merge({
				selected: selected === args.value
			}, _.pick(args, [
				'text',
				'value'
			])));
		}, selected);
		var getLoweredTextProp = _.flow(
			_.partial(_.get, _, 'text'),
			_.toLower
		);
		var extraOptions = _
			.chain(_extraOptions)
			.map(function(name, value) {
				return {
					text: name,
					value: value
				};
			})
			.sortBy(getLoweredTextProp)
			.value();
		var timezones = _
			.chain(moment.tz.names())
			.map(function(value) {
				return {
					text: formatTimezone(value),
					value: value
				};
			})
			.sortBy(getLoweredTextProp)
			.value();
		var optionTags = _
			.chain([
				extraOptions,
				timezones
			])
			.flatten()
			.map(getOptionTag)
			.value();
		var appendToDropdown = _.bind(_.unary(dropdown.append), dropdown);

		optionTags.forEach(appendToDropdown);
	}

	function getLocaleTimezone() {
		return moment.tz.guess();
	}

	function formatTimezone(timezone) {
		return _
			.chain(timezone)
			.replace(/(.+)\/([^/]+)/, '$2 ($1)')
			.replace(/_/g, ' ')
			.value();
	}
});
