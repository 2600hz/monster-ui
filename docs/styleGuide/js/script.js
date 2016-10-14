$(document).ready(function() {
	
	// -------------
	// STICKY HEADER
	// -------------

	// sticky nav/ subnav scroll
	$(window).scroll(function () {
		var height = $(window).height();
		var scrollTop = $(window).scrollTop();

		if(scrollTop > 65) {
			$('.page-nav').addClass('fixed');
			$('section.alpha').css('marginTop', '50px');
		}
		else {
			$('.page-nav').removeClass('fixed');
			$('section.alpha').css('marginTop', '0px');
		}
	});

	// ------------------------
	// PAGE-NAV CLASS EXCHANGES
	// ------------------------

	$('.sub-nav a').on('click', function(e) {
		$('.sub-nav li').removeClass('active');
		$(this).parent('li').addClass('active');
	});

	// ---------------------
	// PAGE SCROLL-TO-ANCHOR
	// ---------------------

	$('.sub-nav li a[href^="#"]').on('click',function (e) {
	    e.preventDefault();

	    // debugger

	    var hrefLink = this.hash;
	    var target = $(hrefLink);


	    $('html, body').stop().animate({
	        scrollTop: target.offset().top
	    }, 'easeInOutQuad');
	});
		
	// ----------------
	// CONTENT TOGGLING
	// ----------------

	// color info toggle
	$('.color-toggle li').on('click', function(e) {
		var toggle = $(this).data('toggle');

		$('.color-toggle li').removeClass('active');
		$(this).addClass('active');

		$('.color-toggle-wrap').removeClass('visible');
		$('.color-toggle-wrap[data-toggle="'+ toggle +'"]').addClass('visible animated zoomIn');
	});

	// button info toggle
	$('.btn-toggle li').on('click', function(e) {
		var toggle = $(this).data('toggle');

		$('.btn-toggle li').removeClass('active');
		$(this).addClass('active');

		$('.btn-toggle-wrap').removeClass('visible');
		$('.btn-toggle-wrap[data-toggle="'+ toggle +'"]').addClass('visible animated zoomIn');
	});

	// code sample dropdowns
	$('.code-toggle').on('click', function(e) {
		
		var context = $(this).next('.code-wrapper').hasClass('visible');
		
		$(this).next('.code-wrapper').slideToggle('fast').toggleClass('visible');

		if(context) {
			$(this).html('View Class Styles');
		}
		else {
			$(this).html('Hide Class Styles');
		}

	});
});

// triggers animations when objects hits a certain distance (px) from the top of window

// $(window).scroll(function() {
// 	$('.start-anim').each(function(){
// 		var imagePos = $(this).offset().top;
// 		var topOfWindow = $(window).scrollTop();

// 		if (imagePos < topOfWindow+500) {
// 			$(this).children('.left').addClass("animated fadeInLeft");
// 			$(this).children('.right').addClass("animated fadeInRight");
// 		}
// 	});
// });

