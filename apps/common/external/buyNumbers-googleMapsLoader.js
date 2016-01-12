$(document).ready(function() {
	if (!window.hasOwnProperty('google')) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src  = '//maps.google.com/maps/api/js?v=3&callback=gmap_draw';
		window.gmap_draw = function() {};
		$("head").append(script);
	}
});