(function(winkstart, amplify, undefined) {
    var locked_requests = {};

	winkstart.registerResources = function(app_name, resources) {
		var THIS = this;

		for(var key in resources){
			var resource = resources[key];

			amplify.request.define( key, 'ajax', {
				url: resource.url,
				decoder: function(data, status, ampXHR, success, error) {
                    if(status == 'success') {
					    success(data, ampXHR.status);
                    }
                    else {
                        if(data == null && 'responseText' in ampXHR) {
                            var _data = null;

                            try {
                                _data = JSON.parse(ampXHR.responseText);
                            }
                            catch(err) {}

                            _data = (typeof _data == 'object') ? _data : null;
                        }

					    error(data || _data || {}, ampXHR.status);
                    }
				},
                global: (typeof resource.trigger_events == 'boolean') ? resource.trigger_events : true,
                contentType: resource.contentType || 'application/json',
                dataType: resource.dataType || 'json',
                type: resource.verb,
                processData: resource.verb == 'GET',
                cache: false,
                beforeSend: function(ampXHR, settings) {
                    ampXHR.setRequestHeader('X-Auth-Token', winkstart.apps[app_name]['auth_token']);

                    if(typeof settings.data == 'object' && 'headers' in settings.data) {
                        $.each(settings.data.headers, function(key, val) {
                            switch(key) {
                                case 'Content-Type':
                                    ampXHR.overrideMimeType(val);
                                    break;

                                default:
                                    ampXHR.setRequestHeader(key, val);
                            }
                        });

                        delete settings.data.headers;
                    }

                    if(settings.contentType == 'application/json') {
                        if(settings.type == 'PUT' || settings.type == 'POST') {
                                settings.data.verb = settings.type;
                                settings.data = JSON.stringify(settings.data);
                        }
                        else if(settings.type =='GET' || settings.type == 'DELETE') {
                                settings.data = '';
                        }
                    }
                    else {
                        if(typeof settings.data == 'object' && settings.data.data) {
                            settings.data = settings.data.data;
                        }
                    }


                    // Without returning true, our decoder will not run.
                    return true;
                }
			});
		}
	};

    winkstart.request = function(locking, resource_name, params, success, error) {
        if(typeof locking !== 'boolean') {
            error = success;
            success = params;
            params = resource_name;
            resource_name = locking;
            locking = false;
        }

        // Delete the lame crossbar param if it exists
        if('crossbar' in params) {
            delete params.crossbar;
        }

        if(locking === true) {
            if(resource_name in locked_requests) {
                return false;
            }
            else {
                locked_requests[resource_name] = true;
            }
        }

        amplify.request({
            resourceId: resource_name,
            data: params,
            success: function(data, status) {
                if(typeof success == 'function') {
                    success(data, status);
                }

                if(locking === true) {
                    delete locked_requests[resource_name];
                }
            },
            error: function(data, status) {
                if(typeof error == 'function') {
                    error(data, status);
                }

                if(locking === true) {
                    delete locked_requests[resource_name];
                }
            }
        });
    };

	winkstart.getJSON = function(locking, resource_name, params, success, error) {
		winkstart.request(locking, resource_name, params, success, error);
	};

	winkstart.postJSON = function(locking, resource_name, params, success, error) {
		winkstart.request(locking, resource_name, params, success, error);
	};

	winkstart.deleteJSON = function(locking, resource_name, params, success, error) {
		winkstart.request(locking, resource_name, params, success, error);
	};

	winkstart.putJSON = function(locking, resource_name, params, success, error) {
		winkstart.request(locking, resource_name, params, success, error);
	};

})(	window.winkstart = window.winkstart || {}, window.amplify = window.amplify || {});
