// -------------
// BUTTON SPLASH
// -------------

(function (window, $) {
  
  	$(function() {

  		var defaultSplash = 'rgba(255,255,255, .35)',
  			primarySplash = 'rgba(255,255,255, .35)',
  			utilitySplash = 'rgba(87,188,255, .6)',
  			confirmSplash = 'rgba(255,255,255, .4)',
  			cancelSplash = 'rgba(32,32,41, .2)',
  			warningSplash = 'rgba(255,255,255, .5)',
  			deleteSplash = 'rgba(255,255,255, .4)';
  			
		$('.splash').on('click', function (event) {
	      	event.preventDefault();
	      
	      	var $div = $('<div/>'),
	          btnOffset = $(this).offset(),
	      		xPos = event.pageX - btnOffset.left,
	      		yPos = event.pageY - btnOffset.top;
	      
			$div.addClass('splash-effect');
	      	var $splash = $(".splash-effect");

	      	var $this = $(this),
	      		cssClass = defaultSplash;

	      	if($this.hasClass('primary')) {
	      		cssClass = primarySplash;
	      	}
	      	else if ($this.hasClass('utility')) {
	      		cssClass = utilitySplash;
	      	}
	      	else if ($this.hasClass('confirm')) {
	      		cssClass = confirmSplash;
	      	}
	      	else if ($this.hasClass('cancel')) {
	      		cssClass = cancelSplash;
	      	}
	      	else if ($this.hasClass('warning')) {
	      		cssClass = warningSplash;
	      	}
	      	else if ($this.hasClass('delete')) {
	      		cssClass = deleteSplash;
	      	}	

	      	$splash.css("height", $(this).height());
	      	$splash.css("width", $(this).height());
	      	$div.css({
	          	top: yPos - ($splash.height()/2),
	          	left: xPos - ($splash.width()/2),
	          	background: cssClass
	        }) 
	        .appendTo($(this));

	      	window.setTimeout(function(){
	        	$div.remove();
	      	}, 1500);
	    });
    });
 })(window, jQuery);