winkstart.module('skeleton', 'sub_module',
	{
		css: [
            'css/sub_module.css'
		],

		templates: {
			sub_module: 'tmpl/sub_module.html'
		},

		subscribe: {
			'sub_module.activate' : 'activate'
		},

		resources: {
			'sub_module.get_account': {
				url: '{api_url}/accounts/{account_id}',
				contentType: 'application/json',
				verb: 'GET'
			}
		}
	},

	function(args) {
		winkstart.registerResources(this.__whapp, this.config.resources);

		winkstart.publish('whappnav.subnav.add', {
			whapp: 'skeleton',
			module: this.__module,
			label: 'Skeleton Sub-Module',
			icon: 'device', /* Check the icon.css file in whapps/core/layout/css */
			weight: '05'
		});
	},

	{
		activate: function(data) {
			var THIS = this;

            /* Change me! */
            winkstart.request('sub_module.get_account', {
                    api_url: winkstart.apps['skeleton'].api_url,
                    account_id: winkstart.apps['skeleton'].account_id
                },
                function(_data, status) {
                    var sub_module_html = $('#ws-content').empty()
                                                          .append(THIS.templates.sub_module.tmpl(_data.data));
                },
                function(_data, status) {
                    winkstart.alert('Couldn\'t get your account!');
                }
            );
		}
	}
);
