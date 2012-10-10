/*
 * TOOLTIP, jQuery Plugin
 *
 *Author : Peter Defebvre
 *Email : peter@2600hz.com
 *Version : 1.0
 */

/*
 *Simple Usage: 
 *
 *<p id="someId" tooltip="I'am an awesome tooltip">Some Text</p>
 *
 *$("#someId')).tooltip({options});
 *
 *Multiple Usage:
 *
 *<p id="someId" tooltip="I'am an awesome tooltip">Some Text</p>
 *<p id="someId1" tooltip="I'am an awesome tooltip">Some Text</p>
 *
 *$.each($('body').find('*[tooltip]'), function(){
				$(this).tooltip({options});
			});
 *
 *Class Usage:
 *
 *<p id="someId" class="someClass" tooltip="I'am an awesome tooltip">Some Text</p>
 *<p id="someId1" class="someClass" tooltip="I'am an awesome tooltip">Some Text</p>
 *
 *$.each($('body').find('.someClass'), function(){
		$(this).tooltip({options});
	});
 */

(function( $ ){
	
	var defaults = {
		xMove: 20,					 
		yMove: 10,					
		width: 0,                       //Width of the tooltip
		height: 0,                      //Height of the tooltip
		tooltip_class: 'tooltip_div',	//Class of the tooltip
		header_class: 'tooltip_header',     //Class of the tooltip header
		body_class: 'tooltip_body',         //Class of the tooltip body
		footer_class: 'tooltip_footer',     //Class of the tooltip footer
		header: null,                   //Text in the header
		footer: null,                   //Text in the footer
		attach: null,                   //Place where you want to attach the html code default:after the current obj
        relative: true
	};
	
	var methods = {
		
		init: function(options) {
			
			if(this == null){
				$.error('Obj null');
			}else if(this == undefined){
				$.error('Obj undefined');
			}else{
				//Store options
				this.data('settings', $.extend({}, defaults, options));

				//Bind action to the object 
				this.bind('mouseover', methods._mouseover(this));
				this.bind('mousemove', methods._mousemove(this));
				this.bind('mouseout', methods._mouseout(this));
			}
		},
		
		_mouseover: function(o){
			//Get back the settings
			var s = o.data('settings');
			
			o.mouseover(function(e) {
				//Creating the html for the tooltip
				var html = '<div class="'+s.tooltip_class+'">';
				
				if(s.header != null){
					html += '<div class="'+s.header_class+'">'+s.header+'</div>';
				}
				
				html += '<div class="'+s.body_class+'">'+o.attr('tooltip')+'</div>';
				
				if(s.footer != null){
					html += '<div class="'+s.footer_class+'">'+s.footer+'</div>';
				}
				
				html += '</div>';
				
				//Add the tooltip to the page
				if(s.attach == null){
					o.after(html);
				}else{
					$(s.attach).after(html);
				}
				
				//Put the tooltip arround the mouse
				$('.'+s.tooltip_class).css('top', (s.relative ? e.layerY : e.pageY) + s.yMove );
				$('.'+s.tooltip_class).css('left', (s.relative ? e.layerX : e.pageX) + s.xMove );

				$('.'+s.tooltip_class).fadeIn('slow');         
			});
		},
		
		_mousemove: function(o){
			//Get back the settings
			var s = o.data('settings');
			
			o.mousemove(function(e) {
				//Make sure the tooltip is in front
				$('.'+s.tooltip_class).css('position', 'absolute');
				$('.'+s.tooltip_class).css('z-index', 9999);
				
				//Put the tooltip arround the mouse
				$('.'+s.tooltip_class).css('top', (s.relative ? e.layerY : e.pageY) + s.yMove );
				$('.'+s.tooltip_class).css('left', (s.relative ? e.layerX : e.pageX) + s.xMove );
				
				//Set the size of the tooltip
				if(s.width != 0){
					$('.'+s.tooltip_class).css('width', s.width );
				}
				
				if(s.height != 0){
					$('.'+s.tooltip_class).css('height', s.height );
				}
			});
			
		},
		
		_mouseout: function(o){
			//Get back the settings
			var s = o.data('settings');
			
			o.mouseout(function() {
				//Remove the tooltip from the page
				$('.'+s.tooltip_class).remove();
			});
		}
	};
	
	// Method calling logic
	$.fn.tooltip = function( method ) {
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
		}    
	};	
})( jQuery );
