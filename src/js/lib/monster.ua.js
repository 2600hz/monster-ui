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
					name: 'Polycom',
					regexp: 'polycom',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-polycom'
					},
					inner: [{
						name: 'Polycom vvx',
						kind: 'family',
						regexp: 'vvx',
						info: {
							css: 'monster-ua monster-ua-polycom-vvx'
						},
						inner: [{
							name: 'Polycom vvx 400',
							kind: 'model',
							regexp: 'vvx_400',
							info: {
								css: 'monster-ua monster-ua-polycom-vvx-400'
							}
						}]
					}]
				},
				{
					name: 'Cisco',
					regexp: 'cisco',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-cisco'
					},
					inner: [{
						name: 'Cisco SPA5XX',
						kind: 'family',
						regexp: 'spa',
						info: {
							css: 'monster-ua monster-ua-cisco-spa'
						},
						inner: [{
							name: 'Cisco SPA504G',
							kind: 'model',
							regexp: 'spa504',
							info: {
								css: 'monster-ua monster-ua-cisco-spa-504g'
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
						name: 'Grandstream HD',
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
						}]
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
					name: 'obihai',
					regexp: 'obihai',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-obihai'
					}
				},
				{
					name: 'yealink',
					regexp: 'yealink',
					kind: 'brand',
					info: {
						css: 'monster-ua monster-ua-yealink'
					}
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
