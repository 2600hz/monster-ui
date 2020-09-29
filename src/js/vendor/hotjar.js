	(function(h,o,t,j,a,r){
		h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
		//monster.config.whitelabel.hotjarID is configured in config.js
		//h._hjSettings={hjid:1995636,hjsv:6};
		h._hjSettings={hjid:monster.config.whitelabel.hotjarID,hjsv:6};
		a=o.getElementsByTagName('head')[0];
		r=o.createElement('script');r.async=1;
		r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
		a.appendChild(r);
	})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
