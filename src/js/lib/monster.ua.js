define(function(require) {
	var $ = require('jquery');

	var privateUa = {
		uaMap: {
			name: 'other',
			regexp: '.*',
			kind: 'brand',
			info: {
				css: 'fa fa-phone fa-4x'
			},
			inner: [
				{
					name: 'HTC X325C',
					regexp: 'htc x325c',
					kind: 'model',
					info: {
						css: 'monster-ua-mobile monster-ua-htc-x325c'
					}
				},
				{
					name: 'HTC 831C',
					regexp: 'htc 831c',
					kind: 'model',
					info: {
						css: 'monster-ua-mobile monster-ua-htc-831c'
					}
				},
				{
					name: 'Samsung L710',
					regexp: 'samsung L710',
					kind: 'model',
					info: {
						css: 'monster-ua-mobile monster-ua-samsung-l710'
					}
				},
				{
					name: 'Samsung G930',
					regexp: 'sam g930',
					kind: 'model',
					info: {
						css: 'monster-ua-mobile monster-ua-samsung-g930'
					}
				},
				{
					name: 'LG H790',
					regexp: 'lg h790',
					kind: 'model',
					info: {
						css: 'monster-ua-mobile monster-ua-lg-h790'
					}
				},
				{
					name: 'LG D820',
					regexp: 'lg d820',
					kind: 'model',
					info: {
						css: 'monster-ua-mobile monster-ua-lg-d820'
					}
				},
				{
					name: 'LG LS670',
					regexp: 'lg ls670',
					kind: 'model',
					info: {
						css: 'monster-ua-mobile monster-ua-lg-ls670'
					}
				},
				{
					name: 'apple',
					regexp: 'apple',
					kind: 'brand',
					info: {
						css: 'monster-ua-mobile monster-ua-apple'
					},
					inner: [{
						name: 'Iphone',
						kind: 'family',
						regexp: 'iphone',
						info: {
							css: 'monster-ua-mobile monster-ua-apple-iphone'
						}
					}]
				},
				{
					name: 'bria',
					regexp: 'bria',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-counterpath-bria'
					}
				},
				{
					name: 'Cisco',
					regexp: 'cisco',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-cisco'
					},
					inner: [{
						name: 'Cisco SPA',
						kind: 'family',
						regexp: 'spa',
						info: {
							css: 'monster-ua monster-ua-cisco-spa'
						},
						inner: [{
							name: 'Cisco SPA301g',
							kind: 'model',
							regexp: 'spa301g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-301g'
							}
						},
						{
							name: 'Cisco SPA303g',
							kind: 'model',
							regexp: 'spa303g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-303g'
							}
						},
						{
							name: 'Cisco SPA501g',
							kind: 'model',
							regexp: 'spa501g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-501g'
							}
						},
						{
							name: 'Cisco SPA502g',
							kind: 'model',
							regexp: 'spa502g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-502g'
							}
						},
						{
							name: 'Cisco SPA504g',
							kind: 'model',
							regexp: 'spa504g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-504g'
							}
						},
						{
							name: 'Cisco SPA508g',
							kind: 'model',
							regexp: 'spa508g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-508g'
							}
						},
						{
							name: 'Cisco SPA509g',
							kind: 'model',
							regexp: 'spa509g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-509g'
							}
						},
						{
							name: 'Cisco SPA512g',
							kind: 'model',
							regexp: 'spa512g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-512g'
							}
						},
						{
							name: 'Cisco SPA514g',
							kind: 'model',
							regexp: 'spa514g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-514g'
							}
						},
						{
							name: 'Cisco SPA525g',
							kind: 'model',
							regexp: 'spa525g',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-525g'
							}
						},
						{
							name: 'Cisco SPA525g2',
							kind: 'model',
							regexp: 'spa525g2',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-525g2'
							}
						},
						{
							name: 'Cisco SPA901',
							kind: 'model',
							regexp: 'spa901',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-901'
							}
						},
						{
							name: 'Cisco SPA921',
							kind: 'model',
							regexp: 'spa921',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-921'
							}
						},
						{
							name: 'Cisco SPA922',
							kind: 'model',
							regexp: 'spa922',
							info: {
								css: 'monster-ua monster-ua-cisco-spa922'
							}
						},
						{
							name: 'Cisco SPA941',
							kind: 'model',
							regexp: 'spa941',
							info: {
								css: 'monster-ua monster-ua-cisco-spa941'
							}
						},
						{
							name: 'Cisco SPA942',
							kind: 'model',
							regexp: 'spa942',
							info: {
								css: 'monster-ua monster-ua-cisco-spa942'
							}
						},
						{
							name: 'Cisco SPA962',
							kind: 'model',
							regexp: 'spa962',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-962'
							}
						}]
					}]
				},
				{
					name: 'Grandstream',
					regexp: 'grandstream',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-grandstream'
					},
					inner: [{
						name: 'Grandstream HD gxp',
						kind: 'family',
						regexp: 'gxp',
						info: {
							css: 'monster-ua monster-ua-grandstream-gxp'
						},
						inner: [{
							name: 'Grandstream GXP2130',
							kind: 'model',
							regexp: 'gxp2130',
							info: {
								css: 'monster-ua monster-ua-grandstream-gxp-2130'
							}
						},
						{
							name: 'Grandstream GXP2135',
							kind: 'model',
							regexp: 'gxp2135',
							info: {
								css: 'monster-ua monster-ua-grandstream-gxp-2135'
							}
						},
						{
							name: 'Grandstream GXP2140',
							kind: 'model',
							regexp: 'gxp2140',
							info: {
								css: 'monster-ua monster-ua-grandstream-gxp-2140'
							}
						},
						{
							name: 'Grandstream GXP2160',
							kind: 'model',
							regexp: 'gxp2160',
							info: {
								css: 'monster-ua monster-ua-grandstream-gxp-2160'
							}
						},
						{
							name: 'Grandstream GXP2170',
							kind: 'model',
							regexp: 'gxp2170',
							info: {
								css: 'monster-ua monster-ua-grandstream-gxp-2170'
							}
						}]
					},
					{
						name: 'Grandstream HD HT',
						kind: 'family',
						regexp: 'ht',
						info: {
							css: 'monster-ua monster-ua-grandstream-ht'
						},
						inner: [{
							name: 'Grandstream HT502',
							kind: 'model',
							regexp: 'ht502',
							info: {
								css: 'monster-ua monster-ua-grandstream-ht-ht502'
							}
						},
						{
							name: 'Grandstream HT502 Fax',
							kind: 'model',
							regexp: 'ht502fax',
							info: {
								css: 'monster-ua monster-ua-grandstream-ht-ht502fax'
							}
						},
						{
							name: 'Grandstream HT704',
							kind: 'model',
							regexp: 'ht704',
							info: {
								css: 'monster-ua monster-ua-grandstream-ht-ht704'
							}
						},
						{
							name: 'Grandstream HT704 Fax',
							kind: 'model',
							regexp: 'ht704fax',
							info: {
								css: 'monster-ua monster-ua-grandstream-ht-ht704fax'
							}
						}]
					}]
				},
				{
					name: 'obihai',
					regexp: 'obihai',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-obihai'
					},
					inner: [{
						name: 'Obi 1022',
						kind: 'model',
						regexp: 'obi1022',
						info: {
							css: 'monster-ua monster-ua-obihai-1022'
						}
					},
					{
						name: 'Obi 1032',
						kind: 'model',
						regexp: 'obi1032',
						info: {
							css: 'monster-ua monster-ua-obihai-1032'
						}
					},
					{
						name: 'Obi 1062',
						kind: 'model',
						regexp: 'obi1062',
						info: {
							css: 'monster-ua monster-ua-obihai-1062'
						}
					},
					{
						name: 'Obi 200',
						kind: 'model',
						regexp: 'obi200',
						info: {
							css: 'monster-ua monster-ua-obihai-200'
						}
					},
					{
						name: 'Obi 202',
						kind: 'model',
						regexp: 'obi202',
						info: {
							css: 'monster-ua monster-ua-obihai-202'
						}
					},
					{
						name: 'Obi 300',
						kind: 'model',
						regexp: 'obi300',
						info: {
							css: 'monster-ua monster-ua-obihai-300'
						}
					},
					{
						name: 'Obi 302',
						kind: 'model',
						regexp: 'obi302',
						info: {
							css: 'monster-ua monster-ua-obihai-302'
						}
					},
					{
						name: 'Obi 504vs',
						kind: 'model',
						regexp: 'obi504vs',
						info: {
							css: 'monster-ua monster-ua-obihai-504vs'
						}
					},
					{
						name: 'Obi 508vs',
						kind: 'model',
						regexp: 'obi508vs',
						info: {
							css: 'monster-ua monster-ua-obihai-508vs'
						}
					}]
				},
				{
					name: 'Polycom',
					regexp: 'polycom',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-polycom'
					},
					inner: [{
						name: 'Polycom spip',
						kind: 'family',
						regexp: 'spip',
						info: {
							css: 'monster-ua monster-ua-polycom-spip'
						},
						inner: [{
							name: 'Polycom SPIP 301',
							kind: 'model',
							regexp: 'spip_301',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-301'
							}
						},
						{
							name: 'Polycom SPIP 320',
							kind: 'model',
							regexp: 'spip_320',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-320'
							}
						},
						{
							name: 'Polycom SPIP 321',
							kind: 'model',
							regexp: 'spip_321',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-321'
							}
						},
						{
							name: 'Polycom SPIP 330',
							kind: 'model',
							regexp: 'spip_330',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-330'
							}
						},
						{
							name: 'Polycom SPIP 331',
							kind: 'model',
							regexp: 'spip_331',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-331'
							}
						},
						{
							name: 'Polycom SPIP 335',
							kind: 'model',
							regexp: 'spip_335',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-335'
							}
						},
						{
							name: 'Polycom SPIP 430',
							kind: 'model',
							regexp: 'spip_430',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-430'
							}
						},
						{
							name: 'Polycom SPIP 450',
							kind: 'model',
							regexp: 'spip_450',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-450'
							}
						},
						{
							name: 'Polycom SPIP 501',
							kind: 'model',
							regexp: 'spip_501',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-501'
							}
						},
						{
							name: 'Polycom SPIP 550',
							kind: 'model',
							regexp: 'spip_550',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-550'
							}
						},
						{
							name: 'Polycom SPIP 560',
							kind: 'model',
							regexp: 'spip_560',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-560'
							}
						},
						{
							name: 'Polycom SPIP 600',
							kind: 'model',
							regexp: 'spip_600',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-600'
							}
						},
						{
							name: 'Polycom SPIP 601',
							kind: 'model',
							regexp: 'spip_601',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-601'
							}
						},
						{
							name: 'Polycom SPIP 650',
							kind: 'model',
							regexp: 'spip_650',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-650'
							}
						},
						{
							name: 'Polycom SPIP 670',
							kind: 'model',
							regexp: 'spip_670',
							info: {
								css: 'monster-ua monster-ua-polycom-spip-670'
							}
						}]
					},
					{
						name: 'Polycom ssip',
						kind: 'family',
						regexp: 'ssip',
						info: {
							css: 'monster-ua monster-ua-polycom-ssip'
						},
						inner: [{
							name: 'Polycom SSIP 4000',
							kind: 'model',
							regexp: 'ssip_4000',
							info: {
								css: 'monster-ua monster-ua-polycom-ssip-4000'
							}
						},
						{
							name: 'Polycom SSIP 5000',
							kind: 'model',
							regexp: 'ssip_5000',
							info: {
								css: 'monster-ua monster-ua-polycom-ssip-5000'
							}
						},
						{
							name: 'Polycom SSIP 6000',
							kind: 'model',
							regexp: 'ssip_6000',
							info: {
								css: 'monster-ua monster-ua-polycom-ssip-6000'
							}
						},
						{
							name: 'Polycom SSIP 7000',
							kind: 'model',
							regexp: 'ssip_7000',
							info: {
								css: 'monster-ua monster-ua-polycom-ssip-7000'
							}
						}]
					},
					{
						name: 'Polycom vvx',
						kind: 'family',
						regexp: 'vvx',
						info: {
							css: 'monster-ua monster-ua-polycom-vvx'
						},
						inner: [{
							name: 'Polycom vvx 300',
							kind: 'model',
							regexp: 'vvx_300',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-300'
							}
						},
						{
							name: 'Polycom vvx 301',
							kind: 'model',
							regexp: 'vvx_301',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-301'
							}
						},
						{
							name: 'Polycom vvx 310',
							kind: 'model',
							regexp: 'vvx_310',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-310'
							}
						},
						{
							name: 'Polycom vvx 311',
							kind: 'model',
							regexp: 'vvx_311',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-311'
							}
						},
						{
							name: 'Polycom vvx 400',
							kind: 'model',
							regexp: 'vvx_400',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-400'
							}
						},
						{
							name: 'Polycom vvx 401',
							kind: 'model',
							regexp: 'vvx_401',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-401'
							}
						},
						{
							name: 'Polycom vvx 410',
							kind: 'model',
							regexp: 'vvx_410',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-410'
							}
						},
						{
							name: 'Polycom vvx 411',
							kind: 'model',
							regexp: 'vvx_411',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-411'
							}
						},
						{
							name: 'Polycom vvx 500',
							kind: 'model',
							regexp: 'vvx_500',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-500'
							}
						},
						{
							name: 'Polycom vvx 600',
							kind: 'model',
							regexp: 'vvx_600',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-600'
							}
						},
						{
							name: 'Polycom vvx 1500',
							kind: 'model',
							regexp: 'vvx_1500',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-1500'
							}
						}]
					}]
				},
				{
					name: 'x-lite',
					regexp: 'x-lite ',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-x-lite'
					}
				},
				{
					name: 'yealink',
					regexp: 'yealink',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-yealink'
					},
					inner: [{
						name: 'Yealink CP860',
						kind: 'model',
						regexp: 'CP860',
						info: {
							css: 'monster-ua monster-ua-yealink-cp860'
						}
					},
					{
						name: 'Yealink T18P',
						kind: 'model',
						regexp: 'T18P',
						info: {
							css: 'monster-ua monster-ua-yealink-t18p'
						}
					},
					{
						name: 'Yealink T19P',
						kind: 'model',
						regexp: 'T19P',
						info: {
							css: 'monster-ua monster-ua-yealink-t19p'
						}
					},
					{
						name: 'Yealink T19Pe2',
						kind: 'model',
						regexp: 'T19Pe2',
						info: {
							css: 'monster-ua monster-ua-yealink-t19pe2'
						}
					},
					{
						name: 'Yealink T20P',
						kind: 'model',
						regexp: 'T20P',
						info: {
							css: 'monster-ua monster-ua-yealink-t01p'
						}
					},
					{
						name: 'Yealink T21P',
						kind: 'model',
						regexp: 'T21P',
						info: {
							css: 'monster-ua monster-ua-yealink-t21p'
						}
					},
					{
						name: 'Yealink T21Pe2',
						kind: 'model',
						regexp: 'T21Pe2',
						info: {
							css: 'monster-ua monster-ua-yealink-t21pe2'
						}
					},
					{
						name: 'Yealink T22P',
						kind: 'model',
						regexp: 'T22P',
						info: {
							css: 'monster-ua monster-ua-yealink-t22p'
						}
					},
					{
						name: 'Yealink T23P',
						kind: 'model',
						regexp: 'T23P',
						info: {
							css: 'monster-ua monster-ua-yealink-t23p'
						}
					},
					{
						name: 'Yealink T23G',
						kind: 'model',
						regexp: 'T23G',
						info: {
							css: 'monster-ua monster-ua-yealink-t23g'
						}
					},
					{
						name: 'Yealink T26p',
						kind: 'model',
						regexp: 'T26P',
						info: {
							css: 'monster-ua monster-ua-yealink-t26p'
						}
					},
					{
						name: 'Yealink T27p',
						kind: 'model',
						regexp: 'T27P',
						info: {
							css: 'monster-ua monster-ua-yealink-t27p'
						}
					},
					{
						name: 'Yealink T28p',
						kind: 'model',
						regexp: 'T28P',
						info: {
							css: 'monster-ua monster-ua-yealink-t28p'
						}
					},
					{
						name: 'Yealink T29g',
						kind: 'model',
						regexp: 'T29G',
						info: {
							css: 'monster-ua monster-ua-yealink-t29g'
						}
					},
					{
						name: 'Yealink T32g',
						kind: 'model',
						regexp: 'T32G',
						info: {
							css: 'monster-ua monster-ua-yealink-t32g'
						}
					},
					{
						name: 'Yealink T38g',
						kind: 'model',
						regexp: 'T38G',
						info: {
							css: 'monster-ua monster-ua-yealink-t38g'
						}
					},
					{
						name: 'Yealink T41p',
						kind: 'model',
						regexp: 'T41P',
						info: {
							css: 'monster-ua monster-ua-yealink-t41p'
						}
					},
					{
						name: 'Yealink T41s',
						kind: 'model',
						regexp: 'T41S',
						info: {
							css: 'monster-ua monster-ua-yealink-t41s'
						}
					},
					{
						name: 'Yealink T42g',
						kind: 'model',
						regexp: 'T42G',
						info: {
							css: 'monster-ua monster-ua-yealink-t42g'
						}
					},
					{
						name: 'Yealink T46g',
						kind: 'model',
						regexp: 'T46G',
						info: {
							css: 'monster-ua monster-ua-yealink-t46g'
						}
					},
					{
						name: 'Yealink T48g',
						kind: 'model',
						regexp: 'T48G',
						info: {
							css: 'monster-ua monster-ua-yealink-t48g'
						}
					},
					{
						name: 'Yealink T48s',
						kind: 'model',
						regexp: 'T48S',
						info: {
							css: 'monster-ua monster-ua-yealink-t48s'
						}
					},
					{
						name: 'Yealink W52p',
						kind: 'model',
						regexp: 'W52P',
						info: {
							css: 'monster-ua monster-ua-yealink-w52p'
						}
					}]
				},
				{
					name: 'zoiper',
					regexp: '^Z ',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-zoiper'
					}
				}
			]
		},
		getUserAgent: function(name, collection) {
			var self = this;

			if (collection === undefined) {
				collection = privateUa.uaMap;
			}

			for (var i = 0; i < collection.inner.length; i++) {
				var item = collection.inner[i],
					regexp = new RegExp(item.regexp, 'gi');

				if (regexp.test(name)) {
					if (item.inner !== undefined) {
						return privateUa.getUserAgent(name, item);
					}

					return item;
				}
			};

			return collection;
		}
	};

	var ua = {
		getUserAgent: function(name, collection) {
			var self = this,
				result = $.extend(true, {}, privateUa.getUserAgent(name, collection));

			delete result.inner;

			return result;
		}
	};

	return ua;
});
