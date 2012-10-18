(function() {
	winkstart.history = function() {
		var hashtag = document.location.hash;

		if(hashtag == '') {
			return false;
		}

		var uri = hashtag.split('/');
		uri[0] = uri[0].replace('#', '');

		return uri;
	};

	window.onpopstate = function(e) {
		var uri = winkstart.history();
		
		if(uri.length === 1) {
			winkstart.publish(uri[0] + '.activate', {});
		} else {
			winkstart.publish(uri[0] + '.module_activate', {name: uri[1]});
		}
	};

})();