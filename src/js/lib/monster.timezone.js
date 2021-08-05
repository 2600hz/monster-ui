define(function(require) {
	var $ = require('jquery');
	var _ = require('lodash');
	var moment = require('moment');
	var monster = require('monster');

	require('moment-timezone');

	var supportedCountryCodes = [
		'AD',
		'AE',
		'AF',
		'AG',
		'AI',
		'AL',
		'AM',
		'AN',
		'AO',
		'AQ',
		'AR',
		'AS',
		'AT',
		'AU',
		'AW',
		'AX',
		'AZ',
		'BA',
		'BB',
		'BD',
		'BE',
		'BF',
		'BG',
		'BH',
		'BI',
		'BJ',
		'BL',
		'BM',
		'BN',
		'BO',
		'BR',
		'BS',
		'BT',
		'BV',
		'BW',
		'BY',
		'BZ',
		'CA',
		'CC',
		'CD',
		'CF',
		'CG',
		'CH',
		'CI',
		'CK',
		'CL',
		'CM',
		'CN',
		'CO',
		'CR',
		'CU',
		'CV',
		'CX',
		'CY',
		'CZ',
		'DE',
		'DJ',
		'DK',
		'DM',
		'DO',
		'DZ',
		'EC',
		'EE',
		'EG',
		'EH',
		'ER',
		'ES',
		'ET',
		'FI',
		'FJ',
		'FK',
		'FM',
		'FO',
		'FR',
		'GA',
		'GB',
		'GD',
		'GE',
		'GF',
		'GG',
		'GH',
		'GI',
		'GL',
		'GM',
		'GN',
		'GP',
		'GQ',
		'GR',
		'GS',
		'GT',
		'GU',
		'GW',
		'GY',
		'HK',
		'HM',
		'HN',
		'HR',
		'HT',
		'HU',
		'ID',
		'IE',
		'IL',
		'IM',
		'IN',
		'IO',
		'IQ',
		'IR',
		'IS',
		'IT',
		'JE',
		'JM',
		'JO',
		'JP',
		'KE',
		'KG',
		'KH',
		'KI',
		'KM',
		'KN',
		'KR',
		'KW',
		'KY',
		'KZ',
		'LA',
		'LB',
		'LC',
		'LI',
		'LK',
		'LR',
		'LS',
		'LT',
		'LU',
		'LV',
		'LY',
		'MA',
		'MC',
		'MD',
		'ME',
		'MF',
		'MG',
		'MH',
		'MK',
		'ML',
		'MM',
		'MN',
		'MO',
		'MP',
		'MQ',
		'MR',
		'MS',
		'MT',
		'MU',
		'MV',
		'MW',
		'MX',
		'MY',
		'MZ',
		'NA',
		'NC',
		'NE',
		'NF',
		'NG',
		'NI',
		'NL',
		'NO',
		'NP',
		'NR',
		'NU',
		'NZ',
		'OM',
		'PA',
		'PE',
		'PF',
		'PG',
		'PH',
		'PK',
		'PL',
		'PM',
		'PN',
		'PR',
		'PS',
		'PT',
		'PW',
		'PY',
		'QA',
		'RE',
		'RO',
		'RS',
		'RU',
		'RW',
		'SA',
		'SB',
		'SC',
		'SD',
		'SE',
		'SG',
		'SH',
		'SI',
		'SJ',
		'SK',
		'SL',
		'SM',
		'SN',
		'SO',
		'SR',
		'ST',
		'SV',
		'SY',
		'SZ',
		'TC',
		'TD',
		'TF',
		'TG',
		'TH',
		'TJ',
		'TK',
		'TL',
		'TM',
		'TN',
		'TO',
		'TR',
		'TT',
		'TV',
		'TW',
		'TZ',
		'UA',
		'UG',
		'UM',
		'US',
		'UY',
		'UZ',
		'VA',
		'VC',
		'VE',
		'VG',
		'VI',
		'VN',
		'VU',
		'WF',
		'WS',
		'YE',
		'YT',
		'ZA',
		'ZM',
		'ZW'
	];

	return {
		formatTimezone: formatTimezone,
		getCountries: getCountries,
		getCountryName: getCountryName,
		getLocaleTimezone: getLocaleTimezone,
		populateDropdown: populateDropdown
	};

	function getCountries() {
		return _
			.chain(supportedCountryCodes)
			.keyBy()
			.mapValues(
				_.partial(_.get, monster.apps.core.i18n.active().monsterCountries)
			)
			.value();
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
