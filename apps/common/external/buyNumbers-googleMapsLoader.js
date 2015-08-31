$(document).ready(function() {
	if (!window.hasOwnProperty('google')) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src  = 'http://maps.google.com/maps/api/js?v=3&sensor=true&callback=gmap_draw';
		window.gmap_draw = function() {};
		$("head").append(script);
	}
});