(function() {

	function rooting() {};

	rooting.prototype = {
        previous_uri: null,
		get_hashtag: function() {
			var hashtag = document.location.hash,
				tags = false;

			if(hashtag != '') {
				var uri = hashtag.replace('#', '');

				if(uri[uri.length-1] == '/'){
					uri = uri.substring(0, uri.length-1);
				}

				var tmp = uri.split('/');

				uri = uri.replace(/\//g, '.');

				tags = {
					publish: uri,
					tags: tmp

				}
			}

			return tags;
		}
	};

	winkstart.rooting = new rooting();

	window.onpopstate = function(e) {
		var uri = winkstart.rooting.get_hashtag();
		if(uri && uri.publish !== winkstart.rooting.previous_uri) {
            winkstart.rooting.previous_uri = uri.publish;
			winkstart.publish(uri.publish, uri);
		}
	};

})();
