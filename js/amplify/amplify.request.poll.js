amplify.request.types[ "ajax-poll" ] = function( resource ) {
	resource.frequency = resource.frequency || 0;
	var baseResourceId = "ajax-poll-" + resource.resourceId;
	amplify.request.define( baseResourceId, "ajax", resource );
	return function( settings ) {
		var success = settings.success,
			baseSettings = $.extend( {}, settings, {
				resourceId: baseResourceId
			});
		
		baseSettings.success = function() {
			success.apply( this, arguments );
			setTimeout(function() {
				amplify.request( baseSettings );
			}, resource.frequency * 1000 );
		};
		amplify.request( baseSettings );
	};
};